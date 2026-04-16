const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const db = require('./db');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'replace_this_with_secure_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 3600 * 1000 }
}));

app.use(express.static(path.join(__dirname, 'public')));


function getUserByUsername(username) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
            if (err) return reject(err);
            resolve(row);
        });
    });
}


app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Trūkst username vai password' });
    try {
        const user = await getUserByUsername(username);
        if (!user) return res.status(401).json({ error: 'Nederīgi kredenciāli' });
        
        const ok = await bcrypt.compare(password, user.password);
        
        let viaTemp = false;
        if (!ok && user.temp_password) {
            const okTemp = await bcrypt.compare(password, user.temp_password);
            if (okTemp) viaTemp = true;
            else {
                return res.status(401).json({ error: 'Nederīgi kredenciāli' });
            }
        } else if (!ok) {
            return res.status(401).json({ error: 'Nederīgi kredenciāli' });
        }

        req.session.user = { id: user.id, username: user.username, role: user.role, class_id: user.class_id, must_change_password: user.must_change_password || 0, viaTemp: viaTemp ? 1 : 0 };
        res.json({ id: user.id, username: user.username, role: user.role, class_id: user.class_id, must_change_password: user.must_change_password || 0 });
    } catch (e) {
        res.status(500).json({ error: 'Servera kļūda' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy(() => res.json({ ok: true }));
});


app.post('/api/users/:id/temp-password', requireRole(['admin']), async (req, res) => {
    const targetId = req.params.id;
    const { temp_password } = req.body;
    if (!temp_password) return res.status(400).json({ error: 'Nav temp_password' });
    try {
        const hash = await bcrypt.hash(temp_password, 10);
        db.run(`UPDATE users SET temp_password = ?, must_change_password = 1 WHERE id = ?`, [hash, targetId], function(err) {
            if (err) return res.status(500).json({ error: 'DB kļūda' });
            res.json({ changes: this.changes });
        });
    } catch (e) {
        res.status(500).json({ error: 'Servera kļūda' });
    }
});


app.post('/api/change-password', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Nav autorizēts' });
    const userId = req.session.user.id;
    const { oldPassword, newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ error: 'Nav newPassword' });

    
    db.get(`SELECT password, temp_password, must_change_password FROM users WHERE id = ?`, [userId], async (err, row) => {
        if (err) return res.status(500).json({ error: 'DB kļūda' });
        if (!row) return res.status(404).json({ error: 'Nav lietotāja' });

        try {
            let ok = false;
            
            if (row.must_change_password) {
                if (row.temp_password && oldPassword) {
                    ok = await bcrypt.compare(oldPassword, row.temp_password);
                }
                
                if (!ok && oldPassword) ok = await bcrypt.compare(oldPassword, row.password);
            } else {
                
                if (!oldPassword) return res.status(400).json({ error: 'Nav oldPassword' });
                ok = await bcrypt.compare(oldPassword, row.password);
            }

            if (!ok) return res.status(403).json({ error: 'Nederīga pašreizējā parole' });

            const newHash = await bcrypt.hash(newPassword, 10);
            db.run(`UPDATE users SET password = ?, temp_password = NULL, must_change_password = 0 WHERE id = ?`, [newHash, userId], function(err2) {
                if (err2) return res.status(500).json({ error: 'DB kļūda' });
                
                req.session.user.must_change_password = 0;
                res.json({ ok: true });
            });
        } catch (e) {
            res.status(500).json({ error: 'Servera kļūda' });
        }
    });
});


app.get('/api/me', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Nav autorizēts' });
    res.json(req.session.user);
});


function requireRole(roles = []) {
    return (req, res, next) => {
        const u = req.session.user;
        if (!u) return res.status(401).json({ error: 'Nav autorizēts' });
        if (!roles.includes(u.role)) {
            if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('application/json') !== -1)) {
                return res.status(403).json({ error: 'Nav piekļuves tiesību' });
            }
            const home = '/';
            res.location(home);
            return res.redirect(home);
        }
        next();
    };
}


app.get('/api/users', requireRole(['admin']), (req, res) => {
    db.all(`SELECT id, username, role, class_id FROM users`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'DB kļūda' });
        res.json(rows);
    });
});

app.post('/api/users', requireRole(['admin']), async (req, res) => {
    const { username, password, role, class_id } = req.body;
    if (!username || !password || !role) return res.status(400).json({ error: 'Nepilnīgi dati' });
    try {
        const hash = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO users (username, password, role, class_id) VALUES (?, ?, ?, ?)`, [username, hash, role, class_id || null], function(err) {
            if (err) return res.status(500).json({ error: 'DB kļūda' });
            res.json({ id: this.lastID });
        });
    } catch (e) {
        res.status(500).json({ error: 'Servera kļūda' });
    }
});

app.put('/api/users/:id', requireRole(['admin']), async (req, res) => {
    const id = req.params.id;
    const { username, password, role, class_id } = req.body;
    
    const fields = [];
    const values = [];
    if (username) { fields.push('username = ?'); values.push(username); }
    if (password) { const hash = await bcrypt.hash(password, 10); fields.push('password = ?'); values.push(hash); }
    if (role) { fields.push('role = ?'); values.push(role); }
    if (typeof class_id !== 'undefined') { fields.push('class_id = ?'); values.push(class_id); }
    if (fields.length === 0) return res.status(400).json({ error: 'Nav lauku' });
    values.push(id);
    db.run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values, function(err) {
        if (err) return res.status(500).json({ error: 'DB kļūda' });
        res.json({ changes: this.changes });
    });
});

app.delete('/api/users/:id', requireRole(['admin']), (req, res) => {
    db.run(`DELETE FROM users WHERE id = ?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: 'DB kļūda' });
        res.json({ changes: this.changes });
    });
});


app.get('/api/users/:id', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Nav autorizēts' });
    const id = req.params.id;
    db.get(`SELECT id, username, role, class_id FROM users WHERE id = ?`, [id], (err, row) => {
        if (err) return res.status(500).json({ error: 'DB kļūda' });
        if (!row) return res.status(404).json({ error: 'Nav lietotāja' });
        res.json(row);
    });
});


app.get('/api/classes', (req, res) => {
    db.all(`SELECT * FROM classes`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'DB kļūda' });
        res.json(rows);
    });
});
app.post('/api/classes', requireRole(['admin']), (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Nav nosaukuma' });
    db.run(`INSERT INTO classes (name) VALUES (?)`, [name], function(err) {
        if (err) return res.status(500).json({ error: 'DB kļūda' });
        res.json({ id: this.lastID });
    });
});
app.put('/api/classes/:id', requireRole(['admin']), (req, res) => {
    db.run(`UPDATE classes SET name = ? WHERE id = ?`, [req.body.name, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: 'DB kļūda' });
        res.json({ changes: this.changes });
    });
});
app.delete('/api/classes/:id', requireRole(['admin']), (req, res) => {
    db.run(`DELETE FROM classes WHERE id = ?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: 'DB kļūda' });
        res.json({ changes: this.changes });
    });
});


app.get('/api/subjects', (req, res) => {
    db.all(`SELECT * FROM subjects`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'DB kļūda' });
        res.json(rows);
    });
});
app.post('/api/subjects', requireRole(['admin']), (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Nav nosaukuma' });
    db.run(`INSERT INTO subjects (name) VALUES (?)`, [name], function(err) {
        if (err) return res.status(500).json({ error: 'DB kļūda' });
        res.json({ id: this.lastID });
    });
});
app.put('/api/subjects/:id', requireRole(['admin']), (req, res) => {
    db.run(`UPDATE subjects SET name = ? WHERE id = ?`, [req.body.name, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: 'DB kļūda' });
        res.json({ changes: this.changes });
    });
});
app.delete('/api/subjects/:id', requireRole(['admin']), (req, res) => {
    db.run(`DELETE FROM subjects WHERE id = ?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: 'DB kļūda' });
        res.json({ changes: this.changes });
    });
});


app.get('/api/assessments', (req, res) => {
    const u = req.session.user;
    if (!u) return res.status(401).json({ error: 'Nav autorizēts' });

    
    let sql = `SELECT a.*, c.name as class_name, s.name as subject_name, u.username as creator_username
               FROM assessments a
               LEFT JOIN classes c ON a.class_id = c.id
               LEFT JOIN subjects s ON a.subject_id = s.id
               LEFT JOIN users u ON a.creator_id = u.id`;
    const params = [];

    if (u.role === 'student') {
        sql += ` WHERE a.class_id = ?`;
        params.push(u.class_id);
    } else if (u.role === 'teacher') {
        sql += ` WHERE a.creator_id = ?`;
        params.push(u.id);
    }
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: 'DB kļūda' });
        res.json(rows);
    });
});

app.post('/api/assessments', requireRole(['admin','teacher']), (req, res) => {
    const { class_id, subject_id, assessment_type, title, description, date_exact, period_text, weight } = req.body;
    const creator_id = req.session.user.id;
    db.run(`INSERT INTO assessments (class_id, subject_id, assessment_type, title, description, date_exact, period_text, weight, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [class_id, subject_id, assessment_type, title, description, date_exact || null, period_text || null, weight || null, creator_id],
        function(err) {
            if (err) return res.status(500).json({ error: 'DB kļūda' });
            res.json({ id: this.lastID });
        });
});

app.put('/api/assessments/:id', requireRole(['admin','teacher']), (req, res) => {
    const id = req.params.id;
    const user = req.session.user;

    
    db.get(`SELECT creator_id FROM assessments WHERE id = ?`, [id], (err, row) => {
        if (err) return res.status(500).json({ error: 'DB kļūda' });
        if (!row) return res.status(404).json({ error: 'Nav' });
        if (user.role === 'teacher' && row.creator_id !== user.id) {
            return res.status(403).json({ error: 'Nav piekļuves tiesību' });
        }
        
        const fields = [];
        const vals = [];
        const updatable = ['class_id','subject_id','assessment_type','title','description','date_exact','period_text','weight'];
        updatable.forEach(k => { if (typeof req.body[k] !== 'undefined') { fields.push(`${k} = ?`); vals.push(req.body[k]); }});
        if (fields.length === 0) return res.status(400).json({ error: 'Nav lauku' });
        vals.push(id);
        db.run(`UPDATE assessments SET ${fields.join(', ')} WHERE id = ?`, vals, function(err) {
            if (err) return res.status(500).json({ error: 'DB kļūda' });
            res.json({ changes: this.changes });
        });
    });
});

app.delete('/api/assessments/:id', requireRole(['admin','teacher']), (req, res) => {
    const id = req.params.id;
    const user = req.session.user;
    db.get(`SELECT creator_id FROM assessments WHERE id = ?`, [id], (err, row) => {
        if (err) return res.status(500).json({ error: 'DB kļūda' });
        if (!row) return res.status(404).json({ error: 'Nav' });
        if (user.role === 'teacher' && row.creator_id !== user.id) {
            return res.status(403).json({ error: 'Nav piekļuves tiesību' });
        }
        db.run(`DELETE FROM assessments WHERE id = ?`, [id], function(err) {
            if (err) return res.status(500).json({ error: 'DB kļūda' });
            res.json({ changes: this.changes });
        });
    });
});


app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/admin', requireRole(['admin']), (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/teacher', requireRole(['admin', 'teacher']), (req, res) => res.sendFile(path.join(__dirname, 'public', 'teacher.html')));
app.get('/student', requireRole(['admin', 'teacher', 'student']), (req, res) => res.sendFile(path.join(__dirname, 'public', 'student.html')));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const db = new sqlite3.Database(
    path.join(__dirname, 'database.db')
);

db.serialize(() => {
    
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            class_id INTEGER,
            temp_password TEXT,
            must_change_password INTEGER DEFAULT 0
        )
    `);

    
    db.run(`ALTER TABLE users ADD COLUMN temp_password TEXT`, (err) => {
        if (err && !/duplicate column|already exists/i.test(err.message)) {
            console.error("Ошибка при добавлении temp_password:", err);
        }
    });
    db.run(`ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 0`, (err) => {
        if (err && !/duplicate column|already exists/i.test(err.message)) {
            console.error("Ошибка при добавлении must_change_password:", err);
        }
    });

    
    db.run(`
        CREATE TABLE IF NOT EXISTS classes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        )
    `);

    
    db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_classes_name ON classes(name)`);

    
    db.run(`
        CREATE TABLE IF NOT EXISTS subjects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        )
    `);

    
    db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_subjects_name ON subjects(name)`);

    
    db.run(`
        CREATE TABLE IF NOT EXISTS assessments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            class_id INTEGER,
            subject_id INTEGER,
            assessment_type TEXT,
            title TEXT,
            description TEXT,
            date_exact TEXT,
            period_text TEXT,
            weight REAL,
            creator_id INTEGER,
            FOREIGN KEY(class_id) REFERENCES classes(id),
            FOREIGN KEY(subject_id) REFERENCES subjects(id),
            FOREIGN KEY(creator_id) REFERENCES users(id)
        )
    `);

    
    db.run(`ALTER TABLE assessments ADD COLUMN creator_id INTEGER`, (err) => {
        if (err && !/duplicate column|already exists/i.test(err.message)) {
            console.error("Ошибка при добавлении creator_id:", err);
        }
    });

    db.get(`SELECT COUNT(*) as count FROM classes`, (err, row) => {
        if (err) {
            console.error("Error checking classes table:", err);
            return;
        }
        if (row.count === 0) {
            const classes = ['1A','1B','1C','2A','2B','2C','3A','3B','3C','4A','4B','4C','5A','5B','5C','6A','6B','7A','7B','7C','8A','8B','9A','9B','10','11','12'];
            classes.forEach(name => {
                db.get(`SELECT id FROM classes WHERE name = ?`, [name], (e, r) => {
                    if (e) { console.error('Select class error', e); return; }
                    if (!r) {
                        db.run(`INSERT INTO classes (name) VALUES (?)`, [name], (ie) => {
                            if (ie) console.error(`Failed to insert class ${name}:`, ie);
                        });
                    }
                });
            });
        }
    });


    
    db.get(`SELECT COUNT(*) as count FROM subjects`, (err, row) => {
        if (err) { console.error("Error checking subjects table:", err); return; }
        if (row.count === 0) {
            const subjects = [
                'Latviešu valoda un literatūra','Fraņču valoda','Angļu valoda','Vācu valoda','Poļu valoda un literatūra',
                'Sociālās zinības','Latvijas un pasaules vēsture','Vizuālā māksla','Mūzika','Dabaszinības',
                'Ķīmija','Bioloģija','Fizika','Ģeogrāfija','Matemātika','Datorika','Programmēšana I','Programmēšana II'
            ];
            subjects.forEach(name => {
                db.get(`SELECT id FROM subjects WHERE name = ?`, [name], (e, r) => {
                    if (e) { console.error('Select subject error', e); return; }
                    if (!r) {
                        db.run(`INSERT INTO subjects (name) VALUES (?)`, [name], (ie) => {
                            if (ie) console.error(`Failed to insert subject ${name}:`, ie);
                        });
                    }
                });
            });
        }
    });


    
    db.get(`SELECT COUNT(*) as count FROM users`, (err, row) => {
        if (err) { console.error("Error checking users table:", err); return; }
        if (row.count === 0) {
            const saltRounds = 10;
            const users = [
                { username: 'admin', password: 'adminpass', role: 'admin', class_id: null },
                { username: 'teacher', password: 'teacherpass', role: 'teacher', class_id: null },
                { username: 'student', password: 'studentpass', role: 'student', class_id: 1 }
            ];
            users.forEach(u => {
                db.get(`SELECT id FROM users WHERE username = ?`, [u.username], (e, r) => {
                    if (e) { console.error('Select user error', e); return; }
                    if (!r) {
                        const hash = bcrypt.hashSync(u.password, saltRounds);
                        db.run(`INSERT INTO users (username, password, role, class_id) VALUES (?, ?, ?, ?)`, [u.username, hash, u.role, u.class_id], (ie) => {
                            if (ie) console.error(`Failed to insert user ${u.username}:`, ie);
                        });
                    }
                });
            });
        }
    });


    
    db.get(`SELECT COUNT(*) as count FROM assessments`, (err, row) => {
        if (err) { console.error("Error checking assessments table:", err); return; }
        if (row.count === 0) {
            db.get(`SELECT id FROM users WHERE username = ?`, ['teacher'], (e2, teacherRow) => {
                const teacherId = (teacherRow && teacherRow.id) ? teacherRow.id : null;
                const demo = [
                    [1,1,'Formatībais','<b>Parbaudes darbs 1</b>','<p>Apraksts par darbu</p>','2025-12-20',null,1.0,teacherId],
                    [1,15,'Summatīvais','Mājasdarbs: uzdevumi','<p>Vingrinājumi</p>',null,'1.-2. nedēļa',0.5,teacherId]
                ];
                demo.forEach(d => {
                    const [class_id, subject_id, type, title, desc, date_exact, period_text, weight, creator_id] = d;
                    
                    db.get(`SELECT id FROM assessments WHERE class_id = ? AND subject_id = ? AND title = ?`, [class_id, subject_id, title], (ee, rr) => {
                        if (ee) { console.error('Select assessment error', ee); return; }
                        if (!rr) {
                            db.run(`INSERT INTO assessments (class_id, subject_id, assessment_type, title, description, date_exact, period_text, weight, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                [class_id, subject_id, type, title, desc, date_exact, period_text, weight, creator_id],
                                (ie) => { if (ie) console.error('Insert demo assessment error', ie); });
                        }
                    });
                });
            });
        }
    });
});

module.exports = db;

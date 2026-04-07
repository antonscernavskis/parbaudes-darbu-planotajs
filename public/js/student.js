
(async () => {
    const me = await showUserInfo(); if (!me) return;

    
    const classList = await api('/api/classes').catch(() => []);
    const classMap = new Map();
    classList.forEach(c => classMap.set(String(c.id), c.name));

    const classSel = document.getElementById('filter_class');
    const subjectSel = document.getElementById('filter_subject');
    const monthSel = document.getElementById('filter_month');
    const upcomingTbody = document.getElementById('upcomingTable');
    const pastTbody = document.getElementById('pastTable');
    const nodateTbody = document.getElementById('nodateTable');
    const exportBtn = document.getElementById('exportPdfBtn');

    let allRows = await api('/api/assessments');
    if (!Array.isArray(allRows)) allRows = [];

    function fmtDate(d) {
        if (!d) return '';
        const parts = d.split('-');
        if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
        return d;
    }

    function monthKeyFromDate(dateStr) {
        const dt = new Date(dateStr);
        if (isNaN(dt)) return null;
        return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`; 
    }

    
    function deriveOptions(rows) {
        const classes = new Map(); 
        const subjectsByClass = new Map(); 
        const monthsByClassSubj = new Map(); 
        rows.forEach(r => {
            const cid = String(r.class_id ?? 'null');
            const sid = r.subject_id != null ? String(r.subject_id) : 'null';
            classes.set(cid, r.class_name ?? ('Klase ' + cid));

            if (!subjectsByClass.has(cid)) subjectsByClass.set(cid, new Map());
            if (r.subject_id != null) subjectsByClass.get(cid).set(sid, r.subject_name ?? '—');

            const key = `${cid}|${sid}`;
            if (!monthsByClassSubj.has(key)) monthsByClassSubj.set(key, new Set());
            if (r.date_exact) {
                const mk = monthKeyFromDate(r.date_exact);
                if (mk) monthsByClassSubj.get(key).add(mk);
            }
        });
        return { classes, subjectsByClass, monthsByClassSubj };
    }

    let { classes, subjectsByClass, monthsByClassSubj } = deriveOptions(allRows);

    function populateClasses() {
        classSel.innerHTML = '';
        if (me.role === 'student') {
            const cid = String(me.class_id ?? 'null');
            
            const name = classMap.get(cid) || classes.get(cid) || ('Klase ' + cid);
            classSel.appendChild(new Option(name, cid));
            classSel.value = cid;
            classSel.disabled = true;
        } else {
            classSel.appendChild(new Option('Visas', 'all'));
            
            Array.from(classes.entries()).sort((a, b) => (classMap.get(a[0]) || a[1]).localeCompare(classMap.get(b[0]) || b[1]))
                .forEach(([id, name]) => {
                    const display = classMap.get(id) || name;
                    classSel.appendChild(new Option(display, id));
                });
            classSel.value = 'all';
            classSel.disabled = false;
        }
    }

    function populateSubjects() {
        subjectSel.innerHTML = '';
        subjectSel.appendChild(new Option('Visi', 'all'));
        const selClass = classSel.value;
        const subjMap = new Map();

        if (selClass === 'all') {
            
            subjectsByClass.forEach(map => map.forEach((name, id) => subjMap.set(id, name)));
        } else {
            const map = subjectsByClass.get(selClass);
            if (map) map.forEach((name, id) => subjMap.set(id, name));
        }

        
        Array.from(subjMap.entries()).sort((a, b) => a[1].localeCompare(b[1])).forEach(([id, name]) => {
            subjectSel.appendChild(new Option(name, id));
        });
        subjectSel.value = 'all';
    }

    function populateMonths() {
        monthSel.innerHTML = '';
        monthSel.appendChild(new Option('Visi', 'all'));
        monthSel.appendChild(new Option('Bez datuma', 'nodate'));
        const selClass = classSel.value;
        const selSubj = subjectSel.value;

        const monthSet = new Set();
        allRows.forEach(r => {
            const cid = String(r.class_id ?? 'null');
            const sid = r.subject_id != null ? String(r.subject_id) : 'null';
            if (selClass !== 'all' && cid !== selClass) return;
            if (selSubj !== 'all' && sid !== selSubj) return;
            if (r.date_exact) {
                const mk = monthKeyFromDate(r.date_exact);
                if (mk) monthSet.add(mk);
            }
        });

        Array.from(monthSet).sort((a, b) => b.localeCompare(a)).forEach(mk => {
            const [y, m] = mk.split('-');
            const label = `${String(m).padStart(2, '0')}.${y}`; 
            monthSel.appendChild(new Option(label, mk));
        });
        monthSel.value = 'all';
    }

    populateClasses();
    populateSubjects();
    populateMonths();

    function renderTables() {
        upcomingTbody.innerHTML = '';
        pastTbody.innerHTML = '';
        nodateTbody.innerHTML = '';

        const selClass = classSel.value;
        const selSubj = subjectSel.value;
        const selMonth = monthSel.value;
        const today = new Date();

        
        const filtered = allRows.filter(r => {
            const cid = String(r.class_id ?? 'null');
            const sid = r.subject_id != null ? String(r.subject_id) : 'null';
            if (selClass !== 'all' && cid !== selClass) return false;
            if (selSubj !== 'all' && sid !== selSubj) return false;
            if (selMonth === 'nodate') return !r.date_exact;
            if (selMonth !== 'all') {
                if (!r.date_exact) return false;
                if (monthKeyFromDate(r.date_exact) !== selMonth) return false;
            }
            return true;
        });

        
        const upcoming = [];
        const past = [];
        const nodate = [];
        filtered.forEach(r => {
            if (!r.date_exact) nodate.push(r);
            else {
                const d = new Date(r.date_exact);
                if (isNaN(d)) nodate.push(r);
                else if (d >= today) upcoming.push(r);
                else past.push(r);
            }
        });

        
        upcoming.sort((a, b) => new Date(a.date_exact) - new Date(b.date_exact));
        
        past.sort((a, b) => new Date(b.date_exact) - new Date(a.date_exact));
        
        nodate.sort((a, b) => (a.subject_name || '').localeCompare(b.subject_name || ''));

        
        const btnUpcoming = document.querySelector('#hUpcoming .accordion-button');
        if (btnUpcoming) btnUpcoming.textContent = `Gaidāmie (${upcoming.length})`;
        const btnPast = document.querySelector('#hPast .accordion-button');
        if (btnPast) btnPast.textContent = `Iepriekšējie (${past.length})`;
        const btnNoDate = document.querySelector('#hNoDate .accordion-button');
        if (btnNoDate) btnNoDate.textContent = `Bez datuma (${nodate.length})`;

        function appendRows(tbody, rows) {
            rows.forEach(r => {
                const dateOrPeriod = r.date_exact ? fmtDate(r.date_exact) : (r.period_text || '—');
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${r.subject_name || ''}</td>
                        <td>${r.title || ''}</td>
                        <td>${dateOrPeriod}</td>
                        <td>${r.weight || ''}</td>
                        <td>
                          <button class="btn btn-sm btn-info viewBtn" data-id="${r.id}">Skatīt</button>
                        </td>`;
                tbody.appendChild(tr);
            });
        }

        appendRows(upcomingTbody, upcoming);
        appendRows(pastTbody, past);
        appendRows(nodateTbody, nodate);

        
        document.querySelectorAll('.viewBtn').forEach(b => {
            b.onclick = async () => {
                const id = b.dataset.id;
                const r = allRows.find(x => String(x.id) === String(id));
                if (!r) return;
                
                document.getElementById('sv_class').textContent = r.class_name || classMap.get(String(r.class_id)) || '';
                document.getElementById('sv_subject').textContent = r.subject_name || '';
                document.getElementById('sv_type').textContent = r.assessment_type || '';
                document.getElementById('sv_title').innerHTML = r.title || '';
                document.getElementById('sv_desc').innerHTML = r.description || '';
                document.getElementById('sv_date').textContent = r.date_exact ? fmtDate(r.date_exact) : (r.period_text || '');
                document.getElementById('sv_weight').textContent = r.weight || '';
                document.getElementById('sv_creator').textContent = r.creator_username || '—';
                const vm = new bootstrap.Modal(document.getElementById('viewModalStudent'));
                vm.show();
            };
        });
    }

    classSel.addEventListener('change', () => {
        populateSubjects();
        populateMonths();
        renderTables();
    });
    subjectSel.addEventListener('change', () => {
        populateMonths();
        renderTables();
    });
    monthSel.addEventListener('change', () => renderTables());

    exportBtn?.addEventListener('click', () => {
        const formatDate = (dateStr) => {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            if (isNaN(d)) return dateStr;
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}.${month}.${year}`;
        };

        const formatDateTime = (date) => {
            const d = new Date(date);
            if (isNaN(d)) return '';
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            return `${day}.${month}.${year} ${hours}:${minutes}`;
        };

        
        const collectRows = (tbody) => Array.from(tbody.querySelectorAll('tr')).map(tr => {
            const cols = tr.querySelectorAll('td');
            const get = (i) => (cols[i] && cols[i].textContent) ? cols[i].textContent.trim() : '';
            return { subject: get(0), title: get(1), date: get(2), weight: get(3) };
        });

        const up = collectRows(upcomingTbody);
        const past = collectRows(pastTbody);
        const nod = collectRows(nodateTbody);
        const win = window.open('', '_blank');

        const style = `
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                padding: 20px;
                background-color: #f9f9f9;
                color: #333;
            }
            h1 { text-align: center; color: #2c3e50; }
            h2 { margin-top: 30px; color: #34495e; border-bottom: 2px solid #ddd; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; background: #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
            th { background-color: #3498db; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            tr:hover { background-color: #d6eaf8; }
            p { margin-top: 40px; font-size: 0.9em; color: #777; text-align: right; }
        </style>
    `;

        let html = `<html><head><title>Eksports</title>${style}</head><body><h1>Pārbaudes darbi</h1>`;

        function makeSection(title, arr) {
            html += `<h2>${title} (${arr.length})</h2><table><thead><tr><th>Priekšmets</th><th>Nosaukums</th><th>Datums</th><th>Svars</th></tr></thead><tbody>`;
            arr.forEach(r => html += `<tr><td>${r.subject}</td><td>${r.title}</td><td>${r.date}</td><td>${r.weight}</td></tr>`);
            html += '</tbody></table>';
        }

        makeSection('Gaidāmie', up);
        makeSection('Iepriekšējie', past);
        makeSection('Bez datuma', nod);

        html += `<p>Eksportēts: ${formatDateTime(new Date())}</p></body></html>`;
        win.document.write(html);
        win.document.close();
        setTimeout(() => win.print(), 300);
    });




    renderTables();
})();

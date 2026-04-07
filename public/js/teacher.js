(async () => {
    const user = await showUserInfo();
    const classes = await api('/api/classes');
    const subjects = await api('/api/subjects');

    
    const selClass = document.getElementById('m_class');
    classes.forEach(c => selClass.add(new Option(c.name, c.id)));
    const selSubject = document.getElementById('m_subject');
    subjects.forEach(s => selSubject.add(new Option(s.name, s.id)));

    
    
    const fClass = document.getElementById('filter_class');
    const fSubject = document.getElementById('filter_subject');
    const fMonth = document.getElementById('filter_month');
    const exportBtn = document.getElementById('exportPdfBtn');

    
    const classMap = new Map();
    classes.forEach(c => classMap.set(String(c.id), c.name));

    
    function monthKeyFromDate(dateStr) {
        const dt = new Date(dateStr);
        if (isNaN(dt)) return null;
        return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    }
    function deriveOptions(rows) {
        const classesMap = new Map(); 
        const subjectsByClass = new Map(); 
        const monthsSet = new Map(); 
        rows.forEach(r => {
            const cid = String(r.class_id ?? 'null');
            const sid = r.subject_id != null ? String(r.subject_id) : 'null';
            classesMap.set(cid, r.class_name ?? classMap.get(cid) ?? ('Klase ' + cid));
            if (!subjectsByClass.has(cid)) subjectsByClass.set(cid, new Map());
            if (r.subject_id != null) subjectsByClass.get(cid).set(sid, r.subject_name ?? '—');
            const key = `${cid}|${sid}`;
            if (!monthsSet.has(key)) monthsSet.set(key, new Set());
            if (r.date_exact) {
                const mk = monthKeyFromDate(r.date_exact);
                if (mk) monthsSet.get(key).add(mk);
            }
        });
        return { classesMap, subjectsByClass, monthsSet };
    }

    
    function populateFilterClasses(classesMap) {
        fClass.innerHTML = '';
        
        if (user.role === 'teacher') {
            
            Array.from(classesMap.entries())
                .sort((a, b) => a[1].localeCompare(b[1]))
                .forEach(([id, name]) => fClass.appendChild(new Option(name, id)));
            
        } else {
            fClass.appendChild(new Option('Visas', 'all'));
            Array.from(classesMap.entries()).sort((a, b) => a[1].localeCompare(b[1]))
                .forEach(([id, name]) => fClass.appendChild(new Option(name, id)));
        }
    }
    function populateFilterSubjects(subjectsByClass, selectedClass) {
        fSubject.innerHTML = '';
        fSubject.appendChild(new Option('Visi', 'all'));
        const map = (selectedClass === 'all') ? new Map() : subjectsByClass.get(selectedClass);
        if (selectedClass === 'all') {
            
            const union = new Map();
            subjectsByClass.forEach(m => m.forEach((name, id) => union.set(id, name)));
            Array.from(union.entries()).sort((a, b) => a[1].localeCompare(b[1])).forEach(([id, name]) => fSubject.appendChild(new Option(name, id)));
        } else if (map) {
            Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1])).forEach(([id, name]) => fSubject.appendChild(new Option(name, id)));
        }
    }
    function populateFilterMonths(monthsSet, selClass, selSubj) {
        fMonth.innerHTML = '';
        fMonth.appendChild(new Option('Visi', 'all'));
        fMonth.appendChild(new Option('Bez datuma', 'nodate'));
        const set = new Set();
        const keys = [];
        if (selClass === 'all') {
            monthsSet.forEach(s => s.forEach(mk => set.add(mk)));
        } else {
            if (selSubj === 'all') {
                
                monthsSet.forEach((s, key) => { if (key.startsWith(selClass + '|')) s.forEach(m => set.add(m)); });
            } else {
                const key = `${selClass}|${selSubj}`;
                const s = monthsSet.get(key);
                if (s) s.forEach(m => set.add(m));
            }
        }
        Array.from(set).sort((a, b) => b.localeCompare(a)).forEach(mk => {
            const [y, m] = mk.split('-');
            fMonth.appendChild(new Option(`${String(m).padStart(2, '0')}.${y}`, mk));
        });
    }

    

    let currentEditable = null;

    
    document.querySelectorAll('[contenteditable]').forEach(el => {
        el.addEventListener('focus', () => currentEditable = el);
        
        el.addEventListener('pointerdown', () => currentEditable = el, { passive: true });
    });

    
    
    document.querySelectorAll('.toolbar button').forEach(b => {
        b.addEventListener('mousedown', e => e.preventDefault()); 
        b.addEventListener('click', (e) => {
            
            if (currentEditable) currentEditable.focus();
            const cmd = b.dataset.cmd;
            try {
                document.execCommand(cmd, false, null);
            } catch (err) {
                console.warn('execCommand failed for', cmd, err);
            }
        });
    });

    const assessModal = new bootstrap.Modal(document.getElementById('assessModal'));
    const viewModal = new bootstrap.Modal(document.getElementById('viewAssessModal'));
    let editingId = null;

    
    document.getElementById('assessModal').addEventListener('hidden.bs.modal', () => {
        const backdrops = document.getElementsByClassName('modal-backdrop');
        while (backdrops[0]) backdrops[0].parentNode.removeChild(backdrops[0]);
    });

    function attachRowEvents() {
        document.querySelectorAll('.delBtn').forEach(b => {
            b.onclick = async () => {
                if (!confirm('Dzēst šo darbu?')) return;
                await api('/api/assessments/' + b.dataset.id, { method: 'DELETE' });
                loadAssesses();
            };
        });

        document.querySelectorAll('.editBtn').forEach(b => {
            b.onclick = async () => {
                const recs = await api('/api/assessments');
                const r = recs.find(x => x.id == b.dataset.id);
                if (!r) return alert('Nav datu.');
                editingId = r.id;
                document.getElementById('m_class').value = r.class_id || '';
                document.getElementById('m_subject').value = r.subject_id || '';
                document.getElementById('m_type').value = r.assessment_type || 'Summatīvais';
                document.getElementById('m_title').innerHTML = r.title || '';
                document.getElementById('m_description').innerHTML = r.description || '';
                document.getElementById('m_date').value = r.date_exact || '';
                document.getElementById('m_period').value = r.period_text || '';
                document.getElementById('m_weight').value = r.weight || '';

                
                const creatorEl = document.getElementById('m_creator');
                if (r.creator_username) {
                    creatorEl.textContent = r.creator_username;
                } else if (r.creator_id) {
                    try {
                        const u = await api('/api/users/' + r.creator_id);
                        creatorEl.textContent = u.username || '—';
                    } catch (e) {
                        creatorEl.textContent = '—';
                    }
                } else {
                    creatorEl.textContent = '—';
                }

                assessModal.show();
            };
        });

        document.querySelectorAll('.viewBtn').forEach(b => {
            b.onclick = async () => {
                const recs = await api('/api/assessments');
                const r = recs.find(x => x.id == b.dataset.id);
                if (!r) return;
                document.getElementById('v_class').textContent = r.class_name || '';
                document.getElementById('v_subject').textContent = r.subject_name || '';
                document.getElementById('v_type').textContent = r.assessment_type || '';
                document.getElementById('v_title').innerHTML = r.title || '';
                document.getElementById('v_desc').innerHTML = r.description || '';
                document.getElementById('v_date').textContent = r.date_exact ? formatDate(r.date_exact) : (r.period_text || '');
                document.getElementById('v_weight').textContent = r.weight || '';
                
                document.getElementById('v_creator').textContent = r.creator_username || '—';
                viewModal.show();
            };
        });
    }

    async function loadAssesses() {
        
        const rows = await api('/api/assessments');

        
        const prevClass = fClass?.value;
        const prevSubj = fSubject?.value;
        const prevMonth = fMonth?.value;

        const today = new Date();
        const upcomingTbody = document.querySelector('#upcomingTable');
        const pastTbody = document.querySelector('#pastTable');
        const nodateTbody = document.querySelector('#nodateTable');
        upcomingTbody.innerHTML = '';
        pastTbody.innerHTML = '';
        nodateTbody.innerHTML = '';

        
        const { classesMap, subjectsByClass, monthsSet } = deriveOptions(rows);
        populateFilterClasses(classesMap);
        
        if (prevClass && Array.from(fClass.options).some(o => o.value === prevClass)) {
            fClass.value = prevClass;
        } else if (user.role === 'teacher') {
            fClass.value = (Array.from(classesMap.keys())[0]) || (fClass.options[0] && fClass.options[0].value) || '';
        } else {
            fClass.value = Array.from(fClass.options).some(o => o.value === 'all') ? 'all' : (fClass.options[0] && fClass.options[0].value);
        }
        populateFilterSubjects(subjectsByClass, fClass.value);
        
        if (prevSubj && Array.from(fSubject.options).some(o => o.value === prevSubj)) {
            fSubject.value = prevSubj;
        } else {
            fSubject.value = 'all';
        }
        populateFilterMonths(monthsSet, fClass.value, fSubject.value);
        
        if (prevMonth && Array.from(fMonth.options).some(o => o.value === prevMonth)) {
            fMonth.value = prevMonth;
        } else {
            fMonth.value = 'all';
        }

        
        const selClass = fClass.value;
        const selSubj = fSubject.value || 'all';
        const selMonth = fMonth.value || 'all';

        const filtered = rows.filter(r => {
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

        const upcoming = [], past = [], nodate = [];
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

        
        const btnUpcoming = document.querySelector('#headingUpcoming .accordion-button');
        if (btnUpcoming) btnUpcoming.textContent = `Gaidāmie (${upcoming.length})`;
        const btnPast = document.querySelector('#headingPast .accordion-button');
        if (btnPast) btnPast.textContent = `Iepriekšējie (${past.length})`;
        const btnNoDate = document.querySelector('#headingNoDate .accordion-button');
        if (btnNoDate) btnNoDate.textContent = `Bez datuma (${nodate.length})`;

        const renderRowHtml = (r) => {
            const dateOrPeriod = r.date_exact ? formatDate(r.date_exact) : (r.period_text || '');
            return `
                 <tr>
                     <td>${r.class_name || classMap.get(String(r.class_id)) || ''}</td>
                     <td>${r.subject_name || ''}</td>
                     <td>${r.title || ''}</td>
                     <td>${r.assessment_type || ''}</td>
                     <td>${dateOrPeriod}</td>
                     <td>${r.weight || ''}</td>
                     <td>
                         <button class="btn btn-sm btn-info viewBtn" data-id="${r.id}">Skatīt</button>
                         <button class="btn btn-sm btn-primary editBtn" data-id="${r.id}">Labot</button>
                         <button class="btn btn-sm btn-danger delBtn" data-id="${r.id}">Dzēst</button>
                     </td>
                 </tr>
             `;
        };

        upcoming.forEach(r => upcomingTbody.insertAdjacentHTML('beforeend', renderRowHtml(r)));
        past.forEach(r => pastTbody.insertAdjacentHTML('beforeend', renderRowHtml(r)));
        nodate.forEach(r => nodateTbody.insertAdjacentHTML('beforeend', renderRowHtml(r)));

        attachRowEvents();
    }

    fClass?.addEventListener('change', () => {
        
        (async () => {
            const rows = await api('/api/assessments');
            const { subjectsByClass, monthsSet } = deriveOptions(rows);
            populateFilterSubjects(subjectsByClass, fClass.value);
            populateFilterMonths(monthsSet, fClass.value, fSubject.value);
            loadAssesses();
        })();
    });
    fSubject?.addEventListener('change', () => {
        (async () => {
            const rows = await api('/api/assessments');
            const { monthsSet } = deriveOptions(rows);
            populateFilterMonths(monthsSet, fClass.value, fSubject.value);
            loadAssesses();
        })();
    });
    fMonth?.addEventListener('change', () => loadAssesses());

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
            return {
                klass: cols[0].textContent.trim(),
                subject: cols[1].textContent.trim(),
                title: cols[2].textContent.trim(),
                date: formatDate(cols[4].textContent.trim()),
                weight: cols[5].textContent.trim()
            };
        });

        const up = collectRows(document.getElementById('upcomingTable'));
        const past = collectRows(document.getElementById('pastTable'));
        const nod = collectRows(document.getElementById('nodateTable'));
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
            html += `<h2>${title} (${arr.length})</h2><table><thead><tr><th>Klase</th><th>Priekšmets</th><th>Nosaukums</th><th>Datums</th><th>Svars</th></tr></thead><tbody>`;
            arr.forEach(r => html += `<tr><td>${r.klass}</td><td>${r.subject}</td><td>${r.title}</td><td>${r.date}</td><td>${r.weight}</td></tr>`);
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





    
    document.getElementById('addAssessBtn').onclick = () => {
        editingId = null;
        document.getElementById('m_class').value = classes[0]?.id || '';
        document.getElementById('m_subject').value = subjects[0]?.id || '';
        document.getElementById('m_type').value = 'Summatīvais';
        document.getElementById('m_title').innerHTML = '';
        document.getElementById('m_description').innerHTML = '';
        document.getElementById('m_date').value = '';
        document.getElementById('m_period').value = '';
        document.getElementById('m_weight').value = '';
        
        document.getElementById('m_creator').textContent = user?.username || '—';
        assessModal.show();
    };

    
    document.getElementById('saveAssess').onclick = async () => {
        const btn = document.getElementById('saveAssess');
        const payload = {
            class_id: document.getElementById('m_class').value || null,
            subject_id: document.getElementById('m_subject').value || null,
            assessment_type: document.getElementById('m_type').value,
            title: document.getElementById('m_title').innerHTML,
            description: document.getElementById('m_description').innerHTML,
            date_exact: document.getElementById('m_date').value || null,
            period_text: document.getElementById('m_period').value || null,
            weight: document.getElementById('m_weight').value || null
        };

        const toLocalISODate = (dateStr) => {
            if (!dateStr) return null;
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
            const d = new Date(dateStr);
            if (isNaN(d)) return null;
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        const todayLocalISO = () => {
            const t = new Date();
            const y = t.getFullYear();
            const m = String(t.getMonth() + 1).padStart(2, '0');
            const d = String(t.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        };

        const isDateInPast = (dateStr) => {
            const iso = toLocalISODate(dateStr);
            if (!iso) return false;
            return iso < todayLocalISO();
        };

        const _holidayCache = {};

        const fetchHolidaysForYear = async (year) => {
            if (_holidayCache[year]) return _holidayCache[year];
            const from = `${year}-01-01`;
            const to = `${year}-12-31`;
            const url = `https://openholidaysapi.org/PublicHolidays?countryIsoCode=LV&validFrom=${encodeURIComponent(from)}&validTo=${encodeURIComponent(to)}`;
            try {
                const res = await fetch(url);
                if (!res.ok) throw new Error(`Holidays API ${res.status}`);
                const data = await res.json();
                _holidayCache[year] = Array.isArray(data) ? data : [];
                return _holidayCache[year];
            } catch (err) {
                try {
                    const fallback = await api(`/api/holidays/latvia?year=${encodeURIComponent(year)}`);
                    _holidayCache[year] = Array.isArray(fallback) ? fallback : [];
                    return _holidayCache[year];
                } catch (e) {
                    throw err;
                }
            }
        };

        const checkLatviaHoliday = async (dateStr) => {
            const iso = toLocalISODate(dateStr);
            if (!iso) return { ok: false, error: 'Nederīga datuma forma' };
            try {
                const year = Number(iso.slice(0,4));
                const holidays = await fetchHolidaysForYear(year);
                const isHoliday = holidays.some(h => {
                    const s = h.startDate;
                    const e = h.endDate || h.startDate;
                    if (!s) return false;
                    return (s <= iso && iso <= e);
                });
                return { ok: true, isHoliday };
            } catch (e) {
                return { ok: false, error: e && e.message ? e.message : String(e) };
            }
        };

        const validateDateSelection = async () => {
            const dateEl = document.getElementById('m_date');
            const saveBtn = document.getElementById('saveAssess');
            const val = dateEl?.value || null;
            dateEl.setCustomValidity('');
            if (!val) {
                window._dateSelectionValid = true;
                if (saveBtn) saveBtn.disabled = false;
                return { ok: true };
            }
            if (isDateInPast(val)) {
                dateEl.setCustomValidity('Nevar ievietot darbu pagātnē');
                dateEl.reportValidity();
                window._dateSelectionValid = false;
                if (saveBtn) saveBtn.disabled = true;
                return { ok: false, error: 'past' };
            }
            const chk = await checkLatviaHoliday(val);
            if (!chk.ok) {
                dateEl.setCustomValidity('Neizdevās pārbaudīt svētku dienas');
                dateEl.reportValidity();
                window._dateSelectionValid = false;
                if (saveBtn) saveBtn.disabled = true;
                return { ok: false, error: chk.error || 'holiday_check_failed' };
            }
            if (chk.isHoliday) {
                dateEl.setCustomValidity('Šajā datumā ir svētki vai brīvdiena — darbu nevar ievietot.');
                dateEl.reportValidity();
                window._dateSelectionValid = false;
                if (saveBtn) saveBtn.disabled = true;
                return { ok: false, error: 'holiday' };
            }
            window._dateSelectionValid = true;
            if (saveBtn) saveBtn.disabled = false;
            dateEl.setCustomValidity('');
            return { ok: true };
        };

        const mDateEl = document.getElementById('m_date');
        if (mDateEl) {
            mDateEl.addEventListener('change', () => {
                validateDateSelection().catch(() => {});
            });
            validateDateSelection().catch(() => {});
        }

        try {
            const v = await validateDateSelection();
            if (!v.ok) {
                return;
            }

            btn.disabled = true;

            if (editingId) {
                await api('/api/assessments/' + editingId, { method: 'PUT', body: payload });
                showToast('Darbs atjaunināts', 'OK');
            } else {
                await api('/api/assessments', { method: 'POST', body: payload });
                showToast('Darbs pievienots', 'OK');
            }
            await loadAssesses();
        } catch (e) {
            showError(e, 'Kļūda saglabājot darbu', 'Kļūda');
        } finally {
            btn.disabled = false;
        }
    };

    
    loadAssesses();
})();

function format(command, elId) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.focus(); 
    document.execCommand(command, false, null);
}
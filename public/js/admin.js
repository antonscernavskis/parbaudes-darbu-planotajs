
(async () => {
  await showUserInfo();

  
  const classMap = new Map();

  
  const usersTbody = document.querySelector('#usersTable tbody');
  const addUserBtn = document.getElementById('openAddUser');
  const userModalEl = document.getElementById('userModal');
  const userModal = new bootstrap.Modal(userModalEl);
  const userForm = document.getElementById('userForm');
  const u_id = document.getElementById('user_id');
  const u_username = document.getElementById('u_username');
  const u_password = document.getElementById('u_password');
  const u_role = document.getElementById('u_role');
  const u_class = document.getElementById('u_class');
  const setTempPassBtn = document.getElementById('setTempPassBtn');
  const tempPassInput = document.getElementById('tempPassInput');
  const saveUserBtn = document.getElementById('saveUserBtn');

  
  async function loadClassOptions() {
    const classes = await api('/api/classes');
    u_class.innerHTML = '<option value="">—</option>';
    classes.forEach(c => {
      u_class.appendChild(new Option(c.name, c.id));
      classMap.set(String(c.id), c.name); 
    });
  }
  await loadClassOptions();

  
  async function loadUsers() {
    const rows = await api('/api/users');
    usersTbody.innerHTML = '';
    rows.forEach(r => {
      const className = r.class_id ? (classMap.get(String(r.class_id)) || r.class_id) : '';
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${r.id}</td><td>${r.username}</td><td>${r.role}</td><td>${className}</td>
        <td>
          <button class="btn btn-sm btn-primary editUser" data-id="${r.id}">Rediģēt</button>
          <button class="btn btn-sm btn-danger delUser" data-id="${r.id}">Dzēst</button>
        </td>`;
      usersTbody.appendChild(tr);
    });
    
    document.querySelectorAll('.delUser').forEach(b => b.addEventListener('click', async () => {
      if (!confirm('Dzēst?')) return;
      await api('/api/users/' + b.dataset.id, { method: 'DELETE' });
      showToast('Dzēsts', 'OK');
      loadUsers();
    }));
    document.querySelectorAll('.editUser').forEach(b => b.addEventListener('click', async () => {
      const id = b.dataset.id;
      const users = await api('/api/users');
      const r = users.find(u=>u.id==id);
      if (!r) return;
      u_id.value = r.id;
      u_username.value = r.username;
      u_password.value = '';
      u_role.value = r.role;
      
      u_class.value = r.class_id || '';
      userModalEl.querySelector('.modal-title').textContent = 'Labot lietotāju';
      userModal.show();
    }));
  }
  loadUsers();

  
  addUserBtn.addEventListener('click', () => {
    u_id.value = '';
    u_username.value = '';
    u_password.value = '';
    u_role.value = 'student';
    u_class.value = '';
    tempPassInput.value = '';
    userModalEl.querySelector('.modal-title').textContent = 'Pievienot lietotāju';
    userModal.show();
  });

  
  saveUserBtn.addEventListener('click', async () => {
      const btn = saveUserBtn;
      const payload = {
        username: u_username.value.trim(),
        password: u_password.value || undefined,
        role: u_role.value,
        class_id: (u_class.value && u_class.value !== '') ? Number(u_class.value) : null
      };
      try {
        if (!payload.username || !payload.role) return showToast('Ievadiet pareizus datus', 'Kļūda');
        if (!u_id.value && !u_password.value) return showToast('Jaunam lietotājam jāievada parole', 'Kļūda');
        btn.disabled = true;
        if (u_id.value) {
          await api('/api/users/' + u_id.value, { method: 'PUT', body: payload });
          showToast('Lietotājs atjaunināts', 'OK');
        } else {
          await api('/api/users', { method: 'POST', body: payload });
          showToast('Lietotājs pievienots', 'OK');
          u_username.value = '';
          u_password.value = '';
          u_role.value = 'student';
          u_class.value = '';
        }
        await loadUsers();
      } catch (err) {
        showError(err, 'Kļūda', 'Error');
      } finally {
        btn.disabled = false;
      }
  });

  
  setTempPassBtn.addEventListener('click', async () => {
    const id = u_id.value;
    const tmp = tempPassInput.value.trim();
    if (!id) return showToast('Vispirms izvēlieties lietotāju (Edit) vai saglabājiet jaunu', 'Kļūda');
    if (!tmp) return showToast('Ievadiet pagaidu paroli', 'Kļūda');
    try {
      await api(`/api/users/${id}/temp-password`, { method: 'POST', body: { temp_password: tmp } });
      showToast('Pagaidu parole iestatīta', 'OK');
      tempPassInput.value = '';
    } catch (e) {
      showError(e, 'Kļūda', 'Error');
    }
  });

  
  const classesList = document.getElementById('classesList');
  const subjectsList = document.getElementById('subjectsList');
  document.getElementById('openAddClass').addEventListener('click', () => {
    const cm = new bootstrap.Modal(document.getElementById('classModal')); cm.show();
  });
  document.getElementById('saveClassBtn').addEventListener('click', async () => {
      const btn = document.getElementById('saveClassBtn');
      const nameEl = document.getElementById('c_name');
      const name = nameEl.value.trim();
      if (!name) return showToast('Ievadiet klases nosaukumu', 'Kļūda');
      try {
          btn.disabled = true;
          await api('/api/classes', { method: 'POST', body: { name } });
          showToast('Klase pievienota', 'OK');
          nameEl.value = '';
          await loadClassOptions();
          await loadClasses();
      } catch (e) {
          showError(e, 'Kļūda pievienojot klasi', 'Kļūda');
      } finally {
          btn.disabled = false;
      }
  });

  document.getElementById('openAddSubject').addEventListener('click', () => {
    const sm = new bootstrap.Modal(document.getElementById('subjectModal')); sm.show();
  });
  document.getElementById('saveSubjectBtn').addEventListener('click', async () => {
      const btn = document.getElementById('saveSubjectBtn');
      const nameEl = document.getElementById('s_name');
      const name = nameEl.value.trim();
      if (!name) return showToast('Ievadiet priekšmeta nosaukumu', 'Kļūda');
      try {
          btn.disabled = true;
          await api('/api/subjects', { method: 'POST', body: { name } });
          showToast('Priekšmets pievienots', 'OK');
          nameEl.value = '';
          await loadSubjects();
      } catch (e) {
          showError(e, 'Kļūda pievienojot priekšmetu', 'Kļūda');
      } finally {
          btn.disabled = false;
      }
  });

  
  document.getElementById('refreshUsers').addEventListener('click', loadUsers);

  
  async function loadClasses() {
    const list = await api('/api/classes');
    classesList.innerHTML = '';
    list.forEach(c => {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      li.innerHTML = `<span>${c.id} — ${c.name}</span><div><button class="btn btn-sm btn-danger delClass" data-id="${c.id}">Dzēst</button></div>`;
      classesList.appendChild(li);
    });
    document.querySelectorAll('.delClass').forEach(b => b.addEventListener('click', async () => {
      if (!confirm('Dzēst klasi?')) return;
      await api('/api/classes/' + b.dataset.id, { method: 'DELETE' });
      loadClasses();
      loadClassOptions();
      loadUsers();
    }));
  }
  loadClasses();

  async function loadSubjects() {
    const list = await api('/api/subjects');
    subjectsList.innerHTML = '';
    list.forEach(c => {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      li.innerHTML = `<span>${c.id} — ${c.name}</span><div><button class="btn btn-sm btn-danger delSub" data-id="${c.id}">Dzēst</button></div>`;
      subjectsList.appendChild(li);
    });
    document.querySelectorAll('.delSub').forEach(b => b.addEventListener('click', async () => {
      if (!confirm('Dzēst priekšmetu?')) return;
      await api('/api/subjects/' + b.dataset.id, { method: 'DELETE' });
      loadSubjects();
      loadAssesses?.();
    }));
  }
  loadSubjects();

})();




async function api(path, opts = {}) {
    opts.headers = opts.headers || {};
    
    if (!opts.headers['Content-Type'] && !(opts.body instanceof FormData)) {
        opts.headers['Content-Type'] = 'application/json';
    }
    if (opts.body && typeof opts.body !== 'string' && opts.headers['Content-Type'] === 'application/json') {
        opts.body = JSON.stringify(opts.body);
    }
    const res = await fetch(path, opts);
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Neizdevās' }));
        throw err;
    }
    return res.json().catch(() => ({}));
}
window.api = api; 


function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}
function formatDate(d) {
    if (!d) return '';
    const parts = d.split('-');
    if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
    return d;
}
window.stripHtml = stripHtml;
window.formatDate = formatDate;


async function showUserInfo() {
    try {
        const u = await api('/api/me');
        const ui = document.querySelectorAll('#userInfo');
        ui.forEach(el => el.textContent = `${u.username} (${u.role})`);
        
        renderNav(u);
        return u;
    } catch (e) {
        
        if (location.pathname !== '/login') location = '/login';
        return null;
    }
}
window.showUserInfo = showUserInfo;

function renderNav(user) {
    const container = document.getElementById('navLinks');
    if (!container) return;
    container.innerHTML = '';
    
    const perms = {
        admin: ['admin', 'teacher', 'student'],
        teacher: ['teacher', 'student'],
        student: ['student']
    };
    const labels = {
        admin: 'Administrators',
        teacher: 'Skolotājs',
        student: 'Skolēns'
    };
    const allowed = perms[user.role] || [];
    allowed.forEach(p => {
        const a = document.createElement('a');
        a.className = 'nav-link px-2';
        a.href = `/${p}`;
        a.textContent = labels[p];
        
        if (location.pathname.startsWith(`/${p}`) || (p === 'student' && location.pathname === '/')) {
            a.classList.add('active');
        }
        container.appendChild(a);
    });
}
window.renderNav = renderNav;

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await api('/api/logout', { method: 'POST' });
        location = '/login';
    });
}


const changePassBtn = document.getElementById('changePassBtn');
if (changePassBtn) {
    const cpModalEl = document.getElementById('changePassModal');
    const cpModal = new bootstrap.Modal(cpModalEl);
    changePassBtn.addEventListener('click', async () => {
        
        const oldEl = document.getElementById('cp_old');
        const newEl = document.getElementById('cp_new');
        const new2El = document.getElementById('cp_new2');
        if (oldEl) oldEl.value = '';
        if (newEl) newEl.value = '';
        if (new2El) new2El.value = '';
        cpModal.show();
    });

    document.getElementById('changePassSave').addEventListener('click', async () => {
        const oldVal = document.getElementById('cp_old').value;
        const newVal = document.getElementById('cp_new').value;
        const new2Val = document.getElementById('cp_new2').value;
        if (!newVal || !new2Val) return showToast('Ievadiet jauno paroli un apstiprinājumu', 'Kļūda');
        if (newVal !== new2Val) return showToast('Paroles nesakrīt', 'Kļūda');
        try {
            await api('/api/change-password', { method: 'POST', body: { oldPassword: oldVal || undefined, newPassword: newVal } });
            showToast('Parole nomainīta', 'OK');
            cpModal.hide();
        } catch (err) {
            showToast(err.error || 'Kļūda mainot paroli', 'Kļūda');
        }
    });
}


function execFormat(command) { document.execCommand(command, false, null); }
window.execFormat = execFormat;


(function loadPageScript() {
    
    const path = location.pathname.replace(/\/+$/, ''); 
    const segments = path.split('/').filter(Boolean);
    const page = segments[0] || 'login';
    const allowed = ['login', 'admin', 'teacher', 'student'];
    const pageName = allowed.includes(page) ? page : null;
    if (!pageName) return; 

    const script = document.createElement('script');
    script.src = `/js/${pageName}.js`;
    script.defer = true;
    document.body.appendChild(script);
})();


function showToast(message, title = 'Info', autohide = true) {
    
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        container.style.zIndex = 1080;
        document.body.appendChild(container);
    } else {
        
        container.classList.add('toast-container', 'position-fixed', 'bottom-0', 'end-0', 'p-3');
        container.style.zIndex = 1080;
    }

    const id = 't' + Date.now();
    const toastHtml = `
  <div id="${id}" class="toast align-items-start text-bg-light border" role="alert" aria-live="assertive" aria-atomic="true">
    <div class="toast-header">
      <strong class="me-auto">${title}</strong>
      <small class="text-muted"></small>
      <button type="button" class="btn-close ms-2 mb-1" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
    <div class="toast-body">${message}</div>
  </div>`;
    container.insertAdjacentHTML('beforeend', toastHtml);
    const el = document.getElementById(id);
    const bs = new bootstrap.Toast(el, { autohide: autohide, delay: 3000 });
    bs.show();
}
window.showToast = showToast;


function showError(err, fallback = 'Kļūda', title = 'Kļūda') {
  
  const errStr = (err && typeof err === 'object') ? (err.error || err.message || String(err)) : String(err || '');
  const isDbError = errStr && errStr.includes('DB kļūda');
  if (isDbError) {
    
    console.error('DB error suppressed for toast:', err);
    return;
  }
  
  const msg = (err && typeof err === 'object') ? (err.error || err.message || fallback) : (errStr || fallback);
  showToast(msg, title);
}
window.showError = showError;



document.addEventListener('hidden.bs.modal', () => {
    setTimeout(() => {
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
        document.body.classList.remove('modal-open');
        document.body.style.paddingRight = '';
        
        location.reload();
    }, 10);
});

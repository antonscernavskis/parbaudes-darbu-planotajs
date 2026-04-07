
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(loginForm);
        try {
            const data = await api('/api/login', { method: 'POST', body: { username: fd.get('username'), password: fd.get('password') } });
            if (data.role === 'admin') location = '/teacher';
            else if (data.role === 'teacher') location = '/teacher';
            else location = '/student';
        } catch (err) {
            const errEl = document.getElementById('err');
            if (errEl) errEl.textContent = err.error || 'Kļūda';
        }
    });
}

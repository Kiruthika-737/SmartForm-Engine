/* Task 4 main.js
   - client-side routing
   - validation + password strength meter
   - dynamic DOM updates (users list)
   - localStorage persistence
   - in-page toast messages
*/

// --- persistent "database" using localStorage ---
const STORAGE_KEY = 'task4_users_v1';
const db = {
  users: JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
};

/* --- Routing (show/hide) --- */
const views = {
  login: document.getElementById('view-login'),
  register: document.getElementById('view-register'),
  users: document.getElementById('view-users')
};

function showView(name) {
  Object.values(views).forEach(v => v.hidden = true);
  views[name].hidden = false;
}
document.getElementById('nav-login').addEventListener('click', () => showView('login'));
document.getElementById('nav-register').addEventListener('click', () => showView('register'));
document.getElementById('nav-users').addEventListener('click', () => showView('users'));
document.getElementById('goto-register').addEventListener('click', () => showView('register'));

/* --- Toast utility --- */
const toastBox = document.getElementById('toast');
const toastMsg = document.getElementById('toast-msg');
let toastTimer = null;
function showToast(message, duration = 2500) {
  if (!toastBox) return;
  toastMsg.textContent = message;
  toastBox.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastBox.hidden = true;
  }, duration);
}

/* --- Validation helpers --- */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function isValidPhone(phone) {
  if (!phone) return true; // optional
  const digits = phone.replace(/\D/g,'');
  return digits.length >= 7 && digits.length <= 15;
}
function passwordStrength(pass) {
  let score = 0;
  if (pass.length >= 8) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[\W_]/.test(pass)) score++;
  let label = ['Very weak','Weak','Okay','Good','Strong'][score];
  return {score, label};
}

/* --- Inline error rendering --- */
function showError(input, message) {
  input.classList.add('is-invalid');
  const fb = input.parentElement.querySelector('.invalid-feedback');
  if (fb) { fb.textContent = message; fb.classList.add('show'); }
}
function clearError(input) {
  input.classList.remove('is-invalid');
  const fb = input.parentElement.querySelector('.invalid-feedback');
  if (fb) { fb.textContent = ''; fb.classList.remove('show'); }
}

/* --- Register form logic --- */
const regForm = document.getElementById('register-form');
const regUsername = document.getElementById('reg-username');
const regEmail = document.getElementById('reg-email');
const regPhone = document.getElementById('reg-phone'); // optional
const regPassword = document.getElementById('reg-password');
const regPassword2 = document.getElementById('reg-password2');
const pwBar = document.getElementById('pw-bar');
const pwText = document.getElementById('pw-text');

regPassword.addEventListener('input', () => {
  const val = regPassword.value;
  const {score, label} = passwordStrength(val);
  pwBar.style.width = `${(score/4)*100}%`;
  pwText.textContent = label;
});

regForm.addEventListener('submit', (e) => {
  e.preventDefault();
  [regUsername, regEmail, regPhone, regPassword, regPassword2].forEach(clearError);

  let ok = true;
  const username = regUsername.value.trim();
  const email = regEmail.value.trim();
  const phone = (regPhone && regPhone.value) ? regPhone.value.trim() : '';
  const pass = regPassword.value;
  const pass2 = regPassword2.value;

  if (username.length < 3) { showError(regUsername, 'Username must be at least 3 characters'); ok = false; }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) { showError(regUsername, 'Only letters, numbers and underscore allowed'); ok = false; }
  if (!isValidEmail(email)) { showError(regEmail, 'Please enter a valid email'); ok = false; }
  if (phone && !isValidPhone(phone)) { showError(regPhone, 'Enter a valid phone number (digits or +countrycode)'); ok = false; }

  const {score} = passwordStrength(pass);
  if (score < 3) { showError(regPassword, 'Password is too weak (need length, number and special char)'); ok = false; }
  if (pass !== pass2) { showError(regPassword2, 'Passwords do not match'); ok = false; }

  if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    showError(regEmail, 'Email already registered'); ok = false;
  }

  if (!ok) return;

  const user = { username, email, phone: phone || '—', createdAt: new Date().toISOString() };
  db.users.push(user);
  // save to localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db.users));
  renderUsers();
  regForm.reset();
  pwBar.style.width = '0%';
  pwText.textContent = 'Type a password to see strength';
  showToast('Registration successful!');         // in-page toast
  showView('users');
});

/* --- Login (demo-only) --- */
const loginForm = document.getElementById('login-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  [loginEmail, loginPassword].forEach(clearError);
  const email = loginEmail.value.trim();
  const pass = loginPassword.value;
  if (!isValidEmail(email)) { showError(loginEmail, 'Enter a valid email'); return; }
  if (pass.length === 0) { showError(loginPassword, 'Enter your password'); return; }
  const found = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!found) { showError(loginEmail, 'Email not registered'); return; }
  showToast(`Welcome back, ${found.username}!`);
  showView('users');
});

/* --- Render users list (DOM) --- */
function renderUsers() {
  const container = document.getElementById('users-list');
  container.innerHTML = '';
  db.users.forEach((u, idx) => {
    const div = document.createElement('div');
    div.className = 'col-12 col-md-6';
    div.innerHTML = `
      <div class="user-card d-flex gap-3 align-items-center">
        <img src="assets/images/user.png" alt="avatar" class="img-avatar">
        <div style="flex:1">
          <h5 class="mb-1">${escapeHtml(u.username)}</h5>
          <div class="small-muted">${escapeHtml(u.email)}</div>
          <div class="small-muted">Phone: ${escapeHtml(u.phone)}</div>
          <div class="small-muted">Joined: ${new Date(u.createdAt).toLocaleString()}</div>
        </div>
        <div>
          <button class="btn btn-sm btn-outline-danger remove-user" data-idx="${idx}">Remove</button>
        </div>
      </div>
    `;
    container.appendChild(div);
  });

  // attach remove handlers (re-attach each render)
  document.querySelectorAll('.remove-user').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      const i = Number(ev.currentTarget.dataset.idx);
      if (confirm('Remove this user from the list?')) {
        db.users.splice(i,1);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(db.users)); // save
        renderUsers();
        showToast('User removed');
      }
    });
  });
}

/* --- escape HTML to avoid XSS when rendering values --- */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* --- initial boot --- */
renderUsers();
showView('register');

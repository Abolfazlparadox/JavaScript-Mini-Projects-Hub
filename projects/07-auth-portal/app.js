/**
 * AuthCraft Portal | Authentication Engine & Form Validation
 */

(function () {
  'use strict';

  // --- Local Storage Keys ---
  const STORAGE_USERS = 'authcraft_users';
  const STORAGE_SESSION = 'authcraft_session';

  // Load existing users or default demo user
  let users = JSON.parse(localStorage.getItem(STORAGE_USERS) || '[]');
  if (users.length === 0) {
    users = [
      {
        name: 'Abolfazl Paradox',
        email: 'paradox@example.com',
        pass: 'Password123!',
      },
    ];
    localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
  }

  // --- DOM Elements ---
  const authTabs = document.getElementById('authTabs');
  const tabBtns = document.querySelectorAll('.auth-tabs .tab-btn');
  const formSignIn = document.getElementById('formSignIn');
  const formSignUp = document.getElementById('formSignUp');
  const formForgot = document.getElementById('formForgot');
  const boxLoggedIn = document.getElementById('boxLoggedIn');

  const signinEmail = document.getElementById('signinEmail');
  const signinPass = document.getElementById('signinPass');

  const signupName = document.getElementById('signupName');
  const signupEmail = document.getElementById('signupEmail');
  const signupPass = document.getElementById('signupPass');
  const signupConfirmPass = document.getElementById('signupConfirmPass');
  const strengthFill = document.getElementById('strengthFill');
  const strengthLabel = document.getElementById('strengthLabel');
  const confirmError = document.getElementById('confirmError');

  const forgotEmail = document.getElementById('forgotEmail');
  const linkToForgot = document.getElementById('linkToForgot');
  const linkBackToLogin = document.getElementById('linkBackToLogin');

  const loggedInName = document.getElementById('loggedInName');
  const loggedInEmail = document.getElementById('loggedInEmail');
  const userAvatar = document.getElementById('userAvatar');
  const btnLogout = document.getElementById('btnLogout');
  const toastContainer = document.getElementById('toastContainer');

  // --- Switch Tabs ---
  function showTab(target) {
    tabBtns.forEach((b) => b.classList.toggle('active', b.dataset.target === target));
    formSignIn.classList.toggle('hidden', target !== 'signin');
    formSignUp.classList.toggle('hidden', target !== 'signup');
    formForgot.classList.toggle('hidden', target !== 'forgot');
    boxLoggedIn.classList.add('hidden');
    authTabs.classList.remove('hidden');
  }

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => showTab(btn.dataset.target));
  });

  linkToForgot.addEventListener('click', () => showTab('forgot'));
  linkBackToLogin.addEventListener('click', () => showTab('signin'));

  // --- Password Visibility Toggle ---
  document.querySelectorAll('.toggle-eye-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.input);
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
      } else {
        input.type = 'password';
        btn.textContent = '👁️';
      }
    });
  });

  // --- Password Strength Meter ---
  signupPass.addEventListener('input', (e) => {
    const val = e.target.value;
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    if (val.length === 0) {
      strengthFill.style.width = '0%';
      strengthFill.style.background = '#ef4444';
      strengthLabel.textContent = 'Enter password';
      return;
    }

    switch (score) {
      case 1:
        strengthFill.style.width = '25%';
        strengthFill.style.background = '#ef4444';
        strengthLabel.textContent = 'Weak';
        break;
      case 2:
        strengthFill.style.width = '50%';
        strengthFill.style.background = '#f59e0b';
        strengthLabel.textContent = 'Fair';
        break;
      case 3:
        strengthFill.style.width = '75%';
        strengthFill.style.background = '#3b82f6';
        strengthLabel.textContent = 'Strong';
        break;
      case 4:
        strengthFill.style.width = '100%';
        strengthFill.style.background = '#10b981';
        strengthLabel.textContent = 'Very Secure';
        break;
    }
  });

  // --- Confirm Password Check ---
  signupConfirmPass.addEventListener('input', () => {
    const mismatch = signupPass.value !== signupConfirmPass.value;
    confirmError.classList.toggle('hidden', !mismatch);
  });

  // --- Sign In Handler ---
  formSignIn.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = signinEmail.value.trim().toLowerCase();
    const pass = signinPass.value;

    const matched = users.find((u) => u.email.toLowerCase() === email && u.pass === pass);
    if (matched) {
      setSession(matched);
      showToast(`Welcome back, ${matched.name}! 🎉`);
    } else {
      showToast('Invalid email or password. Check credentials.');
    }
  });

  // --- Sign Up Handler ---
  formSignUp.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = signupName.value.trim();
    const email = signupEmail.value.trim().toLowerCase();
    const pass = signupPass.value;
    const confirm = signupConfirmPass.value;

    if (pass !== confirm) {
      showToast('Passwords do not match');
      return;
    }

    if (users.some((u) => u.email.toLowerCase() === email)) {
      showToast('An account with this email already exists');
      return;
    }

    const newUser = { name, email, pass };
    users.push(newUser);
    localStorage.setItem(STORAGE_USERS, JSON.stringify(users));

    setSession(newUser);
    showToast('Account created successfully! 🚀');
    formSignUp.reset();
  });

  // --- Forgot Password Handler ---
  formForgot.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = forgotEmail.value.trim();
    showToast(`Password recovery email sent to ${email} (Simulated)`);
    formForgot.reset();
    setTimeout(() => showTab('signin'), 1500);
  });

  // --- Session Management ---
  function setSession(user) {
    localStorage.setItem(STORAGE_SESSION, JSON.stringify(user));
    renderLoggedInView(user);
  }

  function renderLoggedInView(user) {
    authTabs.classList.add('hidden');
    formSignIn.classList.add('hidden');
    formSignUp.classList.add('hidden');
    formForgot.classList.add('hidden');
    boxLoggedIn.classList.remove('hidden');

    loggedInName.textContent = user.name;
    loggedInEmail.textContent = user.email;
    userAvatar.textContent = user.name.charAt(0).toUpperCase();
  }

  btnLogout.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_SESSION);
    showTab('signin');
    showToast('Signed out successfully');
  });

  function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  // Check existing session
  const activeSession = JSON.parse(localStorage.getItem(STORAGE_SESSION) || 'null');
  if (activeSession) {
    renderLoggedInView(activeSession);
  }
})();

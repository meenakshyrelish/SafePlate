// SafePlate AI - Authentication Client Logic

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const authAlert = document.getElementById('authAlert');

  // Check if user is already logged in, redirect if so
  checkExistingSession();

  // Helper: Display banner alert
  function showAlert(message, type = 'error') {
    if (!authAlert) return;
    authAlert.textContent = message;
    authAlert.className = `auth-alert auth-alert-${type}`;
    authAlert.style.display = 'block';
  }

  function hideAlert() {
    if (!authAlert) return;
    authAlert.textContent = '';
    authAlert.style.display = 'none';
  }

  // Helper: Set field error
  function setFieldError(fieldId, message) {
    const errorEl = document.getElementById(`${fieldId}Error`);
    const inputEl = document.getElementById(fieldId);
    if (errorEl) errorEl.textContent = message;
    if (inputEl) {
      if (message) {
        inputEl.classList.add('input-invalid');
      } else {
        inputEl.classList.remove('input-invalid');
      }
    }
  }

  function clearAllErrors() {
    hideAlert();
    document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
    document.querySelectorAll('.form-input').forEach(el => el.classList.remove('input-invalid'));
  }

  // Helper: Simple email regex
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Helper: Get redirect URL from query string
  function getRedirectUrl(defaultUrl = 'index.html') {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (redirect && !redirect.startsWith('http://') && !redirect.startsWith('https://')) {
      return redirect;
    }
    return defaultUrl;
  }

  // Check if session already active
  async function checkExistingSession() {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          // If already logged in, redirect to destination
          window.location.href = getRedirectUrl('index.html');
        }
      }
    } catch {
      // Ignore network errors when checking session
    }
  }

  // Login form handler
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAllErrors();

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const submitBtn = document.getElementById('loginSubmitBtn');

      let hasError = false;

      if (!email) {
        setFieldError('email', 'Email is required');
        hasError = true;
      } else if (!isValidEmail(email)) {
        setFieldError('email', 'Please enter a valid email address');
        hasError = true;
      }

      if (!password) {
        setFieldError('password', 'Password is required');
        hasError = true;
      }

      if (hasError) return;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Logging in...';

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
          showAlert(data.message || 'Login failed. Please verify your credentials.');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Log In';
          return;
        }

        showAlert('Login successful! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = getRedirectUrl('index.html');
        }, 500);

      } catch (err) {
        showAlert('Unable to connect to server. Please try again later.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Log In';
      }
    });
  }

  // Signup form handler
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAllErrors();

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const submitBtn = document.getElementById('signupSubmitBtn');

      let hasError = false;

      if (!name) {
        setFieldError('name', 'Full name is required');
        hasError = true;
      } else if (name.length < 2) {
        setFieldError('name', 'Name must be at least 2 characters long');
        hasError = true;
      }

      if (!email) {
        setFieldError('email', 'Email address is required');
        hasError = true;
      } else if (!isValidEmail(email)) {
        setFieldError('email', 'Please enter a valid email address');
        hasError = true;
      }

      if (!password) {
        setFieldError('password', 'Password is required');
        hasError = true;
      } else if (password.length < 6) {
        setFieldError('password', 'Password must be at least 6 characters long');
        hasError = true;
      }

      if (!confirmPassword) {
        setFieldError('confirmPassword', 'Please confirm your password');
        hasError = true;
      } else if (password !== confirmPassword) {
        setFieldError('confirmPassword', 'Passwords do not match');
        hasError = true;
      }

      if (hasError) return;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating account...';

      try {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, confirmPassword })
        });

        const data = await response.json();

        if (!response.ok) {
          showAlert(data.message || 'Signup failed. Please try again.');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign Up';
          return;
        }

        showAlert('Account created successfully! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = getRedirectUrl('index.html');
        }, 600);

      } catch (err) {
        showAlert('Unable to connect to server. Please try again later.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign Up';
      }
    });
  }
});

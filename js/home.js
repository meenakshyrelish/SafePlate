// SafePlate AI - Home Page Navigation & Auth State

document.addEventListener('DOMContentLoaded', async () => {
  const navActions = document.getElementById('navActions');
  const getStartedBtn = document.getElementById('getStartedBtn');

  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const data = await res.json();
      if (data.authenticated && data.user) {
        // User is logged in
        if (navActions) {
          navActions.innerHTML = `
            <span class="nav-user-greeting">👋 Hi, ${escapeHtml(data.user.name)}</span>
            <a href="allergy-select.html" class="nav-link nav-link-primary">Allergies</a>
            <button id="navLogoutBtn" class="nav-logout-btn">Log Out</button>
          `;

          document.getElementById('navLogoutBtn').addEventListener('click', handleLogout);
        }

        if (getStartedBtn) {
          getStartedBtn.href = 'allergy-select.html';
        }
        return;
      }
    }
  } catch {
    // If server unreachable or error, fallback to logged-out state
  }

  // User is not logged in
  if (navActions) {
    navActions.innerHTML = `
      <a href="login.html" class="nav-link">Log In</a>
      <a href="signup.html" class="nav-link nav-link-primary">Sign Up</a>
    `;
  }

  if (getStartedBtn) {
    getStartedBtn.href = 'signup.html';
  }

  async function handleLogout(e) {
    e.preventDefault();
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      window.location.reload();
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
});

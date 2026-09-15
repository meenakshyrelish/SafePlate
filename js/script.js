// SafePlate AI - Allergy Selection Logic & Auth Integration

document.addEventListener('DOMContentLoaded', () => {
  // Existing allergy selection logic
  const pills = document.querySelectorAll('.allergy-pill:not(.custom-pill)');
  const submitBtn = document.getElementById('submitBtn');
  const customBtn = document.getElementById('customBtn');

  let selectedAllergies = [];

  if (pills && pills.length > 0) {
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pill.classList.toggle('selected');
        const allergy = pill.dataset.allergy;

        if (pill.classList.contains('selected')) {
          selectedAllergies.push(allergy);
        } else {
          selectedAllergies = selectedAllergies.filter(a => a !== allergy);
        }

        if (submitBtn) {
          submitBtn.disabled = selectedAllergies.length === 0;
        }
      });
    });
  }

  if (customBtn) {
    customBtn.addEventListener('click', () => {
      const custom = prompt('Enter your allergy:');
      if (custom && custom.trim() !== '') {
        selectedAllergies.push(custom.trim());
        if (submitBtn) submitBtn.disabled = false;
        alert(`Added: ${custom.trim()}`);
      }
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      console.log('Selected allergies:', selectedAllergies);
      // Next: redirect to results.html and pass selectedAllergies along
      alert(`Great! You selected: ${selectedAllergies.join(', ')}`);
    });
  }

  // Handle Logout button if present on page
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (err) {
        console.error('Logout error:', err);
      } finally {
        window.location.href = 'login.html';
      }
    });
  }

  // Check auth status to show current user info in header/navbar
  async function loadUserInfo() {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          const userGreeting = document.getElementById('userGreeting');
          if (userGreeting) {
            userGreeting.textContent = `Hello, ${data.user.name}`;
          }
        }
      }
    } catch {
      // Ignore network errors for background user check
    }
  }

  loadUserInfo();
});

// SafePlate AI - Allergy Selection Logic & Auth Integration

document.addEventListener('DOMContentLoaded', () => {
  const pills = document.querySelectorAll('.allergy-pill:not(.custom-pill)');
  const submitBtn = document.getElementById('submitBtn');
  const customBtn = document.getElementById('customBtn');

  let selectedAllergies = [];

  // 1. Pill click selection logic
  if (pills && pills.length > 0) {
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pill.classList.toggle('selected');
        const allergy = pill.dataset.allergy;

        if (pill.classList.contains('selected')) {
          if (!selectedAllergies.includes(allergy)) {
            selectedAllergies.push(allergy);
          }
        } else {
          selectedAllergies = selectedAllergies.filter(a => a !== allergy);
        }

        if (submitBtn) {
          submitBtn.disabled = selectedAllergies.length === 0;
        }
      });
    });
  }

  // 2. Custom allergy addition
  if (customBtn) {
    customBtn.addEventListener('click', () => {
      const custom = prompt('Enter your allergy:');
      if (custom && custom.trim() !== '') {
        const clean = custom.trim();
        if (!selectedAllergies.includes(clean)) {
          selectedAllergies.push(clean);
          
          // Add custom pill dynamically to UI
          const newPill = document.createElement('button');
          newPill.className = 'allergy-pill selected';
          newPill.dataset.allergy = clean;
          newPill.textContent = clean;
          newPill.addEventListener('click', () => {
            newPill.classList.toggle('selected');
            if (newPill.classList.contains('selected')) {
              if (!selectedAllergies.includes(clean)) selectedAllergies.push(clean);
            } else {
              selectedAllergies = selectedAllergies.filter(a => a !== clean);
            }
            if (submitBtn) submitBtn.disabled = selectedAllergies.length === 0;
          });

          customBtn.parentNode.insertBefore(newPill, customBtn);
        }

        if (submitBtn) submitBtn.disabled = false;
        alert(`Added allergy: ${clean}`);
      }
    });
  }

  // 3. Submit allergies -> Save to Database profile -> Redirect to meals.html
  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      if (selectedAllergies.length === 0) return;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving preferences...';

      try {
        const response = await fetch('/api/user/allergies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ allergies: selectedAllergies })
        });

        if (!response.ok) {
          throw new Error('Failed to save allergy preferences');
        }

        // Redirect directly to meal discovery
        window.location.href = 'meals.html';

      } catch (err) {
        console.error('Save allergies error:', err);
        alert('Unable to save preferences to database. Please check your connection.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
      }
    });
  }

  // 4. Handle Logout button
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

  // 5. Pre-load existing user profile & saved allergies
  async function loadUserAndSavedAllergies() {
    try {
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.authenticated && meData.user) {
          const userGreeting = document.getElementById('userGreeting');
          if (userGreeting) {
            userGreeting.textContent = `Hello, ${meData.user.name}`;
          }
        }
      }

      // Pre-select existing allergies if previously saved in database
      const allergyRes = await fetch('/api/user/allergies');
      if (allergyRes.ok) {
        const allergyData = await allergyRes.json();
        if (Array.isArray(allergyData.allergies) && allergyData.allergies.length > 0) {
          selectedAllergies = [...allergyData.allergies];

          pills.forEach(pill => {
            if (selectedAllergies.includes(pill.dataset.allergy)) {
              pill.classList.add('selected');
            }
          });

          // Add any custom allergies as pills
          const standardPills = Array.from(pills).map(p => p.dataset.allergy);
          selectedAllergies.forEach(allergy => {
            if (!standardPills.includes(allergy) && customBtn && customBtn.parentNode) {
              const customPill = document.createElement('button');
              customPill.className = 'allergy-pill selected';
              customPill.dataset.allergy = allergy;
              customPill.textContent = allergy;
              customPill.addEventListener('click', () => {
                customPill.classList.toggle('selected');
                if (customPill.classList.contains('selected')) {
                  if (!selectedAllergies.includes(allergy)) selectedAllergies.push(allergy);
                } else {
                  selectedAllergies = selectedAllergies.filter(a => a !== allergy);
                }
                if (submitBtn) submitBtn.disabled = selectedAllergies.length === 0;
              });
              customBtn.parentNode.insertBefore(customPill, customBtn);
            }
          });

          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save & Discover Meals';
          }
        }
      }
    } catch (err) {
      console.error('Error pre-loading allergies:', err);
    }
  }

  loadUserAndSavedAllergies();
});

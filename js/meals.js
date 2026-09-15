// SafePlate AI - Meal Discovery & Unified Recipe Personalization Logic

document.addEventListener('DOMContentLoaded', () => {
  let currentUser = null;
  let userAllergies = [];
  let defaultMealsList = [];
  let currentCategory = 'all';

  // DOM Elements
  const userGreeting = document.getElementById('userGreeting');
  const activeAllergiesBadge = document.getElementById('activeAllergiesBadge');
  const logoutBtn = document.getElementById('logoutBtn');
  const mealGrid = document.getElementById('mealGrid');
  const resultsCount = document.getElementById('resultsCount');
  const gridHeading = document.getElementById('gridHeading');
  const mealSearchForm = document.getElementById('mealSearchForm');
  const mealSearchInput = document.getElementById('mealSearchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const categoryFilters = document.getElementById('categoryFilters');

  // Modal Elements
  const recipeModal = document.getElementById('recipeModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const recipeLoadingState = document.getElementById('recipeLoadingState');
  const recipeContentState = document.getElementById('recipeContentState');

  // Initialize Page
  initPage();

  async function initPage() {
    await checkAuthAndLoadAllergies();
    await loadDefaultMeals();
    setupEventListeners();
  }

  // 1. Auth and Allergy Profile Fetching
  async function checkAuthAndLoadAllergies() {
    try {
      // Check authentication
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) throw new Error('Auth check failed');
      const meData = await meRes.json();

      if (!meData.authenticated || !meData.user) {
        window.location.href = `login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }

      currentUser = meData.user;
      if (userGreeting) {
        userGreeting.textContent = `Hi, ${currentUser.name}`;
      }

      // Fetch user's saved allergies from database
      const allergyRes = await fetch('/api/user/allergies');
      if (allergyRes.ok) {
        const allergyData = await allergyRes.json();
        userAllergies = allergyData.allergies || [];
      }

      renderAllergyBadges();

    } catch (err) {
      console.error('Error initializing user profile:', err);
      window.location.href = 'login.html';
    }
  }

  function renderAllergyBadges() {
    if (!activeAllergiesBadge) return;
    if (userAllergies.length === 0) {
      activeAllergiesBadge.innerHTML = `<span class="badge-none">None recorded</span>`;
    } else {
      activeAllergiesBadge.innerHTML = userAllergies.map(a => 
        `<span class="allergy-tag-pill">${escapeHtml(a)}</span>`
      ).join(' ');
    }
  }

  // 2. Load Default Meals (Flow 1)
  async function loadDefaultMeals() {
    try {
      const res = await fetch('/api/meals/defaults');
      const data = await res.json();
      if (data.success && Array.isArray(data.meals)) {
        defaultMealsList = data.meals;
        renderMealCards(defaultMealsList);
      } else {
        mealGrid.innerHTML = `<div class="meal-error">Unable to load meal suggestions.</div>`;
      }
    } catch (err) {
      console.error('Error fetching default meals:', err);
      mealGrid.innerHTML = `<div class="meal-error">Failed to connect to recipe server.</div>`;
    }
  }

  // 3. Render Meal Cards in Grid (Supports both Default and Searched Meals)
  function renderMealCards(meals, isSearchResult = false) {
    if (!mealGrid) return;

    if (!meals || meals.length === 0) {
      mealGrid.innerHTML = `
        <div class="meal-no-results">
          <div class="no-results-icon">🔍</div>
          <h3>No matching meals found</h3>
          <p>Try searching for a different dish name like Pizza, Biryani, Pasta, or Dosa.</p>
          <button id="resetSearchBtn" class="cta-btn reset-search-btn">View All 12 Default Meals</button>
        </div>
      `;
      const resetBtn = document.getElementById('resetSearchBtn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          mealSearchInput.value = '';
          clearSearchBtn.style.display = 'none';
          currentCategory = 'all';
          updateActiveChip('all');
          renderMealCards(defaultMealsList);
        });
      }
      if (resultsCount) resultsCount.textContent = '0 meals found';
      return;
    }

    if (resultsCount) {
      resultsCount.textContent = `${meals.length} ${meals.length === 1 ? 'meal' : 'meals'} available`;
    }

    mealGrid.innerHTML = meals.map(meal => {
      // Check which allergies this meal might trigger for visual cues
      const allergensMatch = (meal.allergenTags || []).filter(tag => 
        userAllergies.some(ua => ua.toLowerCase() === tag.toLowerCase())
      );

      let allergenBadgeHtml = '';
      if (allergensMatch.length > 0) {
        allergenBadgeHtml = `
          <div class="card-allergen-alert" title="SafePlate will substitute these ingredients for you">
            <span class="warning-icon">⚡</span> Auto-Substitutes: ${allergensMatch.map(escapeHtml).join(', ')}
          </div>
        `;
      } else {
        allergenBadgeHtml = `
          <div class="card-allergen-safe">
            <span class="safe-icon">✓</span> Free of your recorded allergens
          </div>
        `;
      }

      return `
        <div class="meal-card" data-meal="${escapeHtml(meal.name)}" role="button" tabindex="0">
          <div class="meal-card-image-wrap">
            <img 
              src="${escapeHtml(meal.image)}" 
              alt="${escapeHtml(meal.name)}" 
              class="meal-card-img" 
              loading="lazy"
              onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';"
            >
            <span class="meal-category-tag">${escapeHtml(meal.category || 'Specialty')}</span>
          </div>
          <div class="meal-card-body">
            <h3 class="meal-card-title">${escapeHtml(meal.name)}</h3>
            <p class="meal-card-desc">${escapeHtml(meal.description)}</p>
            <div class="meal-card-meta">
              <span>⏱ Prep: ${escapeHtml(meal.prepTime || '15 mins')}</span>
              <span>🔥 Cook: ${escapeHtml(meal.cookTime || '15 mins')}</span>
            </div>
            ${allergenBadgeHtml}
            <div class="meal-card-actions">
              <button class="select-meal-btn" data-meal="${escapeHtml(meal.name)}">
                View Personalized Recipe →
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach click listeners to cards and buttons
    document.querySelectorAll('.meal-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // Prevent double triggering if clicked directly on button
        const mealName = card.dataset.meal;
        selectAndPersonalizeMeal(mealName);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectAndPersonalizeMeal(card.dataset.meal);
        }
      });
    });

    document.querySelectorAll('.select-meal-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Avoid card wrapper re-trigger
        const mealName = btn.dataset.meal;
        selectAndPersonalizeMeal(mealName);
      });
    });
  }

  // 4. Unified Personalization Handler (For Both Default Meals and Searched Meals)
  async function selectAndPersonalizeMeal(mealName) {
    if (!mealName) return;

    // Open modal and show loading state
    recipeModal.style.display = 'flex';
    recipeLoadingState.style.display = 'block';
    recipeContentState.style.display = 'none';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling

    try {
      // Call UNIFIED personalization endpoint
      const response = await fetch('/api/recipes/personalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meal: mealName })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Unable to generate personalized recipe');
      }

      const data = await response.json();
      renderPersonalizedRecipe(data.recipe);

    } catch (err) {
      console.error('Personalization error:', err);
      recipeLoadingState.style.display = 'none';
      recipeContentState.style.display = 'block';
      recipeContentState.innerHTML = `
        <div class="modal-error-banner">
          <h3>Failed to Personalize Recipe</h3>
          <p>${escapeHtml(err.message || 'An unexpected error occurred.')}</p>
          <button class="cta-btn" onclick="document.getElementById('recipeModal').style.display='none'; document.body.style.overflow='auto';">Close</button>
        </div>
      `;
    }
  }

  // 5. Render Personalized Recipe Modal
  function renderPersonalizedRecipe(recipe) {
    recipeLoadingState.style.display = 'none';
    recipeContentState.style.display = 'block';

    const allergensDetected = recipe.allergensDetected || [];
    const substitutions = recipe.ingredientsSubstituted || [];
    const hasSubs = substitutions.length > 0;

    // Allergy Safety Banner
    let safetyBannerHtml = '';
    if (allergensDetected.length > 0) {
      safetyBannerHtml = `
        <div class="recipe-safety-alert alert-personalized">
          <div class="alert-icon-wrap">🛡️</div>
          <div class="alert-text-wrap">
            <h4>Allergens Detected & Intelligently Replaced</h4>
            <p>Your profile flagged <strong>${allergensDetected.map(escapeHtml).join(', ')}</strong>. Every unsafe ingredient has been replaced with safe, cross-validated culinary alternatives.</p>
          </div>
        </div>
      `;
    } else {
      safetyBannerHtml = `
        <div class="recipe-safety-alert alert-safe">
          <div class="alert-icon-wrap">✅</div>
          <div class="alert-text-wrap">
            <h4>No Allergens Detected from Your Profile</h4>
            <p>This dish's traditional ingredients do not conflict with your recorded allergies (${recipe.userAllergiesChecked.length > 0 ? recipe.userAllergiesChecked.map(escapeHtml).join(', ') : 'No allergies recorded'}).</p>
          </div>
        </div>
      `;
    }

    // Substitutions Comparison Section
    let substitutionsHtml = '';
    if (hasSubs) {
      substitutionsHtml = `
        <section class="recipe-section subs-section">
          <h3 class="recipe-section-title">
            <span class="section-icon">🔄</span> Ingredients Substituted (${substitutions.length})
          </h3>
          <p class="section-subtext">Original allergens were removed and replaced with safe, validated options:</p>
          <div class="subs-grid">
            ${substitutions.map(sub => `
              <div class="sub-card">
                <div class="sub-before">
                  <span class="sub-pill pill-removed">🚫 Removed</span>
                  <strong>${escapeHtml(sub.original)}</strong>
                  <span class="sub-tag">Allergen: ${sub.allergensAvoided.map(escapeHtml).join(', ')}</span>
                </div>
                <div class="sub-arrow">➔</div>
                <div class="sub-after">
                  <span class="sub-pill pill-safe">✨ Safe Replacement</span>
                  <strong>${escapeHtml(sub.substitute)}</strong>
                  <span class="sub-reason">${escapeHtml(sub.reason)}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </section>
      `;
    }

    // Final Ingredients Section
    const ingredientsHtml = `
      <section class="recipe-section ingredients-section">
        <h3 class="recipe-section-title">
          <span class="section-icon">🥗</span> Final Safe Ingredients (${recipe.finalIngredients.length})
        </h3>
        <ul class="ingredient-list">
          ${recipe.finalIngredients.map(ing => `
            <li class="ingredient-item ${ing.isSubstituted ? 'is-substituted-item' : ''}">
              <label class="ingredient-checkbox-label">
                <input type="checkbox" class="ingredient-checkbox">
                <span class="ingredient-name">
                  <strong>${escapeHtml(ing.amount)}</strong> — ${escapeHtml(ing.name)}
                </span>
                ${ing.isSubstituted ? `<span class="tag-sub-badge">Safe Substitute</span>` : ''}
              </label>
            </li>
          `).join('')}
        </ul>
      </section>
    `;

    // Step-by-Step Cooking Instructions
    const instructionsHtml = `
      <section class="recipe-section instructions-section">
        <h3 class="recipe-section-title">
          <span class="section-icon">🍳</span> Cooking Instructions
        </h3>
        <ol class="instruction-steps">
          ${recipe.cookingInstructions.map(step => `
            <li class="instruction-step">
              <p>${escapeHtml(step)}</p>
            </li>
          `).join('')}
        </ol>
      </section>
    `;

    // Caution Notes and Medical Disclaimer
    const cautionHtml = `
      <section class="recipe-section caution-section">
        <h3 class="recipe-section-title">
          <span class="section-icon">⚠️</span> Safety & Cross-Contamination Notes
        </h3>
        <ul class="caution-list">
          ${recipe.safetyCautionNotes.map(note => `
            <li class="caution-item">${escapeHtml(note)}</li>
          `).join('')}
        </ul>

        <!-- Mandatory Medical Disclaimer -->
        <div class="medical-disclaimer-box" role="note">
          <div class="disclaimer-header">
            <span class="disclaimer-icon">ℹ️</span>
            <strong>Important Medical & Health Notice</strong>
          </div>
          <p class="disclaimer-text">${escapeHtml(recipe.medicalDisclaimer)}</p>
        </div>
      </section>
    `;

    // Put it all together
    recipeContentState.innerHTML = `
      <div class="modal-recipe-header">
        <div class="modal-hero-cover" style="background-image: url('${escapeHtml(recipe.image)}');">
          <div class="modal-hero-overlay">
            <span class="modal-category-chip">${escapeHtml(recipe.category || 'SafePlate Recipe')}</span>
            <h2 id="modalRecipeTitle" class="modal-recipe-title">${escapeHtml(recipe.originalMeal)}</h2>
            <div class="modal-meta-row">
              <span>⏱ Prep: ${escapeHtml(recipe.prepTime)}</span>
              <span>🔥 Cook: ${escapeHtml(recipe.cookTime)}</span>
              <span>🛡️ SafePlate Personalized</span>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-recipe-body">
        ${safetyBannerHtml}
        ${substitutionsHtml}
        ${ingredientsHtml}
        ${instructionsHtml}
        ${cautionHtml}
      </div>

      <div class="modal-recipe-footer">
        <button class="cta-btn secondary-btn" onclick="window.print();">🖨️ Print Recipe</button>
        <button class="cta-btn" id="modalDoneBtn">Done / Back to Meals</button>
      </div>
    `;

    document.getElementById('modalDoneBtn').addEventListener('click', closeModal);
  }

  function closeModal() {
    recipeModal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }

  // 6. Event Listeners (Search, Filters, Modal Close, Logout)
  function setupEventListeners() {
    // Close modal triggers
    closeModalBtn.addEventListener('click', closeModal);
    recipeModal.addEventListener('click', (e) => {
      if (e.target === recipeModal) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && recipeModal.style.display !== 'none') {
        closeModal();
      }
    });

    // Search input clear button
    mealSearchInput.addEventListener('input', () => {
      clearSearchBtn.style.display = mealSearchInput.value.trim() ? 'block' : 'none';
    });

    clearSearchBtn.addEventListener('click', () => {
      mealSearchInput.value = '';
      clearSearchBtn.style.display = 'none';
      gridHeading.textContent = 'Popular Suggestions';
      renderMealCards(filterMealsByCategory(defaultMealsList, currentCategory));
    });

    // Search submit (Flow 2)
    mealSearchForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const query = mealSearchInput.value.trim();

      if (!query) {
        gridHeading.textContent = 'Popular Suggestions';
        renderMealCards(filterMealsByCategory(defaultMealsList, currentCategory));
        return;
      }

      gridHeading.textContent = `Search Results for "${query}"`;
      mealGrid.innerHTML = `<div class="meal-grid-loading">Searching recipes...</div>`;

      try {
        const res = await fetch(`/api/meals/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.meals)) {
          renderMealCards(data.meals, true);
        } else {
          renderMealCards([], true);
        }
      } catch (err) {
        console.error('Search error:', err);
        mealGrid.innerHTML = `<div class="meal-error">Search request failed.</div>`;
      }
    });

    // Category Filter Chips
    if (categoryFilters) {
      categoryFilters.addEventListener('click', (e) => {
        const chip = e.target.closest('.filter-chip');
        if (!chip) return;

        currentCategory = chip.dataset.category;
        updateActiveChip(currentCategory);

        const query = mealSearchInput.value.trim();
        if (query) {
          // If searching, let search run
          return;
        }

        const filtered = filterMealsByCategory(defaultMealsList, currentCategory);
        gridHeading.textContent = currentCategory === 'all' ? 'Popular Suggestions' : `${chip.textContent} Meals`;
        renderMealCards(filtered);
      });
    }

    // Logout
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
  }

  function updateActiveChip(category) {
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.category === category);
    });
  }

  function filterMealsByCategory(meals, category) {
    if (category === 'all') return meals;
    if (category === 'Popular') {
      return meals.slice(0, 6);
    }
    return meals.filter(m => m.category.toLowerCase() === category.toLowerCase());
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});

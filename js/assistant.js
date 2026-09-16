// SafePlate AI - Allergy First-Aid Assistant Interactive Logic

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const openAssistantCard = document.getElementById('openAssistantCard');
  const openAssistantBtn = document.getElementById('openAssistantBtn');
  const assistantModal = document.getElementById('assistantModal');
  const closeAssistantBtn = document.getElementById('closeAssistantBtn');
  const assistantAllergiesList = document.getElementById('assistantAllergiesList');
  const editProfileLink = document.getElementById('editProfileLink');

  const symptomSurveyForm = document.getElementById('symptomSurveyForm');
  const submitSurveyBtn = document.getElementById('submitSurveyBtn');
  const surveyValidationError = document.getElementById('surveyValidationError');
  const symptomSurveyView = document.getElementById('symptomSurveyView');
  const guidanceResultView = document.getElementById('guidanceResultView');
  const chatbotSection = document.getElementById('chatbotSection');
  const startOverBtn = document.getElementById('startOverBtn');

  const chatMessagesFeed = document.getElementById('chatMessagesFeed');
  const assistantChatForm = document.getElementById('assistantChatForm');
  const assistantChatInput = document.getElementById('assistantChatInput');
  const quickChips = document.getElementById('quickChips');

  let currentAllergies = [];
  let currentReportedSymptoms = [];
  let currentFoodContact = '';
  let isCurrentEmergency = false;

  // 1. Open / Close Assistant Modal
  function openAssistant() {
    assistantModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    loadAssistantProfile();
  }

  function closeAssistant() {
    assistantModal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }

  if (openAssistantCard) {
    openAssistantCard.addEventListener('click', openAssistant);
    openAssistantCard.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openAssistant();
      }
    });
  }

  if (openAssistantBtn) {
    openAssistantBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openAssistant();
    });
  }

  if (closeAssistantBtn) {
    closeAssistantBtn.addEventListener('click', closeAssistant);
  }

  assistantModal.addEventListener('click', (e) => {
    if (e.target === assistantModal) closeAssistant();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && assistantModal.style.display !== 'none') {
      closeAssistant();
    }
  });

  // 2. Fetch User Allergy Profile from Database
  async function loadAssistantProfile() {
    try {
      const res = await fetch('/api/assistant/profile');
      if (res.ok) {
        const data = await res.json();
        currentAllergies = data.allergies || [];
        if (assistantAllergiesList) {
          if (currentAllergies.length > 0) {
            assistantAllergiesList.textContent = data.formattedAllergies;
          } else if (data.authenticated) {
            assistantAllergiesList.innerHTML = `<span class="italic-text">None saved in profile yet</span>`;
          } else {
            assistantAllergiesList.innerHTML = `<span class="italic-text">Guest (Log in to load saved profile)</span>`;
          }
        }
        if (editProfileLink) {
          editProfileLink.style.display = data.authenticated ? 'inline' : 'none';
        }
      }
    } catch (err) {
      console.error('Error loading assistant profile:', err);
      if (assistantAllergiesList) assistantAllergiesList.textContent = 'Unable to check saved profile';
    }
  }

  // 3. Handle Symptom Survey Form Submit
  if (symptomSurveyForm) {
    symptomSurveyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      surveyValidationError.style.display = 'none';

      const checkedBoxes = Array.from(document.querySelectorAll('input[name="symptom"]:checked'));
      const selectedSymptoms = checkedBoxes.map(cb => cb.value);
      const onsetTime = document.getElementById('onsetTimeSelect').value;
      const foodContact = document.getElementById('foodExposureInput').value.trim();

      if (selectedSymptoms.length === 0 && !foodContact) {
        surveyValidationError.textContent = 'Please select at least one symptom or describe your suspected food exposure to proceed.';
        surveyValidationError.style.display = 'block';
        return;
      }

      currentReportedSymptoms = selectedSymptoms;
      currentFoodContact = foodContact;

      submitSurveyBtn.disabled = true;
      submitSurveyBtn.textContent = 'Analyzing symptoms & safety triage...';

      try {
        const response = await fetch('/api/assistant/assess', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symptoms: selectedSymptoms,
            onsetTime,
            foodContact
          })
        });

        if (!response.ok) {
          throw new Error('Failed to assess symptoms');
        }

        const data = await response.json();
        isCurrentEmergency = data.isEmergency;

        // Switch to result view
        symptomSurveyView.style.display = 'none';
        guidanceResultView.style.display = 'block';
        chatbotSection.style.display = 'block';
        startOverBtn.style.display = 'inline-block';

        renderGuidance(data.guidance, data.isEmergency);

        // Clear and initialize chat feed
        chatMessagesFeed.innerHTML = '';
        appendChatMessage(
          'assistant',
          data.isEmergency
            ? '🚨 We have detected potentially serious symptoms. Please review the emergency guidance above and call emergency services immediately if needed. How else can I support you right now?'
            : 'I have generated your first-aid guidance above. You can ask follow-up questions below about non-medication comfort, monitoring, or when to seek care.'
        );

        // Scroll to top of modal body
        guidanceResultView.scrollIntoView({ behavior: 'smooth', block: 'start' });

      } catch (err) {
        console.error('Assessment error:', err);
        surveyValidationError.textContent = 'An error occurred during assessment. Please check your connection and try again.';
        surveyValidationError.style.display = 'block';
      } finally {
        submitSurveyBtn.disabled = false;
        submitSurveyBtn.textContent = 'Assess Symptoms & Get First-Aid Guidance →';
      }
    });
  }

  // 4. Render Guidance (Emergency Alert vs 7-Section Non-Emergency)
  function renderGuidance(guidance, isEmergency) {
    if (isEmergency) {
      // 🚨 EMERGENCY RESULT VIEW
      guidanceResultView.innerHTML = `
        <div class="emergency-alert-card" role="alert">
          <div class="emergency-badge-row">
            <span class="emergency-flashing-icon">🚨</span>
            <span class="emergency-badge-text">POSSIBLE MEDICAL EMERGENCY</span>
          </div>

          <h3 class="emergency-main-heading">Seek Emergency Medical Help Immediately</h3>
          <p class="emergency-alert-desc">${escapeHtml(guidance.alertMessage)}</p>

          <div class="emergency-reasons-box">
            <h4>Critical Symptoms Detected:</h4>
            <ul>
              ${(guidance.emergencyReasons || []).map(r => `<li>⚠️ ${escapeHtml(r)}</li>`).join('')}
            </ul>
          </div>

          <div class="emergency-actions-box">
            <h4>Immediate Actions to Take Right Now:</h4>
            <ol class="emergency-steps-list">
              ${(guidance.criticalSteps || []).map(step => `<li><strong>${escapeHtml(step)}</strong></li>`).join('')}
            </ol>
          </div>

          <div class="emergency-plan-callout">
            <span class="plan-icon">📋</span>
            <div>
              <strong>Clinician Emergency Plan Reminder:</strong>
              <p>If you or the person has an individualized, clinician-provided personal allergy emergency action plan from a doctor, follow that plan immediately.</p>
            </div>
          </div>

          <div class="emergency-disclaimer-box">
            <p>${escapeHtml(guidance.disclaimer)}</p>
          </div>
        </div>
      `;
    } else {
      // 🛟 STRUCTURED 7-SECTION NON-EMERGENCY GUIDANCE
      guidanceResultView.innerHTML = `
        <div class="guidance-results-card">

          <!-- Section 1: 🩺 WHAT YOU REPORTED -->
          <div class="guidance-section section-reported">
            <h3 class="guidance-section-title">${escapeHtml(guidance.reportedSection.title)}</h3>
            <div class="reported-grid">
              <div class="reported-item">
                <span class="reported-label">Symptoms:</span>
                <div class="reported-chips">
                  ${guidance.reportedSection.symptomsList.length > 0
                    ? guidance.reportedSection.symptomsList.map(s => `<span class="symptom-reported-tag">${escapeHtml(s)}</span>`).join(' ')
                    : '<span class="italic-text">None explicitly checked</span>'
                  }
                </div>
              </div>
              <div class="reported-item">
                <span class="reported-label">Onset Time:</span>
                <span>${escapeHtml(guidance.reportedSection.onsetTime)}</span>
              </div>
              <div class="reported-item">
                <span class="reported-label">Suspected Food / Contact:</span>
                <span>${escapeHtml(guidance.reportedSection.suspectedFood)}</span>
              </div>
              <div class="reported-item">
                <span class="reported-label">Profile Allergies Checked:</span>
                <span>${escapeHtml(guidance.reportedSection.profileAllergies)}</span>
              </div>
            </div>
          </div>

          <!-- Section 2: 💡 WHAT IT MAY MEAN -->
          <div class="guidance-section section-meaning">
            <h3 class="guidance-section-title">${escapeHtml(guidance.meaningSection.title)}</h3>
            ${guidance.meaningSection.content.map(p => `<p class="guidance-paragraph">${escapeHtml(p)}</p>`).join('')}
          </div>

          <!-- Section 3: 🛟 FIRST-AID STEPS -->
          <div class="guidance-section section-first-aid">
            <h3 class="guidance-section-title">${escapeHtml(guidance.firstAidSection.title)}</h3>
            <ul class="first-aid-checklist">
              ${guidance.firstAidSection.steps.map(step => `
                <li class="first-aid-step-item">
                  <span class="step-check">✓</span>
                  <span>${escapeHtml(step)}</span>
                </li>
              `).join('')}
            </ul>
            <div class="zero-med-note">
              <span>🚫</span> <em>${escapeHtml(guidance.firstAidSection.safetyNote)}</em>
            </div>
          </div>

          <!-- Section 4: 🔎 WHY IT MAY HAVE HAPPENED -->
          <div class="guidance-section section-why">
            <h3 class="guidance-section-title">${escapeHtml(guidance.whySection.title)}</h3>
            ${guidance.whySection.content.map(p => `<p class="guidance-paragraph">${escapeHtml(p)}</p>`).join('')}
          </div>

          <!-- Section 5: 👀 WHAT TO WATCH FOR -->
          <div class="guidance-section section-watch">
            <h3 class="guidance-section-title">${escapeHtml(guidance.watchForSection.title)}</h3>
            <div class="watch-list-box">
              ${guidance.watchForSection.content.map(item => `<p class="watch-item">${escapeHtml(item)}</p>`).join('')}
            </div>
          </div>

          <!-- Section 6: 🚨 WHEN TO GET MEDICAL HELP -->
          <div class="guidance-section section-medical-help">
            <h3 class="guidance-section-title">${escapeHtml(guidance.medicalHelpSection.title)}</h3>
            <ul class="medical-help-list">
              ${guidance.medicalHelpSection.content.map(p => `<li>${escapeHtml(p)}</li>`).join('')}
            </ul>
          </div>

          <!-- Section 7: 🛡️ HOW TO BE CAUTIOUS NEXT TIME -->
          <div class="guidance-section section-cautious">
            <h3 class="guidance-section-title">${escapeHtml(guidance.cautiousNextTimeSection.title)}</h3>
            <ul class="cautious-list">
              ${guidance.cautiousNextTimeSection.tips.map(tip => `<li>${escapeHtml(tip)}</li>`).join('')}
            </ul>
          </div>

          <!-- Safety Disclaimer -->
          <div class="guidance-disclaimer-note">
            <span>ℹ️</span> <small>${escapeHtml(guidance.disclaimer)}</small>
          </div>

        </div>
      `;
    }
  }

  // 5. Follow-Up Chat Functionality
  if (assistantChatForm) {
    assistantChatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const message = assistantChatInput.value.trim();
      if (!message) return;

      appendChatMessage('user', message);
      assistantChatInput.value = '';

      // Typing indicator
      const typingIndicator = document.createElement('div');
      typingIndicator.className = 'chat-message chat-assistant typing';
      typingIndicator.innerHTML = '<span class="typing-dot">.</span><span class="typing-dot">.</span><span class="typing-dot">.</span>';
      chatMessagesFeed.appendChild(typingIndicator);
      chatMessagesFeed.scrollTop = chatMessagesFeed.scrollHeight;

      try {
        const res = await fetch('/api/assistant/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            sessionContext: {
              reportedSymptoms: currentReportedSymptoms,
              foodContact: currentFoodContact,
              isEmergency: isCurrentEmergency
            }
          })
        });

        const data = await res.json();
        typingIndicator.remove();

        if (data.isEmergency) {
          appendChatMessage('assistant emergency', `🚨 **EMERGENCY WARNING**: ${data.message}`);
        } else {
          appendChatMessage('assistant', data.message);
        }

      } catch (err) {
        console.error('Chat error:', err);
        typingIndicator.remove();
        appendChatMessage('assistant', 'I had trouble connecting. For any concerning symptoms, please seek direct medical care.');
      }
    });
  }

  function appendChatMessage(sender, text) {
    const msgEl = document.createElement('div');
    msgEl.className = `chat-message chat-${sender}`;
    msgEl.innerHTML = `<div class="chat-bubble">${escapeHtml(text).replace(/\n/g, '<br>')}</div>`;
    chatMessagesFeed.appendChild(msgEl);
    chatMessagesFeed.scrollTop = chatMessagesFeed.scrollHeight;
  }

  // Quick Question Chips
  if (quickChips) {
    quickChips.addEventListener('click', (e) => {
      const chip = e.target.closest('.quick-chip');
      if (!chip) return;
      assistantChatInput.value = chip.dataset.q;
      assistantChatForm.dispatchEvent(new Event('submit'));
    });
  }

  // 6. Reset / Start Over
  if (startOverBtn) {
    startOverBtn.addEventListener('click', () => {
      symptomSurveyForm.reset();
      symptomSurveyView.style.display = 'block';
      guidanceResultView.style.display = 'none';
      chatbotSection.style.display = 'none';
      startOverBtn.style.display = 'none';
      surveyValidationError.style.display = 'none';
      chatMessagesFeed.innerHTML = '';
      currentReportedSymptoms = [];
      currentFoodContact = '';
      isCurrentEmergency = false;
      symptomSurveyView.scrollIntoView({ behavior: 'smooth' });
    });
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

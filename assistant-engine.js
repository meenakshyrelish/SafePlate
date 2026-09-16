/**
 * SafePlate AI - Allergy First-Aid Assistant Engine
 * 
 * Safety Rules & Constraints:
 * 1. NOT a doctor. Must NEVER diagnose conditions or claim definitive causes.
 * 2. Must NEVER prescribe, recommend, or suggest medicines, drug names, or dosages.
 * 3. Deterministic Emergency Triage runs BEFORE normal guidance generation.
 * 4. Zero-medication first-aid focus: stopping exposure, staying with someone, monitoring,
 *    following clinician-provided personal plans, and recognizing emergency thresholds.
 * 5. Pulls user's allergy profile from the database to contextualize guidance.
 */

// Major emergency red-flag symptom identifiers
const EMERGENCY_SYMPTOMS = new Set([
  'Difficulty breathing',
  'Shortness of breath',
  'Wheezing',
  'Throat tightness',
  'Swollen tongue',
  'Difficulty swallowing',
  'Hoarse voice',
  'Fainting',
  'Feeling faint',
  'Symptoms getting worse quickly'
]);

// Multi-system grouping to detect systemic anaphylactic risk
const SYMPTOM_SYSTEM_MAP = {
  skin: ['Itching', 'Hives', 'Rash', 'Redness', 'Swelling'],
  mouthThroat: ['Tingling or itching in mouth', 'Swollen lips', 'Swollen tongue', 'Throat tightness', 'Difficulty swallowing', 'Hoarse voice'],
  breathing: ['Coughing', 'Wheezing', 'Shortness of breath', 'Difficulty breathing'],
  stomach: ['Nausea', 'Vomiting', 'Stomach pain', 'Diarrhea'],
  general: ['Dizziness', 'Feeling faint', 'Fainting', 'Weakness', 'Symptoms getting worse quickly']
};

/**
 * Deterministic Emergency Risk Triage
 * Evaluates symptoms against emergency red flags and multi-system involvement.
 * Runs BEFORE any normal first-aid response is formulated.
 */
function evaluateEmergencyRisk(symptoms = [], additionalInfo = {}) {
  const cleanSymptoms = Array.isArray(symptoms) ? symptoms.map(s => String(s).trim()) : [];
  const emergencyReasons = [];

  // Check 1: Explicit red-flag symptoms
  cleanSymptoms.forEach(sym => {
    if (EMERGENCY_SYMPTOMS.has(sym)) {
      emergencyReasons.push(`Reported severe symptom: "${sym}"`);
    }
  });

  // Check 2: Multi-system involvement (symptoms across 2 or more distinct body systems)
  const activeSystems = new Set();
  cleanSymptoms.forEach(sym => {
    for (const [system, list] of Object.entries(SYMPTOM_SYSTEM_MAP)) {
      if (list.includes(sym)) {
        activeSystems.add(system);
      }
    }
  });

  // Anaphylaxis warning: Involvement of breathing, mouth/throat, or general with skin or stomach
  if (activeSystems.size >= 2) {
    if (activeSystems.has('breathing') || activeSystems.has('mouthThroat') || activeSystems.has('general')) {
      emergencyReasons.push(`Symptoms affect multiple body systems (${Array.from(activeSystems).join(', ')}), which can indicate a systemic reaction`);
    }
  }

  // Check 3: Check textual responses for emergent cues
  const textBlob = `${additionalInfo.foodContact || ''} ${additionalInfo.notes || ''} ${additionalInfo.userMessage || ''}`.toLowerCase();
  const emergencyKeywords = [
    'cannot breathe', "can't breathe", 'throat closing', 'swelling shut',
    'passed out', 'blacked out', 'collapsing', 'choking', 'turning blue',
    'gasping', 'severe wheeze'
  ];

  for (const kw of emergencyKeywords) {
    if (textBlob.includes(kw)) {
      emergencyReasons.push(`User statement indicates acute distress: "${kw}"`);
      break;
    }
  }

  const isEmergency = emergencyReasons.length > 0;

  return {
    isEmergency,
    emergencyReasons,
    activeSystems: Array.from(activeSystems)
  };
}

/**
 * Formats user's database allergies with friendly icons
 */
function formatAllergiesDisplay(allergies = []) {
  if (!allergies || allergies.length === 0) {
    return 'None recorded in your SafePlate profile';
  }

  const iconMap = {
    'peanuts': '🥜 Peanut',
    'peanut': '🥜 Peanut',
    'dairy': '🥛 Milk / Dairy',
    'milk': '🥛 Milk / Dairy',
    'eggs': '🥚 Egg',
    'egg': '🥚 Egg',
    'tree nuts': '🌰 Tree Nut',
    'shellfish': '🦐 Shellfish',
    'soy': '🌱 Soy',
    'gluten': '🌾 Gluten / Wheat',
    'wheat': '🌾 Wheat',
    'fish': '🐟 Fish',
    'sesame': '🥯 Sesame'
  };

  return allergies.map(a => {
    const key = String(a).toLowerCase().trim();
    return iconMap[key] || `⚠️ ${a}`;
  }).join(', ');
}

/**
 * Builds the emergency guidance package.
 * Strict: ZERO medications or dosages.
 */
function buildEmergencyGuidance(reasons, userAllergies = []) {
  return {
    isEmergency: true,
    title: '🚨 POSSIBLE MEDICAL EMERGENCY',
    alertMessage: 'Some of the symptoms you selected can occur during a severe allergic reaction. Seek emergency medical help immediately. Do not rely on SafePlate for emergency treatment.',
    emergencyReasons: reasons,
    criticalSteps: [
      'Call local emergency services immediately (such as 911, 112, or your local emergency dispatch).',
      'If you have a clinician-provided personal allergy emergency action plan from your healthcare provider, follow that plan immediately.',
      'Stay with someone right now. Do not remain alone. Inform them that you are having severe symptoms.',
      'Position yourself safely: Sit upright if breathing is difficult. If feeling faint, dizzy, or lightheaded, lie flat with your legs elevated. Avoid standing up suddenly.',
      'Do not consume any further food, drinks, or unknown substances.'
    ],
    reminderNote: 'SafePlate is an informational tool and cannot treat acute or severe allergic reactions. Professional emergency medical care is required.',
    disclaimer: 'Notice: SafePlate Allergy First-Aid Assistant does not diagnose conditions, prescribe medicines, or replace professional medical care. Call emergency services for severe symptoms.'
  };
}

/**
 * Builds the comprehensive 7-section non-emergency first-aid guidance package.
 * Strict: ZERO medications or dosages.
 */
function buildNonEmergencyGuidance({ symptoms, onsetTime, foodContact, userAllergies = [] }) {
  const cleanSymptoms = Array.isArray(symptoms) ? symptoms : [];
  const allergiesText = formatAllergiesDisplay(userAllergies);

  // 1. WHAT YOU REPORTED
  const reportedSection = {
    title: '🩺 WHAT YOU REPORTED',
    symptomsList: cleanSymptoms,
    onsetTime: onsetTime || 'Not specified',
    suspectedFood: foodContact && foodContact.trim() ? foodContact.trim() : 'No specific food identified',
    profileAllergies: allergiesText
  };

  // 2. WHAT IT MAY MEAN
  const meaningSection = {
    title: '💡 WHAT IT MAY MEAN',
    content: [
      'The symptoms you reported can be associated with a mild or localized food allergic reaction, but they may also stem from other non-allergic causes such as food sensitivity, irritation, or contact dermatitis.',
      'Allergic symptoms typically develop within minutes to a couple of hours after contact or consumption.',
      'Because allergic responses can evolve over time, it is essential to observe how you feel closely rather than assuming symptoms will remain stable.'
    ]
  };

  // 3. FIRST-AID STEPS (Strictly non-medication)
  const firstAidSection = {
    title: '🛟 FIRST-AID STEPS',
    steps: [
      'Stop eating the suspected food immediately and set it aside for future reference (take a photo of the packaging/ingredients if available).',
      'Move away from the food or source of exposure to avoid ongoing contact or inhalation of food particles.',
      'Rinse your mouth gently with clean, cool water to remove any lingering food residue. Do not swallow the rinse water.',
      'If skin contact occurred, gently wash the exposed skin with mild soap and cool water. Avoid scrubbing or scratching the skin.',
      'Apply a cool, damp cloth or compress to itchy or red areas of skin for soothing comfort.',
      'Stay with someone (a family member, friend, or coworker) so you are not alone while monitoring your symptoms.',
      'Rest in a comfortable, relaxed upright position and take slow, steady breaths.',
      'If your healthcare provider has previously provided you with an individualized personal allergy emergency action plan, keep it accessible and follow its non-medication instructions.'
    ],
    safetyNote: 'Do NOT take unprescribed medications or guess dosages. Follow only instructions provided directly by your physician.'
  };

  // 4. WHY IT MAY HAVE HAPPENED
  const whyHappenedContent = [];
  if (userAllergies.length > 0 && foodContact && foodContact.trim()) {
    whyHappenedContent.push(
      `Your SafePlate profile records allergies to: ${allergiesText}. If the food you recently ate ("${foodContact.trim()}") contained these allergens—or was exposed to cross-contact during preparation or cooking—your immune system may have reacted to those proteins.`
    );
  } else if (userAllergies.length > 0) {
    whyHappenedContent.push(
      `You have recorded allergies (${allergiesText}). Reactions can occur from hidden ingredients in sauces, packaged foods, shared cookware, or cross-contact during meal preparation.`
    );
  } else {
    whyHappenedContent.push(
      'Foods can cause localized symptoms through unknown food sensitivities, natural histamine content, spices, or mild allergic responses to ingredients you have not formally tested.'
    );
  }
  whyHappenedContent.push(
    'Even foods thought to be safe can occasionally be manufactured in shared facilities or prepared with utensils previously in contact with common allergens (cross-contact).'
  );

  const whySection = {
    title: '🔎 WHY IT MAY HAVE HAPPENED',
    content: whyHappenedContent
  };

  // 5. WHAT TO WATCH FOR
  const watchForSection = {
    title: '👀 WHAT TO WATCH FOR',
    content: [
      'Watch carefully for any signs of symptom progression or escalation into a more severe reaction:',
      '• Sensation of throat tightness, lump in the throat, or voice becoming hoarse',
      '• Swelling of the tongue, lips, or mouth',
      '• Any shortness of breath, coughing, wheezing, or difficulty breathing',
      '• Dizziness, lightheadedness, weakness, or feeling like you might faint',
      '• Rapidly spreading hives, intense redness, or widespread itching across your entire body',
      '• Repeated vomiting, severe stomach cramping, or sudden diarrhea',
      '• A feeling that symptoms are changing or worsening rapidly'
    ]
  };

  // 6. WHEN TO GET MEDICAL HELP
  const medicalHelpSection = {
    title: '🚨 WHEN TO GET MEDICAL HELP',
    content: [
      'Seek EMERGENCY medical help immediately (call emergency services or go to the nearest emergency department) if you develop ANY breathing difficulties, throat tightness, swelling of the mouth/tongue, dizziness, fainting, or rapidly worsening symptoms.',
      'Seek urgent medical care if mild symptoms persist without improvement for over an hour, or if you feel uneasy and unsure about your condition.',
      'Be aware of biphasic reactions: In some cases, allergic symptoms can resurface hours after initial onset. Continue gentle monitoring even if symptoms initially calm down.',
      'Schedule an appointment with a board-certified allergist or primary physician for formal diagnostic evaluation and a personal allergy action plan.'
    ]
  };

  // 7. HOW TO BE CAUTIOUS NEXT TIME
  const cautiousNextTimeSection = {
    title: '🛡️ HOW TO BE CAUTIOUS NEXT TIME',
    tips: [
      'Read all food labels and ingredient lists thoroughly every single time, as manufacturers frequently reformulate recipes without notice.',
      'Check package allergen warning statements ("May contain...", "Processed in a facility that also processes...").',
      'When dining out, inform your server and the kitchen manager about all known food allergies before placing your order.',
      'Be vigilant about kitchen cross-contact: use clean, sanitized utensils, cutting boards, and cookware that have not touched allergen foods.',
      'Keep a food symptom diary noting what you ate, the brand/ingredients, and the exact time any symptoms began.',
      'Always keep your clinician-provided personal allergy action plan easily accessible wherever you go.'
    ]
  };

  return {
    isEmergency: false,
    title: 'Allergy First-Aid Guidance',
    reportedSection,
    meaningSection,
    firstAidSection,
    whySection,
    watchForSection,
    medicalHelpSection,
    cautiousNextTimeSection,
    disclaimer: 'SafePlate Allergy First-Aid Assistant provides general information based on the symptoms and allergy information you provide. It does not diagnose conditions, prescribe medicines, or replace professional medical care.'
  };
}

/**
 * Sanitizes any text string to ensure NO medication recommendations,
 * dosages, or medical diagnoses are present in generated text.
 */
function sanitizeResponseText(text) {
  if (!text) return '';

  let sanitized = String(text);

  // List of forbidden medication terms
  const forbiddenMeds = [
    /\b(benadryl|diphenhydramine|zyrtec|cetirizine|claritin|loratadine|allegra|fexofenadine)\b/gi,
    /\b(antihistamine[s]?|epinephrine|epipen|auvi-q|adrenaclick)\b/gi,
    /\b(corticosteroid[s]?|steroid[s]?|prednisone|hydrocortisone)\b/gi,
    /\b(aspirin|ibuprofen|advil|motrin|tylenol|acetaminophen)\b/gi,
    /\b(\d+\s*mg|\d+\s*ml|\d+\s*pills?|\d+\s*tablets?|\d+\s*doses?)\b/gi,
    /\b(take|swallow|inject|apply)\s+(a|the|some)?\s*(pill|tablet|medicine|medication|dose)\b/gi
  ];

  forbiddenMeds.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[Consult healthcare professional for medication]');
  });

  // Forbidden diagnostic claims
  const forbiddenDiagnoses = [
    /\byou have anaphylaxis\b/gi,
    /\byou are diagnosed with\b/gi,
    /\bthis is definitely\b/gi
  ];

  forbiddenDiagnoses.forEach(pattern => {
    sanitized = sanitized.replace(pattern, 'these symptoms can be associated with');
  });

  return sanitized;
}

/**
 * Formulates empathetic, safe conversational follow-up response
 * Strict: ZERO medications or dosages.
 */
function handleAssistantChat({ userMessage, sessionContext = {}, userAllergies = [] }) {
  if (!userMessage || !userMessage.trim()) {
    return {
      message: 'Please ask a question about your symptoms, monitoring, or non-medication first-aid steps.'
    };
  }

  const query = userMessage.trim();
  const lower = query.toLowerCase();

  // 1. Immediate Emergency Check on follow-up message!
  const emergencyCheck = evaluateEmergencyRisk([], { userMessage: query });
  const redFlagKeywords = [
    'throat', 'breathing', 'breath', 'swallowing', 'tongue', 'faint', 'dizzy',
    'worse', 'worsening', 'spreading', 'choking', 'tight', 'chest', 'pass out'
  ];

  const hasRedFlagKeyword = redFlagKeywords.some(kw => lower.includes(kw));

  if (emergencyCheck.isEmergency || (lower.includes('worse') && (lower.includes('throat') || lower.includes('breath') || lower.includes('swelling')))) {
    return {
      isEmergency: true,
      alertMessage: '🚨 POSSIBLE MEDICAL EMERGENCY',
      message: sanitizeResponseText(
        'Because your symptoms appear to be changing or involving sensitive areas like your airway or circulation, seek emergency medical help immediately. Call your local emergency services (e.g. 911 / 112) and stay with someone. If you have an individualized clinician-provided emergency action plan, follow that plan immediately. Do not rely on SafePlate for emergency treatment.'
      )
    };
  }

  // 2. Specific question handling
  if (lower.includes('medicine') || lower.includes('medication') || lower.includes('pill') || lower.includes('antihistamine') || lower.includes('dose') || lower.includes('benadryl')) {
    return {
      isEmergency: false,
      message: sanitizeResponseText(
        'As an informational assistant, I cannot recommend, prescribe, or advise on any medicines or dosages. For medication advice, please contact a physician, pharmacist, or urgent care provider. In the meantime, focus on non-medication comfort: stop all food exposure, rinse your mouth with water, rest comfortably, stay with someone, and seek medical care if symptoms persist or escalate.'
      )
    };
  }

  if (lower.includes('itching') || lower.includes('itch') || lower.includes('rash') || lower.includes('hives')) {
    return {
      isEmergency: false,
      message: sanitizeResponseText(
        'For skin itching or hives, practical non-medication steps include applying a cool, damp washcloth to the affected skin, wearing loose-fitting cotton clothing, and avoiding scratching or hot water. Continue to monitor yourself closely. If the rash spreads rapidly, or if you experience throat tightness, swelling of the mouth/tongue, or difficulty breathing, seek emergency medical care immediately.'
      )
    };
  }

  if (lower.includes('water') || lower.includes('drink') || lower.includes('rinse')) {
    return {
      isEmergency: false,
      message: sanitizeResponseText(
        'Gently rinsing your mouth with cool water and spitting it out is helpful to eliminate any remaining food particles. You can take small sips of cool water if you can swallow normally with no throat tightness. If you feel any difficulty swallowing or tightness in your throat, avoid eating or drinking and seek medical evaluation immediately.'
      )
    };
  }

  if (lower.includes('how long') || lower.includes('duration') || lower.includes('timeline')) {
    return {
      isEmergency: false,
      message: sanitizeResponseText(
        'Allergic reactions vary in duration from person to person. Mild symptoms often peak within 1 to 2 hours of exposure and may take several hours to subside. However, symptoms can sometimes return hours later (a biphasic reaction). Stay with someone while symptoms are active, and consult a medical professional if your symptoms do not improve.'
      )
    };
  }

  if (lower.includes('doctor') || lower.includes('hospital') || lower.includes('urgent care')) {
    return {
      isEmergency: false,
      message: sanitizeResponseText(
        'You should go to urgent care or see a healthcare provider if your symptoms feel uncomfortable, do not resolve, or if you are uncertain about what is causing them. Go to an emergency room or call emergency services immediately if you experience any breathing difficulty, throat tightness, swelling of the lips/tongue, lightheadedness, or feeling faint.'
      )
    };
  }

  // General safe educational response
  const allergiesMention = userAllergies && userAllergies.length > 0 
    ? `Based on your profile allergies (${formatAllergiesDisplay(userAllergies)}), continue to be cautious around potential cross-contact.`
    : 'Continue to monitor your body closely.';

  return {
    isEmergency: false,
    message: sanitizeResponseText(
      `${allergiesMention} Focus on simple first-aid actions: stay in a relaxed, comfortable position, avoid any further food exposure, stay with another person, and monitor for warning signs. If symptoms worsen, or if you develop breathing difficulty, throat tightness, or dizziness, seek emergency medical care right away.`
    )
  };
}

module.exports = {
  evaluateEmergencyRisk,
  formatAllergiesDisplay,
  buildEmergencyGuidance,
  buildNonEmergencyGuidance,
  sanitizeResponseText,
  handleAssistantChat
};

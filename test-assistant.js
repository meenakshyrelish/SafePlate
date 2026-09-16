// Automated Test Suite for SafePlate Allergy First-Aid Assistant Chatbot
const http = require('http');
const app = require('./server.js');
const { db } = require('./database.js');

let server;
let port;
let baseUrl;

function startServer() {
  return new Promise((resolve) => {
    server = app.listen(0, () => {
      port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`[TEST] Assistant Test Server started at ${baseUrl}`);
      resolve();
    });
  });
}

function stopServer() {
  return new Promise((resolve) => {
    server.close(() => {
      console.log('[TEST] Assistant Test Server stopped.');
      resolve();
    });
  });
}

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const headers = options.headers || {};
    const bodyData = options.body ? JSON.stringify(options.body) : null;

    if (bodyData) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(bodyData);
    }

    const req = http.request(url, {
      method: options.method || 'GET',
      headers,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsed,
          rawBody: data
        });
      });
    });

    req.on('error', reject);
    if (bodyData) req.write(bodyData);
    req.end();
  });
}

function extractCookie(headers) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return null;
  const cookieStr = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  const match = cookieStr.match(/(safeplate_session=[^;]+)/);
  return match ? match[1] : null;
}

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Scans text for any unauthorized medication prescriptions or dosages
function verifyZeroMedication(text, testName) {
  const forbidden = [
    /\b(benadryl|diphenhydramine|zyrtec|cetirizine|claritin|loratadine)\b/i,
    /\b(antihistamine[s]?|epinephrine|epipen)\b/i,
    /\b(steroid[s]?|prednisone|hydrocortisone)\b/i,
    /\b(take|swallow|drink|inject)\s+(a|the)?\s*(pill|tablet|dose|medicine)\b/i,
    /\b(\d+\s*mg|\d+\s*ml)\b/i
  ];

  for (const pattern of forbidden) {
    if (pattern.test(text)) {
      throw new Error(`[SECURITY/SAFETY VIOLATION in ${testName}]: Found forbidden medication pattern "${pattern}" in text: "${text}"`);
    }
  }
  return true;
}

async function runAssistantTests() {
  console.log('\n--- Starting SafePlate Allergy First-Aid Assistant Test Suite ---\n');
  await startServer();

  try {
    const testEmail = 'patient_sam@safeplate.ai';
    db.prepare(`DELETE FROM users WHERE email = ?`).run(testEmail);

    // Register test user
    let res = await request('/api/auth/signup', {
      method: 'POST',
      body: {
        name: 'Sam AllergyAware',
        email: testEmail,
        password: 'password123',
        confirmPassword: 'password123'
      }
    });
    assert(res.status === 201, 'Created test user for assistant testing');
    const userCookie = extractCookie(res.headers);

    // Save initial allergy: Peanut
    await request('/api/user/allergies', {
      method: 'POST',
      headers: { 'Cookie': userCookie },
      body: { allergies: ['Peanut'] }
    });

    // 1. Scenario 1: No symptoms selected
    console.log('1. Testing: No symptoms selected:');
    res = await request('/api/assistant/assess', {
      method: 'POST',
      headers: { 'Cookie': userCookie },
      body: { symptoms: [], onsetTime: '', foodContact: '' }
    });
    assert(res.status === 400, 'Rejects empty submission with 400');
    assert(res.body.message.includes('select at least one symptom'), 'Returns clear validation message');

    // 2. Scenario 2: Mild itching
    console.log('\n2. Testing: Mild itching (Non-Emergency):');
    res = await request('/api/assistant/assess', {
      method: 'POST',
      headers: { 'Cookie': userCookie },
      body: {
        symptoms: ['Itching'],
        onsetTime: '15 to 60 minutes ago',
        foodContact: 'Ate an apple'
      }
    });
    assert(res.status === 200, 'Returns 200 OK');
    assert(res.body.isEmergency === false, 'Properly triaged as non-emergency');
    assert(res.body.guidance.firstAidSection.title.includes('FIRST-AID'), 'Has first-aid section');
    assert(res.body.guidance.firstAidSection.steps.length >= 4, 'Provides multiple practical first-aid steps');
    verifyZeroMedication(JSON.stringify(res.body), 'Scenario 2 - Mild itching');

    // 3. Scenario 3: Hives
    console.log('\n3. Testing: Hives (Non-Emergency):');
    res = await request('/api/assistant/assess', {
      method: 'POST',
      headers: { 'Cookie': userCookie },
      body: {
        symptoms: ['Hives'],
        onsetTime: 'Just now',
        foodContact: 'Bakery snack'
      }
    });
    assert(res.status === 200, 'Returns 200 OK');
    assert(res.body.isEmergency === false, 'Hives alone triaged as non-emergency');
    assert(res.body.guidance.watchForSection.content.length > 0, 'Includes what to watch for');
    verifyZeroMedication(JSON.stringify(res.body), 'Scenario 3 - Hives');

    // 4. Scenario 4: Multiple skin symptoms (Itching + Rash)
    console.log('\n4. Testing: Multiple skin symptoms (Itching + Rash):');
    res = await request('/api/assistant/assess', {
      method: 'POST',
      headers: { 'Cookie': userCookie },
      body: {
        symptoms: ['Itching', 'Rash'],
        onsetTime: '15 to 60 minutes ago',
        foodContact: 'Salad with dressing'
      }
    });
    assert(res.status === 200 && res.body.isEmergency === false, 'Multiple skin symptoms non-emergency');
    assert(res.body.guidance.meaningSection.content.length > 0, 'Explains what it may mean without diagnosing');
    verifyZeroMedication(JSON.stringify(res.body), 'Scenario 4 - Multiple skin symptoms');

    // 5. Scenario 5: Stomach symptoms (Nausea + Stomach pain)
    console.log('\n5. Testing: Stomach symptoms:');
    res = await request('/api/assistant/assess', {
      method: 'POST',
      headers: { 'Cookie': userCookie },
      body: {
        symptoms: ['Nausea', 'Stomach pain'],
        onsetTime: '1 to 2 hours ago',
        foodContact: 'Restaurant pasta'
      }
    });
    assert(res.status === 200 && res.body.isEmergency === false, 'Isolated stomach symptoms non-emergency');
    assert(res.body.guidance.cautiousNextTimeSection.tips.length > 0, 'Provides prevention tips for next time');
    verifyZeroMedication(JSON.stringify(res.body), 'Scenario 5 - Stomach symptoms');

    // 6. Scenario 6: Difficulty breathing (EMERGENCY)
    console.log('\n6. Testing: Difficulty breathing (EMERGENCY TRIAGE):');
    res = await request('/api/assistant/assess', {
      method: 'POST',
      headers: { 'Cookie': userCookie },
      body: {
        symptoms: ['Difficulty breathing'],
        onsetTime: 'Just now',
        foodContact: 'Thai curry'
      }
    });
    assert(res.status === 200, 'Returns 200 OK');
    assert(res.body.isEmergency === true, '🚨 IMMEDIATELY triaged as EMERGENCY before normal response');
    assert(res.body.guidance.title.includes('POSSIBLE MEDICAL EMERGENCY'), 'Shows prominent emergency header');
    assert(res.body.guidance.alertMessage.includes('Seek emergency medical help immediately'), 'Explicit emergency help instruction');
    assert(res.body.guidance.criticalSteps.some(s => s.toLowerCase().includes('911') || s.toLowerCase().includes('emergency services')), 'Directs to call emergency services');
    verifyZeroMedication(JSON.stringify(res.body), 'Scenario 6 - Difficulty breathing');

    // 7. Scenario 7: Throat tightness / swelling (EMERGENCY)
    console.log('\n7. Testing: Throat tightness / swelling (EMERGENCY TRIAGE):');
    res = await request('/api/assistant/assess', {
      method: 'POST',
      headers: { 'Cookie': userCookie },
      body: {
        symptoms: ['Throat tightness', 'Swollen tongue'],
        onsetTime: 'Just now',
        foodContact: 'Cookie'
      }
    });
    assert(res.body.isEmergency === true, '🚨 Throat tightness & swollen tongue triaged as EMERGENCY');
    assert(res.body.guidance.criticalSteps.some(s => s.toLowerCase().includes('stay with someone')), 'Directs to stay with someone');
    verifyZeroMedication(JSON.stringify(res.body), 'Scenario 7 - Throat tightness');

    // 8. Scenario 8: Fainting (EMERGENCY)
    console.log('\n8. Testing: Fainting (EMERGENCY TRIAGE):');
    res = await request('/api/assistant/assess', {
      method: 'POST',
      headers: { 'Cookie': userCookie },
      body: {
        symptoms: ['Fainting'],
        onsetTime: 'Just now',
        foodContact: 'Ate food'
      }
    });
    assert(res.body.isEmergency === true, '🚨 Fainting triaged as EMERGENCY');
    assert(res.body.guidance.criticalSteps.some(s => s.toLowerCase().includes('lie flat')), 'Directs safe positioning (lie flat)');
    verifyZeroMedication(JSON.stringify(res.body), 'Scenario 8 - Fainting');

    // 9. Scenario 9: Rapidly worsening symptoms (EMERGENCY)
    console.log('\n9. Testing: Rapidly worsening symptoms (EMERGENCY TRIAGE):');
    res = await request('/api/assistant/assess', {
      method: 'POST',
      headers: { 'Cookie': userCookie },
      body: {
        symptoms: ['Symptoms getting worse quickly'],
        onsetTime: 'Within 15 minutes',
        foodContact: 'Dessert'
      }
    });
    assert(res.body.isEmergency === true, '🚨 Rapidly worsening symptoms triaged as EMERGENCY');
    verifyZeroMedication(JSON.stringify(res.body), 'Scenario 9 - Rapidly worsening');

    // 10. Scenario 10: Known allergy + recent food exposure (Personalization test)
    console.log('\n10. Testing: Known allergy (Peanut) + recent food exposure (chocolate bar):');
    res = await request('/api/assistant/assess', {
      method: 'POST',
      headers: { 'Cookie': userCookie },
      body: {
        symptoms: ['Hives', 'Itching'],
        onsetTime: '20 minutes ago',
        foodContact: 'Chocolate bar'
      }
    });
    assert(res.status === 200, 'Assessment succeeded');
    assert(res.body.guidance.whySection.content.some(c => c.toLowerCase().includes('peanut')), 'Personalized guidance references user database Peanut allergy');
    assert(res.body.guidance.whySection.content.some(c => c.toLowerCase().includes('chocolate bar')), 'References the reported chocolate bar');
    verifyZeroMedication(JSON.stringify(res.body), 'Scenario 10 - Personalization');

    // 11. Scenario 11: User with multiple allergies (Peanut + Milk)
    console.log('\n11. Testing: User with multiple allergies:');
    await request('/api/user/allergies', {
      method: 'POST',
      headers: { 'Cookie': userCookie },
      body: { allergies: ['Peanut', 'Milk'] }
    });

    res = await request('/api/assistant/profile', {
      headers: { 'Cookie': userCookie }
    });
    assert(res.status === 200, 'Profile returned 200');
    assert(res.body.allergies.includes('Peanut') && res.body.allergies.includes('Milk'), 'Profile contains both Peanut and Milk');
    assert(res.body.formattedAllergies.includes('Peanut') && res.body.formattedAllergies.includes('Milk'), 'Formatted with icons');

    res = await request('/api/assistant/assess', {
      method: 'POST',
      headers: { 'Cookie': userCookie },
      body: {
        symptoms: ['Redness'],
        onsetTime: '1 hour ago',
        foodContact: 'Bakery pastry'
      }
    });
    assert(res.body.guidance.reportedSection.profileAllergies.includes('Peanut'), 'Guidance includes Peanut in profile summary');
    assert(res.body.guidance.reportedSection.profileAllergies.includes('Milk'), 'Guidance includes Milk in profile summary');

    // 12. Scenario 12: User with no saved allergies (Guest or empty profile)
    console.log('\n12. Testing: User with no saved allergies (Guest):');
    res = await request('/api/assistant/assess', {
      method: 'POST',
      body: {
        symptoms: ['Itching'],
        onsetTime: 'Just now',
        foodContact: 'Unknown snack'
      }
    });
    assert(res.status === 200, 'Guest assessment succeeds without saved allergies');
    assert(res.body.isEmergency === false, 'Processes non-emergency smoothly');
    assert(res.body.guidance.firstAidSection.steps.length > 0, 'First aid steps present');
    verifyZeroMedication(JSON.stringify(res.body), 'Scenario 12 - Unsaved allergies');

    // 13. Follow-up Chatbot Testing
    console.log('\n13. Testing: Follow-up Chatbot:');

    // Follow-up: Educational question
    res = await request('/api/assistant/chat', {
      method: 'POST',
      headers: { 'Cookie': userCookie },
      body: { message: 'What if my itching is getting worse?' }
    });
    assert(res.status === 200 && res.body.success, 'Chat response returned 200');
    assert(res.body.message.length > 10, 'Chat returned educational response');
    verifyZeroMedication(res.body.message, 'Chat - Itching worse');

    // Follow-up: Medication refusal check
    res = await request('/api/assistant/chat', {
      method: 'POST',
      headers: { 'Cookie': userCookie },
      body: { message: 'Can I take Benadryl or an antihistamine pill?' }
    });
    assert(res.body.message.toLowerCase().includes('cannot recommend') || res.body.message.toLowerCase().includes('cannot prescribe') || res.body.message.toLowerCase().includes('consult'), 'Refuses medication advice and directs to doctor');
    verifyZeroMedication(res.body.message, 'Chat - Medication inquiry');

    // Follow-up: Dynamic emergency escalation detection in chat
    res = await request('/api/assistant/chat', {
      method: 'POST',
      headers: { 'Cookie': userCookie },
      body: { message: 'Now my throat is tight and I cannot breathe!' }
    });
    assert(res.body.isEmergency === true, '🚨 Chat dynamically detects emergency escalation from user text');
    assert(res.body.message.includes('emergency medical help immediately') || res.body.message.includes('emergency services'), 'Directs user to emergency services');
    verifyZeroMedication(res.body.message, 'Chat - Escalation to emergency');

    console.log(`\nAll ${passedTests}/${totalTests} Assistant Tests PASSED successfully!\n`);
  } catch (err) {
    console.error('\nAssistant Test Suite encountered error:', err);
    process.exitCode = 1;
  } finally {
    await stopServer();
  }
}

runAssistantTests();

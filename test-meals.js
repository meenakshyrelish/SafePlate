// Automated Test Suite for SafePlate AI - Meal Discovery & Recipe Personalization
const http = require('http');
const app = require('./server.js');
const { db, findUserByEmail, setUserAllergies, getUserAllergies } = require('./database.js');

let server;
let port;
let baseUrl;

function startServer() {
  return new Promise((resolve) => {
    server = app.listen(0, () => {
      port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`[TEST] Test server listening at ${baseUrl}`);
      resolve();
    });
  });
}

function stopServer() {
  return new Promise((resolve) => {
    server.close(() => {
      console.log('[TEST] Test server stopped.');
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

async function runMealDiscoveryTests() {
  console.log('\n--- Starting Meal Discovery & Personalization Test Suite ---\n');
  await startServer();

  try {
    const testEmail = 'foodie@safeplate.ai';
    db.prepare(`DELETE FROM users WHERE email = ?`).run(testEmail);

    // 1. Register a test user
    console.log('1. User Registration & Session:');
    let res = await request('/api/auth/signup', {
      method: 'POST',
      body: {
        name: 'Gourmet Sam',
        email: testEmail,
        password: 'password123',
        confirmPassword: 'password123'
      }
    });
    assert(res.status === 201, 'User created with 201');
    const sessionCookie = extractCookie(res.headers);
    assert(sessionCookie !== null, 'Session cookie obtained');

    // 2. Test Allergy Persistence in Database
    console.log('\n2. User Allergy Database Persistence:');
    res = await request('/api/user/allergies', {
      method: 'POST',
      headers: { 'Cookie': sessionCookie },
      body: { allergies: ['Dairy', 'Gluten'] }
    });
    assert(res.status === 200 && res.body.success, 'POST /api/user/allergies saved successfully');

    res = await request('/api/user/allergies', {
      headers: { 'Cookie': sessionCookie }
    });
    assert(res.status === 200, 'GET /api/user/allergies returned 200');
    assert(res.body.allergies.includes('Dairy') && res.body.allergies.includes('Gluten'), 'Saved allergies retrieved from DB');

    // 3. Test Default Meals Retrieval (Flow 1)
    console.log('\n3. Default Meals Verification (All 12 Required Meals):');
    res = await request('/api/meals/defaults');
    assert(res.status === 200, 'GET /api/meals/defaults returned 200');
    assert(res.body.meals.length === 12, 'Returns exactly 12 default meals');

    const expected12 = [
      'Pizza', 'Pasta', 'Chicken Biryani', 'Burger',
      'Fried Rice', 'Noodles', 'Pancakes', 'Chocolate Cake',
      'Sandwich', 'Dosa', 'Butter Chicken', 'Salad'
    ];

    const returnedNames = res.body.meals.map(m => m.name);
    for (const name of expected12) {
      assert(returnedNames.includes(name), `Default meal "${name}" is present with image`);
    }

    // Check images
    for (const m of res.body.meals) {
      assert(typeof m.image === 'string' && m.image.startsWith('http'), `Meal "${m.name}" has valid image URL`);
    }

    // 4. Test Meal Search (Flow 2)
    console.log('\n4. Meal Search Verification:');
    res = await request('/api/meals/search?q=biryani');
    assert(res.status === 200, 'Search returned 200');
    assert(res.body.meals.some(m => m.name === 'Chicken Biryani'), 'Found Chicken Biryani for "biryani" search');

    res = await request('/api/meals/search?q=dosa');
    assert(res.body.meals.some(m => m.name === 'Dosa'), 'Found Dosa for "dosa" search');

    res = await request('/api/meals/search?q=tacos');
    assert(res.body.meals.some(m => m.name.toLowerCase().includes('taco')), 'Synthesizes card for custom searched meal "tacos"');

    // 5. Test Unified Recipe Personalization for Default Meal: "Pizza" (User allergic to Dairy & Gluten)
    console.log('\n5. Personalizing Default Meal (Pizza) for Dairy & Gluten:');
    res = await request('/api/recipes/personalize', {
      method: 'POST',
      headers: { 'Cookie': sessionCookie },
      body: { meal: 'Pizza' }
    });
    assert(res.status === 200, 'Personalize returned 200');
    let recipe = res.body.recipe;
    assert(recipe.originalMeal === 'Pizza', 'Original meal is Pizza');
    assert(recipe.allergensDetected.includes('Gluten') && recipe.allergensDetected.includes('Dairy'), 'Detected Gluten and Dairy');
    assert(recipe.ingredientsRemoved.some(i => i.toLowerCase().includes('dough')), 'Removed wheat dough');
    assert(recipe.ingredientsRemoved.some(i => i.toLowerCase().includes('cheese')), 'Removed dairy cheese');
    assert(recipe.ingredientsSubstituted.length > 0, 'Substituted safe ingredients');
    assert(recipe.finalIngredients.length > 0, 'Final ingredients provided');
    assert(recipe.cookingInstructions.length > 0, 'Cooking instructions provided');
    assert(recipe.medicalDisclaimer.includes('medical guarantee') || recipe.medicalDisclaimer.includes('medical advice'), 'Required medical disclaimer is present');

    // 6. Test Unified Recipe Personalization for Default Meal: "Butter Chicken"
    // Update allergies to Dairy AND Tree Nuts to test cross-allergen collision avoidance
    console.log('\n6. Cross-Allergen Validation (Butter Chicken with Dairy + Tree Nuts):');
    await request('/api/user/allergies', {
      method: 'POST',
      headers: { 'Cookie': sessionCookie },
      body: { allergies: ['Dairy', 'Tree Nuts'] }
    });

    res = await request('/api/recipes/personalize', {
      method: 'POST',
      headers: { 'Cookie': sessionCookie },
      body: { meal: 'Butter Chicken' }
    });
    assert(res.status === 200, 'Personalized Butter Chicken returned 200');
    recipe = res.body.recipe;
    assert(recipe.allergensDetected.includes('Dairy'), 'Detected Dairy in butter chicken');
    assert(recipe.allergensDetected.includes('Tree Nuts'), 'Detected Tree Nuts in cashew paste');

    // Crucial check: heavy cream substitute must NOT be almond milk (which contains Tree Nuts!)
    const creamSub = recipe.ingredientsSubstituted.find(s => s.original.toLowerCase().includes('heavy cream'));
    assert(creamSub !== undefined, 'Heavy cream was substituted');
    assert(!creamSub.substitute.toLowerCase().includes('almond'), 'Does NOT substitute almond milk due to user Tree Nut allergy');
    assert(creamSub.substitute.toLowerCase().includes('oat') || creamSub.substitute.toLowerCase().includes('coconut'), 'Substituted safe oat or coconut milk');

    // Cashew paste substitute must be nut-free
    const nutSub = recipe.ingredientsSubstituted.find(s => s.original.toLowerCase().includes('cashew'));
    assert(nutSub !== undefined, 'Cashew paste was substituted');
    assert(nutSub.substitute.toLowerCase().includes('sunflower') || nutSub.substitute.toLowerCase().includes('seed'), 'Substituted nut-free seed butter');

    // 7. Test Searched Meal uses the EXACT SAME endpoint & personalization logic
    console.log('\n7. Searched Meal Personalization (Same Endpoint & Engine):');
    res = await request('/api/recipes/personalize', {
      method: 'POST',
      headers: { 'Cookie': sessionCookie },
      body: { meal: 'Pad Thai Rice Noodles' }
    });
    assert(res.status === 200, 'Searched meal personalized successfully via same endpoint');
    assert(res.body.recipe.originalMeal.toLowerCase().includes('pad thai'), 'Returned personalized searched meal');
    assert(Array.isArray(res.body.recipe.finalIngredients), 'Final ingredients list present');
    assert(Array.isArray(res.body.recipe.cookingInstructions), 'Cooking instructions present');

    // 8. Test Route Protection for /meals.html and /api/recipes/personalize
    console.log('\n8. Route Protection Verification:');
    res = await request('/meals.html', {
      headers: { 'Accept': 'text/html' }
    });
    assert(res.status === 302 && res.headers.location.includes('/login.html'), 'Unauthenticated /meals.html redirects to login');

    res = await request('/api/recipes/personalize', {
      method: 'POST',
      body: { meal: 'Pizza' }
    });
    assert(res.status === 401, 'Unauthenticated POST /api/recipes/personalize rejected with 401');

    console.log(`\nAll ${passedTests}/${totalTests} tests PASSED successfully!\n`);
  } catch (err) {
    console.error('\nMeal Discovery Test Suite error:', err);
    process.exitCode = 1;
  } finally {
    await stopServer();
  }
}

runMealDiscoveryTests();

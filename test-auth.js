// Automated Auth & Security Verification Test Suite for SafePlate AI
const http = require('http');
const app = require('./server.js');
const { db, findUserByEmail } = require('./database.js');

let server;
let port;
let baseUrl;

function startServer() {
  return new Promise((resolve) => {
    server = app.listen(0, () => {
      port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`[TEST] Test server started at ${baseUrl}`);
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

async function runTests() {
  console.log('\n--- Starting SafePlate AI Auth Test Suite ---\n');
  await startServer();

  try {
    // Clean up test user if previously exists
    const testEmail = 'testuser@safeplate.ai';
    db.prepare(`DELETE FROM users WHERE email = ?`).run(testEmail);

    // 1. Signup validation checks
    console.log('1. Testing Signup Validation:');

    let res = await request('/api/auth/signup', {
      method: 'POST',
      body: { name: '', email: testEmail, password: 'password123', confirmPassword: 'password123' }
    });
    assert(res.status === 400 && res.body.message.includes('name'), 'Rejects empty name with 400');

    res = await request('/api/auth/signup', {
      method: 'POST',
      body: { name: 'Test User', email: 'invalid-email', password: 'password123', confirmPassword: 'password123' }
    });
    assert(res.status === 400 && res.body.message.includes('valid email'), 'Rejects invalid email format with 400');

    res = await request('/api/auth/signup', {
      method: 'POST',
      body: { name: 'Test User', email: testEmail, password: '123', confirmPassword: '123' }
    });
    assert(res.status === 400 && res.body.message.includes('at least 6 characters'), 'Rejects password shorter than 6 chars with 400');

    res = await request('/api/auth/signup', {
      method: 'POST',
      body: { name: 'Test User', email: testEmail, password: 'password123', confirmPassword: 'differentPassword' }
    });
    assert(res.status === 400 && res.body.message.includes('match'), 'Rejects mismatched passwords with 400');

    // 2. Successful Signup
    console.log('\n2. Testing Successful Signup:');
    res = await request('/api/auth/signup', {
      method: 'POST',
      body: { name: 'Chef SafePlate', email: testEmail, password: 'supersecretpassword123', confirmPassword: 'supersecretpassword123' }
    });
    assert(res.status === 201, 'Signup returns 201 Created');
    assert(res.body.success === true, 'Response body has success: true');
    assert(res.body.user.email === testEmail, 'Response body contains correct user email');

    // Check database directly to verify password hash security
    const dbUser = findUserByEmail(testEmail);
    assert(dbUser !== undefined, 'User record exists in database');
    assert(dbUser.password_hash !== 'supersecretpassword123', 'Password is NOT stored in plain text');
    assert(dbUser.password_hash.startsWith('$2'), 'Password is valid bcrypt hash');

    // Extract cookie from signup
    const signupCookie = extractCookie(res.headers);
    assert(signupCookie !== null, 'Session cookie is returned on signup');

    // 3. Duplicate Email Signup
    console.log('\n3. Testing Duplicate Email Signup:');
    res = await request('/api/auth/signup', {
      method: 'POST',
      body: { name: 'Another User', email: testEmail, password: 'anotherpassword', confirmPassword: 'anotherpassword' }
    });
    assert(res.status === 409, 'Duplicate signup returns 409 Conflict');
    assert(res.body.error === 'DuplicateEmail', 'Error code is DuplicateEmail');

    // 4. Testing Login
    console.log('\n4. Testing Login:');

    // Invalid password
    res = await request('/api/auth/login', {
      method: 'POST',
      body: { email: testEmail, password: 'wrongpassword' }
    });
    assert(res.status === 401, 'Wrong password returns 401 Unauthorized');
    assert(res.body.message.includes('Invalid email or password'), 'Clear error message returned');

    // Non-existent user
    res = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'nonexistent@safeplate.ai', password: 'somepassword' }
    });
    assert(res.status === 401, 'Nonexistent email returns 401 Unauthorized');

    // Correct login
    res = await request('/api/auth/login', {
      method: 'POST',
      body: { email: testEmail, password: 'supersecretpassword123' }
    });
    assert(res.status === 200, 'Valid login returns 200 OK');
    assert(res.body.user.name === 'Chef SafePlate', 'Returns user name');
    const loginCookie = extractCookie(res.headers);
    assert(loginCookie !== null, 'Session cookie returned on login');

    // 5. Protected Route Access (/allergy-select.html)
    console.log('\n5. Testing Protected Route Guard:');

    // Without cookie
    res = await request('/allergy-select.html', {
      headers: { 'Accept': 'text/html' }
    });
    assert(res.status === 302, 'Unauthenticated browser access redirects (302)');
    assert(res.headers.location.includes('/login.html'), 'Redirects to /login.html');

    // With cookie
    res = await request('/allergy-select.html', {
      headers: {
        'Accept': 'text/html',
        'Cookie': loginCookie
      }
    });
    assert(res.status === 200, 'Authenticated access returns 200 OK');
    assert(res.rawBody.includes('What are you allergic to?'), 'Serves allergy selection HTML');

    // 6. Profile & Session verification (/api/auth/me)
    console.log('\n6. Testing /api/auth/me:');

    // Without cookie
    res = await request('/api/auth/me');
    assert(res.status === 200 && res.body.authenticated === false, 'Returns authenticated: false without cookie');

    // With cookie
    res = await request('/api/auth/me', {
      headers: { 'Cookie': loginCookie }
    });
    assert(res.status === 200 && res.body.authenticated === true, 'Returns authenticated: true with cookie');
    assert(res.body.user.name === 'Chef SafePlate', 'Returns current user info');

    // 7. Logout functionality
    console.log('\n7. Testing Logout:');
    res = await request('/api/auth/logout', {
      method: 'POST',
      headers: { 'Cookie': loginCookie }
    });
    assert(res.status === 200, 'Logout returns 200 OK');

    // Check that session is invalidated
    res = await request('/api/auth/me', {
      headers: { 'Cookie': loginCookie }
    });
    assert(res.body.authenticated === false, 'Session is invalidated in database after logout');

    // Check that protected page now redirects even with old cookie
    res = await request('/allergy-select.html', {
      headers: {
        'Accept': 'text/html',
        'Cookie': loginCookie
      }
    });
    assert(res.status === 302 && res.headers.location.includes('/login.html'), 'Protected route rejects invalidated cookie');

    console.log(`\nAll ${passedTests}/${totalTests} tests PASSED successfully!\n`);
  } catch (err) {
    console.error('\nTest Suite encountered error:', err);
    process.exitCode = 1;
  } finally {
    await stopServer();
  }
}

runTests();

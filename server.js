const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const {
  createUser,
  findUserByEmail,
  findUserById,
  createSession,
  getSessionUser,
  deleteSession
} = require('./database.js');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'safeplate_super_secret_key_development';

// 1. Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(SESSION_SECRET));

// 2. Attach authenticated user to request if session cookie is valid
app.use((req, res, next) => {
  const token = req.cookies.safeplate_session;
  if (token) {
    try {
      const user = getSessionUser(token);
      if (user) {
        req.user = user;
        req.sessionToken = token;
      } else {
        // Token was invalid or expired, clear cookie
        res.clearCookie('safeplate_session');
      }
    } catch (err) {
      console.error('Session lookup error:', err);
    }
  }
  next();
});

// Helper: Authentication Guard for protected routes
function requireAuth(req, res, next) {
  if (req.user) {
    return next();
  }

  // If request expects HTML/browser navigation, redirect to login
  if (req.accepts('html') && !req.path.startsWith('/api/')) {
    const redirectUrl = encodeURIComponent(req.originalUrl || '/');
    return res.redirect(`/login.html?redirect=${redirectUrl}`);
  }

  // Otherwise return 401 JSON
  return res.status(401).json({
    error: 'Unauthorized',
    message: 'You must be logged in to access this page.'
  });
}

// 3. Protected Pages (Must be defined before generic static middleware)
app.get('/allergy-select.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'allergy-select.html'));
});

// Friendly aliases
app.get('/login', (req, res) => res.redirect('/login.html'));
app.get('/signup', (req, res) => res.redirect('/signup.html'));
app.get('/allergy-select', (req, res) => res.redirect('/allergy-select.html'));

// 4. API Endpoints

/**
 * POST /api/auth/signup
 * Create a new user account
 */
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Field validation
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'ValidationError', message: 'Full name is required.' });
    }
    if (name.trim().length < 2) {
      return res.status(400).json({ error: 'ValidationError', message: 'Name must be at least 2 characters.' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'ValidationError', message: 'Email address is required.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'ValidationError', message: 'Please enter a valid email address.' });
    }

    if (!password) {
      return res.status(400).json({ error: 'ValidationError', message: 'Password is required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'ValidationError', message: 'Password must be at least 6 characters.' });
    }

    if (!confirmPassword) {
      return res.status(400).json({ error: 'ValidationError', message: 'Please confirm your password.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'ValidationError', message: 'Passwords do not match.' });
    }

    // Check for existing user
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'DuplicateEmail',
        message: 'An account with this email address already exists. Please log in.'
      });
    }

    // Hash password with bcrypt (12 salt rounds)
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Save to database
    const newUser = createUser(name, email, passwordHash);

    // Create session token and set HTTP-only cookie
    const token = crypto.randomBytes(32).toString('hex');
    createSession(token, newUser.id);

    res.cookie('safeplate_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      }
    });

  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({
      error: 'ServerError',
      message: 'An unexpected error occurred during signup. Please try again later.'
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate existing user
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'ValidationError', message: 'Email is required.' });
    }
    if (!password) {
      return res.status(400).json({ error: 'ValidationError', message: 'Password is required.' });
    }

    const user = findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: 'InvalidCredentials',
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        error: 'InvalidCredentials',
        message: 'Invalid email or password.'
      });
    }

    // Create session token and set HTTP-only cookie
    const token = crypto.randomBytes(32).toString('hex');
    createSession(token, user.id);

    res.cookie('safeplate_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      error: 'ServerError',
      message: 'An unexpected error occurred during login. Please try again later.'
    });
  }
});

/**
 * POST /api/auth/logout
 * Destroy session and clear cookie
 */
app.post('/api/auth/logout', (req, res) => {
  try {
    const token = req.cookies.safeplate_session;
    if (token) {
      deleteSession(token);
    }
    res.clearCookie('safeplate_session');
    return res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    console.error('Logout error:', err);
    res.clearCookie('safeplate_session');
    return res.status(200).json({ success: true, message: 'Logged out.' });
  }
});

/**
 * GET /api/auth/me
 * Return current authenticated user profile
 */
app.get('/api/auth/me', (req, res) => {
  if (req.user) {
    return res.status(200).json({
      authenticated: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
      }
    });
  }
  return res.status(200).json({
    authenticated: false,
    user: null
  });
});

// 5. Static Files Serving
app.use(express.static(path.join(__dirname)));

// 404 handler for unmatched routes
app.use((req, res) => {
  if (req.accepts('html')) {
    res.redirect('/');
  } else {
    res.status(404).json({ error: 'NotFound', message: 'Resource not found' });
  }
});

// Start server if not imported by test
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(` SafePlate AI server running on port ${PORT}`);
    console.log(` Open: http://localhost:${PORT}`);
    console.log(`=========================================`);
  });
}

module.exports = app;

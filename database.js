const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'safeplate.db');
const db = new DatabaseSync(dbPath);

// Initialize tables
db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
`);

/**
 * Creates a new user record.
 * @param {string} name 
 * @param {string} email 
 * @param {string} passwordHash 
 * @returns {object} { id, name, email }
 */
function createUser(name, email, passwordHash) {
  const insertStmt = db.prepare(`
    INSERT INTO users (name, email, password_hash)
    VALUES (?, ?, ?)
  `);
  
  const result = insertStmt.run(name.trim(), email.trim().toLowerCase(), passwordHash);
  return {
    id: Number(result.lastInsertRowid),
    name: name.trim(),
    email: email.trim().toLowerCase()
  };
}

/**
 * Finds a user by email (case-insensitive).
 * @param {string} email 
 * @returns {object|undefined} User record or undefined
 */
function findUserByEmail(email) {
  const query = db.prepare(`
    SELECT id, name, email, password_hash, created_at 
    FROM users 
    WHERE email = ?
  `);
  return query.get(email.trim().toLowerCase());
}

/**
 * Finds a user by ID.
 * @param {number} id 
 * @returns {object|undefined} User record (without password) or undefined
 */
function findUserById(id) {
  const query = db.prepare(`
    SELECT id, name, email, created_at 
    FROM users 
    WHERE id = ?
  `);
  return query.get(id);
}

/**
 * Stores a session token for a user.
 * @param {string} token 
 * @param {number} userId 
 * @param {number} maxAgeMs Duration in ms (defaults to 7 days)
 */
function createSession(token, userId, maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
  const now = Date.now();
  const expiresAt = now + maxAgeMs;

  const insertStmt = db.prepare(`
    INSERT INTO sessions (token, user_id, expires_at, created_at)
    VALUES (?, ?, ?, ?)
  `);
  insertStmt.run(token, userId, expiresAt, now);
}

/**
 * Retrieves the user associated with an active session token.
 * Removes expired sessions automatically.
 * @param {string} token 
 * @returns {object|null} Safe user object or null
 */
function getSessionUser(token) {
  if (!token) return null;

  const now = Date.now();
  
  // Clean up any expired sessions periodically
  db.prepare(`DELETE FROM sessions WHERE expires_at < ?`).run(now);

  const query = db.prepare(`
    SELECT u.id, u.name, u.email, u.created_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > ?
  `);

  const user = query.get(token, now);
  return user || null;
}

/**
 * Deletes a session token (logout).
 * @param {string} token 
 */
function deleteSession(token) {
  if (!token) return;
  const deleteStmt = db.prepare(`DELETE FROM sessions WHERE token = ?`);
  deleteStmt.run(token);
}

module.exports = {
  db,
  createUser,
  findUserByEmail,
  findUserById,
  createSession,
  getSessionUser,
  deleteSession
};

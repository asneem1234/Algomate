// Database module - uses Supabase in production, SQLite locally
const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;

if (isProduction) {
  // Use Supabase PostgreSQL in production (Vercel)
  module.exports = require('./db-supabase');
} else {
  // Use SQLite locally for development
  const Database = require('better-sqlite3');
  const path = require('path');

  const dbPath = path.join(__dirname, 'dsa_buddy.db');

  // Initialize database
  let db;
  try {
    db = new Database(dbPath);
    console.log('Connected to SQLite database (development mode)');
    initializeTables();
  } catch (err) {
    console.error('Error opening database:', err.message);
  }

  function initializeTables() {
    try {
      // Problems table
      db.exec(`
        CREATE TABLE IF NOT EXISTS problems (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          category TEXT,
          difficulty TEXT,
          leetcode_number INTEGER,
          status TEXT DEFAULT 'Not Started',
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Problems table ready');

      // AI responses cache table
      db.exec(`
        CREATE TABLE IF NOT EXISTS ai_cache (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          problem_id INTEGER,
          step INTEGER,
          response TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (problem_id) REFERENCES problems (id),
          UNIQUE(problem_id, step)
        )
      `);
      console.log('AI cache table ready');
    } catch (err) {
      console.error('Error initializing tables:', err.message);
    }
  }

  module.exports = db;
}



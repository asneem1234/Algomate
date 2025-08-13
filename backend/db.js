const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'dsa_buddy.db');

// Initialize database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeTables();
  }
});

function initializeTables() {
  // Problems table
  db.run(`
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
  `, (err) => {
    if (err) {
      console.error('Error creating problems table:', err.message);
    } else {
      console.log('Problems table ready');
    }
  });

  // AI responses cache table
  db.run(`
    CREATE TABLE IF NOT EXISTS ai_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      problem_id INTEGER,
      step INTEGER,
      response TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (problem_id) REFERENCES problems (id),
      UNIQUE(problem_id, step)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating ai_cache table:', err.message);
    } else {
      console.log('AI cache table ready');
    }
  });
}

module.exports = db;



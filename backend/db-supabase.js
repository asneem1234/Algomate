const { Pool } = require('pg');

// Supabase connection using Transaction Pooler (works without IPv4)
// Use the "Transaction" mode connection string from Supabase dashboard
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to Supabase:', err.message);
  } else {
    console.log('Connected to Supabase database');
  }
});

// Initialize tables
async function initializeTables() {
  const client = await pool.connect();
  try {
    // Problems table
    await client.query(`
      CREATE TABLE IF NOT EXISTS problems (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        difficulty TEXT,
        leetcode_number INTEGER,
        status TEXT DEFAULT 'Not Started',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Problems table ready');

    // AI responses cache table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_cache (
        id SERIAL PRIMARY KEY,
        problem_id INTEGER REFERENCES problems(id),
        step INTEGER,
        response TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(problem_id, step)
      )
    `);
    console.log('AI cache table ready');
  } catch (err) {
    console.error('Error initializing tables:', err.message);
  } finally {
    client.release();
  }
}

// Initialize on startup
initializeTables();

// Database helper methods (compatible with better-sqlite3 API style)
const db = {
  // Prepare a statement (returns an object with run, get, all methods)
  prepare: (sql) => {
    return {
      // For INSERT, UPDATE, DELETE
      run: async (...params) => {
        const client = await pool.connect();
        try {
          const result = await client.query(sql.replace(/\?/g, (_, i) => `$${params.indexOf(_) + 1}`), params);
          return { 
            changes: result.rowCount,
            lastInsertRowid: result.rows[0]?.id || null
          };
        } finally {
          client.release();
        }
      },
      // For SELECT single row
      get: async (...params) => {
        const client = await pool.connect();
        try {
          // Convert ? to $1, $2, etc for PostgreSQL
          let paramIndex = 0;
          const pgSql = sql.replace(/\?/g, () => `$${++paramIndex}`);
          const result = await client.query(pgSql, params);
          return result.rows[0] || null;
        } finally {
          client.release();
        }
      },
      // For SELECT multiple rows
      all: async (...params) => {
        const client = await pool.connect();
        try {
          let paramIndex = 0;
          const pgSql = sql.replace(/\?/g, () => `$${++paramIndex}`);
          const result = await client.query(pgSql, params);
          return result.rows;
        } finally {
          client.release();
        }
      }
    };
  },
  
  // Direct query execution
  exec: async (sql) => {
    const client = await pool.connect();
    try {
      await client.query(sql);
    } finally {
      client.release();
    }
  },

  // Get the pool for direct access if needed
  pool: pool
};

module.exports = db;

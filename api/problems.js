const db = require('../backend/db');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { search, category, difficulty, status } = req.query;
    
    let sql = 'SELECT * FROM problems WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (name LIKE $' + (params.length + 1) + ' OR description LIKE $' + (params.length + 2) + ')';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category && category !== 'all') {
      sql += ' AND category LIKE $' + (params.length + 1);
      params.push(`%${category}%`);
    }

    if (difficulty && difficulty !== 'all') {
      sql += ' AND difficulty = $' + (params.length + 1);
      params.push(difficulty);
    }

    if (status && status !== 'all') {
      sql += ' AND status = $' + (params.length + 1);
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';

    const stmt = db.prepare(sql);
    const rows = await Promise.resolve(stmt.all(...params));
    
    res.json({
      problems: rows || [],
      total: (rows || []).length
    });
  } catch (err) {
    console.error('Error fetching problems:', err);
    res.status(500).json({ error: 'Failed to fetch problems' });
  }
};

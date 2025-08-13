const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/problems - returns list of problems
router.get('/problems', (req, res) => {
  const { search, category, difficulty, status } = req.query;
  
  let sql = 'SELECT * FROM problems WHERE 1=1';
  const params = [];

  // Add search filter
  if (search) {
    sql += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  // Add category filter
  if (category && category !== 'all') {
    sql += ' AND category LIKE ?';
    params.push(`%${category}%`);
  }

  // Add difficulty filter
  if (difficulty && difficulty !== 'all') {
    sql += ' AND difficulty = ?';
    params.push(difficulty);
  }

  // Add status filter
  if (status && status !== 'all') {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY created_at DESC';

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Error fetching problems:', err);
      res.status(500).json({ error: 'Failed to fetch problems' });
    } else {
      res.json({
        problems: rows,
        total: rows.length
      });
    }
  });
});

// GET /api/problems/stats - returns statistics about problems
router.get('/problems/stats', (req, res) => {
  const statsQueries = [
    'SELECT COUNT(*) as total FROM problems',
    'SELECT COUNT(*) as not_started FROM problems WHERE status = "Not Started"',
    'SELECT COUNT(*) as in_progress FROM problems WHERE status = "In Progress"',
    'SELECT COUNT(*) as done FROM problems WHERE status = "Done"',
    'SELECT difficulty, COUNT(*) as count FROM problems GROUP BY difficulty',
    'SELECT category, COUNT(*) as count FROM problems GROUP BY category'
  ];

  Promise.all(statsQueries.map(query => {
    return new Promise((resolve, reject) => {
      db.all(query, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }))
  .then(results => {
    const [total, notStarted, inProgress, done, byDifficulty, byCategory] = results;
    
    res.json({
      total: total[0].total,
      status: {
        'Not Started': notStarted[0].not_started,
        'In Progress': inProgress[0].in_progress,
        'Done': done[0].done
      },
      difficulty: byDifficulty.reduce((acc, row) => {
        acc[row.difficulty] = row.count;
        return acc;
      }, {}),
      category: byCategory.reduce((acc, row) => {
        acc[row.category] = row.count;
        return acc;
      }, {})
    });
  })
  .catch(err => {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  });
});

module.exports = router;


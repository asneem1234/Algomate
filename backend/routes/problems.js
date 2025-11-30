const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/problems - returns list of problems
router.get('/problems', async (req, res) => {
  try {
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

    const stmt = db.prepare(sql);
    const rows = await Promise.resolve(stmt.all(...params));
    
    res.json({
      problems: rows,
      total: rows.length
    });
  } catch (err) {
    console.error('Error fetching problems:', err);
    res.status(500).json({ error: 'Failed to fetch problems' });
  }
});

// GET /api/problems/stats - returns statistics about problems
router.get('/problems/stats', async (req, res) => {
  try {
    const totalStmt = db.prepare('SELECT COUNT(*) as total FROM problems');
    const notStartedStmt = db.prepare("SELECT COUNT(*) as count FROM problems WHERE status = 'Not Started'");
    const inProgressStmt = db.prepare("SELECT COUNT(*) as count FROM problems WHERE status = 'In Progress'");
    const doneStmt = db.prepare("SELECT COUNT(*) as count FROM problems WHERE status = 'Done'");
    const byDifficultyStmt = db.prepare('SELECT difficulty, COUNT(*) as count FROM problems GROUP BY difficulty');
    const byCategoryStmt = db.prepare('SELECT category, COUNT(*) as count FROM problems GROUP BY category');

    const [total, notStarted, inProgress, done, byDifficulty, byCategory] = await Promise.all([
      Promise.resolve(totalStmt.get()),
      Promise.resolve(notStartedStmt.get()),
      Promise.resolve(inProgressStmt.get()),
      Promise.resolve(doneStmt.get()),
      Promise.resolve(byDifficultyStmt.all()),
      Promise.resolve(byCategoryStmt.all())
    ]);
    
    res.json({
      total: total?.total || 0,
      status: {
        'Not Started': notStarted?.count || 0,
        'In Progress': inProgress?.count || 0,
        'Done': done?.count || 0
      },
      difficulty: (byDifficulty || []).reduce((acc, row) => {
        if (row.difficulty) acc[row.difficulty] = row.count;
        return acc;
      }, {}),
      category: (byCategory || []).reduce((acc, row) => {
        if (row.category) acc[row.category] = row.count;
        return acc;
      }, {})
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;


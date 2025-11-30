const express = require('express');
const db = require('../db');

const router = express.Router();

// POST /api/status/:id - update problem status
router.post('/status/:id', async (req, res) => {
  const problemId = parseInt(req.params.id);
  const { status } = req.body;

  if (!problemId) {
    return res.status(400).json({ error: 'Invalid problem ID' });
  }

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  // Validate status values
  const validStatuses = ['Not Started', 'In Progress', 'Done'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
    });
  }

  try {
    const sql = 'UPDATE problems SET status = ? WHERE id = ?';
    const stmt = db.prepare(sql);
    const result = await Promise.resolve(stmt.run(status, problemId));
    
    if (result.changes === 0) {
      res.status(404).json({ error: 'Problem not found' });
    } else {
      res.json({ 
        message: 'Status updated successfully',
        problemId,
        status
      });
    }
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// GET /api/status/:id - get current status of a problem
router.get('/status/:id', async (req, res) => {
  const problemId = parseInt(req.params.id);

  if (!problemId) {
    return res.status(400).json({ error: 'Invalid problem ID' });
  }

  try {
    const sql = 'SELECT id, name, status FROM problems WHERE id = ?';
    const stmt = db.prepare(sql);
    const row = await Promise.resolve(stmt.get(problemId));
    
    if (!row) {
      res.status(404).json({ error: 'Problem not found' });
    } else {
      res.json(row);
    }
  } catch (err) {
    console.error('Error fetching status:', err);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

module.exports = router;


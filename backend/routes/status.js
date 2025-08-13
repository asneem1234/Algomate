const express = require('express');
const db = require('../db');

const router = express.Router();

// POST /api/status/:id - update problem status
router.post('/status/:id', (req, res) => {
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

  const sql = 'UPDATE problems SET status = ? WHERE id = ?';
  
  db.run(sql, [status, problemId], function(err) {
    if (err) {
      console.error('Error updating status:', err);
      res.status(500).json({ error: 'Failed to update status' });
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Problem not found' });
    } else {
      res.json({ 
        message: 'Status updated successfully',
        problemId,
        status
      });
    }
  });
});

// GET /api/status/:id - get current status of a problem
router.get('/status/:id', (req, res) => {
  const problemId = parseInt(req.params.id);

  if (!problemId) {
    return res.status(400).json({ error: 'Invalid problem ID' });
  }

  const sql = 'SELECT id, name, status FROM problems WHERE id = ?';
  
  db.get(sql, [problemId], (err, row) => {
    if (err) {
      console.error('Error fetching status:', err);
      res.status(500).json({ error: 'Failed to fetch status' });
    } else if (!row) {
      res.status(404).json({ error: 'Problem not found' });
    } else {
      res.json(row);
    }
  });
});

module.exports = router;


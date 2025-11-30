const db = require('../backend/db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  const problemId = parseInt(id);

  if (!problemId) {
    return res.status(400).json({ error: 'Invalid problem ID' });
  }

  if (req.method === 'POST') {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['Not Started', 'In Progress', 'Done'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    try {
      const stmt = db.prepare('UPDATE problems SET status = ? WHERE id = ?');
      const result = await Promise.resolve(stmt.run(status, problemId));
      
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Problem not found' });
      }
      
      res.json({ message: 'Status updated successfully', problemId, status });
    } catch (err) {
      console.error('Error updating status:', err);
      res.status(500).json({ error: 'Failed to update status' });
    }
  } else {
    try {
      const stmt = db.prepare('SELECT id, name, status FROM problems WHERE id = ?');
      const row = await Promise.resolve(stmt.get(problemId));
      
      if (!row) {
        return res.status(404).json({ error: 'Problem not found' });
      }
      
      res.json(row);
    } catch (err) {
      console.error('Error fetching status:', err);
      res.status(500).json({ error: 'Failed to fetch status' });
    }
  }
};

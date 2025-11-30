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

  try {
    const problemStmt = db.prepare('SELECT * FROM problems WHERE id = ?');
    const problem = await Promise.resolve(problemStmt.get(problemId));
    
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const stepsStmt = db.prepare('SELECT step, response FROM ai_cache WHERE problem_id = ? ORDER BY step');
    const rows = await Promise.resolve(stepsStmt.all(problemId));
    
    const steps = {};
    (rows || []).forEach(row => {
      try {
        steps[`step${row.step}`] = JSON.parse(row.response);
      } catch (parseErr) {
        steps[`step${row.step}`] = row.response;
      }
    });

    res.json({ problem, steps });
  } catch (error) {
    console.error('Error fetching problem:', error);
    res.status(500).json({ error: 'Failed to fetch problem details' });
  }
};

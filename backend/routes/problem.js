const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/problem/:id - returns AI-generated content for that problem
router.get('/problem/:id', async (req, res) => {
  const problemId = parseInt(req.params.id);
  
  if (!problemId) {
    return res.status(400).json({ error: 'Invalid problem ID' });
  }

  try {
    // Get problem details
    const problem = await getProblemById(problemId);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Get all AI-generated steps for this problem
    const aiSteps = await getAIStepsForProblem(problemId);
    
    res.json({
      problem,
      steps: aiSteps
    });

  } catch (error) {
    console.error('Error fetching problem:', error);
    res.status(500).json({ error: 'Failed to fetch problem details' });
  }
});

// Helper function to get problem by ID
function getProblemById(id) {
  try {
    const stmt = db.prepare('SELECT * FROM problems WHERE id = ?');
    const row = stmt.get(id);
    return row;
  } catch (err) {
    throw new Error(`Error fetching problem: ${err.message}`);
  }
}

// Helper function to get AI steps for a problem
function getAIStepsForProblem(problemId) {
  try {
    const stmt = db.prepare('SELECT step, response FROM ai_cache WHERE problem_id = ? ORDER BY step');
    const rows = stmt.all(problemId);
    
    const steps = {};
    rows.forEach(row => {
      try {
        steps[`step${row.step}`] = JSON.parse(row.response);
      } catch (parseErr) {
        console.error('Error parsing AI response:', parseErr);
        steps[`step${row.step}`] = row.response;
      }
    });
    
    return steps;
  } catch (err) {
    throw new Error(`Error fetching AI steps: ${err.message}`);
  }
}

module.exports = router;


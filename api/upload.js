const db = require('../backend/db');

// Parse problems from text
function parseProblems(text) {
  const problems = [];
  const lines = text.split('\n').filter(line => line.trim());

  for (const line of lines) {
    const problem = parseProblemLine(line);
    if (problem) {
      problems.push(problem);
    }
  }

  return problems;
}

function parseProblemLine(line) {
  const trimmedLine = line.trim();
  if (!trimmedLine) return null;

  const numberMatch = trimmedLine.match(/^(\d+)\.?\s*/);
  const leetcodeNumber = numberMatch ? parseInt(numberMatch[1]) : null;
  
  let remainingLine = numberMatch ? trimmedLine.replace(numberMatch[0], '') : trimmedLine;
  
  const difficultyMatch = remainingLine.match(/\b(Easy|Medium|Hard)\b/i);
  const difficulty = difficultyMatch ? difficultyMatch[1] : 'Unknown';
  
  if (difficultyMatch) {
    remainingLine = remainingLine.replace(difficultyMatch[0], '').replace(/[(),-]/g, ' ').trim();
  }
  
  const parts = remainingLine.split(/[-,]/);
  const name = parts[0] ? parts[0].trim() : 'Unknown Problem';
  const category = parts.slice(1).join(', ').trim() || 'General';

  return {
    name,
    category,
    difficulty,
    leetcode_number: leetcodeNumber,
    description: trimmedLine
  };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const problems = parseProblems(text);
    
    if (problems.length === 0) {
      return res.status(400).json({ error: 'No problems found in the provided text' });
    }

    const savedProblems = [];
    for (const problem of problems) {
      const sql = `INSERT INTO problems (name, category, difficulty, leetcode_number, description) VALUES (?, ?, ?, ?, ?)`;
      const stmt = db.prepare(sql);
      const result = await Promise.resolve(stmt.run(
        problem.name,
        problem.category,
        problem.difficulty,
        problem.leetcode_number,
        problem.description
      ));
      
      savedProblems.push({
        id: result.lastInsertRowid,
        ...problem,
        status: 'Not Started'
      });
    }

    res.json({
      message: `Successfully uploaded ${savedProblems.length} problems`,
      problems: savedProblems
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process upload' });
  }
};

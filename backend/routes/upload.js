const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const db = require('../db');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// POST /api/upload - accepts problem list, parses, saves to DB
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    let problemsText = '';

    if (req.file) {
      // Handle PDF file
      if (req.file.mimetype === 'application/pdf') {
        const pdfData = await pdfParse(req.file.buffer);
        problemsText = pdfData.text;
      } else if (req.file.mimetype === 'text/plain') {
        // Handle text file
        problemsText = req.file.buffer.toString('utf-8');
      } else {
        return res.status(400).json({ error: 'Unsupported file type. Please upload PDF or text file.' });
      }
    } else if (req.body.text) {
      // Handle direct text input
      problemsText = req.body.text;
    } else {
      return res.status(400).json({ error: 'No file or text provided' });
    }

    // Parse problems from text
    const problems = parseProblems(problemsText);
    
    if (problems.length === 0) {
      return res.status(400).json({ error: 'No problems found in the provided text' });
    }

    // Save problems to database
    const savedProblems = [];
    for (const problem of problems) {
      const result = await insertProblem(problem);
      savedProblems.push(result);
    }

    res.json({
      message: `Successfully uploaded ${savedProblems.length} problems`,
      problems: savedProblems
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process upload' });
  }
});

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

// Parse individual problem line
function parseProblemLine(line) {
  // Try to extract LeetCode number, name, difficulty, and category
  // Format examples:
  // "1. Two Sum (Easy) - Array, Hash Table"
  // "Two Sum - Easy - Array"
  // "1 Two Sum Easy Array Hash Table"
  
  const trimmedLine = line.trim();
  if (!trimmedLine) return null;

  // Extract LeetCode number (if present)
  const numberMatch = trimmedLine.match(/^(\d+)\.?\s*/);
  const leetcodeNumber = numberMatch ? parseInt(numberMatch[1]) : null;
  
  // Remove number from line
  let remainingLine = numberMatch ? trimmedLine.replace(numberMatch[0], '') : trimmedLine;
  
  // Extract difficulty (Easy, Medium, Hard)
  const difficultyMatch = remainingLine.match(/\b(Easy|Medium|Hard)\b/i);
  const difficulty = difficultyMatch ? difficultyMatch[1] : 'Unknown';
  
  // Remove difficulty from line
  if (difficultyMatch) {
    remainingLine = remainingLine.replace(difficultyMatch[0], '').replace(/[(),-]/g, ' ').trim();
  }
  
  // Split remaining text to get name and category
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

// Insert problem into database
function insertProblem(problem) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO problems (name, category, difficulty, leetcode_number, description)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    db.run(sql, [
      problem.name,
      problem.category,
      problem.difficulty,
      problem.leetcode_number,
      problem.description
    ], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({
          id: this.lastID,
          ...problem,
          status: 'Not Started'
        });
      }
    });
  });
}

module.exports = router;


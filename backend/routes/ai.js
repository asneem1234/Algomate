const express = require('express');
const axios = require('axios');
const db = require('../db');

const router = express.Router();

// Gemini API configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// System prompt for Gemini API
const SYSTEM_PROMPT = `You are a DSA mentor. When given a problem description, respond ONLY in the following JSON format:

{
  "step1": "...",
  "step2": "...",
  "step3": "...",
  "step4": "...",
  "step5": "...",
  "step6": "...",
  "step7": "..."
}

Rules:
- For each step, provide comprehensive, detailed explanations with clear reasoning.
- Use sections, bullet points and formatting to organize your thoughts.
- Include concrete examples and walk through the reasoning step-by-step.
- Do NOT give full final code unless explicitly requested.
- For steps 3 & 4, focus on guiding questions and partial pseudocode.
- Each step should be detailed and thorough (300-500 words).

Step descriptions:
1. Question Reading – Restate problem in simple words, break down the requirements, identify inputs/outputs, constraints, and discuss any edge cases in detail.
2. Understand with an Example – Show detailed dry run with step-by-step visualizations of multiple sample cases, including edge cases and corner scenarios.
3. Think & Apply Your Approach – Provide comprehensive thinking process with guiding questions, detailed reasoning for algorithm selection, and step-by-step development of approach.
4. Learn Solution (Brute Force & Optimal) – In-depth comparison of multiple approaches with detailed time/space analysis, optimization techniques, and trade-offs.
5. Behavioral Questions – Explore problem-solving thought process, optimization strategies, and how to handle potential interview follow-up questions.
6. Modifications Possibilities – Analyze multiple variants of the problem, how they change the solution approach, and strategies to adapt.
7. Real-Life Applications – Detailed explanation of where this algorithm/pattern is used in real systems, software, and technologies.`;

// POST /api/ai/:step - sends problem details + step number to Gemini API
router.post('/ai/:step', async (req, res) => {
  const stepNumber = parseInt(req.params.step);
  const { problemId, problemName, problemDescription } = req.body;

  if (!stepNumber || stepNumber < 1 || stepNumber > 7) {
    return res.status(400).json({ error: 'Invalid step number. Must be between 1 and 7.' });
  }

  if (!problemId) {
    return res.status(400).json({ error: 'Problem ID is required' });
  }

  try {
    // Check if we have cached response for this problem and step
    const cachedResponse = await getCachedAIResponse(problemId, stepNumber);
    if (cachedResponse) {
      return res.json(JSON.parse(cachedResponse));
    }

    // Get problem details if not provided
    let problem;
    if (!problemName || !problemDescription) {
      problem = await getProblemById(problemId);
      if (!problem) {
        return res.status(404).json({ error: 'Problem not found' });
      }
    }

    const name = problemName || problem.name;
    const description = problemDescription || problem.description;

    // Generate AI response
    const aiResponse = await generateAIResponse(name, description, stepNumber);
    
    // Cache the response
    await cacheAIResponse(problemId, stepNumber, JSON.stringify(aiResponse));

    res.json(aiResponse);

  } catch (error) {
    console.error('AI API error:', error);
    res.status(500).json({ error: 'Failed to generate AI response' });
  }
});

// POST /api/ai/all/:problemId - generate all steps for a problem
router.post('/ai/all/:problemId', async (req, res) => {
  const problemId = parseInt(req.params.problemId);

  if (!problemId) {
    return res.status(400).json({ error: 'Invalid problem ID' });
  }

  try {
    // Get problem details
    const problem = await getProblemById(problemId);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Generate all steps
    const allSteps = {};
    for (let step = 1; step <= 7; step++) {
      try {
        // Check cache first
        let cachedResponse = await getCachedAIResponse(problemId, step);
        if (cachedResponse) {
          allSteps[`step${step}`] = JSON.parse(cachedResponse);
        } else {
          // Generate new response
          const aiResponse = await generateAIResponse(problem.name, problem.description, step);
          await cacheAIResponse(problemId, step, JSON.stringify(aiResponse));
          allSteps[`step${step}`] = aiResponse;
        }
      } catch (stepError) {
        console.error(`Error generating step ${step}:`, stepError);
        allSteps[`step${step}`] = { error: 'Failed to generate this step' };
      }
    }

    res.json(allSteps);

  } catch (error) {
    console.error('Error generating all steps:', error);
    res.status(500).json({ error: 'Failed to generate AI responses' });
  }
});

// Generate AI response using Gemini API
async function generateAIResponse(problemName, problemDescription, stepNumber) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const userPrompt = `Problem: ${problemName}
Description: ${problemDescription}

Please provide all 7 steps of the learning flow for this DSA problem. Focus especially on step ${stepNumber} but provide all steps in the JSON format.`;

  // Gemini API expects a different request format
  const response = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    contents: [
      {
        role: "user",
        parts: [
          { text: SYSTEM_PROMPT },
          { text: userPrompt }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2000,
      topP: 0.95,
      topK: 40
    }
  }, {
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Gemini API response structure is different
  const aiContent = response.data.candidates[0].content.parts[0].text;
  
  try {
    return JSON.parse(aiContent);
  } catch (parseError) {
    console.error('Failed to parse AI response as JSON:', aiContent);
    throw new Error('Invalid JSON response from AI');
  }
}

// Helper functions
function getProblemById(id) {
  try {
    const stmt = db.prepare('SELECT * FROM problems WHERE id = ?');
    return stmt.get(id);
  } catch (err) {
    throw new Error(`Error fetching problem: ${err.message}`);
  }
}

function getCachedAIResponse(problemId, step) {
  try {
    const stmt = db.prepare('SELECT response FROM ai_cache WHERE problem_id = ? AND step = ?');
    const row = stmt.get(problemId, step);
    return row ? row.response : null;
  } catch (err) {
    throw new Error(`Error fetching cached AI response: ${err.message}`);
  }
}

function cacheAIResponse(problemId, step, response) {
  try {
    const stmt = db.prepare('INSERT OR REPLACE INTO ai_cache (problem_id, step, response) VALUES (?, ?, ?)');
    const result = stmt.run(problemId, step, response);
    return result.lastInsertRowid;
  } catch (err) {
    throw new Error(`Error caching AI response: ${err.message}`);
  }
}

module.exports = router;


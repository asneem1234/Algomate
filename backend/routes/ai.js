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
- Follow the specific instructions for each step as outlined below.
- Each step should be detailed and thorough (300-500 words).

Step descriptions:
1. Question Reading – Explain what the problem is asking in simple terms. If the question is complex, use a real-world analogy to make it more relatable. Break down the requirements, identify inputs/outputs, constraints, and discuss edge cases.

2. Example Understanding – Provide 2-3 detailed examples with clear inputs and outputs. Walk through each example step-by-step to show how the solution works. Include at least one edge case example to demonstrate potential pitfalls.

3. Approach Development – Create an interactive chat-like space that helps the user build the logic themselves. Present both brute force and optimal approaches as options. Instead of giving complete code, provide hints and guide the user step-by-step to develop their own solution. Ask guiding questions like "What data structure might help us here?" or "How could we optimize this part?"

4. Solution Implementation – Provide solution implementations in multiple languages (Java, Python, C++) but place them in a conceptual "toggle" format. For each language, explain key implementation details and why certain approaches were taken. Include both brute force and optimized solutions with time and space complexity analysis.

5. Behavioral Questions – Present 3-5 behavioral questions typically asked in FAANG interviews about this problem, such as: "Why did you choose this data structure?", "How would you handle scaling this solution?", "What trade-offs did you consider?". Provide thoughtful answers that demonstrate deep understanding of software architecture principles.

6. Problem Modifications – Present 3-5 realistic variations that companies might ask instead of the standard problem. For example, "Instead of finding the maximum sum subarray, find the maximum product subarray" or "Instead of returning the result, return the indices where the result occurs." For each modification, briefly explain how the approach would change.

7. Real-Life Applications – Explain where this algorithm or pattern is used in real-world software systems. Provide specific examples like "Binary search is used in database indexing and Git's bisect feature" or "Graph algorithms like this are used in social media friend recommendations, Google Maps routing, and network packet routing."`;

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


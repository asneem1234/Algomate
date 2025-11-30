const axios = require('axios');
const db = require('../backend/db');

// Gemini 2.0 Flash API configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = `
You are a DSA mentor assistant that teaches deeply and interactively. When given a problem, you MUST RESPOND ONLY with valid JSON (no extra text, no commentary). The JSON must exactly follow the schema described below. If you cannot answer, return {"error": "explanation"} only.  

GENERAL RULES:
- Output MUST be parseable JSON, no leading/trailing text.  
- Do not include triple-backtick fences outside strings; code blocks should be strings inside the JSON.  
- Keep answers thorough, clear, and teachable. Use plain English and short examples. Use an encouraging tone.  
- When asked to focus on one step, still return all seven steps, but provide extra depth for the requested step.  
- If asked to include code, provide three language variants: Java, Python, C++.

REQUIRED TOP-LEVEL JSON SCHEMA:
{
  "step1": { "title":"", "summary":"", "requirements": ["..."], "constraints":["..."], "edge_cases":["..."] },
  "step2": { "title":"", "examples":[ {"input":"", "output":"", "explanation":""}, ... ] },
  "step3": { "title":"", "brute_force":"", "optimal":"", "interactive_prompts":[ "question1", ... ] },
  "step4": { "title":"", "solutions": { "java": { "code":"", "explanation":"", "time":"", "space":"" }, "python": { "code":"", "explanation":"", "time":"", "space":"" }, "cpp": { "code":"", "explanation":"", "time":"", "space":"" } } },
  "step5": { "title":"", "behavioral":[ {"question":"", "answer":""}, ... ] },
  "step6": { "title":"", "variations":[ {"variant":"", "hint":""}, ... ] },
  "step7": { "title":"", "applications":[ {"system":"", "explanation":""}, ... ] }
}
`;

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

  const { step } = req.query;
  const stepNumber = parseInt(step);
  const { problemId, problemName, problemDescription } = req.body;

  if (!stepNumber || stepNumber < 1 || stepNumber > 7) {
    return res.status(400).json({ error: 'Invalid step number. Must be between 1 and 7.' });
  }

  if (!problemId) {
    return res.status(400).json({ error: 'Problem ID is required' });
  }

  try {
    // Check cache first
    const cacheStmt = db.prepare('SELECT response FROM ai_cache WHERE problem_id = ? AND step = ?');
    const cached = await Promise.resolve(cacheStmt.get(problemId, stepNumber));
    
    if (cached) {
      return res.json(JSON.parse(cached.response));
    }

    // Get problem details if not provided
    let name = problemName;
    let description = problemDescription;
    
    if (!name || !description) {
      const problemStmt = db.prepare('SELECT * FROM problems WHERE id = ?');
      const problem = await Promise.resolve(problemStmt.get(problemId));
      if (!problem) {
        return res.status(404).json({ error: 'Problem not found' });
      }
      name = problem.name;
      description = problem.description;
    }

    // Generate AI response
    const userPrompt = `Problem: ${name}
Description: ${description}
User additional info: focus step=${stepNumber}

When responding, produce only JSON following the schema above.`;

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
        maxOutputTokens: 4000,
        topP: 0.95,
        topK: 40
      }
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    const aiContent = response.data.candidates[0].content.parts[0].text;
    let aiResponse;
    
    try {
      // Try to parse JSON, handling markdown code blocks
      let jsonStr = aiContent.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      }
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }
      aiResponse = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      return res.status(500).json({ error: 'Invalid response from AI' });
    }

    // Cache the response
    const isPostgres = process.env.DATABASE_URL;
    const cacheSql = isPostgres 
      ? 'INSERT INTO ai_cache (problem_id, step, response) VALUES ($1, $2, $3) ON CONFLICT (problem_id, step) DO UPDATE SET response = $3'
      : 'INSERT OR REPLACE INTO ai_cache (problem_id, step, response) VALUES (?, ?, ?)';
    
    const cacheInsertStmt = db.prepare(cacheSql);
    await Promise.resolve(cacheInsertStmt.run(problemId, stepNumber, JSON.stringify(aiResponse)));

    res.json(aiResponse);

  } catch (error) {
    console.error('AI API error:', error);
    res.status(500).json({ error: 'Failed to generate AI response' });
  }
};

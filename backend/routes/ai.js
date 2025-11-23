const express = require('express');
const axios = require('axios');
const db = require('../db');

const router = express.Router();

// Gemini API configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// System prompt for Gemini API
const SYSTEM_PROMPT = `
You are a DSA mentor assistant that teaches deeply and interactively. When given a problem, you MUST RESPOND ONLY with valid JSON (no extra text, no commentary). The JSON must exactly follow the schema described below. If you cannot answer, return {"error": "explanation"} only.  

GENERAL RULES:
- Output MUST be parseable JSON, no leading/trailing text.  
- Do not include triple-backtick fences outside strings; code blocks should be strings inside the JSON.  
- Keep answers thorough, clear, and teachable. Use plain English and short examples. Use an encouraging tone.  
- When asked to focus on one step, still return all seven steps, but provide extra depth for the requested step.  
- If asked to include code, provide three language variants: Java, Python, C++. Put code and a short explanation inside each language object. Include time & space complexity.  
- Do not assume anything not provided in the user prompt — if insufficient data, include a short JSON field "clarify" with a single question to ask the user.

REQUIRED TOP-LEVEL JSON SCHEMA:
{
  "step1": { "title":"", "summary":"", "requirements": ["..."], "constraints":["..."], "edge_cases":["..."] },
  "step2": { "title":"", "examples":[ {"input":"", "output":"", "explanation":""}, ... ] },
  "step3": { "title":"", 
             "brute_force":"(explain approach + complexity)", 
             "optimal":"(explain approach + complexity)", 
             "interactive_prompts":[ "question1", "question2", ... ] 
           },
  "step4": { "title":"", 
             "solutions": {
                "java": { "code":"", "explanation":"", "time":"", "space":"" },
                "python": { "code":"", "explanation":"", "time":"", "space":"" },
                "cpp": { "code":"", "explanation":"", "time":"", "space":"" }
             }
           },
  "step5": { "title":"", "behavioral":[ {"question":"", "answer":""}, ... ] },
  "step6": { "title":"", "variations":[ {"variant":"", "hint":"short hint on how to adapt"}, ... ] },
  "step7": { "title":"", "applications":[ {"system":"", "explanation":""}, ... ] }
}

DETAILED INSTRUCTIONS PER STEP:
1) Question Reading
 - "summary": 1-3 sentence plain-language explanation of what is asked.
 - "requirements": list input, output, and success conditions.
 - "constraints": list complexity, memory, and any special constraints (e.g., in-place, immutable).
 - "edge_cases": list typical tricky cases.

2) Example Understanding
 - Provide 2-3 examples. One must be a small normal case, one an edge case (empty, single element, duplicates, etc.). Each example must include step-by-step explanation.

3) Approach Development (Interactive)
 - Provide a full brute-force description (algorithm, complexity).
 - Provide the optimal approach idea (algorithm, complexity).
 - Provide an ordered list "interactive_prompts" of 6–10 short guiding questions/prompts to lead a user to implement the optimal solution themselves (no full code). Each prompt should be actionable (e.g., "What data structure lets you check duplicates in O(1)?"). The assistant should **not** supply full code in this step; it's a scaffold to use in interactive chat.

4) Solution Implementation (toggle concept)
 - Provide ready-to-copy working solutions for Java, Python, and C++. Each language object must include:
    - "code": the source code as a string (with newline characters). Use typical function/class signatures used in LeetCode for that language.
    - "explanation": 2–4 sentences describing the core lines / why it works.
    - "time": Big-O time complexity.
    - "space": Big-O space complexity.
 - Include both brute-force and optimal solutions when sensible; label them clearly inside the "explanation" or within the code comments.

5) Behavioral Questions
 - Provide 3–5 interview-style behavioral/design questions and model answers that explain engineering tradeoffs (scalability, maintainability, choice of data structure, memory vs speed).

6) Problem Modifications
 - Provide 3–5 realistic variations of the original problem with a 1–2 line hint on how to adapt the solution.

7) Real-Life Applications
 - Provide 3 concrete systems or scenarios where this algorithm/pattern is used, and a short explanation of how it is applied.

FORMATTING & LENGTH:
- For steps 1–3, aim for ~150–350 words each (rich but concise).  
- Step 4 code should be compact but complete; prefer clarity and LeetCode-style signatures.  
- Each JSON value must be a string, array, or object — no raw markdown outside strings.  

ERROR HANDLING:
- If you cannot generate a step, set that step to { "error": "short reason" } rather than breaking JSON.
- If the user requested focus on one step number via the user prompt, put an extra field in that step: "focusDetail": "..." with deeper explanation.

SAFETY & QUALITY:
- Do not hallucinate facts about specific websites or proprietary solutions. For applications and behavioral answers, be realistic and practical.
- Always use \`==\` vs \`equals()\` language correctly when describing Java equality (nodes vs values).
`;

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
User additional info: focus step=${stepNumber}

When responding, produce only JSON following the schema above.`;

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
      maxOutputTokens: 4000, // Increased token count for more detailed responses
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


# AlgoMate - Complete Learning Guide for Varsha
## Understanding Every Part of This Project with Real Code

---

# 📌 PART 1: WHAT IS ALGOMATE?

## 1.1 The Problem We're Solving

AlgoMate is a **learning platform for DSA (Data Structures & Algorithms) interview preparation**.

**The issue with existing tools:**
- LeetCode shows you problems and solutions
- But it doesn't teach you HOW to think
- You memorize solutions instead of learning patterns

**What AlgoMate does differently:**
- Breaks every problem into 7 learning steps
- Uses AI to explain each step in detail
- Works inside LeetCode via Chrome extension
- Tracks your progress

## 1.2 Project Overview

| Component | What it is | Files |
|-----------|------------|-------|
| **Frontend** | The website you see | `frontend/index.html`, `frontend/app.js`, `frontend/style.css` |
| **Backend** | Server that handles requests | `backend/server.js`, `backend/routes/*.js` |
| **Database** | Stores problems & AI responses | `backend/db.js`, `backend/db-supabase.js` |
| **Chrome Extension** | Works inside LeetCode | `chrome-extension/*.js` |
| **API (Vercel)** | Cloud version of backend | `api/*.js` |

## 1.3 The Complete User Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER JOURNEY                                  │
└─────────────────────────────────────────────────────────────────────┘

Step 1: User opens website (algomate-silk.vercel.app)
        ↓
Step 2: User uploads a list of problems (PDF or text)
        ↓
Step 3: Problems appear in a table
        ↓
Step 4: User clicks "Learn" on a problem
        ↓
Step 5: Modal opens with 7 step buttons
        ↓
Step 6: User clicks "Step 1: Question Reading"
        ↓
Step 7: AI content loads and displays
        ↓
Step 8: User goes through all 7 steps
        ↓
Step 9: User marks problem as "Done"
        ↓
Step 10: Stats update (Completed count increases)
```

---

# 📌 PART 2: WHAT HAPPENS WHEN USER DOES EACH ACTION

## 2.1 ACTION: User Opens the Website

### What user sees:
- Dashboard with stats (Total, Not Started, In Progress, Done)
- Upload section
- Problems table
- Filter options

### What happens in code:

**Step 1: Browser loads `index.html`**
```html
<!-- frontend/index.html -->
<!DOCTYPE html>
<html>
<head>
    <title>DSA Buddy</title>
    <link rel="stylesheet" href="style.css">  <!-- Loads styles -->
</head>
<body>
    <!-- Stats cards -->
    <div class="stats-grid">
        <div class="stat-card">
            <h3>Total Problems</h3>
            <span id="totalProblems">0</span>  <!-- Will be filled by JS -->
        </div>
        <!-- More stats... -->
    </div>
    
    <!-- Problems table -->
    <table id="problemsTable">
        <tbody id="problemsTableBody">
            <!-- Problems will be inserted here by JavaScript -->
        </tbody>
    </table>
    
    <script src="app.js"></script>  <!-- Loads the main JavaScript -->
</body>
</html>
```

**Step 2: `app.js` runs and creates the DSABuddy class**
```javascript
// frontend/app.js

class DSABuddy {
    constructor() {
        this.apiBase = '/api';           // Where to send requests
        this.currentProblems = [];       // Store loaded problems
        this.currentProblem = null;      // Currently selected problem
        this.currentStep = 1;            // Which step is active (1-7)
        this.init();                     // Start the app
    }

    init() {
        this.bindEvents();    // Set up button clicks
        this.loadProblems();  // Fetch problems from server
        this.loadStats();     // Fetch statistics
    }
}

// Create the app when page loads
const app = new DSABuddy();
```

**What `this.init()` does:**
1. `bindEvents()` - Attaches click handlers to buttons
2. `loadProblems()` - Calls API to get all problems
3. `loadStats()` - Calls API to get statistics

**Step 3: `loadStats()` calls the backend**
```javascript
// frontend/app.js

async loadStats() {
    try {
        // Make HTTP request to our backend
        const response = await fetch(`${this.apiBase}/stats`);
        
        // Convert response to JavaScript object
        const stats = await response.json();

        // Update the HTML with the numbers
        if (response.ok) {
            document.getElementById('totalProblems').textContent = stats.total;
            document.getElementById('notStarted').textContent = stats.status['Not Started'] || 0;
            document.getElementById('inProgress').textContent = stats.status['In Progress'] || 0;
            document.getElementById('completed').textContent = stats.status['Done'] || 0;
        }
    } catch (error) {
        console.error('Load stats error:', error);
    }
}
```

**What `fetch()` does:**
- `fetch('/api/stats')` = "Hey server, give me statistics"
- Server responds with JSON like: `{total: 50, status: {'Done': 10, ...}}`
- We put those numbers into the HTML

---

## 2.2 ACTION: User Uploads Problems

### What user does:
1. Pastes text like:
   ```
   1. Two Sum (Easy) - Array, Hash Table
   2. Add Two Numbers (Medium) - Linked List
   ```
2. Clicks "Upload Text"

### What happens in code:

**Step 1: Frontend captures the click**
```javascript
// frontend/app.js

bindEvents() {
    // When "Upload Text" button is clicked, call uploadText()
    document.getElementById('uploadTextBtn').addEventListener('click', () => this.uploadText());
}

async uploadText() {
    // Get the text from the textarea
    const textInput = document.getElementById('textInput');
    const text = textInput.value.trim();

    // Check if user entered anything
    if (!text) {
        this.showToast('Please enter some text', 'error');
        return;
    }

    try {
        this.showLoading(true);  // Show "Processing..." spinner
        
        // Send text to backend
        const response = await fetch(`${this.apiBase}/upload`, {
            method: 'POST',                           // POST = creating new data
            headers: {
                'Content-Type': 'application/json'    // Tell server we're sending JSON
            },
            body: JSON.stringify({ text })            // Convert {text: "..."} to string
        });

        const result = await response.json();

        if (response.ok) {
            this.showToast(`Successfully uploaded ${result.problems.length} problems`);
            textInput.value = '';    // Clear the textarea
            this.refreshData();      // Reload problems and stats
        } else {
            this.showToast(result.error || 'Upload failed', 'error');
        }
    } catch (error) {
        console.error('Upload error:', error);
        this.showToast('Upload failed', 'error');
    } finally {
        this.showLoading(false);  // Hide spinner
    }
}
```

**Step 2: Backend receives the request**
```javascript
// backend/routes/upload.js

const express = require('express');
const multer = require('multer');      // For handling file uploads
const pdfParse = require('pdf-parse'); // For reading PDF files
const db = require('../db');           // Database connection

const router = express.Router();

// This handles POST /api/upload
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        let problemsText = '';

        // Check what user sent
        if (req.file) {
            // User uploaded a file
            if (req.file.mimetype === 'application/pdf') {
                // It's a PDF - extract text from it
                const pdfData = await pdfParse(req.file.buffer);
                problemsText = pdfData.text;
            } else if (req.file.mimetype === 'text/plain') {
                // It's a text file - just read it
                problemsText = req.file.buffer.toString('utf-8');
            }
        } else if (req.body.text) {
            // User pasted text directly
            problemsText = req.body.text;
        } else {
            return res.status(400).json({ error: 'No file or text provided' });
        }

        // Parse the text into problem objects
        const problems = parseProblems(problemsText);
        
        if (problems.length === 0) {
            return res.status(400).json({ error: 'No problems found' });
        }

        // Save each problem to database
        const savedProblems = [];
        for (const problem of problems) {
            const result = await insertProblem(problem);
            savedProblems.push(result);
        }

        // Send success response
        res.json({
            message: `Successfully uploaded ${savedProblems.length} problems`,
            problems: savedProblems
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to process upload' });
    }
});
```

**Step 3: Parse each line of text**
```javascript
// backend/routes/upload.js

function parseProblems(text) {
    const problems = [];
    
    // Split text into lines and remove empty lines
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
    // Input: "1. Two Sum (Easy) - Array, Hash Table"
    
    const trimmedLine = line.trim();
    if (!trimmedLine) return null;

    // Extract number: "1" from "1. Two Sum..."
    const numberMatch = trimmedLine.match(/^(\d+)\.?\s*/);
    const leetcodeNumber = numberMatch ? parseInt(numberMatch[1]) : null;
    
    // Remove number from line
    let remainingLine = numberMatch 
        ? trimmedLine.replace(numberMatch[0], '') 
        : trimmedLine;
    
    // Extract difficulty: "Easy" or "Medium" or "Hard"
    const difficultyMatch = remainingLine.match(/\b(Easy|Medium|Hard)\b/i);
    const difficulty = difficultyMatch ? difficultyMatch[1] : 'Unknown';
    
    // Get name and category from remaining text
    const parts = remainingLine.split(/[-,]/);
    const name = parts[0] ? parts[0].trim() : 'Unknown Problem';
    const category = parts.slice(1).join(', ').trim() || 'General';

    // Return structured object
    return {
        name,                           // "Two Sum"
        category,                       // "Array, Hash Table"
        difficulty,                     // "Easy"
        leetcode_number: leetcodeNumber, // 1
        description: trimmedLine        // Original line
    };
}
```

**Step 4: Save to database**
```javascript
// backend/routes/upload.js

async function insertProblem(problem) {
    const sql = `
        INSERT INTO problems (name, category, difficulty, leetcode_number, description)
        VALUES (?, ?, ?, ?, ?)
    `;
    
    // db.prepare creates a prepared statement (prevents SQL injection)
    const stmt = db.prepare(sql);
    
    // Execute with actual values
    const result = await Promise.resolve(stmt.run(
        problem.name,
        problem.category,
        problem.difficulty,
        problem.leetcode_number,
        problem.description
    ));
    
    return {
        id: result.lastInsertRowid,  // Database gives us the new ID
        ...problem,
        status: 'Not Started'        // Default status
    };
}
```

### Complete flow diagram:
```
User pastes text → Click Upload → uploadText() runs
                                        ↓
                    fetch('/api/upload', {method: 'POST', body: text})
                                        ↓
                    Backend upload.js receives request
                                        ↓
                    parseProblems() splits text into lines
                                        ↓
                    parseProblemLine() extracts name, difficulty, category
                                        ↓
                    insertProblem() saves to database
                                        ↓
                    Response: {problems: [{id: 1, name: "Two Sum", ...}]}
                                        ↓
                    Frontend shows "Successfully uploaded 2 problems"
                                        ↓
                    refreshData() reloads the table
```

---

## 2.3 ACTION: User Clicks "Learn" on a Problem

### What user sees:
- Modal popup appears
- Problem name and difficulty shown
- 7 step buttons
- AI content loads

### What happens in code:

**Step 1: Click captured in frontend**
```javascript
// frontend/app.js

renderProblems() {
    // For each problem, create HTML with a Learn button
    tbody.innerHTML = this.currentProblems.map(problem => `
        <tr>
            <td>${problem.name}</td>
            <td>
                <button class="btn learn-btn" data-problem-id="${problem.id}">
                    Learn
                </button>
            </td>
        </tr>
    `).join('');

    // Attach click handlers to all Learn buttons
    document.querySelectorAll('.learn-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const problemId = e.target.dataset.problemId;  // Get ID from data attribute
            this.openProblemModal(problemId);
        });
    });
}
```

**Step 2: Open modal and load AI content**
```javascript
// frontend/app.js

async openProblemModal(problemId) {
    try {
        this.showLoading(true);
        
        // Find the problem in our stored list
        const problem = this.currentProblems.find(p => p.id == problemId);
        if (!problem) {
            this.showToast('Problem not found', 'error');
            return;
        }

        this.currentProblem = problem;
        
        // Update modal header with problem info
        document.getElementById('modalProblemName').textContent = problem.name;
        document.getElementById('modalDifficulty').textContent = problem.difficulty;
        document.getElementById('modalCategory').textContent = problem.category;

        // Show the modal (change CSS display)
        document.getElementById('problemModal').style.display = 'flex';
        
        // Load AI content for ALL 7 steps at once
        await this.loadAllSteps(problemId);
        
        // Show step 1 by default
        this.showStep(1);

    } catch (error) {
        console.error('Open modal error:', error);
        this.showToast('Failed to load problem details', 'error');
    } finally {
        this.showLoading(false);
    }
}

async loadAllSteps(problemId) {
    try {
        // Call API to get all 7 steps
        const response = await fetch(`${this.apiBase}/ai/all/${problemId}`, {
            method: 'POST'
        });

        const steps = await response.json();

        if (response.ok) {
            this.currentSteps = steps;  // Store for switching between steps
        }
    } catch (error) {
        console.error('Load steps error:', error);
        this.currentSteps = {};
    }
}
```

**Step 3: Backend processes AI request**
```javascript
// backend/routes/ai.js

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Handle POST /api/ai/all/:problemId
router.post('/ai/all/:problemId', async (req, res) => {
    const problemId = parseInt(req.params.problemId);

    try {
        // Get problem details from database
        const problem = await getProblemById(problemId);
        if (!problem) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        // Generate all 7 steps
        const allSteps = {};
        
        for (let step = 1; step <= 7; step++) {
            // First check: Do we have this cached?
            let cachedResponse = await getCachedAIResponse(problemId, step);
            
            if (cachedResponse) {
                // YES! Use cached version (fast!)
                allSteps[`step${step}`] = JSON.parse(cachedResponse);
            } else {
                // NO - Call Gemini AI (slower)
                const aiResponse = await generateAIResponse(
                    problem.name, 
                    problem.description, 
                    step
                );
                
                // Save to cache for next time
                await cacheAIResponse(problemId, step, JSON.stringify(aiResponse));
                
                allSteps[`step${step}`] = aiResponse;
            }
        }

        res.json(allSteps);

    } catch (error) {
        console.error('Error generating all steps:', error);
        res.status(500).json({ error: 'Failed to generate AI responses' });
    }
});
```

**Step 4: Call Gemini AI**
```javascript
// backend/routes/ai.js

async function generateAIResponse(problemName, problemDescription, stepNumber) {
    // The prompt tells AI exactly what format we want
    const SYSTEM_PROMPT = `
    You are a DSA mentor. Respond ONLY with valid JSON.
    
    REQUIRED JSON FORMAT:
    {
      "step1": { "title":"", "summary":"", "requirements": [...] },
      "step2": { "title":"", "examples":[...] },
      "step3": { "title":"", "brute_force":"", "optimal":"" },
      "step4": { "title":"", "solutions": {"java":{}, "python":{}, "cpp":{}} },
      "step5": { "title":"", "behavioral":[...] },
      "step6": { "title":"", "variations":[...] },
      "step7": { "title":"", "applications":[...] }
    }
    `;

    const userPrompt = `Problem: ${problemName}
    Description: ${problemDescription}
    Focus on step ${stepNumber}`;

    // Call Gemini API
    const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
            contents: [{
                role: "user",
                parts: [
                    { text: SYSTEM_PROMPT },
                    { text: userPrompt }
                ]
            }],
            generationConfig: {
                temperature: 0.7,        // Creativity level
                maxOutputTokens: 4000,   // Maximum response length
            }
        }
    );

    // Extract the text from Gemini's response
    const aiContent = response.data.candidates[0].content.parts[0].text;
    
    // Convert JSON string to JavaScript object
    return JSON.parse(aiContent);
}
```

**Step 5: Cache functions**
```javascript
// backend/routes/ai.js

// Check if we have a cached response
async function getCachedAIResponse(problemId, step) {
    const stmt = db.prepare('SELECT response FROM ai_cache WHERE problem_id = ? AND step = ?');
    const row = await Promise.resolve(stmt.get(problemId, step));
    return row ? row.response : null;
}

// Save response to cache
async function cacheAIResponse(problemId, step, response) {
    const sql = 'INSERT OR REPLACE INTO ai_cache (problem_id, step, response) VALUES (?, ?, ?)';
    const stmt = db.prepare(sql);
    await Promise.resolve(stmt.run(problemId, step, response));
}
```

### Complete flow diagram:
```
User clicks "Learn" → openProblemModal(5) runs
                            ↓
        Show modal, call loadAllSteps(5)
                            ↓
        fetch('/api/ai/all/5', {method: 'POST'})
                            ↓
        Backend ai.js receives request
                            ↓
    ┌───────────────────────────────────────┐
    │  For each step (1 to 7):              │
    │                                       │
    │  1. Check cache: getCachedAIResponse()│
    │     ↓                                 │
    │  2. If cached → Use it (0.01 seconds) │
    │     If not → Call Gemini (2 seconds)  │
    │     ↓                                 │
    │  3. If called Gemini → Save to cache  │
    └───────────────────────────────────────┘
                            ↓
        Response: {step1: {...}, step2: {...}, ...}
                            ↓
        Frontend stores in this.currentSteps
                            ↓
        showStep(1) displays step 1 content
```

---

## 2.4 ACTION: User Changes Status (Not Started → Done)

### What user does:
- Clicks dropdown on a problem
- Selects "Done"

### What happens in code:

**Step 1: Frontend detects change**
```javascript
// frontend/app.js

renderProblems() {
    // Create HTML with status dropdown
    tbody.innerHTML = this.currentProblems.map(problem => `
        <tr>
            <td>${problem.name}</td>
            <td>
                <select class="status-select" data-problem-id="${problem.id}">
                    <option value="Not Started" ${problem.status === 'Not Started' ? 'selected' : ''}>
                        Not Started
                    </option>
                    <option value="In Progress" ${problem.status === 'In Progress' ? 'selected' : ''}>
                        In Progress
                    </option>
                    <option value="Done" ${problem.status === 'Done' ? 'selected' : ''}>
                        Done
                    </option>
                </select>
            </td>
        </tr>
    `).join('');

    // When dropdown changes, call updateStatus
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', (e) => {
            this.updateStatus(
                e.target.dataset.problemId,  // Which problem
                e.target.value               // New status value
            );
        });
    });
}

async updateStatus(problemId, status) {
    try {
        const response = await fetch(`${this.apiBase}/status?id=${problemId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });

        if (response.ok) {
            this.showToast('Status updated successfully');
            this.loadStats();  // Refresh the stats cards
        }
    } catch (error) {
        console.error('Update status error:', error);
    }
}
```

**Step 2: Backend updates database**
```javascript
// backend/routes/status.js

router.post('/status/:id', async (req, res) => {
    const problemId = parseInt(req.params.id);
    const { status } = req.body;

    // Validate
    if (!problemId) {
        return res.status(400).json({ error: 'Invalid problem ID' });
    }

    const validStatuses = ['Not Started', 'In Progress', 'Done'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        // Update in database
        const sql = 'UPDATE problems SET status = ? WHERE id = ?';
        const stmt = db.prepare(sql);
        const result = await Promise.resolve(stmt.run(status, problemId));
        
        if (result.changes === 0) {
            res.status(404).json({ error: 'Problem not found' });
        } else {
            res.json({ message: 'Status updated', problemId, status });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to update status' });
    }
});
```

---

# 📌 PART 3: THE DATABASE EXPLAINED

## 3.1 Two Databases - Why?

| Situation | Database Used | Why |
|-----------|--------------|-----|
| Running on your laptop | SQLite | Simple file, no setup needed |
| Running on Vercel (internet) | Supabase PostgreSQL | Cloud database, always available |

## 3.2 The Smart Switcher

```javascript
// backend/db.js

// Check: Are we in production (Vercel) or development (laptop)?
const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;

if (isProduction) {
    // Use PostgreSQL (Supabase) for production
    module.exports = require('./db-supabase');
} else {
    // Use SQLite for development
    const Database = require('better-sqlite3');
    const db = new Database('./dsa_buddy.db');
    
    // Create tables if they don't exist
    db.exec(`
        CREATE TABLE IF NOT EXISTS problems (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT,
            difficulty TEXT,
            status TEXT DEFAULT 'Not Started',
            description TEXT
        )
    `);
    
    module.exports = db;
}
```

**How does the code know which environment?**
- On Vercel: `process.env.DATABASE_URL` is set (Supabase connection string)
- On laptop: `DATABASE_URL` is not set, so we use SQLite

## 3.3 Supabase Connection (Production)

```javascript
// backend/db-supabase.js

const { Pool } = require('pg');  // PostgreSQL client library

// Create connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }  // Required for Supabase
});

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection failed:', err.message);
    } else {
        console.log('Connected to Supabase database');
    }
});
```

**What is a Connection Pool?**
- Opening database connections is slow (~500ms)
- Pool keeps connections ready to use
- Request comes → grab ready connection → use → return to pool
- Much faster for multiple requests!

---

# 📌 PART 4: THE 7-STEP METHODOLOGY

## Why 7 Steps?

| Step | Name | Purpose |
|------|------|---------|
| 1 | Question Reading | Understand WHAT is being asked |
| 2 | Example Understanding | Trace through examples manually |
| 3 | Approach Development | Think about HOW to solve it |
| 4 | Solution Implementation | See the actual code |
| 5 | Behavioral Questions | Prepare for "why" questions |
| 6 | Problem Modifications | Know variations that might be asked |
| 7 | Real-Life Applications | Where is this used in real world? |

## Sample AI Response Structure

When we ask Gemini about "Two Sum", it returns:

```json
{
    "step1": {
        "title": "Question Reading",
        "summary": "Given an array of numbers and a target, find two numbers that add up to target",
        "requirements": [
            "Input: Array of integers, target integer",
            "Output: Indices of two numbers",
            "Must return exactly two indices"
        ],
        "constraints": [
            "Only one valid answer exists",
            "Cannot use same element twice"
        ],
        "edge_cases": [
            "Negative numbers",
            "Array with two elements"
        ]
    },
    "step2": {
        "title": "Example Understanding",
        "examples": [
            {
                "input": "[2, 7, 11, 15], target = 9",
                "output": "[0, 1]",
                "explanation": "nums[0] + nums[1] = 2 + 7 = 9"
            }
        ]
    },
    "step3": {
        "title": "Approach Development",
        "brute_force": "Check every pair - O(n²) time complexity",
        "optimal": "Use HashMap for O(1) lookup - O(n) time complexity",
        "interactive_prompts": [
            "What data structure gives O(1) lookup?",
            "What should we store in the HashMap?"
        ]
    },
    "step4": {
        "title": "Solution",
        "solutions": {
            "python": {
                "code": "def twoSum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i",
                "explanation": "Store each number's index in a dictionary. For each number, check if its complement exists.",
                "time": "O(n)",
                "space": "O(n)"
            },
            "java": { ... },
            "cpp": { ... }
        }
    },
    "step5": {
        "behavioral": [
            {
                "question": "Why HashMap instead of sorting?",
                "answer": "Sorting would give O(n log n). HashMap gives O(n)."
            }
        ]
    },
    "step6": {
        "variations": [
            {
                "variant": "Two Sum II - Sorted Array",
                "hint": "Use two pointers since array is sorted"
            }
        ]
    },
    "step7": {
        "applications": [
            {
                "system": "Financial transactions",
                "explanation": "Finding matching payments that sum to a specific amount"
            }
        ]
    }
}
```

---

# 📌 PART 5: CHROME EXTENSION

## How It Works

```
User visits leetcode.com/problems/two-sum
            ↓
Chrome sees the URL matches "leetcode.com/problems/*"
            ↓
Chrome injects content.js into the page
            ↓
content.js creates a floating widget
            ↓
User clicks "Get Hints"
            ↓
Extension extracts problem name from page
            ↓
Calls our backend API
            ↓
Shows AI response in the widget
```

## Key Files

**manifest.json** - Tells Chrome what the extension does
```json
{
    "manifest_version": 3,
    "name": "DSA Buddy",
    "permissions": ["activeTab", "storage"],
    "content_scripts": [{
        "matches": ["*://leetcode.com/problems/*"],
        "js": ["content.js"],
        "run_at": "document_end"
    }]
}
```

**content.js** - Runs on LeetCode pages
```javascript
class DSABuddyExtension {
    constructor() {
        this.apiBase = 'http://localhost:3000/api';
        this.init();
    }

    init() {
        if (this.isLeetCodeProblemPage()) {
            this.createWidget();
            this.detectProblem();
        }
    }

    isLeetCodeProblemPage() {
        return window.location.pathname.includes('/problems/');
    }

    createWidget() {
        const widget = document.createElement('div');
        widget.id = 'dsa-buddy-widget';
        widget.innerHTML = `
            <h3>DSA Buddy</h3>
            <button onclick="dsaBuddyExt.getHints()">Get Hints</button>
            <div id="hints-content"></div>
        `;
        document.body.appendChild(widget);
    }
}
```

---

# 📌 PART 6: DEPLOYMENT (Local → Internet)

## Local Development

```
Your Laptop
    │
    ├── frontend/index.html  ──→ localhost:3000
    ├── backend/server.js    ──→ localhost:3000/api/*
    └── backend/dsa_buddy.db ──→ SQLite file
```

**To run locally:**
```bash
cd backend
npm install
node server.js
# Open http://localhost:3000
```

## Production (Vercel + Supabase)

```
Internet Users
    │
    ↓
Vercel CDN (serves frontend files)
    │
    ↓
Vercel Serverless Functions (api/*.js)
    │
    ↓
Supabase PostgreSQL Database
```

**Key difference:**
- Vercel functions are "serverless" - they start fresh each time
- Can't use SQLite (file-based) because files don't persist
- Must use cloud database (Supabase)

---

# 📌 PART 7: TOPICS YOU NEED TO LEARN

## Must Understand (for this project)

### 1. JavaScript Basics
**What to learn:**
- Variables: `let`, `const`
- Functions: `function name() {}` and `() => {}`
- Arrays: `[1, 2, 3]`, `.map()`, `.filter()`, `.find()`
- Objects: `{name: "value"}`
- Async/await: `async function() { await fetch(...) }`

**How much?** Enough to read and understand the code above.

### 2. HTML Basics
**What to learn:**
- Tags: `<div>`, `<button>`, `<input>`, `<table>`
- IDs and classes: `id="myButton"`, `class="btn"`
- How JavaScript finds elements: `document.getElementById()`

**How much?** Enough to understand `index.html` structure.

### 3. How Web Requests Work
**What to learn:**
- What is `fetch()`? - Makes HTTP requests from browser
- What is GET vs POST? - GET reads, POST creates/updates
- What is JSON? - Data format `{key: value}`

**Example:**
```javascript
// GET request - fetching data
const response = await fetch('/api/problems');
const data = await response.json();

// POST request - sending data
const response = await fetch('/api/upload', {
    method: 'POST',
    body: JSON.stringify({text: "..."})
});
```

### 4. Basic SQL
**What to learn:**
- SELECT: Get data from database
- INSERT: Add new data
- UPDATE: Change existing data
- WHERE: Filter results

**Examples used in project:**
```sql
SELECT * FROM problems WHERE status = 'Done'
INSERT INTO problems (name, difficulty) VALUES ('Two Sum', 'Easy')
UPDATE problems SET status = 'Done' WHERE id = 5
```

### 5. Environment Variables
**What to learn:**
- Why we use them: Keep secrets out of code
- How to access: `process.env.VARIABLE_NAME`
- `.env` file: Stores variables locally

---

## Nice to Understand (helps but not required)

### 1. Express.js Routing
```javascript
router.get('/problems', (req, res) => {});   // Handle GET /api/problems
router.post('/upload', (req, res) => {});    // Handle POST /api/upload
```

### 2. How Caching Works
- First request: Call AI, save response
- Second request: Return saved response (skip AI)

### 3. Chrome Extension Basics
- `manifest.json` defines permissions
- `content.js` runs on web pages
- `background.js` runs in background

---

# 📌 PART 8: QUICK REFERENCE

## API Endpoints

| Method | URL | What it does |
|--------|-----|--------------|
| GET | `/api/problems` | Get all problems |
| POST | `/api/upload` | Upload new problems |
| GET | `/api/stats` | Get statistics |
| POST | `/api/status/:id` | Update problem status |
| POST | `/api/ai/:step` | Get AI content for one step |
| POST | `/api/ai/all/:id` | Get AI content for all 7 steps |

## Key Functions

| Function | File | What it does |
|----------|------|--------------|
| `loadProblems()` | app.js | Fetch problems from API |
| `uploadText()` | app.js | Send text to backend |
| `openProblemModal()` | app.js | Open problem detail modal |
| `showStep()` | app.js | Display specific step content |
| `parseProblems()` | upload.js | Parse text into problem objects |
| `generateAIResponse()` | ai.js | Call Gemini AI |
| `getCachedAIResponse()` | ai.js | Check if cached |

## Environment Variables

| Variable | Purpose | Where to get |
|----------|---------|--------------|
| `GEMINI_API_KEY` | Access Gemini AI | Google AI Studio |
| `DATABASE_URL` | Supabase connection | Supabase dashboard |
| `NODE_ENV` | production/development | Set on Vercel |

---

# 📌 PART 9: INTERVIEW PREPARATION

## How to Explain This Project

### 30 Seconds
> "AlgoMate is an AI-powered DSA learning app. It breaks every problem into 7 steps - understanding, examples, approach, code, behavioral questions, variations, and applications. It uses Google Gemini for AI and caches responses for speed."

### 2 Minutes
> "I built AlgoMate because existing tools show solutions but don't teach thinking. 
>
> When a user uploads problems, the backend parses the text and saves to database. When they click 'Learn', we call Gemini AI to generate 7-step explanations.
>
> Key optimization: We cache AI responses. First request takes 2-3 seconds, future requests are instant.
>
> Tech stack: JavaScript frontend and backend, Express.js server, SQLite for local development, Supabase PostgreSQL for production, deployed on Vercel."

### Technical Deep Dive
> "When user clicks Learn:
> 1. Frontend calls `fetch('/api/ai/all/5')`
> 2. Backend checks cache table first
> 3. If not cached, calls Gemini API with structured prompt
> 4. Saves response to cache
> 5. Returns JSON to frontend
> 6. Frontend renders with formatters for each step type"

---

*Guide for Varsha Kantipudi - AlgoMate Project*
*Last updated: December 2024*

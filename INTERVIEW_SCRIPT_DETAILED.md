# AlgoMate - SUPER DETAILED Interview Script
## Complete Project Walkthrough (~2 Hours)

---

# 🎬 OPENING (3 minutes)

## Your Introduction

"Good [morning/afternoon]! My name is Varsha Kantipudi. I'm here to present AlgoMate - a full-stack AI-powered learning platform I built for DSA interview preparation.

Before I dive in, let me give you a quick overview:
- **What**: A web app + Chrome extension that teaches you HOW to solve coding problems, not just shows solutions
- **Why**: I struggled with interview prep - existing tools show answers but don't teach thinking
- **Tech**: JavaScript full-stack, Google Gemini AI, PostgreSQL, deployed on Vercel
- **Time**: This took about 4-5 weeks to build and deploy

Let me walk you through everything in detail."

---

# 📖 PART 1: THE PROBLEM I SOLVED (10 minutes)

## 1.1 My Personal Pain Points

"Let me start with WHY I built this. During my interview prep, I faced 4 major problems:

### Problem 1: Solutions Without Understanding

When I used LeetCode, I'd see a problem, struggle for 30 minutes, then give up and look at the solution. I'd read the code, think 'Oh that makes sense!' and move on.

Next week? Same type of problem. Same struggle. The solution didn't stick because I never learned HOW to think about it.

**Real example**: I saw 'Two Sum' solved with a HashMap. I understood the code. But when I saw 'Two Sum II' (sorted array), I still tried to use HashMap instead of two pointers. Because I memorized, not learned.

### Problem 2: Context Switching Kills Focus

My study session looked like this:
- Open LeetCode problem
- Get stuck, open YouTube
- Watch a video, go back to LeetCode
- Forget something, open Notes app
- Check discussion forum
- 20 tabs open, completely lost focus

Each switch took 5-10 minutes to regain concentration. I was losing hours to context switching.

### Problem 3: No Structured Approach

LeetCode gives you:
✅ Problems
✅ Solutions
❌ How to READ a problem
❌ How to THINK about approaches
❌ Why certain data structures work
❌ Interview behavioral questions
❌ What variations might be asked

It's like giving someone a recipe but not teaching them to cook.

### Problem 4: Interview != Just Coding

In real interviews, you need to:
- Explain your thought process
- Discuss tradeoffs
- Answer 'Why not use X instead?'
- Handle variations on the spot

No platform taught this holistically."

## 1.2 The Solution I Envisioned

"I wanted to build something that teaches like a human tutor would:

1. First, let's understand what the problem is asking
2. Let's look at examples and trace through them
3. Now, let's think about approaches - what could work?
4. Here's the actual code with explanations
5. How would you explain your decisions in an interview?
6. What if the interviewer changes the problem slightly?
7. Where is this actually used in real software?

This became my 7-step methodology. It mirrors how expert programmers actually think."

---

# 📖 PART 2: PROJECT PLANNING (10 minutes)

## 2.1 Feature Requirements

"I wrote down exactly what I needed:

### Must-Have Features (MVP):
1. Upload problems from a list (PDF or text)
2. Store problems in a database
3. Track status: Not Started → In Progress → Done
4. AI-generated content for each of the 7 steps
5. Cache AI responses (so repeat requests are instant)
6. Filter and search problems
7. Clean, usable interface

### Nice-to-Have Features:
1. Chrome extension for LeetCode
2. Code in multiple languages (Java, Python, C++)
3. Complexity analysis
4. Export progress

### Future Features (Not built yet):
1. User authentication
2. Spaced repetition
3. Code execution
4. Social features"

## 2.2 User Flow Design

"I mapped out the complete user journey:

```
USER JOURNEY:

1. User opens AlgoMate website
   └── Sees dashboard with stats
   
2. User uploads problems (PDF or paste text)
   └── System parses and saves to database
   └── Problems appear in table
   
3. User clicks on a problem
   └── Modal opens with 7 step buttons
   
4. User clicks 'Step 1: Question Reading'
   └── System checks cache
   └── If cached: return instantly
   └── If not: call Gemini AI
   └── Display formatted content
   
5. User navigates through steps 1-7
   └── Each step loads on demand
   └── All responses get cached
   
6. User updates status (Not Started → In Progress → Done)
   └── Database updates
   └── Stats refresh

7. User filters problems
   └── By category, difficulty, status
   └── Search by name
```

For Chrome Extension:
```
1. User is on leetcode.com/problems/two-sum
2. Extension detects LeetCode page
3. Widget appears on the right side
4. User clicks 'Get Hints'
5. Extension sends problem name to backend
6. Backend returns AI content
7. Widget shows hints without leaving LeetCode
```"

## 2.3 Database Design

"I designed two tables:

### Table 1: `problems`
```sql
CREATE TABLE problems (
    id SERIAL PRIMARY KEY,        -- Unique identifier
    name TEXT NOT NULL,           -- 'Two Sum'
    category TEXT,                -- 'Array, Hash Table'
    difficulty TEXT,              -- 'Easy', 'Medium', 'Hard'
    leetcode_number INTEGER,      -- 1
    status TEXT DEFAULT 'Not Started',
    description TEXT,             -- Full problem description
    created_at TIMESTAMP
);
```

**Why each field?**
- `id`: Every record needs a unique identifier
- `name`: The problem title - required for display and AI queries
- `category`: For filtering - 'Array', 'Tree', 'Dynamic Programming'
- `difficulty`: For filtering and priority sorting
- `leetcode_number`: Nice to have for reference
- `status`: Progress tracking - core feature
- `description`: Sent to AI for context
- `created_at`: Audit trail, useful for 'recently added'

### Table 2: `ai_cache`
```sql
CREATE TABLE ai_cache (
    id SERIAL PRIMARY KEY,
    problem_id INTEGER REFERENCES problems(id),
    step INTEGER,                 -- 1 through 7
    response TEXT,                -- Full JSON from AI
    created_at TIMESTAMP,
    UNIQUE(problem_id, step)      -- Only one response per problem per step
);
```

**Why a cache table?**
- AI calls cost money (Gemini charges per token)
- AI calls take 2-3 seconds
- Same problem + same step = same answer
- Cache hit = instant response + $0 cost
- `UNIQUE(problem_id, step)` prevents duplicates

**Real numbers:**
- Without cache: 50 problems × 7 steps = 350 API calls = ~$5-10 + slow
- With cache: 50 problems × 7 steps = 350 API calls ONCE, then free forever"

---

# 📖 PART 3: TECHNICAL IMPLEMENTATION (30 minutes)

## 3.1 Backend Setup

"Let me walk through the backend code:

### Server Entry Point (`backend/server.js`)

```javascript
require('dotenv').config();  // Load environment variables
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());                           // Allow cross-origin requests
app.use(express.json());                   // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));  // Parse form data

// Serve frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api', require('./routes/upload'));
app.use('/api', require('./routes/problems'));
app.use('/api', require('./routes/problem'));
app.use('/api', require('./routes/status'));
app.use('/api', require('./routes/ai'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'DSA Buddy backend is running' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`DSA Buddy server running on port ${PORT}`);
});
```

**Line-by-line explanation:**

1. `require('dotenv').config()` - Loads `.env` file variables into `process.env`
   - Why? Security - we don't hardcode API keys in code

2. `const express = require('express')` - Import Express framework
   - Why Express? Most popular Node.js framework, simple, lots of documentation

3. `app.use(cors())` - Enable CORS (Cross-Origin Resource Sharing)
   - Why? Without this, browser blocks requests from different domains
   - Chrome extension (chrome-extension://) calling localhost:3000 needs this

4. `app.use(express.json())` - Parse JSON request bodies
   - Why? When frontend sends `{problemId: 1}`, we need to read it as object

5. `app.use(express.static(...))` - Serve frontend files
   - Why? So accessing localhost:3000 shows our HTML/CSS/JS
   - Alternative: separate frontend server (more complex)

6. Route registration - Each route file handles a specific resource
   - Separation of concerns - easier to maintain"

## 3.2 Database Module - The Smart Switcher

"One of my clever implementations is the database module:

### `backend/db.js` - Environment Detection
```javascript
const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;

if (isProduction) {
  module.exports = require('./db-supabase');  // PostgreSQL
} else {
  // SQLite setup...
  const Database = require('better-sqlite3');
  const db = new Database('./dsa_buddy.db');
  // ... initialization
  module.exports = db;
}
```

**What's happening:**
1. Check if we're in production (Vercel) or development (laptop)
2. Production has `DATABASE_URL` environment variable set
3. If production: use PostgreSQL via Supabase
4. If development: use SQLite (simple file-based database)

**Why this design?**
- Development: No need to set up PostgreSQL server
- SQLite works immediately, no configuration
- Production: Vercel needs cloud database (can't use files)
- Single codebase works in both environments

### `backend/db-supabase.js` - PostgreSQL Connection
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Test connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to Supabase:', err.message);
  } else {
    console.log('Connected to Supabase database');
  }
});

// Database helper methods
const db = {
  prepare: (sql) => {
    return {
      run: async (...params) => { /* execute INSERT/UPDATE/DELETE */ },
      get: async (...params) => { /* SELECT single row */ },
      all: async (...params) => { /* SELECT multiple rows */ }
    };
  }
};
```

**Key concepts:**

**Connection Pooling:**
- Creating database connections is slow (network handshake, authentication)
- Connection pool keeps connections ready to use
- Request comes in → grab available connection → use it → return it
- Like having taxis waiting instead of calling Uber each time

**SSL:**
- `ssl: { rejectUnauthorized: false }` - Accept Supabase's SSL certificate
- Required for secure cloud database connections

**Why Port 6543?**
- Supabase offers two connection modes:
- Port 5432 (Direct): Needs IPv4 address (Vercel free tier doesn't have)
- Port 6543 (Transaction Pooler): Works without IPv4
- We use 6543 for Vercel compatibility"

## 3.3 AI Integration - The Heart of AlgoMate

"This is the most important part - AI integration:

### `backend/routes/ai.js`

```javascript
// Gemini API Configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
```

**Why Gemini 2.0 Flash?**
- Speed: Responds in 1-2 seconds (other models take 5-10 seconds)
- Cost: Cheaper than GPT-4 or Claude
- JSON Output: Good at following structured output instructions
- Context Window: 1 million tokens (can handle long prompts)
- Reliability: Google's infrastructure, rarely goes down

### The System Prompt (Most Critical Part!)

```javascript
const SYSTEM_PROMPT = `
You are a DSA mentor assistant that teaches deeply and interactively. 
When given a problem, you MUST RESPOND ONLY with valid JSON.

REQUIRED TOP-LEVEL JSON SCHEMA:
{
  "step1": { "title":"", "summary":"", "requirements": [...], "constraints":[...], "edge_cases":[...] },
  "step2": { "title":"", "examples":[ {"input":"", "output":"", "explanation":""} ] },
  "step3": { "title":"", "brute_force":"", "optimal":"", "interactive_prompts":[...] },
  "step4": { "title":"", "solutions": {
      "java": { "code":"", "explanation":"", "time":"", "space":"" },
      "python": { "code":"", "explanation":"", "time":"", "space":"" },
      "cpp": { "code":"", "explanation":"", "time":"", "space":"" }
  }},
  "step5": { "title":"", "behavioral":[ {"question":"", "answer":""} ] },
  "step6": { "title":"", "variations":[ {"variant":"", "hint":""} ] },
  "step7": { "title":"", "applications":[ {"system":"", "explanation":""} ] }
}

DETAILED INSTRUCTIONS PER STEP:
...
`;
```

**What is Prompt Engineering?**

Think of it like giving instructions to a very smart but very literal assistant:
- Bad: 'Explain Two Sum'
- Good: 'Explain Two Sum following this exact JSON format with these specific fields...'

**Why such detailed prompts?**
1. **Consistency**: Same format every time = frontend knows what to expect
2. **Completeness**: AI won't skip sections if we specify everything
3. **Parseability**: JSON format means we can programmatically display content

**Key prompt techniques I used:**
- Schema definition: Exact JSON structure expected
- Per-step instructions: What each step should contain
- Length guidelines: '150-350 words' prevents too short/long
- Error handling: 'If you cannot generate, return {error: reason}'
- Safety: 'Do not hallucinate facts'

### API Route Logic

```javascript
router.post('/ai/:step', async (req, res) => {
  const stepNumber = parseInt(req.params.step);
  const { problemId, problemName, problemDescription } = req.body;

  // Validation
  if (!stepNumber || stepNumber < 1 || stepNumber > 7) {
    return res.status(400).json({ error: 'Invalid step number' });
  }

  try {
    // STEP 1: Check cache first
    const cachedResponse = await getCachedAIResponse(problemId, stepNumber);
    if (cachedResponse) {
      return res.json(JSON.parse(cachedResponse));  // Instant return!
    }

    // STEP 2: Get problem details if not provided
    let problem;
    if (!problemName || !problemDescription) {
      problem = await getProblemById(problemId);
      if (!problem) {
        return res.status(404).json({ error: 'Problem not found' });
      }
    }

    // STEP 3: Call Gemini API
    const aiResponse = await generateAIResponse(name, description, stepNumber);
    
    // STEP 4: Cache for future requests
    await cacheAIResponse(problemId, stepNumber, JSON.stringify(aiResponse));

    // STEP 5: Return to frontend
    res.json(aiResponse);

  } catch (error) {
    console.error('AI API error:', error);
    res.status(500).json({ error: 'Failed to generate AI response' });
  }
});
```

**The flow explained:**
1. User requests Step 3 for Problem ID 5
2. Check: 'Do we have cached response for Problem 5, Step 3?'
3. If yes: Return immediately (fast!)
4. If no: Call Gemini, wait for response
5. Save response to cache (for next time)
6. Return response to user

### Gemini API Call

```javascript
async function generateAIResponse(problemName, problemDescription, stepNumber) {
  const userPrompt = `Problem: ${problemName}
Description: ${problemDescription}
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
      temperature: 0.7,      // Creativity level (0=deterministic, 1=creative)
      maxOutputTokens: 4000, // Maximum response length
      topP: 0.95,            // Nucleus sampling
      topK: 40               // Top-K sampling
    }
  });

  // Extract and parse response
  const aiContent = response.data.candidates[0].content.parts[0].text;
  return JSON.parse(aiContent);
}
```

**Parameter explanations:**
- `temperature: 0.7`: Balance between creative and consistent
  - 0.0 = Always same answer
  - 1.0 = Very creative/random
  - 0.7 = Good for educational content

- `maxOutputTokens: 4000`: Limit response length
  - Prevents runaway responses
  - 4000 tokens ≈ ~3000 words

- `topP` and `topK`: Control response diversity
  - Technical parameters for sampling algorithm
  - Default values work well for most cases"

## 3.4 Frontend Implementation

"Let me explain the frontend architecture:

### `frontend/app.js` - Main Application Class

```javascript
class DSABuddy {
    constructor() {
        this.apiBase = '/api';        // API endpoint base
        this.currentProblems = [];    // All loaded problems
        this.currentProblem = null;   // Currently selected problem
        this.currentStep = 1;         // Active step (1-7)
        this.init();                  // Start the app
    }

    init() {
        this.bindEvents();  // Attach event listeners
        this.loadProblems(); // Fetch problems from API
        this.loadStats();    // Fetch statistics
    }
}
```

**Why a class-based approach?**
- Organized: All related code in one place
- State management: `this.currentProblem` tracks current state
- Easy to extend: Add methods without restructuring

### Event Binding

```javascript
bindEvents() {
    // Upload buttons
    document.getElementById('uploadFileBtn').addEventListener('click', () => this.uploadFile());
    document.getElementById('uploadTextBtn').addEventListener('click', () => this.uploadText());

    // Filters
    document.getElementById('searchInput').addEventListener('input', () => this.filterProblems());
    document.getElementById('categoryFilter').addEventListener('change', () => this.filterProblems());
    
    // Step navigation
    document.querySelectorAll('.step-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const step = parseInt(e.target.dataset.step);
            this.showStep(step);
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.closeModal();
    });
}
```

**What's happening:**
- When user clicks upload → call `uploadFile()` method
- When user types in search → call `filterProblems()` 
- When user clicks step button → call `showStep(step)`
- When user presses Escape → close modal

### Loading and Displaying Problems

```javascript
async loadProblems() {
    try {
        const params = new URLSearchParams();
        const search = document.getElementById('searchInput').value;
        const category = document.getElementById('categoryFilter').value;
        // ... more filters

        if (search) params.append('search', search);
        if (category !== 'all') params.append('category', category);

        const response = await fetch(`${this.apiBase}/problems?${params}`);
        const result = await response.json();

        if (response.ok) {
            this.currentProblems = result.problems;
            this.renderProblems();
        }
    } catch (error) {
        console.error('Load problems error:', error);
        this.showToast('Failed to load problems', 'error');
    }
}
```

**Why URLSearchParams?**
- Clean way to build query strings
- Handles encoding automatically
- `/api/problems?search=two%20sum&category=Array`

### Rendering Problems Table

```javascript
renderProblems() {
    const tbody = document.getElementById('problemsTableBody');
    
    tbody.innerHTML = this.currentProblems.map(problem => `
        <tr>
            <td>${problem.leetcode_number || '-'}</td>
            <td>${problem.name}</td>
            <td>
                ${problem.category.split(',').map(cat => 
                    `<span class="category-badge">${cat.trim()}</span>`
                ).join('')}
            </td>
            <td>
                <span class="difficulty-badge difficulty-${problem.difficulty.toLowerCase()}">
                    ${problem.difficulty}
                </span>
            </td>
            <td>
                <select class="status-select" data-problem-id="${problem.id}">
                    <option value="Not Started" ${problem.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
                    <option value="In Progress" ${problem.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option value="Done" ${problem.status === 'Done' ? 'selected' : ''}>Done</option>
                </select>
            </td>
            <td>
                <button class="btn btn-primary learn-btn" data-problem-id="${problem.id}">
                    Learn
                </button>
            </td>
        </tr>
    `).join('');
}
```

**Template literals explained:**
- `` `text ${variable}` `` - String interpolation
- `.map().join('')` - Convert array to HTML string
- Conditional classes for styling (difficulty-easy, difficulty-medium, difficulty-hard)"

## 3.5 Chrome Extension

"The Chrome extension brings AlgoMate to where users practice:

### `manifest.json` - Extension Configuration

```json
{
  "manifest_version": 3,
  "name": "DSA Buddy",
  "version": "1.0.0",
  "description": "A Chrome extension to help you learn DSA problems on LeetCode",
  "permissions": [
    "activeTab",
    "storage"
  ],
  "host_permissions": [
    "*://leetcode.com/*",
    "*://localhost:3000/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["*://leetcode.com/problems/*"],
      "js": ["content.js"],
      "css": ["content.css"],
      "run_at": "document_end"
    }
  ],
  "action": {
    "default_popup": "popup.html"
  }
}
```

**Key concepts:**

**manifest_version: 3**
- Latest Chrome extension standard
- Required since 2023
- Service workers instead of background pages
- More secure, better performance

**permissions:**
- `activeTab`: Access current tab's URL/content
- `storage`: Save settings (like backend URL)

**host_permissions:**
- Where extension can make network requests
- `*://leetcode.com/*` - Any LeetCode page
- `*://localhost:3000/*` - Our local backend

**content_scripts:**
- Code injected into web pages
- `matches`: Only runs on LeetCode problem pages
- `run_at: document_end`: Wait for page to load

### `content.js` - Page Integration

```javascript
class DSABuddyExtension {
    constructor() {
        this.apiBase = 'http://localhost:3000/api';
        this.widget = null;
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        if (!this.isLeetCodeProblemPage()) return;
        
        this.createWidget();
        this.detectProblem();
    }

    isLeetCodeProblemPage() {
        return window.location.hostname === 'leetcode.com' && 
               window.location.pathname.includes('/problems/');
    }

    createWidget() {
        this.widget = document.createElement('div');
        this.widget.id = 'dsa-buddy-widget';
        this.widget.innerHTML = `
            <div class="dsa-buddy-header">
                <h3>DSA Buddy</h3>
            </div>
            <div class="dsa-buddy-content">
                <!-- Step navigation and content -->
            </div>
        `;
        document.body.appendChild(this.widget);
    }
}
```

**How it works:**
1. Page loads → Content script runs
2. Check: Is this a LeetCode problem page?
3. If yes: Create floating widget on the right side
4. Detect problem name from page URL/title
5. User clicks 'Get Hints' → Fetch from backend → Display"

---

# 📖 PART 4: DEPLOYMENT (15 minutes)

## 4.1 Why Vercel?

"I chose Vercel for deployment because:

1. **Free tier**: Perfect for student projects
2. **Automatic deployments**: Push to GitHub → Auto deploys
3. **Serverless functions**: No server management
4. **Fast global CDN**: Users worldwide get fast responses
5. **Easy environment variables**: Simple secrets management

## 4.2 The Deployment Challenge

"Here's the challenge I faced:

**Local development:**
- Express server runs continuously
- SQLite database is a file on disk
- Everything works perfectly

**Vercel deployment:**
- Serverless functions (not continuous server)
- No persistent file system
- SQLite DOESN'T WORK!

**Why doesn't SQLite work on Vercel?**

Serverless functions are like temporary workers:
```
Request comes in → Function starts → Processes → Returns → Function DIES

Next request → NEW function starts → Has no memory of previous → Starts fresh
```

SQLite stores data in a file. But:
- Function A writes to database
- Function A dies
- Function B starts - where's the file? GONE!

## 4.3 The Solution: Supabase

"I solved this with Supabase - a managed PostgreSQL database:

### Why Supabase?
- PostgreSQL (professional database)
- Managed (they handle maintenance)
- Free tier (50,000 rows, enough for this project)
- Connection pooling built-in

### Connection Pooler Problem

But wait, there's another problem!

**Normal database connections:**
1. Function starts
2. Open connection to database
3. Run queries
4. Close connection
5. Function ends

**The issue:**
- Each connection takes ~500ms to establish
- Vercel might run 50 concurrent functions
- 50 functions × 500ms = massive overhead
- Database has connection limits (usually 100)

**Solution: Transaction Pooler**

Supabase offers a connection pooler:
```
Normal:     Function → Database (slow, limited connections)
Pooler:     Function → Pooler → Database (fast, shared connections)
```

The pooler maintains open connections and shares them:
- Connection already open = instant access
- 50 functions share maybe 10 actual connections
- Way more efficient!

**Port numbers:**
- Port 5432: Direct connection (needs IPv4)
- Port 6543: Transaction pooler (works without IPv4)

Vercel free tier doesn't have IPv4, so I use port 6543."

## 4.4 Vercel Configuration

### `vercel.json`
```json
{
  "version": 2,
  "buildCommand": "echo 'Build complete'",
  "outputDirectory": "frontend",
  "functions": {
    "api/**/*.js": {
      "runtime": "@vercel/node@3"
    }
  },
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Line by line:**

- `outputDirectory: "frontend"`: Serve files from frontend folder
- `functions`: Any .js file in /api folder becomes a serverless function
- `rewrites`: 
  - `/api/*` requests go to serverless functions
  - Everything else loads `index.html` (single-page app pattern)

### Serverless Function Structure

Instead of Express routes, each endpoint is a separate file:

```
/api
├── ai.js        → handles /api/ai?step=1
├── problems.js  → handles /api/problems
├── problem.js   → handles /api/problem?id=1
├── status.js    → handles /api/status
├── upload.js    → handles /api/upload
└── stats.js     → handles /api/stats
```

Each file exports a function:
```javascript
module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Handle the request
  if (req.method === 'GET') {
    // ... handle GET
  } else if (req.method === 'POST') {
    // ... handle POST
  }
};
```

## 4.5 Environment Variables

"On Vercel, I set these environment variables:

| Variable | Purpose |
|----------|---------|
| `GEMINI_API_KEY` | Authenticate with Google AI |
| `DATABASE_URL` | Supabase connection string |
| `NODE_ENV` | Set to 'production' |

**Security:**
- Never commit API keys to GitHub
- Environment variables are encrypted on Vercel
- Only your deployment can access them"

---

# 📖 PART 5: WHAT I LEARNED (10 minutes)

## 5.1 Technical Lessons

"1. **Start with MVP, iterate later**
   - First version used basic UI
   - Enhanced after core worked
   - Don't perfect what might change

2. **Environment abstraction is crucial**
   - `db.js` switching between SQLite/PostgreSQL
   - Same code works locally and in production
   - Testing locally is much easier

3. **Caching changes everything**
   - Without cache: Every click = API call = slow + expensive
   - With cache: First click slow, every future click instant
   - Cache invalidation is a hard problem (I didn't implement it)

4. **Prompt engineering is an art**
   - First prompt attempts gave inconsistent responses
   - Took 10+ iterations to get reliable JSON output
   - Specific beats vague

5. **Error handling matters**
   - API can fail, database can fail, JSON parsing can fail
   - Every async operation needs try/catch
   - User-friendly error messages"

## 5.2 Project Management Lessons

"1. **Break down big tasks**
   - 'Build AI learning platform' is overwhelming
   - 'Implement caching for AI responses' is doable

2. **Test each component separately**
   - Backend API tested with Postman
   - Frontend tested locally
   - Integration tested together

3. **Git commits often**
   - Each feature is a commit
   - Can roll back if something breaks
   - History shows progress"

---

# 📖 PART 6: FUTURE IMPROVEMENTS (5 minutes)

"If I continue this project:

### Short-term:
1. **User authentication** - Personal progress tracking
2. **Spaced repetition** - Resurface problems you're forgetting
3. **Code execution** - Run code directly in the app

### Medium-term:
4. **Mobile app** - Learn on the go
5. **Analytics** - Which topics need more practice?
6. **Community** - Share and discuss solutions

### Long-term:
7. **Mock interviews** - Timed practice with AI interviewer
8. **Company-specific prep** - 'Amazon problems', 'Google problems'
9. **Video explanations** - Auto-generated walkthroughs

### Scalability improvements:
10. **Redis cache** - Faster than database
11. **Rate limiting** - Prevent abuse
12. **Message queue** - Async AI processing"

---

# 📖 PART 7: Q&A PREPARATION (Reference)

## Technical Questions

**Q: Why JavaScript for everything?**
> "Consistency - same language frontend and backend. Also, JavaScript's non-blocking I/O is perfect for API calls where we're waiting for external services like Gemini."

**Q: Why not use React/Vue for frontend?**
> "For this project's scope, vanilla JavaScript was faster to develop. React's component model would be beneficial for a larger project or if we needed state management complexity."

**Q: How do you handle concurrent requests?**
> "Node.js event loop handles concurrent requests naturally. PostgreSQL connection pooling handles concurrent database queries. Each request is independent."

**Q: What if Gemini API is down?**
> "First, we try to serve from cache. If not cached and API fails, we return a user-friendly error. We could add retry logic with exponential backoff for robustness."

**Q: How would you test this?**
> "Unit tests for parsing functions, integration tests for API endpoints using supertest, and end-to-end tests for critical user flows using Puppeteer or Cypress."

## Behavioral Questions

**Q: What was the hardest bug you fixed?**
> "The SQLite to PostgreSQL migration. SQLite's synchronous API is completely different from PostgreSQL's asynchronous API. I had to create an abstraction layer that works with both."

**Q: How do you handle disagreements about technical decisions?**
> "I document pros and cons of each approach, try prototyping when possible, and focus on data - 'Let's test both and see which performs better' rather than opinion-based arguments."

**Q: What would you do differently?**
> "I'd add comprehensive tests earlier. Manual testing worked but doesn't scale. Also, I'd implement proper logging from the start for debugging production issues."

---

# 🎬 CLOSING (2 minutes)

"To summarize:

**AlgoMate solves** the gap between knowing solutions exist and understanding how to think about problems.

**Technically**, it's a full-stack JavaScript application with:
- Express.js backend with smart database switching
- Google Gemini integration with careful prompt engineering
- Response caching for performance
- Chrome extension for LeetCode integration
- Serverless deployment on Vercel with Supabase

**I learned** full-stack development, API design, prompt engineering, database management, and deployment strategies.

**The future** includes authentication, spaced repetition, and scaling to help more developers prepare for interviews.

Thank you for listening. I'm happy to answer any questions or dive deeper into any technical aspect."

---

*Script prepared for Varsha Kantipudi*
*Duration: ~90-120 minutes with questions*
*Last updated: December 2024*

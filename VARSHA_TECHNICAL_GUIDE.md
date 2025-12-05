# AlgoMate - Complete Technical Guide for Varsha
## Everything You Need to Know About This Project

---

## 📌 Quick Overview

**Project Name:** AlgoMate (also called DSA Buddy)  
**Purpose:** AI-powered DSA learning platform with 7-step structured methodology  
**Collaborators:** asneem1234 & VarshaKantipudi  
**Deployment:** https://algomate-silk.vercel.app  
**Repository:** https://github.com/asneem1234/Algomate.git

---

## 🏗️ Project Architecture

```
AlgoMate/
├── frontend/           # Web UI (HTML, CSS, JavaScript)
├── backend/            # Express.js server (local development)
├── api/                # Vercel Serverless Functions (production)
├── chrome-extension/   # LeetCode integration extension
├── vercel.json         # Deployment configuration
└── package.json        # Root dependencies
```

### How Everything Connects

```
┌─────────────────────────────────────────────────────────────┐
│                      USER INTERFACES                         │
├─────────────────────────┬───────────────────────────────────┤
│   Web App (frontend/)   │   Chrome Extension                │
│   - index.html          │   - popup.html                    │
│   - app.js              │   - content.js                    │
│   - style.css           │   - background.js                 │
└───────────┬─────────────┴───────────────┬───────────────────┘
            │                             │
            │      HTTP Requests          │
            ▼                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER                               │
├─────────────────────────────────────────────────────────────┤
│   Local (backend/server.js)    │   Production (api/*.js)    │
│   - Express.js routes          │   - Vercel serverless      │
│   - Port 3000                  │   - Edge functions         │
└───────────┬─────────────────────────────┬───────────────────┘
            │                             │
            ▼                             ▼
┌─────────────────────┐       ┌───────────────────────────────┐
│   SQLite (local)    │       │   Supabase PostgreSQL (prod)  │
│   - better-sqlite3  │       │   - Connection pooling        │
│   - dsa_buddy.db    │       │   - Port 6543 (Transaction)   │
└─────────────────────┘       └───────────────────────────────┘
            │                             │
            └──────────────┬──────────────┘
                           ▼
            ┌─────────────────────────────┐
            │   Gemini 2.0 Flash API      │
            │   - AI content generation   │
            │   - 7-step methodology      │
            └─────────────────────────────┘
```

---

## 🔧 Tech Stack Explained

### Backend Technologies

| Technology | Purpose | Why We Chose It |
|------------|---------|-----------------|
| **Node.js** | Runtime environment | Non-blocking I/O, great for API calls |
| **Express.js 5.1.0** | Web framework | Simple, flexible, widely used |
| **better-sqlite3** | Local database | Synchronous, fast, no setup needed |
| **pg (node-postgres)** | PostgreSQL client | Production database connection |
| **axios** | HTTP client | Clean syntax for API calls to Gemini |
| **cors** | Middleware | Enable cross-origin requests |
| **dotenv** | Environment vars | Secure secret management |
| **multer** | File uploads | Handle PDF/text file uploads |
| **pdf-parse** | PDF processing | Extract text from uploaded PDFs |

### Frontend Technologies

| Technology | Purpose |
|------------|---------|
| **HTML5** | Page structure |
| **CSS3** | Styling with Flexbox/Grid |
| **Vanilla JavaScript** | No framework overhead, class-based |
| **Fetch API** | API communication |

### AI Integration

| Service | Purpose |
|---------|---------|
| **Google Gemini 2.0 Flash** | AI content generation |
| **API Endpoint** | `generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash` |

### Deployment

| Service | Purpose |
|---------|---------|
| **Vercel** | Hosting + Serverless functions |
| **Supabase** | Managed PostgreSQL database |
| **GitHub** | Version control + CI/CD integration |

---

## 💾 Database Design

### Table: `problems`

```sql
CREATE TABLE problems (
    id SERIAL PRIMARY KEY,           -- Auto-increment ID
    name TEXT NOT NULL,              -- Problem title (e.g., "Two Sum")
    category TEXT,                   -- DSA category (Array, Tree, etc.)
    difficulty TEXT,                 -- Easy, Medium, Hard
    leetcode_number INTEGER,         -- LeetCode problem number
    status TEXT DEFAULT 'Not Started', -- Learning progress
    description TEXT,                -- Problem description
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table: `ai_cache`

```sql
CREATE TABLE ai_cache (
    id SERIAL PRIMARY KEY,
    problem_id INTEGER REFERENCES problems(id),  -- Foreign key
    step INTEGER,                                -- Step 1-7
    response TEXT,                               -- JSON response from AI
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(problem_id, step)                     -- Prevent duplicate cache
);
```

### Why Caching?
- Gemini API calls cost money and take time
- Same problem + same step = same answer
- Cache saves ~2-3 seconds per request
- Reduces API costs by ~90%

---

## 🎯 The 7-Step Learning Methodology

This is the CORE feature of AlgoMate. When you click on a problem, the AI generates content for 7 learning steps:

### Step 1: Question Reading
**What it does:** Breaks down the problem into understandable parts
```json
{
  "title": "Question Reading",
  "summary": "Plain English explanation",
  "requirements": ["What inputs are given", "What output is expected"],
  "constraints": ["Time limits", "Space limits"],
  "edge_cases": ["Empty array", "Single element", "All same values"]
}
```

### Step 2: Example Understanding
**What it does:** Walks through examples step-by-step
```json
{
  "title": "Example Understanding",
  "examples": [
    {
      "input": "[2, 7, 11, 15], target = 9",
      "output": "[0, 1]",
      "explanation": "nums[0] + nums[1] = 2 + 7 = 9"
    }
  ]
}
```

### Step 3: Approach Development
**What it does:** Teaches how to think about solutions
```json
{
  "title": "Approach Development",
  "brute_force": "Check all pairs - O(n²) time",
  "optimal": "Use HashMap - O(n) time",
  "interactive_prompts": [
    "What data structure allows O(1) lookup?",
    "How can we avoid checking the same pair twice?"
  ]
}
```

### Step 4: Solution Implementation
**What it does:** Provides code in 3 languages
```json
{
  "title": "Solution",
  "solutions": {
    "java": { "code": "...", "explanation": "...", "time": "O(n)", "space": "O(n)" },
    "python": { "code": "...", "explanation": "...", "time": "O(n)", "space": "O(n)" },
    "cpp": { "code": "...", "explanation": "...", "time": "O(n)", "space": "O(n)" }
  }
}
```

### Step 5: Behavioral Questions
**What it does:** Interview prep questions
```json
{
  "title": "Behavioral Questions",
  "behavioral": [
    {
      "question": "Why did you choose HashMap over TreeMap?",
      "answer": "HashMap provides O(1) average lookup, TreeMap is O(log n)..."
    }
  ]
}
```

### Step 6: Problem Variations
**What it does:** Shows related problems to practice
```json
{
  "title": "Variations",
  "variations": [
    {
      "variant": "Three Sum",
      "hint": "Use Two Sum as a subroutine after fixing one element"
    }
  ]
}
```

### Step 7: Real-Life Applications
**What it does:** Connects DSA to real systems
```json
{
  "title": "Applications",
  "applications": [
    {
      "system": "Database Indexing",
      "explanation": "Hash tables are used for fast lookups in databases"
    }
  ]
}
```

---

## 📁 Key Files Explained

### Backend Files

#### `backend/server.js`
The main Express server file
```javascript
// What it does:
// 1. Sets up middleware (CORS, JSON parsing)
// 2. Serves static frontend files
// 3. Registers API routes
// 4. Starts server on port 3000
```

#### `backend/db.js`
Smart database switcher
```javascript
// IMPORTANT: This file detects environment and loads correct DB
const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;

if (isProduction) {
  module.exports = require('./db-supabase');  // PostgreSQL
} else {
  // SQLite setup for local development
}
```

#### `backend/db-supabase.js`
PostgreSQL connection with pooling
```javascript
// Uses pg library with connection pooling
// Connection string format:
// postgresql://postgres.[project-ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

// Port 6543 = Transaction Pooler (works with serverless)
// Port 5432 = Direct connection (needs IPv4)
```

#### `backend/routes/ai.js`
AI integration route (local development)
```javascript
// What it does:
// 1. Receives step number + problem info
// 2. Checks cache for existing response
// 3. If not cached, calls Gemini API
// 4. Parses JSON response
// 5. Caches result
// 6. Returns to frontend
```

### API Files (Vercel Serverless)

#### `api/ai.js`
Production AI endpoint
```javascript
// Same logic as backend/routes/ai.js but formatted as serverless function
module.exports = async (req, res) => {
  // CORS headers (required for cross-origin)
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Process request...
};
```

#### Other API files:
- `api/problems.js` - GET all problems, POST new problem
- `api/problem.js` - GET single problem by ID
- `api/status.js` - PUT update problem status
- `api/upload.js` - POST file/text upload
- `api/stats.js` - GET statistics

### Frontend Files

#### `frontend/app.js` (925 lines!)
Main application class
```javascript
class DSABuddy {
    constructor() {
        this.apiBase = '/api';        // API base URL
        this.currentProblems = [];    // All loaded problems
        this.currentProblem = null;   // Currently selected
        this.currentStep = 1;         // Current step (1-7)
    }
    
    // Key methods:
    // - loadProblems() - Fetch all problems from API
    // - showProblem(id) - Open problem modal
    // - showStep(step) - Load step content from AI
    // - formatQuestionReadingStep() - Render Step 1
    // - formatSolutionStep() - Render Step 4 with code tabs
    // ... and more
}
```

### Chrome Extension Files

#### `chrome-extension/manifest.json`
Extension configuration
```json
{
  "manifest_version": 3,           // Latest Chrome extension version
  "name": "DSA Buddy",
  "permissions": ["activeTab", "storage"],
  "host_permissions": [
    "*://leetcode.com/*"           // Works on LeetCode pages
  ],
  "content_scripts": [{
    "matches": ["*://leetcode.com/problems/*"],
    "js": ["content.js"]           // Injected into LeetCode
  }],
  "background": {
    "service_worker": "background.js"  // Background process
  }
}
```

#### `chrome-extension/content.js`
Runs on LeetCode pages
```javascript
// What it does:
// 1. Detects LeetCode problem page
// 2. Extracts problem name/number from URL
// 3. Injects helper button into page
// 4. Communicates with background.js
```

### Configuration Files

#### `vercel.json`
```json
{
  "version": 2,
  "outputDirectory": "frontend",      // Serve frontend folder
  "functions": {
    "api/**/*.js": {
      "runtime": "@vercel/node@3"     // Node.js runtime
    }
  },
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 🔑 Environment Variables

### Required Variables:

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `GEMINI_API_KEY` | Google Gemini API key | [Google AI Studio](https://makersuite.google.com/app/apikey) |
| `DATABASE_URL` | Supabase connection string | Supabase Dashboard > Settings > Database |
| `NODE_ENV` | Environment flag | Set to `production` on Vercel |

### Supabase Connection String Format:
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```
**Important:** Use port `6543` (Transaction Pooler), not `5432` (Direct)

---

## 🚀 How to Run Locally

### Step 1: Clone Repository
```bash
git clone https://github.com/asneem1234/Algomate.git
cd Algomate
```

### Step 2: Install Dependencies
```bash
cd backend
npm install
```

### Step 3: Create `.env` file in `backend/`
```env
GEMINI_API_KEY=your_gemini_api_key_here
# Don't add DATABASE_URL locally - it will use SQLite
```

### Step 4: Start Server
```bash
npm start
# or
node server.js
```

### Step 5: Open Browser
```
http://localhost:3000
```

---

## 🌐 How to Deploy to Vercel

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Deploy update"
git push origin main
```

### Step 2: Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Add environment variables:
   - `GEMINI_API_KEY`
   - `DATABASE_URL` (Supabase pooler connection)
   - `NODE_ENV=production`

### Step 3: Deploy
Vercel auto-deploys on every push to main branch!

---

## 🔄 API Endpoints Reference

| Method | Endpoint | Purpose | Request Body |
|--------|----------|---------|--------------|
| GET | `/api/problems` | Get all problems | - |
| POST | `/api/problems` | Add new problem | `{ name, category, difficulty }` |
| GET | `/api/problem?id=1` | Get single problem | - |
| PUT | `/api/status?id=1` | Update status | `{ status: "Done" }` |
| POST | `/api/ai?step=1` | Get AI content | `{ problemId, problemName }` |
| POST | `/api/upload` | Upload problems | FormData or `{ text: "..." }` |
| GET | `/api/stats` | Get statistics | - |

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot find module 'better-sqlite3'"
**Solution:** Run `npm install better-sqlite3` in backend folder

### Issue 2: "GEMINI_API_KEY not defined"
**Solution:** Create `.env` file with your API key

### Issue 3: "Database connection failed" on Vercel
**Solution:** Make sure you're using Transaction Pooler URL (port 6543)

### Issue 4: AI returns invalid JSON
**Solution:** The code handles this with:
```javascript
// Strip markdown if present
if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7);
}
```

### Issue 5: Chrome extension not working
**Solution:** 
1. Go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `chrome-extension` folder

---

## 📊 What Makes This Project Impressive

### Technical Highlights:
1. **Full-stack development** - Frontend, Backend, Chrome Extension
2. **AI integration** - Google Gemini with prompt engineering
3. **Database dual-mode** - SQLite (dev) + PostgreSQL (prod)
4. **Serverless architecture** - Vercel functions
5. **Connection pooling** - Handles Vercel's stateless nature
6. **Smart caching** - Reduces API costs and latency
7. **Chrome Extension** - Manifest V3 compliance

### Problem-Solving Examples:
- **SQLite issue:** Vercel is stateless → Migrated to Supabase
- **IPv4 limitation:** Used Transaction Pooler instead of direct connection
- **AI response parsing:** Added JSON stripping logic
- **Cost optimization:** Implemented caching layer

---

## 💬 How to Explain This in Interview

### "Tell me about AlgoMate"
> "AlgoMate is an AI-powered DSA learning platform I built to solve a problem I faced while preparing for technical interviews. Instead of just showing solutions, it teaches through a structured 7-step methodology. It includes a web application, Chrome extension for LeetCode integration, and uses Google Gemini for intelligent content generation."

### "What was the most challenging part?"
> "The deployment to Vercel was challenging because SQLite doesn't work in serverless environments. I had to migrate to Supabase PostgreSQL and implement connection pooling. Also, Vercel's free tier doesn't include IPv4 addresses, so I had to use Supabase's Transaction Pooler on port 6543 instead of direct connections."

### "How does the AI integration work?"
> "I use Google Gemini 2.0 Flash API with carefully engineered prompts. The system prompt defines a strict JSON schema for 7 learning steps. When a user selects a step, we first check the cache. If not cached, we call Gemini with the problem details, parse the JSON response, cache it, and return it to the frontend. This approach reduces API costs significantly."

### "What would you improve?"
> "I'd add user authentication for personalized progress tracking, implement spaced repetition for long-term retention, add code execution capability, and build a mobile app. For scalability, I'd add Redis caching, implement rate limiting, and use message queues for async AI processing."

---

## 🎓 Key Concepts to Understand

### 1. REST API Design
- GET for reading, POST for creating, PUT for updating
- Status codes: 200 (OK), 400 (Bad Request), 404 (Not Found), 500 (Server Error)

### 2. Environment-Based Configuration
```javascript
const isProduction = process.env.NODE_ENV === 'production';
```

### 3. Connection Pooling
```javascript
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// Maintains multiple connections for concurrent requests
```

### 4. Serverless Functions
- Each request = new function instance
- No persistent state between requests
- Must connect to external database

### 5. Prompt Engineering
- Specific JSON schema in system prompt
- Clear instructions for consistent output
- Error handling guidance

---

## 📚 Resources for Learning More

- [Express.js Documentation](https://expressjs.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Chrome Extension Development](https://developer.chrome.com/docs/extensions/)
- [Google Gemini API](https://ai.google.dev/docs)

---

*Guide prepared for Varsha Kantipudi - AlgoMate Project*
*Last updated: December 2024*

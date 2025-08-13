## Todo List

### Phase 1: Project Setup and Initial File Structure
- [x] Create `backend/` directory
- [x] Create `frontend/` directory
- [x] Create `chrome-extension/` directory
- [x] Create `backend/server.js`
- [x] Create `backend/db.js`
- [x] Create `backend/routes/` directory
- [x] Create `backend/.env.example`
- [x] Create `frontend/index.html`
- [x] Create `frontend/style.css`
- [x] Create `frontend/app.js`
- [x] Create `chrome-extension/manifest.json`
- [x] Create `chrome-extension/content.js`
- [x] Create `chrome-extension/background.js`
- [x] Create `README.md`

### Phase 2: Backend Development
- [x] Implement `backend/db.js` for SQLite setup
- [x] Implement `backend/server.js` for Express app setup
- [x] Implement `backend/routes/upload.js` for POST /upload endpoint (parsing text/PDF, saving to DB)
- [x] Implement `backend/routes/problems.js` for GET /problems endpoint
- [x] Implement `backend/routes/problem.js` for GET /problem/:id endpoint (AI-generated content)
- [x] Implement `backend/routes/status.js` for POST /status/:id endpoint
- [x] Implement `backend/routes/ai.js` for POST /ai/:step endpoint (DeepSeek API integration, prompt engineering, caching)
- [x] Add `pdf-parse` dependency and integration

### Phase 3: Frontend Development
- [x] Implement `frontend/index.html` for table UI
- [x] Implement `frontend/style.css` for clean, responsive styling
- [x] Implement `frontend/app.js` for fetching API data, rendering UI, handling status updates, and "Learn" button functionality

### Phase 4: Chrome Extension Development
- [x] Implement `chrome-extension/manifest.json` (Manifest v3)
- [x] Implement `chrome-extension/content.js` for injecting widget, detecting problem title, calling backend /ai/3 and /ai/4, displaying hints
- [x] Implement `chrome-extension/background.js` for background tasks and communication
- [x] (Optional) Implement `chrome-extension/popup.html`

### Phase 5: Testing and Integration
- [x] Test backend API endpoints
- [x] Test frontend functionality
- [x] Test Chrome extension functionality and communication with backend
- [x] Ensure PDF parsing works correctly
- [x] Verify AI caching mechanism

### Phase 6: Documentation
- [x] Create `README.md` with instructions for running locally

### Phase 7: Deliver Project
- [ ] Deliver all generated code and documentation to the user.


# Running AlgoMate

This document provides detailed instructions on how to set up and run each component of the AlgoMate project.

## Prerequisites

Before starting, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- [Google Chrome](https://www.google.com/chrome/) browser (for extension testing)

## 1. Backend Setup

The backend is built with Express.js and uses SQLite for data storage. It integrates with the DeepSeek API for AI capabilities.

### Step 1: Configure Environment Variables

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create or edit the `.env` file:
   ```
   DEEPSEEK_API_KEY=your_deepseek_api_key_here
   PORT=3000
   ```
   
   Replace `your_deepseek_api_key_here` with your actual DeepSeek API key.

### Step 2: Install Dependencies

In the backend directory, run:
```
npm install
```

This will install all required dependencies defined in `package.json`, including:
- express
- sqlite3
- cors
- dotenv
- axios
- multer
- pdf-parse

### Step 3: Start the Backend Server

Run the following command in the backend directory:
```
npm start
```

This will start the Express server on port 3000 (or the port specified in your `.env` file).

The server should display a message indicating it's running successfully, such as:
```
Server running on port 3000
Database connection successful
```

### Backend API Endpoints

The backend provides the following API endpoints:

- `POST /api/upload`: For uploading problem documents (text or PDF)
- `GET /api/problems`: Get a list of all problems
- `GET /api/problem/:id`: Get details for a specific problem
- `POST /api/status/:id`: Update the status of a problem
- `POST /api/ai/:step`: Interact with the AI for hints and solutions

## 2. Frontend Setup

The frontend is a simple web application built with HTML, CSS, and JavaScript.

### Step 1: Access the Frontend

Since the backend serves the frontend static files, once the backend is running, you can access the frontend by opening a browser and navigating to:

```
http://localhost:3000
```

No additional setup is required for the frontend as long as the backend is running.

### Alternative: Run Frontend Standalone

If you want to run the frontend separately (for development purposes):

1. You can use any simple HTTP server. For example, with Node.js you can install `http-server`:
   ```
   npm install -g http-server
   ```

2. Navigate to the frontend directory:
   ```
   cd frontend
   ```

3. Start the HTTP server:
   ```
   http-server
   ```

4. Open your browser and navigate to the URL provided by the HTTP server (typically http://127.0.0.1:8080).

Note: Running the frontend standalone will require the backend to be running at the expected URL (http://localhost:3000 by default).

## 3. Chrome Extension Setup

The Chrome extension integrates with LeetCode to provide AI-powered hints and guidance.

### Step 1: Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" using the toggle in the top-right corner
3. Click "Load unpacked" button
4. Browse to and select the `chrome-extension` directory from your project folder
5. The extension should now appear in your extensions list as "DSA Buddy"

### Step 2: Use the Extension

1. Navigate to a LeetCode problem page (e.g., https://leetcode.com/problems/any-problem-name/)
2. The extension will automatically detect the problem and provide a widget with hints
3. Click on the extension icon in the Chrome toolbar to access additional features through the popup interface

### Extension Configuration

If you need to modify the backend URL that the extension communicates with:

1. Open `chrome-extension/content.js`
2. Find the `BASE_URL` variable (typically near the top of the file)
3. Change it to match your backend server address if different from the default

## 4. Testing the Complete System

To test the complete AlgoMate system:

1. Start the backend server (as described in Section 1)
2. Access the frontend (as described in Section 2)
3. Load and activate the Chrome extension (as described in Section 3)
4. Navigate to LeetCode and open a problem
5. The extension should detect the problem and communicate with your backend
6. Use the frontend interface to track progress and manage problems

## Troubleshooting

### Backend Issues

- **Database errors**: Ensure the SQLite database file (`dsa_buddy.db`) exists and has the correct permissions
- **API key errors**: Verify your DeepSeek API key is correctly set in the `.env` file
- **Port conflicts**: If port 3000 is already in use, specify a different port in the `.env` file

### Extension Issues

- **Extension not detecting problems**: Ensure you're on a valid LeetCode problem page
- **Communication errors**: Verify the backend server is running and accessible
- **CORS issues**: Check that the `host_permissions` in `manifest.json` include your backend URL

### Frontend Issues

- **Cannot access frontend**: Ensure the backend server is running and serving static files correctly
- **API errors**: Open browser developer tools and check the console for error messages

# AlgoMate

This is a duo project developed by [asneem1234](https://github.com/asneem1234) and [VarshaKantipuli](https://github.com/VarshaKantipuli).

## Description
AlgoMate is a comprehensive learning platform for mastering algorithms and data structures. It combines a powerful backend API, user-friendly frontend interface, and a helpful Chrome extension that works directly within LeetCode to enhance your coding practice.

## Features

### Backend API
- **Express.js server** with robust API endpoints
- **SQLite database** for efficient data storage
- **PDF parsing** functionality for uploading and analyzing problem documents
- **AI integration** with DeepSeek API for generating personalized hints and solutions
- **Smart caching** mechanism to improve response times

### Frontend Application
- **Clean, responsive UI** for browsing and managing algorithm problems
- **Problem status tracking** to monitor your progress
- **Learning path** with step-by-step guides for each algorithm
- **Interactive elements** for a seamless user experience

### Chrome Extension
- **LeetCode integration** with problem detection
- **Context-aware hints** provided directly in the LeetCode interface
- **Real-time assistance** as you work through problems
- **Manifest V3 compliant** for modern browser compatibility

## Technology Stack
- **Backend**: Node.js, Express, SQLite, pdf-parse
- **Frontend**: HTML5, CSS3, JavaScript
- **Chrome Extension**: JavaScript, Chrome API
- **AI Integration**: DeepSeek API

## Installation and Setup

For detailed installation and running instructions, see [RUNNING.md](RUNNING.md).

### Quick Start

### Prerequisites
- Node.js and npm installed
- Chrome browser for extension testing

### Backend Setup
1. Navigate to the backend directory:
   ```
   cd backend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   PORT=3000
   DEEPSEEK_API_KEY=your_deepseek_api_key_here
   ```
4. Start the server:
   ```
   npm start
   ```

### Frontend Setup
1. With the backend running, simply navigate to `http://localhost:3000` in your browser

### Chrome Extension Setup
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top right)
3. Click "Load unpacked" and select the `chrome-extension` directory
4. The extension will now be active when you visit LeetCode problem pages

## Usage

### Using the Web Interface
1. Visit the frontend page
2. Browse available algorithm problems
3. Track your progress using the status indicators
4. Click "Learn" to access step-by-step guides for each algorithm

### Using the Chrome Extension
1. Navigate to a LeetCode problem page
2. The extension will automatically detect the problem
3. Click on the extension icon to get hints and guidance
4. Use the contextual help to assist with solving the problem

## Project Structure
```
AlgoMate/
├── backend/              # Server-side code
│   ├── db.js             # Database configuration
│   ├── server.js         # Express server setup
│   └── routes/           # API endpoints
│       ├── ai.js         # AI integration endpoints
│       ├── problem.js    # Individual problem endpoints
│       ├── problems.js   # Problem collection endpoints
│       ├── status.js     # Progress tracking endpoints
│       └── upload.js     # File upload handling
├── frontend/             # Client-side web interface
│   ├── index.html        # Main HTML structure
│   ├── style.css         # CSS styling
│   └── app.js            # Frontend JavaScript
└── chrome-extension/     # LeetCode extension
    ├── manifest.json     # Extension configuration
    ├── background.js     # Background service worker
    ├── content.js        # Content script for LeetCode pages
    ├── content.css       # Extension styling
    └── popup.html        # Extension popup interface
```

## Authors
- [asneem1234](https://github.com/asneem1234)
- [VarshaKantipuli](https://github.com/VarshaKantipuli)

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License - see the LICENSE file for details.

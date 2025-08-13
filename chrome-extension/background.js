// DSA Buddy Chrome Extension Background Script

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
    console.log('DSA Buddy extension installed:', details.reason);
    
    if (details.reason === 'install') {
        // Show welcome notification or open options page
        chrome.tabs.create({
            url: 'https://github.com/your-repo/dsa-buddy'
        });
    }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request);
    
    switch (request.action) {
        case 'getProblemData':
            handleGetProblemData(request, sendResponse);
            return true; // Keep message channel open for async response
            
        case 'updateProblemStatus':
            handleUpdateProblemStatus(request, sendResponse);
            return true;
            
        case 'getSettings':
            handleGetSettings(sendResponse);
            return true;
            
        case 'saveSettings':
            handleSaveSettings(request, sendResponse);
            return true;
            
        default:
            sendResponse({ error: 'Unknown action' });
    }
});

// Handle getting problem data from backend
async function handleGetProblemData(request, sendResponse) {
    try {
        const { problemTitle } = request;
        
        // Get backend URL from storage or use default
        const settings = await getStorageData(['backendUrl']);
        const backendUrl = settings.backendUrl || 'http://localhost:3000';
        
        // Try to find matching problem in backend
        const response = await fetch(`${backendUrl}/api/problems?search=${encodeURIComponent(problemTitle)}`);
        
        if (response.ok) {
            const data = await response.json();
            const matchingProblem = data.problems.find(p => 
                p.name.toLowerCase().includes(problemTitle.toLowerCase()) ||
                problemTitle.toLowerCase().includes(p.name.toLowerCase())
            );
            
            sendResponse({ 
                success: true, 
                problem: matchingProblem,
                backendUrl 
            });
        } else {
            sendResponse({ 
                success: false, 
                error: 'Backend not accessible',
                backendUrl 
            });
        }
    } catch (error) {
        console.error('Error getting problem data:', error);
        sendResponse({ 
            success: false, 
            error: error.message 
        });
    }
}

// Handle updating problem status
async function handleUpdateProblemStatus(request, sendResponse) {
    try {
        const { problemId, status } = request;
        
        const settings = await getStorageData(['backendUrl']);
        const backendUrl = settings.backendUrl || 'http://localhost:3000';
        
        const response = await fetch(`${backendUrl}/api/status/${problemId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        
        if (response.ok) {
            const data = await response.json();
            sendResponse({ success: true, data });
        } else {
            const error = await response.json();
            sendResponse({ success: false, error: error.error });
        }
    } catch (error) {
        console.error('Error updating problem status:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Handle getting settings
async function handleGetSettings(sendResponse) {
    try {
        const settings = await getStorageData(['backendUrl', 'autoLoad', 'showHints']);
        sendResponse({ 
            success: true, 
            settings: {
                backendUrl: settings.backendUrl || 'http://localhost:3000',
                autoLoad: settings.autoLoad !== false, // Default to true
                showHints: settings.showHints !== false // Default to true
            }
        });
    } catch (error) {
        console.error('Error getting settings:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Handle saving settings
async function handleSaveSettings(request, sendResponse) {
    try {
        const { settings } = request;
        await setStorageData(settings);
        sendResponse({ success: true });
    } catch (error) {
        console.error('Error saving settings:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Utility functions for Chrome storage
function getStorageData(keys) {
    return new Promise((resolve) => {
        chrome.storage.sync.get(keys, resolve);
    });
}

function setStorageData(data) {
    return new Promise((resolve) => {
        chrome.storage.sync.set(data, resolve);
    });
}

// Handle tab updates to inject content script if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('leetcode.com/problems/')) {
        // Inject content script if not already injected
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js']
        }).catch(err => {
            // Script might already be injected, ignore error
            console.log('Content script injection skipped:', err.message);
        });
    }
});

// Handle browser action click
chrome.action.onClicked.addListener((tab) => {
    if (tab.url && tab.url.includes('leetcode.com/problems/')) {
        // Send message to content script to toggle widget
        chrome.tabs.sendMessage(tab.id, { action: 'toggleWidget' });
    } else {
        // Open DSA Buddy web app
        chrome.tabs.create({ url: 'http://localhost:3000' });
    }
});

console.log('DSA Buddy background script loaded');



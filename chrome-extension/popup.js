// DSA Buddy Chrome Extension Popup Script

document.addEventListener('DOMContentLoaded', async () => {
    const statusElement = document.getElementById('status');
    const openWebAppBtn = document.getElementById('openWebApp');
    const toggleWidgetBtn = document.getElementById('toggleWidget');
    const backendUrlInput = document.getElementById('backendUrl');
    
    // Load settings
    await loadSettings();
    
    // Check backend connection
    await checkConnection();
    
    // Bind events
    openWebAppBtn.addEventListener('click', openWebApp);
    toggleWidgetBtn.addEventListener('click', toggleWidget);
    backendUrlInput.addEventListener('change', saveBackendUrl);
    
    async function loadSettings() {
        try {
            const response = await sendMessageToBackground({ action: 'getSettings' });
            if (response.success) {
                backendUrlInput.value = response.settings.backendUrl;
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
    
    async function checkConnection() {
        try {
            const backendUrl = backendUrlInput.value || 'http://localhost:3000';
            const response = await fetch(`${backendUrl}/health`);
            
            if (response.ok) {
                const data = await response.json();
                statusElement.className = 'status connected';
                statusElement.textContent = '✓ Connected to DSA Buddy backend';
            } else {
                throw new Error('Backend not responding');
            }
        } catch (error) {
            statusElement.className = 'status disconnected';
            statusElement.textContent = '✗ Backend not accessible';
        }
    }
    
    async function openWebApp() {
        const backendUrl = backendUrlInput.value || 'http://localhost:3000';
        chrome.tabs.create({ url: backendUrl });
        window.close();
    }
    
    async function toggleWidget() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (tab.url && tab.url.includes('leetcode.com/problems/')) {
                chrome.tabs.sendMessage(tab.id, { action: 'toggleWidget' });
                window.close();
            } else {
                alert('Please navigate to a LeetCode problem page first');
            }
        } catch (error) {
            console.error('Error toggling widget:', error);
            alert('Error: Make sure you are on a LeetCode problem page');
        }
    }
    
    async function saveBackendUrl() {
        try {
            const settings = { backendUrl: backendUrlInput.value };
            await sendMessageToBackground({ action: 'saveSettings', settings });
            await checkConnection();
        } catch (error) {
            console.error('Error saving backend URL:', error);
        }
    }
    
    function sendMessageToBackground(message) {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage(message, resolve);
        });
    }
});


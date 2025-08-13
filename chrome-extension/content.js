// DSA Buddy Chrome Extension Content Script

class DSABuddyExtension {
    constructor() {
        this.apiBase = 'http://localhost:3000/api';
        this.widget = null;
        this.currentProblem = null;
        this.currentSteps = {};
        this.isMinimized = false;
        this.init();
    }

    init() {
        // Wait for page to load completely
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        // Check if we're on a LeetCode problem page
        if (!this.isLeetCodeProblemPage()) {
            return;
        }

        // Create and inject the widget
        this.createWidget();
        
        // Detect the current problem
        this.detectProblem();
        
        // Set up observers for dynamic content changes
        this.setupObservers();
    }

    isLeetCodeProblemPage() {
        return window.location.hostname === 'leetcode.com' && 
               window.location.pathname.includes('/problems/');
    }

    createWidget() {
        // Remove existing widget if any
        const existingWidget = document.getElementById('dsa-buddy-widget');
        if (existingWidget) {
            existingWidget.remove();
        }

        // Create widget HTML
        this.widget = document.createElement('div');
        this.widget.id = 'dsa-buddy-widget';
        this.widget.innerHTML = `
            <div class="dsa-buddy-header" onclick="dsaBuddyExt.toggleWidget()">
                <h3>DSA Buddy</h3>
                <button class="dsa-buddy-toggle">−</button>
            </div>
            <div class="dsa-buddy-content">
                <div class="dsa-buddy-problem-info">
                    <div class="dsa-buddy-problem-title">Detecting problem...</div>
                    <div class="dsa-buddy-problem-status">Please wait</div>
                </div>
                <div class="dsa-buddy-steps">
                    <div class="dsa-buddy-step-nav">
                        <button class="dsa-buddy-step-btn active" data-step="3">3. Approach</button>
                        <button class="dsa-buddy-step-btn" data-step="4">4. Solution</button>
                    </div>
                    <div class="dsa-buddy-step-content">
                        <div class="dsa-buddy-loading">
                            <div class="dsa-buddy-loading-spinner"></div>
                            <div>Loading hints...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Inject widget into page
        document.body.appendChild(this.widget);

        // Bind step navigation events
        this.widget.querySelectorAll('.dsa-buddy-step-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const step = parseInt(e.target.dataset.step);
                this.showStep(step);
            });
        });

        // Make widget draggable
        this.makeDraggable();
    }

    makeDraggable() {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        const header = this.widget.querySelector('.dsa-buddy-header');

        header.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('dsa-buddy-toggle')) return;
            
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;

            if (e.target === header || header.contains(e.target)) {
                isDragging = true;
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                xOffset = currentX;
                yOffset = currentY;

                this.widget.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
            }
        });

        document.addEventListener('mouseup', () => {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        });
    }

    toggleWidget() {
        this.isMinimized = !this.isMinimized;
        const toggle = this.widget.querySelector('.dsa-buddy-toggle');
        
        if (this.isMinimized) {
            this.widget.classList.add('minimized');
            toggle.textContent = '+';
        } else {
            this.widget.classList.remove('minimized');
            toggle.textContent = '−';
        }
    }

    async detectProblem() {
        try {
            // Try multiple selectors to find the problem title
            const titleSelectors = [
                '[data-cy="question-title"]',
                '.css-v3d350',
                'h1',
                '.question-title h3',
                '.question-content .question-title'
            ];

            let problemTitle = null;
            for (const selector of titleSelectors) {
                const element = document.querySelector(selector);
                if (element && element.textContent.trim()) {
                    problemTitle = element.textContent.trim();
                    break;
                }
            }

            if (!problemTitle) {
                // Try to extract from URL
                const urlParts = window.location.pathname.split('/');
                const problemSlug = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
                problemTitle = problemSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            }

            if (problemTitle) {
                this.currentProblem = {
                    title: problemTitle,
                    url: window.location.href
                };

                this.updateProblemInfo();
                await this.loadHints();
            } else {
                this.showError('Could not detect problem title');
            }
        } catch (error) {
            console.error('Error detecting problem:', error);
            this.showError('Error detecting problem');
        }
    }

    updateProblemInfo() {
        const titleElement = this.widget.querySelector('.dsa-buddy-problem-title');
        const statusElement = this.widget.querySelector('.dsa-buddy-problem-status');
        
        if (this.currentProblem) {
            titleElement.textContent = this.currentProblem.title;
            statusElement.textContent = 'Ready to help!';
        }
    }

    async loadHints() {
        if (!this.currentProblem) return;

        try {
            // Load hints for steps 3 and 4
            await Promise.all([
                this.loadStep(3),
                this.loadStep(4)
            ]);

            // Show step 3 by default
            this.showStep(3);
        } catch (error) {
            console.error('Error loading hints:', error);
            this.showError('Failed to load hints');
        }
    }

    async loadStep(stepNumber) {
        try {
            const response = await fetch(`${this.apiBase}/ai/${stepNumber}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    problemId: null, // We don't have problem ID from extension
                    problemName: this.currentProblem.title,
                    problemDescription: this.currentProblem.title // Use title as description for now
                })
            });

            if (response.ok) {
                const stepData = await response.json();
                this.currentSteps[stepNumber] = stepData[`step${stepNumber}`];
            } else {
                console.error(`Failed to load step ${stepNumber}`);
                this.currentSteps[stepNumber] = `Failed to load step ${stepNumber} content. Please check your DSA Buddy backend connection.`;
            }
        } catch (error) {
            console.error(`Error loading step ${stepNumber}:`, error);
            this.currentSteps[stepNumber] = `Error loading step ${stepNumber}. Make sure DSA Buddy backend is running on localhost:3000.`;
        }
    }

    showStep(stepNumber) {
        // Update active step button
        this.widget.querySelectorAll('.dsa-buddy-step-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        this.widget.querySelector(`[data-step="${stepNumber}"]`).classList.add('active');

        // Show step content
        const contentElement = this.widget.querySelector('.dsa-buddy-step-content');
        
        if (this.currentSteps[stepNumber]) {
            contentElement.innerHTML = this.formatStepContent(this.currentSteps[stepNumber]);
        } else {
            contentElement.innerHTML = `
                <div class="dsa-buddy-loading">
                    <div class="dsa-buddy-loading-spinner"></div>
                    <div>Loading step ${stepNumber}...</div>
                </div>
            `;
            this.loadStep(stepNumber).then(() => {
                if (this.widget.querySelector(`[data-step="${stepNumber}"]`).classList.contains('active')) {
                    contentElement.innerHTML = this.formatStepContent(this.currentSteps[stepNumber]);
                }
            });
        }
    }

    formatStepContent(content) {
        if (typeof content !== 'string') {
            content = JSON.stringify(content, null, 2);
        }

        // Convert markdown-like formatting to HTML
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^/, '<p>')
            .replace(/$/, '</p>');
    }

    showError(message) {
        const contentElement = this.widget.querySelector('.dsa-buddy-step-content');
        contentElement.innerHTML = `
            <div class="dsa-buddy-error">
                <strong>Error:</strong> ${message}
            </div>
        `;
    }

    showSuccess(message) {
        const contentElement = this.widget.querySelector('.dsa-buddy-step-content');
        contentElement.innerHTML = `
            <div class="dsa-buddy-success">
                ${message}
            </div>
        `;
    }

    setupObservers() {
        // Watch for URL changes (SPA navigation)
        let currentUrl = window.location.href;
        const urlObserver = new MutationObserver(() => {
            if (window.location.href !== currentUrl) {
                currentUrl = window.location.href;
                if (this.isLeetCodeProblemPage()) {
                    setTimeout(() => this.detectProblem(), 1000); // Wait for page to load
                } else if (this.widget) {
                    this.widget.remove();
                }
            }
        });

        urlObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Watch for problem content changes
        const contentObserver = new MutationObserver(() => {
            if (!this.currentProblem && this.isLeetCodeProblemPage()) {
                this.detectProblem();
            }
        });

        contentObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

// Initialize the extension
let dsaBuddyExt;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        dsaBuddyExt = new DSABuddyExtension();
    });
} else {
    dsaBuddyExt = new DSABuddyExtension();
}

// Make toggle function globally available
window.dsaBuddyExt = dsaBuddyExt;



// DSA Buddy Frontend JavaScript

class DSABuddy {
    constructor() {
        this.apiBase = '/api';
        this.currentProblems = [];
        this.currentProblem = null;
        this.currentStep = 1;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadProblems();
        this.loadStats();
    }

    bindEvents() {
        // Upload events
        document.getElementById('uploadFileBtn').addEventListener('click', () => this.uploadFile());
        document.getElementById('uploadTextBtn').addEventListener('click', () => this.uploadText());

        // Filter events
        document.getElementById('searchInput').addEventListener('input', () => this.filterProblems());
        document.getElementById('categoryFilter').addEventListener('change', () => this.filterProblems());
        document.getElementById('difficultyFilter').addEventListener('change', () => this.filterProblems());
        document.getElementById('statusFilter').addEventListener('change', () => this.filterProblems());
        document.getElementById('refreshBtn').addEventListener('click', () => this.refreshData());

        // Modal events
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('problemModal').addEventListener('click', (e) => {
            if (e.target.id === 'problemModal') this.closeModal();
        });

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

    async uploadFile() {
        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];

        if (!file) {
            this.showToast('Please select a file', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            this.showLoading(true);
            const response = await fetch(`${this.apiBase}/upload`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                this.showToast(`Successfully uploaded ${result.problems.length} problems`);
                fileInput.value = '';
                this.refreshData();
            } else {
                this.showToast(result.error || 'Upload failed', 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showToast('Upload failed', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async uploadText() {
        const textInput = document.getElementById('textInput');
        const text = textInput.value.trim();

        if (!text) {
            this.showToast('Please enter some text', 'error');
            return;
        }

        try {
            this.showLoading(true);
            const response = await fetch(`${this.apiBase}/upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text })
            });

            const result = await response.json();

            if (response.ok) {
                this.showToast(`Successfully uploaded ${result.problems.length} problems`);
                textInput.value = '';
                this.refreshData();
            } else {
                this.showToast(result.error || 'Upload failed', 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showToast('Upload failed', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async loadProblems() {
        try {
            const params = new URLSearchParams();
            const search = document.getElementById('searchInput').value;
            const category = document.getElementById('categoryFilter').value;
            const difficulty = document.getElementById('difficultyFilter').value;
            const status = document.getElementById('statusFilter').value;

            if (search) params.append('search', search);
            if (category !== 'all') params.append('category', category);
            if (difficulty !== 'all') params.append('difficulty', difficulty);
            if (status !== 'all') params.append('status', status);

            const response = await fetch(`${this.apiBase}/problems?${params}`);
            const result = await response.json();

            if (response.ok) {
                this.currentProblems = result.problems;
                this.renderProblems();
                this.updateCategoryFilter();
            } else {
                this.showToast('Failed to load problems', 'error');
            }
        } catch (error) {
            console.error('Load problems error:', error);
            this.showToast('Failed to load problems', 'error');
        }
    }

    async loadStats() {
        try {
            const response = await fetch(`${this.apiBase}/problems/stats`);
            const stats = await response.json();

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

    renderProblems() {
        const tbody = document.getElementById('problemsTableBody');
        const emptyState = document.getElementById('emptyState');

        if (this.currentProblems.length === 0) {
            tbody.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
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
                    <button class="btn btn-primary btn-sm learn-btn" data-problem-id="${problem.id}">
                        Learn
                    </button>
                </td>
            </tr>
        `).join('');

        // Bind status change events
        document.querySelectorAll('.status-select').forEach(select => {
            select.addEventListener('change', (e) => {
                this.updateStatus(e.target.dataset.problemId, e.target.value);
            });
        });

        // Bind learn button events
        document.querySelectorAll('.learn-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const problemId = e.target.dataset.problemId;
                this.openProblemModal(problemId);
            });
        });
    }

    updateCategoryFilter() {
        const categoryFilter = document.getElementById('categoryFilter');
        const categories = new Set();
        
        this.currentProblems.forEach(problem => {
            problem.category.split(',').forEach(cat => {
                categories.add(cat.trim());
            });
        });

        // Keep existing options and add new ones
        const existingOptions = Array.from(categoryFilter.options).map(opt => opt.value);
        categories.forEach(category => {
            if (!existingOptions.includes(category)) {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categoryFilter.appendChild(option);
            }
        });
    }

    async updateStatus(problemId, status) {
        try {
            const response = await fetch(`${this.apiBase}/status/${problemId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });

            const result = await response.json();

            if (response.ok) {
                this.showToast('Status updated successfully');
                this.loadStats(); // Refresh stats
            } else {
                this.showToast(result.error || 'Failed to update status', 'error');
            }
        } catch (error) {
            console.error('Update status error:', error);
            this.showToast('Failed to update status', 'error');
        }
    }

    async openProblemModal(problemId) {
        try {
            this.showLoading(true);
            
            // Find problem in current list
            const problem = this.currentProblems.find(p => p.id == problemId);
            if (!problem) {
                this.showToast('Problem not found', 'error');
                return;
            }

            this.currentProblem = problem;
            
            // Update modal header
            document.getElementById('modalProblemName').textContent = problem.name;
            document.getElementById('modalDifficulty').textContent = problem.difficulty;
            document.getElementById('modalDifficulty').className = `difficulty-badge difficulty-${problem.difficulty.toLowerCase()}`;
            document.getElementById('modalCategory').textContent = problem.category;

            // Show modal
            document.getElementById('problemModal').style.display = 'flex';
            
            // Load AI content for all steps
            await this.loadAllSteps(problemId);
            
            // Show first step
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
            const response = await fetch(`${this.apiBase}/ai/all/${problemId}`, {
                method: 'POST'
            });

            const steps = await response.json();

            if (response.ok) {
                this.currentSteps = steps;
            } else {
                this.showToast('Failed to load AI content', 'error');
                this.currentSteps = {};
            }
        } catch (error) {
            console.error('Load steps error:', error);
            this.currentSteps = {};
        }
    }

    showStep(stepNumber) {
        // Update active step button with smooth transition
        document.querySelectorAll('.step-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeButton = document.querySelector(`[data-step="${stepNumber}"]`);
        activeButton.classList.add('active');
        
        // Add a subtle animation to draw attention to the active button
        activeButton.animate([
            { transform: 'scale(1.05)', boxShadow: '0 6px 15px rgba(102, 126, 234, 0.4)' },
            { transform: 'scale(1)', boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)' }
        ], {
            duration: 300,
            easing: 'ease-out'
        });

        // Prepare step content with transition
        const stepContent = document.getElementById('stepContent');
        const stepKey = `step${stepNumber}`;
        
        // First fade out the current content
        stepContent.style.opacity = '0';
        stepContent.style.transform = 'translateY(10px)';
        
        // Wait for fade-out to complete
        setTimeout(() => {
            // Then update the content
            if (this.currentSteps && this.currentSteps[stepKey]) {
                // Extract the actual step content
                const content = this.currentSteps[stepKey];
                
                // Format based on step type/number
                let stepTitle = '';
                switch(stepNumber) {
                    case 1: stepTitle = '<div class="step-header">Question Reading</div>'; break;
                    case 2: stepTitle = '<div class="step-header">Example Analysis</div>'; break;
                    case 3: stepTitle = '<div class="step-header">Approach Development</div>'; break;
                    case 4: stepTitle = '<div class="step-header">Solution & Optimization</div>'; break;
                    case 5: stepTitle = '<div class="step-header">Behavioral Analysis</div>'; break;
                    case 6: stepTitle = '<div class="step-header">Problem Modifications</div>'; break;
                    case 7: stepTitle = '<div class="step-header">Real-World Applications</div>'; break;
                }
                
                // For each step, extract the text directly from the step's value
                if (typeof content === 'string') {
                    // If it's already a string, display it directly
                    stepContent.innerHTML = stepTitle + this.enhancedFormatting(content);
                } else {
                    // If we have the full response from the server, it might have the step text directly
                    const stepValue = content[`step${stepNumber}`] || content;
                    if (typeof stepValue === 'string') {
                        stepContent.innerHTML = stepTitle + this.enhancedFormatting(stepValue);
                    } else {
                        // If it's still an object, format it properly
                        stepContent.innerHTML = stepTitle + this.formatStepContent(stepValue);
                    }
                }
            } else {
                stepContent.innerHTML = '<div class="loading"><div class="loading-spinner-small"></div> Loading comprehensive analysis...</div>';
                this.loadSingleStep(stepNumber);
            }
            
            // Then fade in the new content
            setTimeout(() => {
                stepContent.style.opacity = '1';
                stepContent.style.transform = 'translateY(0)';
            }, 50);
        }, 200); // Short delay for the fade-out

        this.currentStep = stepNumber;
    }

    async loadSingleStep(stepNumber) {
        if (!this.currentProblem) return;

        try {
            const response = await fetch(`${this.apiBase}/ai/${stepNumber}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    problemId: this.currentProblem.id,
                    problemName: this.currentProblem.name,
                    problemDescription: this.currentProblem.description
                })
            });

            const stepData = await response.json();

            if (response.ok) {
                if (!this.currentSteps) this.currentSteps = {};
                this.currentSteps[`step${stepNumber}`] = stepData;
                
                if (this.currentStep === stepNumber) {
                    // Extract the actual step content
                    const stepKey = `step${stepNumber}`;
                    const stepContent = stepData[stepKey];
                    
                    if (typeof stepContent === 'string') {
                        // If it's already a string, display it directly
                        document.getElementById('stepContent').innerHTML = this.formatText(stepContent);
                    } else {
                        // If it's still an object or undefined, use the formatStepContent helper
                        document.getElementById('stepContent').innerHTML = this.formatStepContent(stepData);
                    }
                }
            } else {
                document.getElementById('stepContent').innerHTML = 
                    '<div class="error">Failed to load step content</div>';
            }
        } catch (error) {
            console.error('Load single step error:', error);
            document.getElementById('stepContent').innerHTML = 
                '<div class="error">Failed to load step content</div>';
        }
    }

    formatStepContent(content) {
        if (typeof content === 'string') {
            return `<div class="step-text">${this.enhancedFormatting(content)}</div>`;
        }
        
        // Handle the new structured JSON format
        if (content && typeof content === 'object') {
            const stepKey = Object.keys(content).find(key => key.startsWith('step'));
            if (stepKey && content[stepKey] && typeof content[stepKey] === 'object') {
                // This is our new structured JSON format
                const stepObj = content[stepKey];
                let html = '';
                
                // Format based on the step number
                const stepNum = parseInt(stepKey.replace('step', ''));
                switch (stepNum) {
                    case 1:
                        html = this.formatQuestionReadingStep(stepObj);
                        break;
                    case 2:
                        html = this.formatExampleStep(stepObj);
                        break;
                    case 3:
                        html = this.formatApproachStep(stepObj);
                        break;
                    case 4:
                        html = this.formatSolutionStep(stepObj);
                        break;
                    case 5:
                        html = this.formatBehavioralStep(stepObj);
                        break;
                    case 6:
                        html = this.formatVariationsStep(stepObj);
                        break;
                    case 7:
                        html = this.formatApplicationsStep(stepObj);
                        break;
                    default:
                        html = `<div class="step-text">${JSON.stringify(stepObj, null, 2)}</div>`;
                }
                
                return html;
            } else if (stepKey && typeof content[stepKey] === 'string') {
                // Handle the old format where step values are strings
                return `<div class="step-text">${this.enhancedFormatting(content[stepKey])}</div>`;
            } else {
                // Try to find content in any format
                for (const key of Object.keys(content)) {
                    if (typeof content[key] === 'string' && content[key].trim().length > 0) {
                        return `<div class="step-text">${this.enhancedFormatting(content[key])}</div>`;
                    }
                }
                
                // If we still don't have content, check common property names or stringify
                const fallbackContent = content.content || content.text || content.explanation || 
                           content.value || JSON.stringify(content, null, 2);
                           
                return `<div class="step-text">${this.enhancedFormatting(fallbackContent)}</div>`;
            }
        }
        
        // Fallback for any other format
        return `<div class="step-text">${this.enhancedFormatting(String(content))}</div>`;
    }
    
    // Enhanced formatting with improved structure and detailing
    enhancedFormatting(text) {
        // First apply basic markdown formatting
        let formatted = this.formatText(text);
        
        // Identify step titles and add special formatting
        const stepTitles = [
            'Question Reading', 'Example', 'Approach', 'Solution', 
            'Behavioral', 'Modifications', 'Applications'
        ];
        
        // Create header sections for important parts
        stepTitles.forEach((title, index) => {
            const regex = new RegExp(`(${title}[:\\s-]*)`, 'gi');
            formatted = formatted.replace(regex, `<h3 class="step-section-title">$1</h3>`);
        });
        
        // Highlight key concepts and terms
        const keyTerms = [
            'Time Complexity', 'Space Complexity', 'O\\(n\\)', 'O\\(1\\)', 'O\\(n²\\)', 'O\\(n log n\\)',
            'Brute Force', 'Optimal Solution', 'Algorithm', 'Data Structure', 'Hash Table', 'Two Pointer',
            'Sliding Window', 'Dynamic Programming', 'Recursion', 'Iteration'
        ];
        
        keyTerms.forEach(term => {
            const regex = new RegExp(`(${term})`, 'g');
            formatted = formatted.replace(regex, `<span class="keyword">$1</span>`);
        });
        
        // Format code snippets better
        formatted = formatted.replace(/```([^`]+)```/g, '<div class="code-block"><pre><code>$1</code></pre></div>');
        
        // Add visual separation between major sections
        formatted = formatted.replace(/<\/h3>/g, '</h3><div class="section-divider"></div>');
        
        // Make lists more visually distinct
        formatted = formatted.replace(/(\d+\.\s[^<\n]+)(<br>|<\/p>)/g, '<div class="list-item">$1</div>$2');
        
        // Add example highlighting
        formatted = formatted.replace(/(Example:[^\n<]+)/g, '<div class="example-highlight">$1</div>');
        
        return formatted;
    }
    
    // Specialized formatters for each step type
    
    formatQuestionReadingStep(stepObj) {
        let html = '<div class="step-text structured-step">';
        
        if (stepObj.title) {
            html += `<h3 class="step-section-title">${stepObj.title}</h3>`;
        }
        
        if (stepObj.summary) {
            html += `<div class="summary-section">
                <h4>Summary</h4>
                <p>${this.formatText(stepObj.summary)}</p>
            </div>`;
        }
        
        if (stepObj.requirements && stepObj.requirements.length) {
            html += '<div class="requirements-section">';
            html += '<h4>Requirements</h4>';
            html += '<ul class="requirement-list">';
            stepObj.requirements.forEach(req => {
                html += `<li>${this.formatText(req)}</li>`;
            });
            html += '</ul></div>';
        }
        
        if (stepObj.constraints && stepObj.constraints.length) {
            html += '<div class="constraints-section">';
            html += '<h4>Constraints</h4>';
            html += '<ul class="constraint-list">';
            stepObj.constraints.forEach(constraint => {
                html += `<li>${this.formatText(constraint)}</li>`;
            });
            html += '</ul></div>';
        }
        
        if (stepObj.edge_cases && stepObj.edge_cases.length) {
            html += '<div class="edge-cases-section">';
            html += '<h4>Edge Cases</h4>';
            html += '<ul class="edge-case-list">';
            stepObj.edge_cases.forEach(edgeCase => {
                html += `<li>${this.formatText(edgeCase)}</li>`;
            });
            html += '</ul></div>';
        }
        
        // If there's a focusDetail field, add it with special formatting
        if (stepObj.focusDetail) {
            html += `<div class="focus-detail">
                <h4>Detailed Analysis</h4>
                <div class="focus-content">${this.formatText(stepObj.focusDetail)}</div>
            </div>`;
        }
        
        html += '</div>';
        return html;
    }
    
    formatExampleStep(stepObj) {
        let html = '<div class="step-text structured-step">';
        
        if (stepObj.title) {
            html += `<h3 class="step-section-title">${stepObj.title}</h3>`;
        }
        
        if (stepObj.examples && stepObj.examples.length) {
            stepObj.examples.forEach((example, index) => {
                html += `<div class="example-card">
                    <div class="example-header">Example ${index + 1}</div>
                    <div class="example-content">
                        <div class="example-input"><strong>Input:</strong> ${this.formatText(example.input)}</div>
                        <div class="example-output"><strong>Output:</strong> ${this.formatText(example.output)}</div>
                        <div class="example-explanation"><strong>Explanation:</strong> ${this.formatText(example.explanation)}</div>
                    </div>
                </div>`;
            });
        }
        
        // If there's a focusDetail field, add it with special formatting
        if (stepObj.focusDetail) {
            html += `<div class="focus-detail">
                <h4>Detailed Example Analysis</h4>
                <div class="focus-content">${this.formatText(stepObj.focusDetail)}</div>
            </div>`;
        }
        
        html += '</div>';
        return html;
    }
    
    formatApproachStep(stepObj) {
        let html = '<div class="step-text structured-step">';
        
        if (stepObj.title) {
            html += `<h3 class="step-section-title">${stepObj.title}</h3>`;
        }
        
        if (stepObj.brute_force) {
            html += `<div class="approach-section brute-force">
                <h4>Brute Force Approach</h4>
                <div class="approach-content">${this.formatText(stepObj.brute_force)}</div>
            </div>`;
        }
        
        if (stepObj.optimal) {
            html += `<div class="approach-section optimal">
                <h4>Optimal Approach</h4>
                <div class="approach-content">${this.formatText(stepObj.optimal)}</div>
            </div>`;
        }
        
        if (stepObj.interactive_prompts && stepObj.interactive_prompts.length) {
            html += '<div class="prompts-section">';
            html += '<h4>Guiding Questions</h4>';
            html += '<ol class="prompt-list">';
            stepObj.interactive_prompts.forEach(prompt => {
                html += `<li>${this.formatText(prompt)}</li>`;
            });
            html += '</ol></div>';
        }
        
        // If there's a focusDetail field, add it with special formatting
        if (stepObj.focusDetail) {
            html += `<div class="focus-detail">
                <h4>Detailed Approach Analysis</h4>
                <div class="focus-content">${this.formatText(stepObj.focusDetail)}</div>
            </div>`;
        }
        
        html += '</div>';
        return html;
    }
    
    formatSolutionStep(stepObj) {
        let html = '<div class="step-text structured-step">';
        
        if (stepObj.title) {
            html += `<h3 class="step-section-title">${stepObj.title}</h3>`;
        }
        
        if (stepObj.solutions) {
            // Create tabs for different languages
            html += '<div class="code-tabs">';
            html += '<div class="tab-header">';
            
            const languages = Object.keys(stepObj.solutions);
            languages.forEach((lang, index) => {
                const activeClass = index === 0 ? 'active' : '';
                html += `<div class="tab-button ${activeClass}" data-lang="${lang}">${lang.toUpperCase()}</div>`;
            });
            
            html += '</div>'; // End of tab-header
            html += '<div class="tab-content">';
            
            languages.forEach((lang, index) => {
                const solution = stepObj.solutions[lang];
                const activeClass = index === 0 ? 'active' : '';
                
                html += `<div class="tab-pane ${activeClass}" data-lang="${lang}">`;
                html += `<div class="code-block"><pre><code>${solution.code}</code></pre></div>`;
                html += `<div class="code-explanation">${this.formatText(solution.explanation)}</div>`;
                html += `<div class="complexity">
                    <span class="time-complexity"><strong>Time:</strong> ${solution.time}</span>
                    <span class="space-complexity"><strong>Space:</strong> ${solution.space}</span>
                </div>`;
                html += '</div>'; // End of tab-pane
            });
            
            html += '</div>'; // End of tab-content
            html += '</div>'; // End of code-tabs
            
            // Add JavaScript to handle tab switching
            setTimeout(() => {
                document.querySelectorAll('.tab-button').forEach(button => {
                    button.addEventListener('click', () => {
                        const lang = button.dataset.lang;
                        
                        // Deactivate all tabs and panes
                        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
                        
                        // Activate the selected tab and pane
                        button.classList.add('active');
                        document.querySelector(`.tab-pane[data-lang="${lang}"]`).classList.add('active');
                    });
                });
            }, 100);
        }
        
        // If there's a focusDetail field, add it with special formatting
        if (stepObj.focusDetail) {
            html += `<div class="focus-detail">
                <h4>Detailed Solution Analysis</h4>
                <div class="focus-content">${this.formatText(stepObj.focusDetail)}</div>
            </div>`;
        }
        
        html += '</div>';
        return html;
    }
    
    formatBehavioralStep(stepObj) {
        let html = '<div class="step-text structured-step">';
        
        if (stepObj.title) {
            html += `<h3 class="step-section-title">${stepObj.title}</h3>`;
        }
        
        if (stepObj.behavioral && stepObj.behavioral.length) {
            stepObj.behavioral.forEach((item, index) => {
                html += `<div class="behavioral-card">
                    <div class="question-header">Question ${index + 1}</div>
                    <div class="question">${this.formatText(item.question)}</div>
                    <div class="answer-header">Answer</div>
                    <div class="answer">${this.formatText(item.answer)}</div>
                </div>`;
            });
        }
        
        // If there's a focusDetail field, add it with special formatting
        if (stepObj.focusDetail) {
            html += `<div class="focus-detail">
                <h4>Detailed Behavioral Analysis</h4>
                <div class="focus-content">${this.formatText(stepObj.focusDetail)}</div>
            </div>`;
        }
        
        html += '</div>';
        return html;
    }
    
    formatVariationsStep(stepObj) {
        let html = '<div class="step-text structured-step">';
        
        if (stepObj.title) {
            html += `<h3 class="step-section-title">${stepObj.title}</h3>`;
        }
        
        if (stepObj.variations && stepObj.variations.length) {
            stepObj.variations.forEach((variation, index) => {
                html += `<div class="variation-card">
                    <div class="variation-name">Variation ${index + 1}: ${this.formatText(variation.variant)}</div>
                    <div class="variation-hint">${this.formatText(variation.hint)}</div>
                </div>`;
            });
        }
        
        // If there's a focusDetail field, add it with special formatting
        if (stepObj.focusDetail) {
            html += `<div class="focus-detail">
                <h4>Detailed Variations Analysis</h4>
                <div class="focus-content">${this.formatText(stepObj.focusDetail)}</div>
            </div>`;
        }
        
        html += '</div>';
        return html;
    }
    
    formatApplicationsStep(stepObj) {
        let html = '<div class="step-text structured-step">';
        
        if (stepObj.title) {
            html += `<h3 class="step-section-title">${stepObj.title}</h3>`;
        }
        
        if (stepObj.applications && stepObj.applications.length) {
            stepObj.applications.forEach((app, index) => {
                html += `<div class="application-card">
                    <div class="application-system">${this.formatText(app.system)}</div>
                    <div class="application-explanation">${this.formatText(app.explanation)}</div>
                </div>`;
            });
        }
        
        // If there's a focusDetail field, add it with special formatting
        if (stepObj.focusDetail) {
            html += `<div class="focus-detail">
                <h4>Detailed Applications Analysis</h4>
                <div class="focus-content">${this.formatText(stepObj.focusDetail)}</div>
            </div>`;
        }
        
        html += '</div>';
        return html;
    }

    formatText(text) {
        // First, handle code blocks with ```
        text = text.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');
        
        // Handle inline code
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Handle bold and italic
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Handle numbered lists
        text = text.replace(/(\d+\.\s)(.*?)(\n|$)/g, '<div class="list-item"><span class="list-number">$1</span>$2</div>');
        
        // Handle bullet points
        text = text.replace(/(-\s)(.*?)(\n|$)/g, '<div class="list-item bullet"><span class="bullet-point">•</span>$2</div>');
        
        // Handle sections with common titles
        const sections = [
            'Problem Understanding', 'Problem Statement', 'Example', 'Approach', 
            'Algorithm', 'Time Complexity', 'Space Complexity', 'Solution',
            'Brute Force', 'Optimization', 'Real-life Applications'
        ];
        
        sections.forEach(section => {
            const regex = new RegExp(`(${section}\\s*:)\\s*(.+?)(?=\\n\\n|$)`, 'g');
            text = text.replace(regex, '<div class="concept-section"><span class="section-title">$1</span> $2</div>');
        });
        
        // Handle paragraphs
        text = text.replace(/\n\n/g, '</p><p>');
        text = text.replace(/\n/g, '<br>');
        
        // Wrap everything in paragraphs if needed
        if (!text.startsWith('<div') && !text.startsWith('<pre') && !text.startsWith('<p')) {
            text = `<p>${text}</p>`;
        }
        
        // Add highlighting for complexity mentions
        text = text.replace(/(O\([^)]+\))/g, '<span class="complexity-tag">$1</span>');
        
        return text;
    }

    closeModal() {
        document.getElementById('problemModal').style.display = 'none';
        this.currentProblem = null;
        this.currentSteps = null;
        this.currentStep = 1;
    }

    filterProblems() {
        this.loadProblems();
    }

    refreshData() {
        this.loadProblems();
        this.loadStats();
        this.showToast('Data refreshed');
    }

    showLoading(show) {
        document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
    }

    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DSABuddy();
});



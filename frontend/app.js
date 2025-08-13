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
        // Update active step button
        document.querySelectorAll('.step-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-step="${stepNumber}"]`).classList.add('active');

        // Show step content
        const stepContent = document.getElementById('stepContent');
        const stepKey = `step${stepNumber}`;
        
        if (this.currentSteps && this.currentSteps[stepKey]) {
            stepContent.innerHTML = this.formatStepContent(this.currentSteps[stepKey]);
        } else {
            stepContent.innerHTML = '<div class="loading">Loading step content...</div>';
            this.loadSingleStep(stepNumber);
        }

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
                this.currentSteps[`step${stepNumber}`] = stepData[`step${stepNumber}`];
                
                if (this.currentStep === stepNumber) {
                    document.getElementById('stepContent').innerHTML = 
                        this.formatStepContent(stepData[`step${stepNumber}`]);
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
            return `<div class="step-text">${this.formatText(content)}</div>`;
        }
        return `<div class="step-text">${this.formatText(JSON.stringify(content, null, 2))}</div>`;
    }

    formatText(text) {
        // Convert markdown-like formatting to HTML
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^/, '<p>')
            .replace(/$/, '</p>');
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



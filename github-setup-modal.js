// GitHub Storage Setup Modal
// This provides a user-friendly interface to configure GitHub storage

class GitHubSetupModal {
  constructor() {
    this.modal = null;
    this.isOpen = false;
  }

  // Show the GitHub setup modal
  show() {
    if (this.isOpen) return;
    
    this.createModal();
    this.isOpen = true;
  }

  // Create the modal HTML
  createModal() {
    // Remove existing modal if any
    this.remove();

    // Create modal overlay
    this.modal = document.createElement('div');
    this.modal.className = 'github-setup-modal';
    this.modal.innerHTML = `
      <div class="modal-overlay" onclick="githubSetupModal.close()"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h2>🌟 Setup GitHub Storage</h2>
          <button class="close-btn" onclick="githubSetupModal.close()">×</button>
        </div>
        
        <div class="modal-body">
          <div class="setup-step">
            <h3>📋 Step 1: Create GitHub Repository</h3>
            <ol>
              <li>Go to <a href="https://github.com/new" target="_blank">GitHub.com/new</a></li>
              <li>Repository name: <code>ag-genius-profiles</code></li>
              <li>Set to <strong>Public</strong> (so images are accessible)</li>
              <li>Click "Create repository"</li>
            </ol>
          </div>

          <div class="setup-step">
            <h3>🔑 Step 2: Create Personal Access Token</h3>
            <ol>
              <li>Go to <a href="https://github.com/settings/tokens" target="_blank">GitHub Settings → Tokens</a></li>
              <li>Click "Generate new token (classic)"</li>
              <li>Name: <code>AgGenius Profile Images</code></li>
              <li>Expiration: <code>No expiration</code></li>
              <li>Scopes: Check <strong>repo</strong> (full control)</li>
              <li>Click "Generate token"</li>
              <li><strong>Copy the token immediately!</strong></li>
            </ol>
          </div>

          <div class="setup-step">
            <h3>⚙️ Step 3: Configure AgGenius</h3>
            <form id="githubConfigForm">
              <div class="form-group">
                <label for="githubUsername">GitHub Username:</label>
                <input type="text" id="githubUsername" placeholder="your-username" required>
              </div>

              <div class="form-group">
                <label for="githubRepository">Repository Name:</label>
                <input type="text" id="githubRepository" value="ag-genius-profiles" required>
              </div>

              <div class="form-group">
                <label for="githubToken">Personal Access Token:</label>
                <input type="password" id="githubToken" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" required>
              </div>

              <div class="form-actions">
                <button type="button" onclick="githubSetupModal.testConnection()" class="btn btn-secondary">
                  🧪 Test Connection
                </button>
                <button type="submit" class="btn btn-primary">
                  ✅ Save & Enable GitHub Storage
                </button>
              </div>
            </form>
          </div>

          <div class="setup-step">
            <h3>💡 Benefits of GitHub Storage</h3>
            <ul class="benefits-list">
              <li>✅ <strong>Free</strong> - No cost for public repositories</li>
              <li>✅ <strong>Reliable</strong> - Backed by Microsoft/GitHub</li>
              <li>✅ <strong>Global CDN</strong> - Fast loading worldwide</li>
              <li>✅ <strong>1GB Storage</strong> - Much more than localStorage</li>
              <li>✅ <strong>Cross-Device</strong> - Access from anywhere</li>
            </ul>
          </div>
        </div>
      </div>
    `;

    // Add styles
    this.addStyles();

    // Add to page
    document.body.appendChild(this.modal);

    // Setup form handling
    this.setupFormHandling();

    // Load existing config if available
    this.loadExistingConfig();
  }

  // Add CSS styles
  addStyles() {
    if (document.getElementById('githubModalStyles')) return;

    const style = document.createElement('style');
    style.id = 'githubModalStyles';
    style.textContent = `
      .github-setup-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
      }

      .modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
      }

      .modal-content {
        background: white;
        border-radius: 12px;
        width: 90%;
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      }

      .modal-header {
        padding: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid #e0e0e0;
      }

      .modal-header h2 {
        margin: 0;
        color: #4CAF50;
        font-size: 1.5em;
      }

      .close-btn {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
        padding: 5px;
        line-height: 1;
      }

      .close-btn:hover {
        color: #333;
      }

      .modal-body {
        padding: 0 20px 20px;
      }

      .setup-step {
        margin-bottom: 20px;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 8px;
        border-left: 4px solid #4CAF50;
      }

      .setup-step h3 {
        margin-top: 0;
        color: #333;
      }

      .setup-step ol, .setup-step ul {
        margin: 15px 0;
        padding-left: 20px;
      }

      .setup-step li {
        margin: 8px 0;
        line-height: 1.5;
      }

      .setup-step code {
        background: #e9ecef;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: monospace;
        color: #d63384;
      }

      .setup-step a {
        color: #4CAF50;
        text-decoration: none;
        font-weight: bold;
      }

      .setup-step a:hover {
        text-decoration: underline;
      }

      .form-group {
        margin-bottom: 20px;
      }

      .form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: 600;
        color: #333;
      }

      .form-group input {
        width: 100%;
        padding: 10px;
        border: 2px solid #e0e0e0;
        border-radius: 6px;
        font-size: 14px;
        box-sizing: border-box;
      }

      .form-group input:focus {
        outline: none;
        border-color: #4CAF50;
      }

      .form-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 20px;
      }

      .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.3s ease;
      }

      .btn-primary {
        background: #4CAF50;
        color: white;
      }

      .btn-primary:hover {
        background: #45a049;
      }

      .btn-secondary {
        background: #6c757d;
        color: white;
      }

      .btn-secondary:hover {
        background: #5a6268;
      }

      .benefits-list {
        list-style: none;
        padding: 0;
      }

      .benefits-list li {
        padding: 5px 0;
        color: #333;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;

    document.head.appendChild(style);
  }

  // Setup form handling
  setupFormHandling() {
    const form = document.getElementById('githubConfigForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveConfiguration();
      });
    }
  }

  // Load existing configuration
  loadExistingConfig() {
    const savedConfig = localStorage.getItem('githubStorageConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        if (config.username) document.getElementById('githubUsername').value = config.username;
        if (config.repository) document.getElementById('githubRepository').value = config.repository;
        if (config.token) document.getElementById('githubToken').value = config.token;
      } catch (error) {
        console.error('Error loading config:', error);
      }
    }
  }

  // Test GitHub connection
  async testConnection() {
    try {
      const config = this.getFormData();
      
      if (!config.username || !config.repository || !config.token) {
        showToast('Please fill in all fields', 'error');
        return;
      }

      showToast('Testing connection...', 'success');
      
      // Test the connection
      await window.setupGitHubStorage(config);
      
      showToast('✅ GitHub connection successful!', 'success');
      
    } catch (error) {
      showToast(`❌ Connection failed: ${error.message}`, 'error');
    }
  }

  // Save configuration
  async saveConfiguration() {
    try {
      const config = this.getFormData();
      
      if (!config.username || !config.repository || !config.token) {
        showToast('Please fill in all fields', 'error');
        return;
      }

      // Setup GitHub storage
      await window.setupGitHubStorage(config);
      
      showToast('GitHub storage enabled!', 'success');
      
      // Close modal
      setTimeout(() => {
        this.close();
      }, 1500);
      
    } catch (error) {
      showToast(`Setup failed: ${error.message}`, 'error');
    }
  }

  // Get form data
  getFormData() {
    return {
      username: document.getElementById('githubUsername').value.trim(),
      repository: document.getElementById('githubRepository').value.trim(),
      token: document.getElementById('githubToken').value.trim()
    };
  }

  // Close modal
  close() {
    if (this.modal) {
      this.modal.style.animation = 'fadeOut 0.3s ease forwards';
      setTimeout(() => {
        this.remove();
      }, 300);
    }
  }

  // Remove modal from DOM
  remove() {
    if (this.modal) {
      document.body.removeChild(this.modal);
      this.modal = null;
      this.isOpen = false;
    }
  }
}

// Initialize modal
const githubSetupModal = new GitHubSetupModal();

// Global function to show setup modal
window.showGitHubSetup = function() {
  githubSetupModal.show();
};

// Global access
window.githubSetupModal = githubSetupModal; 
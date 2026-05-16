// Input Form UI - Username, Token, Date Range

class InputForm {
  constructor(container) {
    this.container = container;
    this.onSubmit = null;
  }

  render() {
    this.container.innerHTML = `
      <div id="input-section" class="card">
        <div class="header-content">
          <h1>GitHub Wrapped</h1>
          <p class="subtitle">Your coding journey captured</p>
        </div>

        <div class="form-group">
          <label for="username">GitHub Username</label>
          <input
            type="text"
            id="username"
            placeholder="octocat"
            autocomplete="off"
          >
          <p class="helper-text">Enter your GitHub username to get started</p>
        </div>

        <div class="form-group">
          <label for="token">GitHub Personal Access Token (Optional)</label>
          <input
            type="password"
            id="token"
            placeholder="ghp_xxxxxxxxxxxxx"
            autocomplete="off"
          >
          <p class="helper-text">Add a token to include private repos and get detailed insights</p>
        </div>

        <div class="form-group">
          <label>Tenure Period</label>
          <div class="input-group">
            <label for="start-date">Start Date</label>
            <input type="date" id="start-date">
            <p class="helper-text" id="auto-detect-status">Auto-detected from your first commit</p>
          </div>

          <div class="input-group">
            <label for="end-date">End Date</label>
            <input type="date" id="end-date">
            <p class="helper-text">Defaults to today</p>
          </div>
        </div>

        <div class="button-group">
          <button id="generate-btn" class="primary-button">
            <span class="loader hidden"></span>
            Generate Snapshot
          </button>
          <button id="upload-btn" class="secondary-button">
            Upload Previous
          </button>
        </div>

        <input type="file" id="file-input" accept=".json" class="hidden">
        <div id="error-message" class="error hidden"></div>
      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    const usernameInput = document.getElementById('username');
    const tokenInput = document.getElementById('token');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const generateBtn = document.getElementById('generate-btn');
    const uploadBtn = document.getElementById('upload-btn');
    const fileInput = document.getElementById('file-input');
    const errorMsg = document.getElementById('error-message');

    // Set end date to today
    endDateInput.valueAsDate = new Date();

    // Generate button
    generateBtn.addEventListener('click', async () => {
      try {
        errorMsg.classList.add('hidden');
        const username = usernameInput.value.trim();
        const token = tokenInput.value.trim() || null;
        const startDate = startDateInput.value ? new Date(startDateInput.value) : null;
        const endDate = endDateInput.value ? new Date(endDateInput.value) : new Date();

        if (!username) {
          throw new Error('Please enter your GitHub username');
        }

        if (startDate && startDate >= endDate) {
          throw new Error('Start date must be before end date');
        }

        // Show loading state
        const loader = generateBtn.querySelector('.loader');
        loader.classList.remove('hidden');
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';

        // Trigger submission
        if (this.onSubmit) {
          await this.onSubmit(username, token, startDate, endDate);
        }
      } catch (error) {
        errorMsg.textContent = error.message;
        errorMsg.classList.remove('hidden');
        generateBtn.disabled = false;
        const loader = generateBtn.querySelector('.loader');
        loader.classList.add('hidden');
        generateBtn.innerHTML = 'Generate Snapshot';
      }
    });

    // Upload button
    uploadBtn.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file && this.onUpload) {
        this.onUpload(file);
      }
    });

    // Auto-detect tenure when username changes
    usernameInput.addEventListener('blur', async () => {
      const username = usernameInput.value.trim();
      if (username) {
        try {
          const api = new GitHubAPI(username);
          const user = await api.getUser();
          const created = new Date(user.created_at);
          startDateInput.valueAsDate = created;
          document.getElementById('auto-detect-status').textContent =
            `Auto-detected from account creation on ${DateUtil.format(created, 'long')}`;
        } catch (error) {
          // Silent fail - user can enter manually
        }
      }
    });
  }
}

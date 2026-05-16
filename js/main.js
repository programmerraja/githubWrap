// Main App - Orchestration

class App {
  constructor() {
    this.inputForm = null;
    this.resultsPage = null;
    this.snapshot = null;
  }

  async init() {
    const contentDiv = document.getElementById("content");
    if (!contentDiv) {
      console.error("Content container not found");
      return;
    }

    // Check for uploaded file in URL
    const uploadedJSON = this.getUploadedFile();
    if (uploadedJSON) {
      return this.renderFromSnapshot(uploadedJSON);
    }

    // Show input form
    this.showInputForm(contentDiv);
  }

  showInputForm(container) {
    this.inputForm = new InputForm(container);
    this.inputForm.render();

    // Handle form submission
    this.inputForm.onSubmit = async (username, token, startDate, endDate) => {
      await this.generateSnapshot(username, token, startDate, endDate);
    };

    // Handle file upload
    this.inputForm.onUpload = async (file) => {
      const snapshot = await SnapshotStorage.uploadSnapshot(file);
      this.renderFromSnapshot(snapshot);
    };
  }

  async generateSnapshot(username, token, startDate, endDate) {
    try {
      console.log("🚀 Generating snapshot for", username);

      // Check cache first
      const cached = await CacheManager.getRawData(username);
      if (cached && !cached.isPartial) {
        console.log("✅ Using cached data");
        const analysis = DataAnalyzer.analyzeAll(cached.data);
        this.snapshot = new Snapshot(cached.data, analysis);
        const contentDiv = document.getElementById("content");
        this.resultsPage = new ResultsPage(contentDiv);
        this.resultsPage.render(this.snapshot);
        SnapshotStorage.saveToLocalStorage(this.snapshot);
        return;
      }

      // Auto-detect start date if not provided
      if (!startDate) {
        const api = new GitHubAPI(username, token);
        const user = await api.getUser();
        startDate = new Date(user.created_at);
        console.log("📅 Auto-detected start date:", startDate);
      }

      // Default end date to today
      if (!endDate) {
        endDate = new Date();
      }

      // Initialize API
      const api = new GitHubAPI(username, token);

      // Set up progress callback for UI
      const contentDiv = document.getElementById("content");
      const progressDiv = document.createElement("div");
      progressDiv.id = "progress-container";
      progressDiv.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <h2>⏳ Fetching your GitHub data...</h2>
          <div id="progress-bar" style="width: 300px; height: 10px; background: #30363d; margin: 20px auto; border-radius: 5px;">
            <div id="progress-fill" style="height: 100%; background: #2ea043; width: 0%; border-radius: 5px;"></div>
          </div>
          <p id="progress-text">Starting data extraction...</p>
        </div>
      `;
      contentDiv.innerHTML = "";
      contentDiv.appendChild(progressDiv);

      api.setProgressCallback((progress) => {
        const progressFill = document.getElementById("progress-fill");
        const progressText = document.getElementById("progress-text");

        if (!progressFill || !progressText) return;

        if (progress.isWaiting) {
          progressText.innerText = progress.message;
        } else if (progress.percent !== undefined) {
          progressFill.style.width = progress.percent + "%";
          progressText.innerText = `${progress.message} (${progress.percent}%)`;
        } else {
          // indeterminate or count-based
          progressText.innerText = progress.message;
        }
      });

      // Extract data
      const extractor = new DataExtractor();
      const rawData = await extractor.extractAll(api, startDate, endDate);
      console.log("✅ Data extraction complete");

      // Save to cache
      await CacheManager.saveRawData(username, rawData);

      // Analyze data
      const analysis = DataAnalyzer.analyzeAll(rawData);
      console.log("✅ Data analysis complete");

      // Build snapshot
      this.snapshot = new Snapshot(rawData, analysis);
      console.log("✅ Snapshot created");

      // Render results
      this.resultsPage = new ResultsPage(contentDiv);
      this.resultsPage.render(this.snapshot);
      console.log("✅ Results rendered");

      // Save to localStorage
      SnapshotStorage.saveToLocalStorage(this.snapshot);
      console.log("✅ Snapshot saved to localStorage");
    } catch (error) {
      console.error("❌ Snapshot generation failed:", error);
    }
  }

  renderFromSnapshot(snapshot) {
    // Validate
    if (!SnapshotStorage.validateSnapshot(snapshot)) {
      console.log("Invalid snapshot file");
      return;
    }

    this.snapshot = snapshot;
    const contentDiv = document.getElementById("content");
    this.resultsPage = new ResultsPage(contentDiv);
    this.resultsPage.render(snapshot);
  }

  getUploadedFile() {
    // Check localStorage for last snapshot
    const params = new URLSearchParams(window.location.search);
    const username = params.get("user");
    if (username) {
      return SnapshotStorage.loadFromLocalStorage(username);
    }
    return null;
  }
}

// Initialize app on page load
document.addEventListener("DOMContentLoaded", async () => {
  const app = new App();
  await app.init();
});

// Results Page - Renders all sections

class ResultsPage {
  constructor(container) {
    this.container = container;
    this.snapshot = null;
  }

  render(snapshot) {
    this.snapshot = snapshot;

    const sections = [
      HeaderSection.render(snapshot),
      ContributionGraphSection.render(snapshot),
      StatsSection.render(snapshot),
      CodeFootprintSection.render(snapshot),
      TimePatternsSection.render(snapshot),
      HighlightsSection.render(snapshot),
      CollaborationSection.render(snapshot),
      PersonaSection.render(snapshot),
      TopReposSection.render(snapshot),
      CTASection.render(snapshot)
    ];

    this.container.innerHTML = `
      <div class="results-wrapper">
        <div class="actions-bar">
          <button id="back-btn" class="action-btn">← Back</button>
          <div class="right-actions">
            <select id="result-theme-select" class="theme-selector">
              <option value="default">Dark</option>
              <option value="light">Light</option>
              <option value="cyberpunk">Cyber</option>
              <option value="sunset">Sunset</option>
            </select>
          </div>
        </div>

        <div id="capture-area" class="wrapped-content">
          ${sections.join('')}
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    // Back button
    document.getElementById('back-btn')?.addEventListener('click', () => {
      location.reload();
    });

    // Theme selector
    document.getElementById('result-theme-select')?.addEventListener('change', (e) => {
      document.documentElement.setAttribute('data-theme', e.target.value);
    });

    // Download JSON
    document.getElementById('download-json-btn')?.addEventListener('click', () => {
      SnapshotStorage.downloadSnapshot(this.snapshot);
    });

    // Download PDF
    document.getElementById('download-pdf-btn')?.addEventListener('click', async () => {
      await PDFGenerator.generatePDF(
        this.snapshot.user.login,
        this.snapshot.tenure.endDate
      );
    });

    // Share button
    document.getElementById('share-btn')?.addEventListener('click', () => {
      const text = `Check out my GitHub Wrapped! @${this.snapshot.user.login} - ${this.snapshot.metrics.totalCommits} commits, ${this.snapshot.metrics.totalPRs} PRs`;
      if (navigator.share) {
        navigator.share({ title: 'GitHub Wrapped', text });
      } else {
        alert('Sharing not supported in your browser');
      }
    });
  }
}

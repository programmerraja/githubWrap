// Highlights Section - Biggest Commits & Shipped Features

class HighlightsSection {
  static render(snapshot) {
    const { highlights } = snapshot;

    // Biggest commits
    const bigCommitsHTML = (highlights?.biggestCommits || [])
      .slice(0, 5)
      .map(commit => `
        <div class="highlight-item commit-item">
          <div class="commit-header">
            <div class="commit-info">
              <a href="${commit.url}" target="_blank" class="commit-hash">${commit.hash}</a>
              <div class="commit-message">${FormatUtil.truncate(commit.message, 60)}</div>
            </div>
            <div class="commit-stats">
              <span class="stat-badge additions">+${FormatUtil.shortNumber(commit.additions)}</span>
              <span class="stat-badge deletions">-${FormatUtil.shortNumber(commit.deletions)}</span>
            </div>
          </div>
          <div class="commit-meta">
            <span class="repo-tag">${commit.repo}</span>
            <span class="date-tag">${DateUtil.format(commit.date, 'long')}</span>
          </div>
        </div>
      `)
      .join('');

    // Shipped features
    const featuresHTML = (highlights?.shippedFeatures || [])
      .slice(0, 5)
      .map(feature => `
        <div class="highlight-item feature-item">
          <div class="feature-header">
            <h4 class="feature-title">🚀 ${feature.title}</h4>
          </div>
          <p class="feature-description">${feature.description}</p>
          <div class="feature-meta">
            <span class="repo-tag">${feature.repo}</span>
            <span class="date-tag">${DateUtil.format(feature.date, 'long')}</span>
          </div>
        </div>
      `)
      .join('');

    return `
      <div class="stat-card full-width">
        <div class="stat-label"><span class="stat-icon">⭐</span> Highlights</div>

        <div class="highlights-section">
          <div class="highlight-subsection">
            <h3>Biggest Commits</h3>
            <div class="highlights-list">${bigCommitsHTML}</div>
          </div>

          <div class="highlight-subsection">
            <h3>Shipped Features</h3>
            <div class="highlights-list">${featuresHTML}</div>
          </div>
        </div>
      </div>
    `;
  }
}

// Stats Section - Key Metrics Cards

class StatsSection {
  static render(snapshot) {
    const { metrics } = snapshot;

    return `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label"><span class="stat-icon">📝</span> Commits</div>
          <div class="stat-value">${FormatUtil.shortNumber(metrics.totalCommits)}</div>
        </div>

        <div class="stat-card">
          <div class="stat-label"><span class="stat-icon">🔀</span> Pull Requests</div>
          <div class="stat-value">${FormatUtil.shortNumber(metrics.totalPRs)}</div>
        </div>

        <div class="stat-card">
          <div class="stat-label"><span class="stat-icon">👀</span> Code Reviews</div>
          <div class="stat-value">${FormatUtil.shortNumber(metrics.codeReviewCount)}</div>
        </div>

        <div class="stat-card">
          <div class="stat-label"><span class="stat-icon">🚀</span> Issues Opened</div>
          <div class="stat-value">${FormatUtil.shortNumber(metrics.totalIssues)}</div>
        </div>

        <div class="stat-card">
          <div class="stat-label"><span class="stat-icon">➕</span> Lines Added</div>
          <div class="stat-value">${FormatUtil.shortNumber(metrics.totalLOCAdded)}</div>
        </div>

        <div class="stat-card">
          <div class="stat-label"><span class="stat-icon">📦</span> Repositories</div>
          <div class="stat-value">${FormatUtil.shortNumber(metrics.repositoriesContributedTo)}</div>
        </div>
      </div>
    `;
  }
}

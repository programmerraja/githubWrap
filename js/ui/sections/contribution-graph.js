// Contribution Graph Section - GitHub-style heatmap

class ContributionGraphSection {
  static render(snapshot) {
    const { contributionGraph, metrics } = snapshot;

    // Generate grid HTML
    const graphHTML = contributionGraph.weeks
      .map(week => {
        const daysHTML = week.days
          .map(day => {
            const level = day.level;
            return `<div class="day-box ${level}" data-count="${day.count}" data-date="${day.date}" title="${day.date}: ${day.count} contributions"></div>`;
          })
          .join('');
        return `<div class="week-col">${daysHTML}</div>`;
      })
      .join('');

    // Month labels
    const monthLabels = MONTHS.map((m, i) => `<span>${m}</span>`).join('');

    return `
      <div class="stat-card full-width graph-section">
        <div class="stat-label"><span class="stat-icon">📊</span> Contribution Graph</div>
        <div class="contribution-container">
          <div class="month-labels">${monthLabels}</div>
          <div class="contribution-graph">${graphHTML}</div>
        </div>
        <div class="graph-stats">
          <p class="contribution-count">${FormatUtil.number(metrics.totalCommits)} total commits</p>
          <p class="contribution-subtext">Longest streak: ${metrics.longestCommitStreak} days</p>
        </div>
      </div>
    `;
  }
}

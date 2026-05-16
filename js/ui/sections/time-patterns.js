// Time Patterns Section - Activity Heatmap

class TimePatternsSection {
  static render(snapshot) {
    const { timePatterns } = snapshot;

    // Day of week
    const dayStats = timePatterns.commitsPerDay.map((count, i) => ({
      day: DAYS[i],
      count
    }));

    const maxDayCount = Math.max(...timePatterns.commitsPerDay) || 1;

    const dayBarsHTML = dayStats
      .map(stat => `
        <div class="time-bar-item">
          <div class="time-label">${stat.day.substring(0, 3)}</div>
          <div class="time-bar-container">
            <div class="time-bar" style="height: ${Math.max(5, (stat.count / maxDayCount) * 100)}%"></div>
          </div>
          <div class="time-value">${stat.count}</div>
        </div>
      `)
      .join('');

    // Hour of day
    const hourStats = timePatterns.commitsPerHour
      .map((count, i) => ({ hour: i, count }))
      .filter((_, i) => i % 3 === 0); // Show every 3rd hour for space

    const maxHourCount = Math.max(...timePatterns.commitsPerHour) || 1;

    const hourBarsHTML = hourStats
      .map(stat => `
        <div class="time-bar-item">
          <div class="time-label">${String(stat.hour).padStart(2, '0')}:00</div>
          <div class="time-bar-container">
            <div class="time-bar" style="height: ${Math.max(5, (stat.count / maxHourCount) * 100)}%"></div>
          </div>
          <div class="time-value">${stat.count}</div>
        </div>
      `)
      .join('');

    return `
      <div class="stat-card full-width">
        <div class="stat-label"><span class="stat-icon">⏰</span> Coding Patterns</div>

        <div class="patterns-grid">
          <div class="pattern-section">
            <div class="pattern-title">Most Active Day</div>
            <div class="pattern-highlight">${timePatterns.mostActiveDay}</div>
            <p class="pattern-subtext">${timePatterns.commitsPerDay[DAYS.indexOf(timePatterns.mostActiveDay)]} commits</p>
          </div>

          <div class="pattern-section">
            <div class="pattern-title">Peak Hour</div>
            <div class="pattern-highlight">${String(timePatterns.mostActiveHour).padStart(2, '0')}:00</div>
            <p class="pattern-subtext">${timePatterns.commitsPerHour[timePatterns.mostActiveHour]} commits</p>
          </div>

          <div class="pattern-section">
            <div class="pattern-title">Most Active Month</div>
            <div class="pattern-highlight">${timePatterns.mostActiveMonth}</div>
            <p class="pattern-subtext">${timePatterns.mostActiveMonthCount} commits</p>
          </div>
        </div>

        <div class="time-charts">
          <div class="time-chart">
            <h4>Commits by Day of Week</h4>
            <div class="time-bars">${dayBarsHTML}</div>
          </div>

          <div class="time-chart">
            <h4>Commits by Hour of Day</h4>
            <div class="time-bars">${hourBarsHTML}</div>
          </div>
        </div>
      </div>
    `;
  }
}

// Code Footprint Section - Languages & Top Files

class CodeFootprintSection {
  static render(snapshot) {
    const { languages, topFiles } = snapshot;

    // Languages cards
    const languagesHTML = languages
      .slice(0, 5)
      .map(lang => `
        <div class="language-item">
          <div class="language-header">
            <div class="language-name">
              <span class="lang-dot" style="background-color: ${lang.color}"></span>
              ${lang.name}
            </div>
            <div class="language-percentage">${lang.percentage}%</div>
          </div>
          <div class="language-bar">
            <div class="language-bar-fill" style="width: ${lang.percentage}%; background-color: ${lang.color}"></div>
          </div>
        </div>
      `)
      .join('');

    // Top files table
    const filesHTML = (topFiles || [])
      .slice(0, 5)
      .map(file => `
        <div class="file-row">
          <div class="file-name">${file.path}</div>
          <div class="file-stats">
            <span class="file-stat">${file.commits} commits</span>
            <span class="file-stat">+${FormatUtil.shortNumber(file.additions)}</span>
            <span class="file-stat">-${FormatUtil.shortNumber(file.deletions)}</span>
          </div>
        </div>
      `)
      .join('');

    return `
      <div class="stat-card full-width">
        <div class="stat-label"><span class="stat-icon">💻</span> Code Footprint</div>
        <div class="footprint-grid">
          <div class="footprint-section">
            <h3>Top Languages</h3>
            <div class="languages-list">${languagesHTML}</div>
          </div>
          ${(topFiles && topFiles.length > 0) ? `
            <div class="footprint-section">
              <h3>Most Changed Files</h3>
              <div class="files-list">${filesHTML}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
}

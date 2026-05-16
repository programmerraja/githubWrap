// Top Repos Section - Most Contributed Repositories

class TopReposSection {
  static render(snapshot) {
    const { topRepositories } = snapshot;

    if (!topRepositories || topRepositories.length === 0) {
      return '';
    }

    const reposHTML = topRepositories
      .slice(0, 3)
      .map(repo => `
        <div class="repo-card">
          <div class="repo-header">
            <a href="${repo.url}" target="_blank" class="repo-name">${repo.name}</a>
            <div class="repo-stars">
              <span>⭐</span> ${repo.stars}
            </div>
          </div>
          ${repo.description ? `<div class="repo-desc">${FormatUtil.truncate(repo.description, 100)}</div>` : ''}
          <div class="repo-footer">
            <span class="repo-lang" style="color: ${repo.langColor}">
              <span class="lang-dot" style="background-color: ${repo.langColor}"></span>
              ${repo.language}
            </span>
            <span class="repo-commits">${repo.commits} commits</span>
          </div>
        </div>
      `)
      .join('');

    return `
      <div class="stat-card full-width">
        <div class="stat-label"><span class="stat-icon">📚</span> Top Repositories</div>
        <div class="repos-grid">${reposHTML}</div>
      </div>
    `;
  }
}

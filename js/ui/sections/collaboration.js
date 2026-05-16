// Collaboration Section - Code Reviews & Teamwork

class CollaborationSection {
  static render(snapshot) {
    const { collaboration } = snapshot;

    // Top reviewers
    const reviewersHTML = (collaboration?.topReviewers || [])
      .slice(0, 5)
      .map(reviewer => `
        <div class="collaborator-item">
          <img src="${reviewer.avatarUrl}" alt="${reviewer.username}" class="collaborator-avatar">
          <div class="collaborator-info">
            <div class="collaborator-name">@${reviewer.username}</div>
            <div class="collaborator-stat">${reviewer.reviewCount} reviews</div>
          </div>
        </div>
      `)
      .join('');

    return `
      <div class="stat-card full-width">
        <div class="stat-label"><span class="stat-icon">👥</span> Collaboration</div>

        <div class="collaboration-grid">
          <div class="collaboration-stat-box">
            <div class="collaboration-number">${collaboration.codeReviewCount}</div>
            <div class="collaboration-label">Code Reviews</div>
          </div>

          <div class="collaboration-stat-box">
            <div class="collaboration-number">${collaboration.topReviewers.length}</div>
            <div class="collaboration-label">Team Members</div>
          </div>

          <div class="collaboration-stat-box">
            <div class="collaboration-number">${collaboration.averageReviewsPerMonth.toFixed(1)}</div>
            <div class="collaboration-label">Reviews/Month</div>
          </div>
        </div>

        <div class="collaboration-section">
          <h3>Top Collaborators</h3>
          <div class="collaborators-list">${reviewersHTML || '<p class="empty-state">No collaboration data available</p>'}</div>
        </div>

        ${collaboration.mentionedUsers.length > 0 ? `
          <div class="collaboration-section">
            <h3>Mentioned Users</h3>
            <div class="mentioned-users">
              ${(collaboration?.mentionedUsers || []).slice(0, 10).map(u => `<span class="user-badge">@${u}</span>`).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
}

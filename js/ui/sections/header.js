// Header Section - Profile & Tenure Overview

class HeaderSection {
  static render(snapshot) {
    const { user, tenure } = snapshot;

    return `
      <div class="wrapped-header">
        <div class="header-content">
          <img src="${user.avatar_url}" alt="${user.login}" class="profile-avatar">
          <div class="header-info">
            <h1 class="username">@${user.login}</h1>
            ${user.name ? `<p class="user-name">${user.name}</p>` : ''}
            <p class="year-label">${tenure.durationMonths} Months in Code</p>
            <p class="tenure-dates">${DateUtil.format(tenure.startDate, 'long')} to ${DateUtil.format(tenure.endDate, 'long')}</p>
            ${user.bio ? `<p class="user-bio">${user.bio}</p>` : ''}
          </div>
        </div>
        ${user.location ? `<div class="header-meta"><span>📍 ${user.location}</span></div>` : ''}
      </div>
    `;
  }
}

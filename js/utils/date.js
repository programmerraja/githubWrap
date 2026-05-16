// Date Utilities

class DateUtil {
  // Format date as YYYY-MM-DD
  static format(date, style = 'short') {
    if (!date) return '';
    const d = new Date(date);

    if (style === 'short') {
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${d.getFullYear()}-${month}-${day}`;
    }

    if (style === 'long') {
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    if (style === 'month') {
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short'
      });
    }

    return d.toISOString();
  }

  // Get time ago string (e.g., "2 months ago")
  static timeAgo(date) {
    const now = new Date();
    const d = new Date(date);
    const diffMs = now - d;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffMonths / 12);

    if (diffYears > 0) return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
    if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    return 'just now';
  }

  // Get month name
  static monthName(monthIndex) {
    return MONTHS[monthIndex] || '';
  }

  // Get day name
  static dayName(dayIndex) {
    return DAYS[dayIndex] || '';
  }

  // Parse date from various formats
  static parse(dateStr) {
    if (!dateStr) return null;
    return new Date(dateStr);
  }
}

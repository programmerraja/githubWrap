// String & Number Formatting

class FormatUtil {
  // Format number with commas
  static number(num) {
    if (!num && num !== 0) return '0';
    return num.toLocaleString('en-US');
  }

  // Shorten number (e.g., 1500 -> 1.5K)
  static shortNumber(num) {
    if (!num && num !== 0) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  // Format percentage
  static percentage(value, total) {
    if (total === 0) return '0%';
    return Math.round((value / total) * 100) + '%';
  }

  // Truncate text with ellipsis
  static truncate(text, length = 50) {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  }

  // Capitalize first letter
  static capitalize(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  // Convert camelCase to Title Case
  static toTitleCase(text) {
    if (!text) return '';
    return text
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  }

  // Format bytes to human readable
  static bytes(num) {
    if (!num && num !== 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = num;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex += 1;
    }

    return size.toFixed(1) + ' ' + units[unitIndex];
  }

  // Pluralize word
  static plural(count, singular, plural = null) {
    if (count === 1) return singular;
    return plural || (singular + 's');
  }

  // Generate color gradient for heat map
  static getHeatmapColor(value, max) {
    if (value === 0) return '#ebedf0';
    const intensity = Math.min(value / max, 1);

    // Green gradient (GitHub style)
    const colors = ['#c6e48b', '#7bc96f', '#239a3b', '#196127'];
    const idx = Math.floor(intensity * (colors.length - 1));
    return colors[idx];
  }
}

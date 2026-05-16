// Snapshot builder - combines raw data with analysis

class Snapshot {
  constructor(rawData, analysis) {
    this.version = '1.0';
    this.generatedAt = new Date().toISOString();

    this.user = analysis.user;
    this.tenure = {
      startDate: this.formatDate(analysis.dateRange.startDate),
      endDate: this.formatDate(analysis.dateRange.endDate),
      durationMonths: this.calculateMonthsDifference(
        analysis.dateRange.startDate,
        analysis.dateRange.endDate
      )
    };

    this.metrics = analysis.metrics;
    this.languages = analysis.languages;
    // this.topFiles = analysis.topFiles; // DISABLED
    this.contributionGraph = analysis.contributionGraph;
    this.timePatterns = analysis.timePatterns;
    // this.highlights = analysis.highlights; // DISABLED
    this.collaboration = analysis.collaboration;
    // this.persona = analysis.persona; // DISABLED
    this.topRepositories = analysis.topRepositories;
  }

  // Convert to serializable object for JSON
  toJSON() {
    return {
      version: this.version,
      generatedAt: this.generatedAt,
      user: this.user,
      tenure: this.tenure,
      metrics: this.metrics,
      languages: this.languages,
      // topFiles: this.topFiles, // DISABLED
      contributionGraph: this.contributionGraph,
      timePatterns: this.timePatterns,
      // highlights: this.highlights, // DISABLED
      collaboration: this.collaboration,
      // persona: this.persona, // DISABLED
      topRepositories: this.topRepositories
    };
  }

  // Export as downloadable file
  download() {
    const json = JSON.stringify(this, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `github-wrapped-${this.user.login}-${this.tenure.endDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Static: Import from JSON
  static fromJSON(jsonString) {
    const data = JSON.parse(jsonString);
    const snapshot = Object.create(Snapshot.prototype);
    Object.assign(snapshot, data);
    return snapshot;
  }

  // Helper: Format date YYYY-MM-DD
  formatDate(date) {
    if (typeof date === 'string') return date;
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  }

  // Helper: Calculate months difference
  calculateMonthsDifference(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    let months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
    months += endDate.getMonth() - startDate.getMonth();
    return months;
  }
}

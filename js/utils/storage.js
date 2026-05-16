// Snapshot Storage - Download & Upload

class SnapshotStorage {
  // Download snapshot as JSON
  static downloadSnapshot(snapshot) {
    try {
      const json = JSON.stringify(snapshot, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `github-wrapped-${snapshot.user.login}-${snapshot.tenure.endDate}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      throw new Error('Failed to download snapshot');
    }
  }

  // Upload & parse snapshot from file
  static async uploadSnapshot(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = e.target.result;
          const snapshot = Snapshot.fromJSON(json);
          resolve(snapshot);
        } catch (error) {
          reject(new Error('Invalid JSON file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  // Validate snapshot structure
  static validateSnapshot(snapshot) {
    const required = ['user', 'tenure', 'metrics', 'languages', 'topFiles', 'contributionGraph'];
    return required.every(field => snapshot[field] !== undefined);
  }

  // Save to browser localStorage (limited size)
  static saveToLocalStorage(snapshot) {
    try {
      const json = JSON.stringify(snapshot, null, 2);
      if (json.length > 5 * 1024 * 1024) {
        throw new Error('Snapshot too large for localStorage');
      }
      localStorage.setItem(`snapshot_${snapshot.user.login}`, json);
    } catch (error) {
      console.warn('LocalStorage save failed:', error);
    }
  }

  // Load from browser localStorage
  static loadFromLocalStorage(username) {
    try {
      const json = localStorage.getItem(`snapshot_${username}`);
      if (json) {
        return Snapshot.fromJSON(json);
      }
    } catch (error) {
      console.warn('LocalStorage load failed:', error);
    }
    return null;
  }
}

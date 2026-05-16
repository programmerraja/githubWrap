// IndexedDB Cache Manager - stores raw API data
class CacheManager {
  static DB_NAME = 'GitHubWrappedDB';
  static STORE_NAME = 'rawData';
  static VERSION = 1;
  static CACHE_VALIDITY_DAYS = 7;

  static async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: 'username' });
        }
      };
    });
  }

  static async saveRawData(username, rawData) {
    const db = await this.initDB();
    const cachedData = {
      username,
      data: rawData,
      fetchedAt: new Date().toISOString(),
      isPartial: false
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(cachedData);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log(`💾 Cached data for ${username}`);
        resolve(cachedData);
      };
    });
  }

  static async getRawData(username) {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(username);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const cached = request.result;
        if (!cached) {
          resolve(null);
          return;
        }

        // Check if cache is still valid
        const fetchedAt = new Date(cached.fetchedAt);
        const now = new Date();
        const daysDiff = (now - fetchedAt) / (1000 * 60 * 60 * 24);

        if (daysDiff < this.CACHE_VALIDITY_DAYS) {
          console.log(`✅ Using cached data (${daysDiff.toFixed(1)} days old)`);
          resolve(cached);
        } else {
          console.log(`⏰ Cache expired (${daysDiff.toFixed(1)} days old)`);
          resolve(null);
        }
      };
    });
  }

  static async clearCache(username) {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(username);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log(`🗑️ Cleared cache for ${username}`);
        resolve(true);
      };
    });
  }

  static async savePartialData(username, rawData) {
    const db = await this.initDB();
    const cachedData = {
      username,
      data: rawData,
      fetchedAt: new Date().toISOString(),
      isPartial: true
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(cachedData);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(cachedData);
    });
  }

  static async saveIncrementalProgress(username, type, items, page) {
    const cached = await this.getRawData(username) || { data: { commits: [], prs: [], issues: [], repos: [] } };
    const rawData = cached.data;

    if (!rawData[type]) rawData[type] = [];
    rawData[type].push(...items);
    rawData[`${type}LastPage`] = page;

    return this.savePartialData(username, rawData);
  }

  static async getRateLimitResetTime() {
    const cached = sessionStorage.getItem('rateLimitReset');
    if (cached) {
      const resetTime = new Date(cached);
      const now = new Date();
      if (resetTime > now) {
        const waitMs = resetTime - now;
        return { resetTime, waitMs };
      }
    }
    return null;
  }

  static setRateLimitReset(resetTimestamp) {
    const resetDate = new Date(resetTimestamp * 1000);
    sessionStorage.setItem('rateLimitReset', resetDate.toISOString());
  }
}

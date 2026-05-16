// GitHub API Client

class GitHubAPI {
  constructor(username, token = null) {
    this.username = username;
    this.token = token;
    this.baseURL = CONFIG.GITHUB_API_BASE;
    this.rateLimitRemaining = 5000;
    this.rateLimitReset = null;
    this.requestCache = new Map(); // Cache responses to avoid duplicate calls
    this.progressCallback = null; // For UI progress updates
    this.totalRequests = 0;
    this.completedRequests = 0;
  }

  setProgressCallback(callback) {
    this.progressCallback = callback;
  }

  updateProgress(message) {
    if (typeof message === "object") {
      if (this.progressCallback) this.progressCallback(message);
      return;
    }

    this.completedRequests++;
    if (this.progressCallback) {
      const total = this.totalRequests || 100; // Fallback to avoid Infinity
      const percent = Math.min(
        99,
        Math.round((this.completedRequests / total) * 100),
      );

      this.progressCallback({
        message,
        completed: this.completedRequests,
        total: this.totalRequests,
        percent: percent,
      });
    }
  }

  // Helper: Make authenticated request with retry logic + caching
  async makeRequest(endpoint, params = {}, retries = 3) {
    const cacheKey = endpoint + JSON.stringify(params);

    // Return cached response if available
    if (this.requestCache.has(cacheKey)) {
      console.log(`💾 Cache hit: ${endpoint}`);
      return this.requestCache.get(cacheKey);
    }

    const url = new URL(`${this.baseURL}${endpoint}`);
    Object.keys(params).forEach((key) => {
      url.searchParams.append(key, params[key]);
    });

    const headers = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "GitHubWrapped",
    };

    if (this.token) {
      headers["Authorization"] = `token ${this.token}`;
    }

    try {
      console.log(`📡 API: GET ${endpoint}`);
      const response = await fetch(url, { headers });

      // Track rate limits
      const remaining = response.headers.get("X-RateLimit-Remaining");
      const reset = response.headers.get("X-RateLimit-Reset");
      if (remaining) this.rateLimitRemaining = parseInt(remaining);
      if (reset) this.rateLimitReset = parseInt(reset) * 1000;

      // Handle search rate limit (separate from core rate limit)
      const searchRemaining = response.headers.get(
        "X-RateLimit-Search-Remaining",
      );
      if (searchRemaining && parseInt(searchRemaining) === 0) {
        const searchReset =
          parseInt(response.headers.get("X-RateLimit-Search-Reset")) * 1000;
        const waitTime = Math.max(1000, searchReset - Date.now());
        console.warn(
          `⏳ Search rate limit hit. Waiting ${Math.round(waitTime / 1000)}s...`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime + 500));
        return this.makeRequest(endpoint, params, retries);
      }

      // Handle rate limit (429) or Secondary Rate Limit (403)
      if (response.status === 429 || response.status === 403) {
        const retryAfter = response.headers.get("Retry-After");
        const resetTime = response.headers.get("X-RateLimit-Reset");
        const body = await response.clone().json().catch(() => ({}));
        
        const isRateLimit = response.status === 429 || 
                          retryAfter || 
                          (body.message && body.message.toLowerCase().includes('rate limit'));

        if (isRateLimit) {
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 
                          (resetTime ? Math.max(1000, parseInt(resetTime) * 1000 - Date.now()) : 60000);
          const waitSec = (waitTime / 1000).toFixed(0);

          console.warn(`⏳ Rate limit hit. Waiting ${waitSec}s...`);
          if (this.progressCallback) {
            this.progressCallback({
              message: `GitHub Rate Limit hit. Waiting ${waitSec}s to resume...`,
              isWaiting: true,
              waitTime: waitSec
            });
          }

          await new Promise((resolve) => setTimeout(resolve, waitTime + 1000));
          return this.makeRequest(endpoint, params, retries);
        }
      }

      if (!response.ok) {
        if (response.status === 404)
          throw new Error(`User or resource not found`);
        if (response.status === 403) {
          const body = await response.clone().json().catch(() => ({}));
          if (body.message && body.message.includes('rate limit')) {
            // Should be handled above, but as a fallback:
            throw new Error('Rate limit exceeded (Secondary)');
          }
          throw new Error(`Access denied: ${body.message || 'Check your token scopes'}`);
        }
        if (response.status === 422) {
          const body = await response.clone().json().catch(() => ({}));
          throw new Error(`Invalid request: ${body.message || 'Check search parameters'}`);
        }
        if (response.status >= 500 && retries > 0) {
          console.warn(`⚠️ Server error (${response.status}). Retrying...`);
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (4 - retries)),
          );
          return this.makeRequest(endpoint, params, retries - 1);
        }
        throw new Error(`API error (${response.status})`);
      }

      const data = await response.json();
      console.log(
        `  ✓ Response: ${Array.isArray(data) ? data.length + " items" : "object"}, Rate: ${this.rateLimitRemaining}`,
      );

      // Cache successful response
      const cacheKey = endpoint + JSON.stringify(params);
      this.requestCache.set(cacheKey, data);

      return data;
    } catch (error) {
      console.error(`❌ API request failed: ${endpoint}`, error.message);
      throw error;
    }
  }

  // Helper: Make GraphQL request
  async makeGraphQLRequest(query, variables = {}) {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "GitHubWrapped",
    };

    if (this.token) {
      headers["Authorization"] = `token ${this.token}`;
    }

    try {
      console.log(`📡 GraphQL: Query`);
      const response = await fetch(CONFIG.GITHUB_GRAPHQL, {
        method: "POST",
        headers,
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        throw new Error(`GraphQL API error (${response.status})`);
      }

      const result = await response.json();
      if (result.errors) {
        console.error("❌ GraphQL errors:", result.errors);
        throw new Error(result.errors[0].message);
      }

      return result.data;
    } catch (error) {
      console.error(`❌ GraphQL request failed`, error.message);
      throw error;
    }
  }

  // Get user profile
  async getUser() {
    const endpoint = this.token ? "/user" : `/users/${this.username}`;
    const user = await this.makeRequest(endpoint);
    
    // Update username to the official login (handles case-sensitivity and nicknames)
    if (user.login) {
      console.log(`👤 Authenticated as: ${user.login}`);
      this.username = user.login;
    }

    // Warn if unauthenticated (low rate limit)
    if (!this.token && this.rateLimitRemaining < 50) {
      console.warn(
        `⚠️ UNAUTHENTICATED: ${this.rateLimitRemaining}/60 requests left. Add GitHub token for 5000/hour limit.`,
      );
    }

    return user;
  }

  // Get repositories (limited to recent ones to save API calls)
  // Get repositories (include orgs and private)
  async getAllRepositories(maxRepos = 500) {
    const repos = [];
    let page = 1;
    const maxPages = Math.ceil(maxRepos / CONFIG.ITEMS_PER_PAGE);

    while (
      page <= maxPages &&
      this.rateLimitRemaining >= CONFIG.RATE_LIMIT_BUFFER
    ) {
      const endpoint = this.token
        ? "/user/repos"
        : `/users/${this.username}/repos`;
      
      const params = {
        per_page: CONFIG.ITEMS_PER_PAGE,
        page: page,
        sort: "updated",
        direction: "desc"
      };

      if (this.token) {
        params.affiliation = "owner,collaborator,organization_member";
      } else {
        params.type = "all";
      }

      const data = await this.makeRequest(endpoint, params);

      if (data.length === 0) break;
      repos.push(...data);

      if (repos.length >= maxRepos) {
        repos.length = maxRepos;
        break;
      }
      page++;
    }

    console.log(
      `📦 Limited to ${repos.length} recent repos (max: ${maxRepos})`,
    );
    return repos;
  }

  // Get user's organizations
  async getOrganizations() {
    if (!this.token) return [];
    try {
      return await this.makeRequest("/user/orgs");
    } catch (error) {
      console.warn("⚠️ Failed to fetch organizations:", error.message);
      return [];
    }
  }

  // Search all commits by user across all repos
  async searchCommits(since, until, page = 1) {
    const q = `author:${this.username} committer-date:${this.formatDate(since)}..${this.formatDate(until)}`;
    return this.makeRequest("/search/commits", {
      q,
      per_page: CONFIG.ITEMS_PER_PAGE,
      page,
      sort: "committer-date",
      order: "desc",
    });
  }

  // Search all PRs or Issues by user
  async searchIssues(type, since, until, page = 1) {
    const typeQuery = type === "pr" ? "is:pr" : "is:issue";
    const q = `author:${this.username} ${typeQuery} created:${this.formatDate(since)}..${this.formatDate(until)}`;
    return this.makeRequest("/search/issues", {
      q,
      per_page: CONFIG.ITEMS_PER_PAGE,
      page,
      sort: "created",
      order: "desc",
    });
  }

  // Batch fetch PR reviews using GraphQL
  async batchGetPRReviews(prsWithRepos) {
    if (prsWithRepos.length === 0) return [];

    // Group by repo to minimize GraphQL queries (though we can do many in one)
    const queries = prsWithRepos.map((pr, index) => {
      const [owner, name] = pr.repoFullName.split("/");
      return `
        pr${index}: repository(owner: "${owner}", name: "${name}") {
          pullRequest(number: ${pr.number}) {
            reviews(first: 10, author: "${this.username}") {
              nodes {
                state
                createdAt
                body
              }
            }
          }
        }
      `;
    });

    const fullQuery = `query { ${queries.join("\n")} }`;
    const data = await this.makeGraphQLRequest(fullQuery);

    return prsWithRepos.map((pr, index) => {
      const reviews = data[`pr${index}`]?.pullRequest?.reviews?.nodes || [];
      return {
        ...pr,
        reviews,
        hasUserReview: reviews.length > 0,
      };
    });
  }

  // Get commits for a repository in a date range with author filter
  async getCommits(repoFullName, since, until, authorFilter = true) {
    const commits = [];
    let page = 1;
    const maxPages = 100; // Fetch ALL pages

    while (
      page <= maxPages &&
      this.rateLimitRemaining >= CONFIG.RATE_LIMIT_BUFFER
    ) {
      try {
        const params = {
          per_page: CONFIG.ITEMS_PER_PAGE,
          page: page,
          since: this.formatDate(since),
          until: this.formatDate(until),
        };

        // Filter by author to reduce API load
        if (authorFilter) {
          params.author = this.username;
        }

        const data = await this.makeRequest(
          `/repos/${repoFullName}/commits`,
          params,
        );

        if (data.length === 0) break;
        commits.push(...data);
        page++;
      } catch (error) {
        console.warn(`⚠️ Commits ${repoFullName}: ${error.message}`);
        break;
      }
    }

    return commits;
  }

  // Get detailed commit info (includes additions/deletions)
  async getCommitDetails(repoFullName, sha) {
    return this.makeRequest(`/repos/${repoFullName}/commits/${sha}`);
  }

  // Get pull requests for a repository (all pages, filtered by date and creator)
  async getPullRequests(repoFullName, since, until) {
    const prs = [];
    let page = 1;
    const maxPages = 100; // Fetch ALL pages

    while (
      page <= maxPages &&
      this.rateLimitRemaining >= CONFIG.RATE_LIMIT_BUFFER
    ) {
      try {
        const data = await this.makeRequest(`/repos/${repoFullName}/pulls`, {
          per_page: CONFIG.ITEMS_PER_PAGE,
          page: page,
          state: "all",
          sort: "updated",
        });

        if (data.length === 0) break;

        // Filter by date and creator
        const filtered = data.filter((pr) => {
          const prDate = new Date(pr.created_at);
          const isUserPR = pr.user?.login === this.username;
          return isUserPR && prDate >= since && prDate <= until;
        });

        prs.push(...filtered);

        // Stop if we found old PRs (assuming sorted by updated, but created may vary)
        const oldestInBatch = new Date(
          Math.min(...data.map((pr) => new Date(pr.created_at))),
        );
        if (oldestInBatch < since) break;

        page++;
      } catch (error) {
        console.warn(`⚠️ PRs ${repoFullName}: ${error.message}`);
        break;
      }
    }

    return prs;
  }

  // Get issues for a repository (all pages, filtered by date and creator)
  async getIssues(repoFullName, since, until) {
    const issues = [];
    let page = 1;
    const maxPages = 100; // Fetch ALL pages

    while (
      page <= maxPages &&
      this.rateLimitRemaining >= CONFIG.RATE_LIMIT_BUFFER
    ) {
      try {
        const data = await this.makeRequest(`/repos/${repoFullName}/issues`, {
          per_page: CONFIG.ITEMS_PER_PAGE,
          page: page,
          state: "all",
          sort: "updated",
        });

        if (data.length === 0) break;

        // Filter by date and creator (exclude PRs, they have pull_request property)
        const filtered = data.filter((issue) => {
          const issueDate = new Date(issue.created_at);
          const isUserIssue = issue.user?.login === this.username;
          const isPullRequest = !!issue.pull_request;
          return (
            isUserIssue &&
            !isPullRequest &&
            issueDate >= since &&
            issueDate <= until
          );
        });

        issues.push(...filtered);

        // Stop if we found old issues
        const oldestInBatch = new Date(
          Math.min(...data.map((issue) => new Date(issue.created_at))),
        );
        if (oldestInBatch < since) break;

        page++;
      } catch (error) {
        console.warn(`⚠️ Issues ${repoFullName}: ${error.message}`);
        break;
      }
    }

    return issues;
  }

  // Get pull request reviews
  async getPullRequestReviews(repoFullName, prNumber) {
    try {
      return await this.makeRequest(
        `/repos/${repoFullName}/pulls/${prNumber}/reviews`,
      );
    } catch (error) {
      return [];
    }
  }

  // Batch fetch reviews for multiple PRs
  async getPullRequestsWithReviews(prs, repoFullName) {
    const enrichedPRs = [];

    for (const pr of prs) {
      try {
        const reviews = await this.getPullRequestReviews(
          repoFullName,
          pr.number,
        );
        const userReviews = reviews.filter(
          (r) => r.user?.login === this.username,
        );

        enrichedPRs.push({
          ...pr,
          reviews: userReviews.length > 0 ? userReviews : [],
          hasUserReview: userReviews.length > 0,
        });

        if (this.progressCallback && Math.random() < 0.1) {
          // Update every ~10th PR
          this.updateProgress(
            `Fetched reviews for ${pr.title.substring(0, 40)}`,
          );
        }
      } catch (error) {
        enrichedPRs.push({ ...pr, reviews: [], hasUserReview: false });
      }

      if (this.isApproachingRateLimit()) {
        console.warn(`⏳ Rate limit approaching during review fetch`);
        break;
      }
    }

    return enrichedPRs;
  }

  // Helper: Format date for API
  formatDate(date) {
    if (typeof date === "string") return date;
    return date.toISOString().split("T")[0];
  }

  // Get rate limit status
  getRateLimitStatus() {
    return {
      remaining: this.rateLimitRemaining,
      resetTime: this.rateLimitReset ? new Date(this.rateLimitReset) : null,
    };
  }

  // Check if we're approaching rate limit
  isApproachingRateLimit() {
    return this.rateLimitRemaining < CONFIG.RATE_LIMIT_BUFFER;
  }

  async waitIfRateLimitApproaching() {
    if (this.rateLimitRemaining < CONFIG.RATE_LIMIT_BUFFER + 10) {
      const resetTime = new Date(this.rateLimitReset);
      const waitTime = Math.max(1000, resetTime - Date.now());
      console.warn(
        `⏳ Rate limit approaching (${this.rateLimitRemaining} left). Waiting...`,
      );
      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(waitTime, 60000)),
      ); // Max 60s wait
    }
  }
}

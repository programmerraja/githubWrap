// Data Extraction from GitHub API

class DataExtractor {
  async extractAll(api, startDate, endDate) {
    try {
      console.log('🔍 Extracting data from', startDate, 'to', endDate);

      const user = await api.getUser();
      console.log('👤 User:', user.login);

      const orgs = await api.getOrganizations();
      if (orgs.length > 0) {
        console.log('🏢 Organizations found:', orgs.map(o => o.login).join(', '));
      }

      // Check for partial data to resume
      const cached = await CacheManager.getRawData(user.login);
      let rawData = cached && cached.isPartial 
        ? cached.data 
        : { user, repos: [], commits: [], prs: [], issues: [], orgs };

      // 1. Fetch Repositories (if not already fetched)
      if (!rawData.repos || rawData.repos.length === 0) {
        api.updateProgress('Fetching repositories...');
        rawData.repos = await api.getAllRepositories(1000); // Higher limit for orgs
        await CacheManager.savePartialData(user.login, rawData);
      }
      console.log('📦 Repos found:', rawData.repos.length);

      // 2. Fetch Commits via Search API (Year by Year to bypass 1000 limit)
      if (!rawData.commitsFetched) {
        const years = this.getDateChunks(startDate, endDate);
        rawData.commits = rawData.commits || [];
        rawData.fetchedYears = rawData.fetchedYears || [];

        for (const chunk of years) {
          if (rawData.fetchedYears.includes(chunk.id)) continue;
          
          let page = 1;
          let hasMore = true;
          while (hasMore) {
            api.updateProgress(`Searching commits for ${chunk.id} (Page ${page})...`);
            try {
              const result = await api.searchCommits(chunk.start, chunk.end, page);
              if (!result || !result.items || result.items.length === 0) break;

              const items = result.items.map(c => ({
                ...c,
                repo: c.repository.name,
                repoFullName: c.repository.full_name
              }));
              
              rawData.commits.push(...items);
              if (items.length < CONFIG.ITEMS_PER_PAGE || page >= 33) { // Stop at ~1000 per chunk
                hasMore = false;
              } else {
                page++;
              }
            } catch (error) {
              if (error.message.includes('1000 search results')) {
                console.warn(`⚠️ Hit 1000 limit for ${chunk.id}. Some commits may be missing.`);
                hasMore = false;
              } else {
                throw error;
              }
            }
          }
          rawData.fetchedYears.push(chunk.id);
          await CacheManager.savePartialData(user.login, rawData);
        }
        rawData.commitsFetched = true;
        await CacheManager.savePartialData(user.login, rawData);
      }
      console.log('✨ Commits fetched:', rawData.commits?.length || 0);

      // 3. Fetch PRs via Search API
      if (!rawData.prsFetched) {
        let page = (rawData.prsLastPage || 0) + 1;
        let hasMore = true;

        while (hasMore) {
          api.updateProgress(`Searching pull requests (Page ${page})...`);
          try {
            const result = await api.searchIssues('pr', startDate, endDate, page);
            if (!result || !result.items || result.items.length === 0) break;

            const items = result.items.map(pr => ({
              ...pr,
              repo: pr.repository_url.split('/').pop(),
              repoFullName: pr.repository_url.split('/').slice(-2).join('/')
            }));

            rawData.prs = rawData.prs || [];
            rawData.prs.push(...items);
            rawData.prsLastPage = page;

            if (items.length < CONFIG.ITEMS_PER_PAGE || page >= 33) {
              hasMore = false;
              if (items.length >= CONFIG.ITEMS_PER_PAGE && page >= 33) {
                console.warn('⚠️ Hit 1000 limit for PRs. Consider a narrower date range.');
              }
            } else {
              page++;
            }
          } catch (error) {
            if (error.message.includes('1000 search results')) {
              hasMore = false;
            } else {
              throw error;
            }
          }
          await CacheManager.savePartialData(user.login, rawData);
        }
        rawData.prsFetched = true;
        await CacheManager.savePartialData(user.login, rawData);
      }
      console.log('✨ PRs fetched:', rawData.prs?.length || 0);

      // 4. Fetch Issues via Search API
      if (!rawData.issuesFetched) {
        let page = (rawData.issuesLastPage || 0) + 1;
        let hasMore = true;

        while (hasMore) {
          api.updateProgress(`Searching issues (Page ${page})...`);
          try {
            const result = await api.searchIssues('issue', startDate, endDate, page);
            if (!result || !result.items || result.items.length === 0) break;

            const items = result.items.map(issue => ({
              ...issue,
              repo: issue.repository_url.split('/').pop(),
              repoFullName: issue.repository_url.split('/').slice(-2).join('/')
            }));

            rawData.issues = rawData.issues || [];
            rawData.issues.push(...items);
            rawData.issuesLastPage = page;

            if (items.length < CONFIG.ITEMS_PER_PAGE || page >= 33) {
              hasMore = false;
            } else {
              page++;
            }
          } catch (error) {
            if (error.message.includes('1000 search results')) {
              hasMore = false;
            } else {
              throw error;
            }
          }
          await CacheManager.savePartialData(user.login, rawData);
        }
        rawData.issuesFetched = true;
        await CacheManager.savePartialData(user.login, rawData);
      }
      console.log('✨ Issues fetched:', rawData.issues?.length || 0);

      // 5. Enrich PRs with reviews (Batch GraphQL)
      if (!rawData.reviewsFetched && rawData.prs && rawData.prs.length > 0) {
        api.updateProgress('Fetching code reviews...');
        rawData.prs = await this.enrichPRsWithReviews(api, rawData.prs);
        rawData.reviewsFetched = true;
        await CacheManager.savePartialData(user.login, rawData);
      }

      console.log(`\n📊 Totals: ${rawData.commits?.length || 0} commits, ${rawData.prs?.length || 0} PRs, ${rawData.issues?.length || 0} issues`);

      return {
        ...rawData,
        extractedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Data extraction failed:', error);
      throw error;
    }
  }

  // Enrich PRs with review information using GraphQL batching
  async enrichPRsWithReviews(api, prs) {
    const enriched = [];
    const batchSize = 10;
    
    for (let i = 0; i < prs.length; i += batchSize) {
      const batch = prs.slice(i, i + batchSize);
      try {
        const batchResults = await api.batchGetPRReviews(batch);
        enriched.push(...batchResults);
      } catch (error) {
        console.warn('⚠️ Batch review fetch failed, falling back to empty reviews for this batch');
        enriched.push(...batch.map(pr => ({ ...pr, reviews: [], hasUserReview: false })));
      }
      
      if (i % 20 === 0) {
        api.updateProgress(`Enriching PRs with reviews (${i}/${prs.length})...`);
      }
    }

    return enriched;
  }

  // Split date range into yearly chunks to bypass 1000 limit
  getDateChunks(start, end) {
    const chunks = [];
    let current = new Date(start);
    const finalEnd = new Date(end);

    while (current < finalEnd) {
      const year = current.getFullYear();
      const chunkStart = new Date(current);
      const chunkEnd = new Date(Math.min(finalEnd, new Date(year, 11, 31, 23, 59, 59)));
      
      chunks.push({
        id: year.toString(),
        start: chunkStart,
        end: chunkEnd
      });

      current = new Date(year + 1, 0, 1);
    }
    return chunks;
  }

  // Extract language stats from repos
  static extractLanguages(repos) {
    const languageStats = {};
    let totalBytes = 0;

    repos.forEach(repo => {
      if (repo.language) {
        if (!languageStats[repo.language]) {
          languageStats[repo.language] = 0;
        }
        languageStats[repo.language] += repo.size || 0;
        totalBytes += repo.size || 0;
      }
    });

    return languageStats;
  }

  // Extract collaborators from PRs
  static extractCollaborators(prs, issues) {
    const collaborators = new Set();
    prs.forEach(pr => {
      if (pr.user && pr.user.login) collaborators.add(pr.user.login);
    });
    issues.forEach(issue => {
      if (issue.user && issue.user.login) collaborators.add(issue.user.login);
    });
    return Array.from(collaborators);
  }
}

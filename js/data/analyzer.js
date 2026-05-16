// Data Analysis & Metric Computation

class DataAnalyzer {
  // Main analysis function
  static analyzeAll(rawData) {
    console.log('📈 Analyzing data:', {
      repos: rawData.repos.length,
      commits: rawData.commits.length,
      prs: rawData.prs.length,
      issues: rawData.issues.length
    });

    const startDate = rawData.commits.length > 0
      ? new Date(Math.min(...rawData.commits.map(c => new Date(c.commit.author.date))))
      : new Date(rawData.user.created_at);
    const endDate = rawData.commits.length > 0
      ? new Date(Math.max(...rawData.commits.map(c => new Date(c.commit.author.date))))
      : new Date();

    console.log('📅 Date range:', startDate, 'to', endDate);

    return {
      user: rawData.user,
      dateRange: { startDate, endDate },
      metrics: this.computeMetrics(rawData),
      languages: this.analyzeLanguages(rawData.repos),
      // topFiles: this.analyzeTopFiles(rawData.commits), // DISABLED
      contributionGraph: this.buildContributionGraph(rawData.commits, startDate, endDate),
      timePatterns: this.analyzeTimePatterns(rawData.commits),
      highlights: this.detectHighlights(rawData.commits, rawData.prs),
      collaboration: this.analyzeCollaboration(rawData.prs, rawData.commits, startDate, endDate),
      persona: this.detectPersona(rawData.commits, rawData.prs),
      topRepositories: this.getTopRepositories(rawData.repos, rawData.commits)
    };
  }

  // Compute basic metrics
  static computeMetrics(rawData) {
    const commits = rawData.commits || [];
    const prs = rawData.prs || [];
    const issues = rawData.issues || [];

    // Count user's own PRs & issues (created by user)
    const userPRs = prs.filter(pr => pr.user?.login === rawData.user.login);
    const userIssues = issues.filter(issue => issue.user?.login === rawData.user.login);

    // Count reviews (PRs where user left reviews)
    const userReviews = prs.filter(pr => pr.hasUserReview).length;

    return {
      totalCommits: commits.length,
      totalPRs: userPRs.length,
      totalIssues: userIssues.length,
      codeReviewCount: userReviews,
      repositoriesContributedTo: new Set(commits.map(c => c.repo)).size,
      longestCommitStreak: this.calculateCommitStreak(commits),
      averageCommitMessageLength: commits.length > 0
        ? commits.reduce((sum, c) => sum + (c.commit.message || '').length, 0) / commits.length
        : 0
    };
  }

  // Analyze languages
  static analyzeLanguages(repos) {
    const languageStats = {};
    let totalBytes = 0;

    repos.forEach(repo => {
      if (repo.language && !repo.fork) {
        if (!languageStats[repo.language]) {
          languageStats[repo.language] = 0;
        }
        languageStats[repo.language] += repo.size || 0;
        totalBytes += repo.size || 0;
      }
    });

    if (totalBytes === 0) return [];

    // Convert to percentage & add colors
    return Object.entries(languageStats)
      .map(([name, bytes]) => ({
        name,
        bytes,
        percentage: Math.round((bytes / totalBytes) * 100),
        color: CONFIG.LANGUAGE_COLORS[name] || '#858585'
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 10); // Top 10 languages
  }

  // DISABLED: Analyze top files (not needed for current version)
  // static analyzeTopFiles(commits) {
  //   const fileStats = {};
  //   commits.forEach(commit => {
  //     if (commit.files) {
  //       commit.files.forEach(file => {
  //         if (!fileStats[file.filename]) {
  //           fileStats[file.filename] = {
  //             path: file.filename,
  //             commits: 0,
  //             additions: 0,
  //             deletions: 0
  //           };
  //         }
  //         fileStats[file.filename].commits += 1;
  //         fileStats[file.filename].additions += file.additions || 0;
  //         fileStats[file.filename].deletions += file.deletions || 0;
  //       });
  //     }
  //   });
  //   return Object.values(fileStats)
  //     .sort((a, b) => b.commits - a.commits)
  //     .slice(0, CONFIG.MAX_ITEMS_IN_SECTION.topFiles);
  // }

  // Build contribution graph (GitHub heatmap style)
  static buildContributionGraph(commits, startDate, endDate) {
    const graph = {};

    // Initialize all dates in range
    let current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      graph[dateStr] = 0;
      current.setDate(current.getDate() + 1);
    }

    // Count commits per day
    commits.forEach(commit => {
      const commitDate = commit.commit.author.date.split('T')[0];
      if (graph[commitDate] !== undefined) {
        graph[commitDate] += 1;
      }
    });

    // Group by weeks
    const weeks = [];
    let week = [];
    current = new Date(startDate);
    current.setDate(current.getDate() - current.getDay()); // Start from Sunday

    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const level = this.getContributionLevel(graph[dateStr] || 0);

      week.push({
        date: dateStr,
        count: graph[dateStr] || 0,
        level
      });

      if (week.length === 7) {
        weeks.push({ days: [...week] });
        week = [];
      }

      current.setDate(current.getDate() + 1);
    }

    if (week.length > 0) {
      weeks.push({ days: week });
    }

    return {
      year: startDate.getFullYear(),
      weeks
    };
  }

  static getContributionLevel(count) {
    if (count === 0) return 'l0';
    if (count < 5) return 'l1';
    if (count < 10) return 'l2';
    if (count < 20) return 'l3';
    return 'l4';
  }

  // Analyze time patterns
  static analyzeTimePatterns(commits) {
    const monthStats = new Array(12).fill(0);
    const dayStats = new Array(7).fill(0);
    const hourStats = new Array(24).fill(0);

    commits.forEach(commit => {
      const date = new Date(commit.commit.author.date);
      monthStats[date.getMonth()] += 1;
      dayStats[date.getDay()] += 1;
      hourStats[date.getHours()] += 1;
    });

    // Find peaks
    const mostActiveMonthIdx = monthStats.indexOf(Math.max(...monthStats));
    const mostActiveDayIdx = dayStats.indexOf(Math.max(...dayStats));
    const mostActiveHourIdx = hourStats.indexOf(Math.max(...hourStats));

    return {
      mostActiveMonth: MONTHS[mostActiveMonthIdx],
      mostActiveMonthCount: monthStats[mostActiveMonthIdx],
      mostActiveDay: DAYS[mostActiveDayIdx],
      mostActiveHour: mostActiveHourIdx,
      commitsPerMonth: monthStats,
      commitsPerDay: dayStats,
      commitsPerHour: hourStats
    };
  }

  // Detect highlights (biggest commits, shipped features)
  static detectHighlights(commits, prs) {
    const biggestCommits = commits
      .filter(c => c.additions > 0 || c.deletions > 0)
      .sort((a, b) => (b.additions + b.deletions) - (a.additions + a.deletions))
      .slice(0, CONFIG.MAX_ITEMS_IN_SECTION.biggestCommits)
      .map(c => ({
        hash: c.sha.substring(0, 7),
        message: (c.commit.message || '').split('\n')[0],
        date: c.commit.author.date,
        additions: c.additions || 0,
        deletions: c.deletions || 0,
        repo: c.repo,
        url: c.html_url
      }));
    const shippedFeatures = this.detectShippedFeatures(commits, prs)
      .slice(0, CONFIG.MAX_ITEMS_IN_SECTION.shippedFeatures);
    return { biggestCommits, shippedFeatures };
  }

  static detectShippedFeatures(commits, prs) {
    const features = [];
    commits.forEach(commit => {
      const message = (commit.commit.message || '').toLowerCase();
      const isFeature = CONFIG.FEATURE_KEYWORDS.some(kw => message.includes(kw));
      if (isFeature) {
        features.push({
          title: (commit.commit.message || '').split('\n')[0],
          description: `Shipped on ${new Date(commit.commit.author.date).toLocaleDateString()}`,
          date: commit.commit.author.date,
          repo: commit.repo,
          score: (commit.additions || 0) + 100
        });
      }
    });
    prs.forEach(pr => {
      if (pr.merged_at && pr.title) {
        features.push({
          title: pr.title,
          description: `Merged on ${new Date(pr.merged_at).toLocaleDateString()}`,
          date: pr.merged_at,
          repo: pr.repo,
          score: pr.additions || 0
        });
      }
    });
    return features
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, CONFIG.MAX_ITEMS_IN_SECTION.shippedFeatures);
  }

  // Analyze collaboration using PR reviews
  static analyzeCollaboration(prs, commits, startDate, endDate) {
    const reviewsGiven = [];

    // Track reviews user has GIVEN (PRs created by others that user reviewed)
    prs.forEach(pr => {
      if (pr.hasUserReview && pr.reviews && pr.reviews.length > 0) {
        // User reviewed this PR
        reviewsGiven.push({
          prTitle: pr.title,
          prAuthor: pr.user?.login,
          reviewCount: pr.reviews.length,
          repo: pr.repo
        });

        // For now, don't track who reviewed, since we want user's review activity
      }
    });

    // Mentioned users in commits
    const mentionedUsers = new Set();
    commits.forEach(commit => {
      const matches = (commit.commit.message || '').match(/@[\w-]+/g) || [];
      matches.forEach(m => mentionedUsers.add(m.substring(1)));
    });

    // Count user's code reviews
    const userCodeReviewCount = reviewsGiven.reduce((sum, r) => sum + r.reviewCount, 0);

    // Calculate actual months from date range
    let months = 1;
    if (startDate && endDate) {
      months = Math.max(
        1,
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
          (endDate.getMonth() - startDate.getMonth())
      );
    }

    // Top collaborators (people whose PRs user reviewed)
    const collaborators = {};
    reviewsGiven.forEach(review => {
      if (review.prAuthor) {
        if (!collaborators[review.prAuthor]) {
          collaborators[review.prAuthor] = 0;
        }
        collaborators[review.prAuthor] += review.reviewCount;
      }
    });

    const topCollaborators = Object.entries(collaborators)
      .map(([username, reviewCount]) => ({
        username,
        reviewCount,
        avatarUrl: `https://avatars.githubusercontent.com/${username}`
      }))
      .sort((a, b) => b.reviewCount - a.reviewCount)
      .slice(0, CONFIG.MAX_ITEMS_IN_SECTION.topReviewers);

    return {
      topReviewers: topCollaborators,
      reviewsGiven: userCodeReviewCount,
      mentionedUsers: Array.from(mentionedUsers),
      codeReviewCount: userCodeReviewCount,
      averageReviewsPerMonth: months > 0 ? userCodeReviewCount / months : 0
    };
  }

  // Detect developer persona
  static detectPersona(commits, prs) {
    const metrics = {
      bugFixes: 0,
      refactors: 0,
      features: 0,
      nightOwl: 0,
      consistent: 0
    };
    commits.forEach(commit => {
      const msg = (commit.commit.message || '').toLowerCase();
      const hour = new Date(commit.commit.author.date).getHours();
      if (CONFIG.BUGFIX_KEYWORDS.some(kw => msg.includes(kw))) metrics.bugFixes += 1;
      if (CONFIG.REFACTOR_KEYWORDS.some(kw => msg.includes(kw))) metrics.refactors += 1;
      if (CONFIG.FEATURE_KEYWORDS.some(kw => msg.includes(kw))) metrics.features += 1;
      if (hour >= 22 || hour <= 6) metrics.nightOwl += 1;
    });
    metrics.consistent = commits.length / 30;
    let persona, title, emoji;
    if (metrics.bugFixes > metrics.features) {
      title = 'The Debugger';
      emoji = '🔍';
    } else if (metrics.refactors > metrics.features * 0.5) {
      title = 'The Refactor King';
      emoji = '👑';
    } else if (metrics.nightOwl > commits.length * 0.4) {
      title = 'The Night Owl';
      emoji = '🦉';
    } else if (prs.length > commits.length * 0.3) {
      title = 'The Collaborator';
      emoji = '👥';
    } else if (metrics.consistent > 15) {
      title = 'The Speedster';
      emoji = '⚡';
    } else {
      title = 'The Architect';
      emoji = '🏗️';
    }
    return {
      title,
      emoji,
      description: CONFIG.PERSONAS[title]?.description || 'A dedicated developer'
    };
  }

  // Get top repositories
  static getTopRepositories(repos, commits) {
    const commitsByRepo = {};
    commits.forEach(c => {
      commitsByRepo[c.repo] = (commitsByRepo[c.repo] || 0) + 1;
    });

    return repos
      .filter(r => !r.fork && commitsByRepo[r.name])
      .map(r => ({
        name: r.name,
        stars: r.stargazers_count || 0,
        description: r.description || '',
        language: r.language || 'Unknown',
        langColor: CONFIG.LANGUAGE_COLORS[r.language] || '#858585',
        url: r.html_url,
        commits: commitsByRepo[r.name],
        prs: 0
      }))
      .sort((a, b) => b.commits - a.commits)
      .slice(0, 10);
  }

  // Helper: Calculate longest commit streak
  static calculateCommitStreak(commits) {
    if (commits.length === 0) return 0;

    const commitDates = new Set();
    commits.forEach(c => {
      const date = c.commit.author.date.split('T')[0];
      commitDates.add(date);
    });

    const sortedDates = Array.from(commitDates).sort();
    let maxStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak += 1;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    return maxStreak;
  }
}

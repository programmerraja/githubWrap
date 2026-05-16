# GitHub Wrapped — Development Guide

Complete guide to building the full-featured GitHub tenure snapshot product.

---

## 1. PROJECT OVERVIEW

**Product**: Developer tenure snapshot generator
- Input: GitHub username, optional token, tenure date range
- Output: Interactive web view + PDF export + JSON snapshot
- Architecture: Frontend-only, no backend
- Tech: Vanilla JS, html2pdf, GitHub API v3

---

## 2. PROJECT STRUCTURE

```
githubWrap/
├── index.html                 # Main HTML shell
├── js/
│   ├── main.js               # App orchestration & initialization
│   ├── api/
│   │   └── github.js         # GitHub API client
│   ├── data/
│   │   ├── extractor.js      # Raw data fetching
│   │   ├── analyzer.js       # Data transformation & analysis
│   │   └── snapshot.js       # JSON snapshot format
│   ├── ui/
│   │   ├── input-form.js     # Username/token/date input
│   │   ├── results.js        # Results page rendering
│   │   ├── sections/
│   │   │   ├── header.js
│   │   │   ├── contribution-graph.js
│   │   │   ├── stats.js
│   │   │   ├── code-footprint.js
│   │   │   ├── time-patterns.js
│   │   │   ├── highlights.js
│   │   │   ├── collaboration.js
│   │   │   ├── persona.js
│   │   │   ├── top-repos.js
│   │   │   └── cta.js
│   │   └── pdf-generator.js  # HTML → PDF conversion
│   ├── utils/
│   │   ├── storage.js        # JSON upload/download
│   │   ├── date.js           # Date utilities
│   │   ├── format.js         # String formatting
│   │   └── color-map.js      # Language → color mapping
│   └── config.js             # Constants, API endpoints
├── css/
│   ├── main.css              # Styles (from current index.html)
│   └── responsive.css        # Mobile optimizations
├── data/
│   └── language-colors.json  # Language hex colors
└── DEVELOPMENT.md            # This file
```

---

## 3. TECH STACK & DEPENDENCIES

### Core Libraries
```html
<!-- In index.html head -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
```

**No npm/build step required** — everything vanilla JS, all loaded in browser.

### Why These Choices
- **Vanilla JS**: No build tools, instant deployment as static site
- **html2pdf**: Converts DOM to PDF client-side, works offline
- **GitHub API v3**: REST API, well-documented, free tier sufficient

---

## 4. DATA MODEL & JSON SNAPSHOT

This is the core data structure users download and re-upload.

```javascript
{
  "version": "1.0",
  "generatedAt": "2026-05-10T14:30:00Z",
  "user": {
    "username": "octocat",
    "name": "The Octocat",
    "avatarUrl": "https://...",
    "bio": "There once was...",
    "location": "San Francisco"
  },
  "tenure": {
    "startDate": "2021-01-15",
    "endDate": "2024-05-10",
    "durationMonths": 40
  },
  "metrics": {
    "totalCommits": 1245,
    "totalPRs": 87,
    "totalReviews": 156,
    "totalIssues": 34,
    "totalLOCAdded": 45230,
    "totalLOCDeleted": 12340,
    "repositoriesContributedTo": 23
  },
  "languages": [
    { "name": "JavaScript", "percentage": 35, "color": "#f1e05a", "bytes": 156000 },
    { "name": "Python", "percentage": 25, "color": "#3572A5", "bytes": 112000 }
    // ... more languages
  ],
  "topRepositories": [
    {
      "name": "awesome-project",
      "stars": 245,
      "description": "The best project ever",
      "language": "JavaScript",
      "url": "https://github.com/octocat/awesome-project",
      "commits": 234,
      "prs": 12
    }
    // ... more repos
  ],
  "contributionGraph": {
    "year": 2024,
    "weeks": [
      {
        "days": [
          { "date": "2024-01-01", "count": 5, "level": 2 },
          // ... 7 days per week
        ]
      }
      // ... 52 weeks
    ]
  },
  "timePatterns": {
    "mostActiveMonth": "March",
    "mostActiveMonthCount": 156,
    "mostActiveDay": "Tuesday",
    "mostActiveHour": 14,
    "commitsPerMonth": { "January": 45, "February": 67, ... },
    "commitsPerDay": { "Monday": 234, "Tuesday": 245, ... },
    "commitsPerHour": { "0": 5, "1": 3, ..., "23": 42 }
  },
  "highlights": {
    "biggestCommits": [
      {
        "hash": "abc123",
        "message": "Refactor auth system",
        "date": "2023-06-15",
        "additions": 450,
        "deletions": 320,
        "repo": "main-app"
      }
      // ... top 10
    ],
    "shippedFeatures": [
      {
        "title": "Dark mode support",
        "description": "Detected from: 'feat: dark mode' commits",
        "date": "2023-08-20",
        "repo": "main-app",
        "commits": 12
      }
      // ... top 5
    ]
  },
  "collaboration": {
    "topReviewers": [
      { "username": "alice", "reviewCount": 45, "avatarUrl": "https://..." },
      { "username": "bob", "reviewCount": 32, "avatarUrl": "https://..." }
    ],
    "reviewedBy": [
      { "username": "charlie", "reviewCount": 28 }
    ],
    "mentionedUsers": ["alice", "bob", "charlie"],
    "codeReviewCount": 156,
    "averageReviewsPerMonth": 3.9
  },
  "persona": {
    "title": "The Debugger",
    "emoji": "🔍",
    "description": "You find and fix the bugs others miss",
    "reasoning": "High review count + consistent commits"
  }
}
```

---

## 5. USER FLOW (DETAILED)

### Flow 1: New User (Enter Username)

```
1. User lands on page
   ↓
2. Input form shows: "GitHub Username"
   ↓
3. User enters "octocat"
   ↓
4. Click "Generate"
   ↓
5. Fetch public repos & commits (no token needed)
   ↓
6. Auto-detect first commit date = tenure start
   ↓
7. Show: "Found your work from Jan 15, 2021 to today (May 10, 2024). Edit dates?"
   ↓
8. User clicks "Continue" or edits dates
   ↓
9. Fetch full data & analyze
   ↓
10. Render results page with all 10 sections
   ↓
11. User downloads JSON + PDF
```

### Flow 2: New User (Enter Username + Token)

```
Same as Flow 1, but:
- Step 5: User pastes GitHub Personal Access Token
- Fetch includes: private repos, detailed commit metadata
- More complete metrics (private repo contributions visible)
```

### Flow 3: Returning User (Upload JSON)

```
1. User lands on page
   ↓
2. Input form shows: "Upload JSON Snapshot"
   ↓
3. User selects previous JSON file
   ↓
4. Parse JSON in memory
   ↓
5. Instantly render results page (no API calls)
   ↓
6. User can download new PDF, adjust theme, re-download
```

---

## 6. IMPLEMENTATION GUIDE BY SECTION

### 6.1 INPUT FORM (`js/ui/input-form.js`)

**Responsibilities:**
- Render input fields (username, optional token, date range)
- Handle auto-detect tenure start
- Validate inputs
- Trigger data fetching

**Key Functions:**
```javascript
class InputForm {
  render()              // Draw form UI
  getFormData()         // Return { username, token, startDate, endDate }
  autoDetectTenureStart() // Fetch first commit date
  validateInputs()      // Check username format, date logic
  onSubmit()            // Trigger main.js to start fetching
}
```

### 6.2 GITHUB API CLIENT (`js/api/github.js`)

**Responsibilities:**
- Wrap GitHub API calls
- Handle token/non-token requests
- Manage rate limiting & errors

**Key Functions:**
```javascript
class GitHubAPI {
  constructor(username, token = null)
  
  // User data
  async getUser()           // @octocat
  async getPublicRepos()    // All public repos
  async getUserRepos()      // User + contributed repos
  
  // Commit data
  async getCommits(repo, since, until) // All commits in range
  async getCommitDetails(repo, sha)    // Single commit (additions/deletions)
  
  // PR & Review data
  async getPullRequests(repo, since, until)
  async getIssues(repo, since, until)
  async getPullRequestReviews(repo, prNumber)
  
  // Helpers
  async makeRequest(endpoint, params = {})
  handleRateLimit()
  formatDate(date)
}
```

**Implementation Notes:**
- Use `since` & `until` query params to filter by date
- GitHub API pagination: fetch up to 30 items per page, iterate
- Cache results in memory (user only generates once per session)

### 6.3 DATA EXTRACTOR & ANALYZER (`js/data/extractor.js` + `js/data/analyzer.js`)

**Extractor:** Raw API → structured data
```javascript
class DataExtractor {
  async extractUserData(api, username)     // User profile
  async extractRepositories(api)           // All repos
  async extractCommits(api, repos, since, until)
  async extractPRs(api, repos, since, until)
  async extractReviews(api, repos, since, until)
}
```

**Analyzer:** Structured data → insights
```javascript
class DataAnalyzer {
  analyzeLanguages(repos)              // { name, percentage, color, bytes }
  analyzeTimePatterns(commits)         // Most active month/day/hour
  analyzeHighlights(commits, prs)      // Biggest commits, shipped features
  analyzeCollaboration(reviews, prs)   // Top reviewers, code review stats
  detectPersona(metrics)               // Badge & persona based on patterns
  
  // Helpers for feature detection:
  detectShippedFeatures(commits)       // Parse feat:, release:, etc.
  detectMajorRefactors(commits)        // Large commits with refactor keywords
  scoreCommit(commit)                  // Size + message analysis
}
```

**Feature Detection Logic** (Highlights section):
```javascript
// Pattern matching on commit messages:
const featureKeywords = ['feat:', 'feature', 'new', 'launch', 'release'];
const refactorKeywords = ['refactor', 'cleanup', 'reorganize', 'migrate'];

// Heuristic: size-based
if (commit.additions > 200 && commit.deletions < 100) {
  // Likely a feature (net additions, few removals)
}

// Heuristic: impact
if (commit.additions > 500 || commit.deletions > 500) {
  // Major change regardless of message
}
```

### 6.4 SNAPSHOT STORAGE (`js/utils/storage.js`)

**Responsibilities:**
- Download JSON snapshot to user's device
- Accept uploaded JSON & validate format

**Key Functions:**
```javascript
class SnapshotStorage {
  downloadSnapshot(data)     // Trigger browser download of JSON
  uploadSnapshot()           // File input → parse JSON
  validateSnapshot(data)     // Check version, required fields
  exportAsJSON(data)         // Serialize cleanly
  importFromJSON(text)       // Parse & return data object
}
```

### 6.5 RESULTS PAGE & SECTIONS

Each section is its own module in `js/ui/sections/`:

```javascript
class HeaderSection {
  render(data) // Returns HTML for profile + tenure
}

class ContributionGraphSection {
  render(data) // Generates heatmap grid
}

class StatsSection {
  render(data) // Metrics cards (commits, PRs, reviews, etc.)
}

class CodeFootprintSection {
  render(data) // Languages pie chart, top files table
}

class TimePatternsSection {
  render(data) // Most active month/day/hour, sparklines
}

class HighlightsSection {
  render(data) // Top commits, shipped features
}

class CollaborationSection {
  render(data) // Top reviewers, code review stats
}

class PersonaSection {
  render(data) // Developer badge + description
}

class TopReposSection {
  render(data) // Top 3 repos cards
}

class CTASection {
  render(data) // Download PDF, share, upload next time
}
```

Each returns HTML string. Results.js combines them:
```javascript
class ResultsPage {
  async render(snapshot) {
    const sections = [
      new HeaderSection().render(snapshot),
      new ContributionGraphSection().render(snapshot),
      // ... all 10 sections
    ];
    
    document.getElementById('content').innerHTML = sections.join('');
    this.attachEventListeners();
  }
}
```

### 6.6 PDF GENERATION (`js/ui/pdf-generator.js`)

**Responsibilities:**
- Convert rendered HTML to PDF
- Handle multi-page layout

**Key Functions:**
```javascript
class PDFGenerator {
  generatePDF() {
    // 1. Get the rendered HTML from DOM
    const element = document.getElementById('capture-area');
    
    // 2. Use html2pdf to convert
    const options = {
      margin: 10,
      filename: `github-wrapped-${username}-${year}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };
    
    html2pdf().set(options).from(element).save();
  }
}
```

**Design Considerations:**
- CSS should have print-friendly styles (@media print)
- Sections should break cleanly across pages
- Images (avatars, charts) should be base64-encoded or cached

---

## 7. MAIN ORCHESTRATION (`js/main.js`)

Ties everything together:

```javascript
class App {
  constructor() {
    this.api = null;
    this.snapshot = null;
  }
  
  async init() {
    // 1. Check if user uploaded JSON
    const uploadedJSON = this.checkForUploadedFile();
    if (uploadedJSON) {
      // Flow 3: Returning user
      return this.renderFromSnapshot(uploadedJSON);
    }
    
    // Flow 1/2: New user
    this.renderInputForm();
  }
  
  renderInputForm() {
    const form = new InputForm();
    form.onSubmit = (username, token, startDate, endDate) => {
      this.generateSnapshot(username, token, startDate, endDate);
    };
  }
  
  async generateSnapshot(username, token, startDate, endDate) {
    // 1. Initialize GitHub API
    this.api = new GitHubAPI(username, token);
    
    // 2. Extract raw data
    const extractor = new DataExtractor();
    const rawData = await extractor.extractAll(this.api, startDate, endDate);
    
    // 3. Analyze data
    const analyzer = new DataAnalyzer();
    const metrics = analyzer.analyzeAll(rawData);
    
    // 4. Build snapshot
    this.snapshot = new Snapshot(rawData, metrics);
    
    // 5. Render results
    const resultsPage = new ResultsPage();
    await resultsPage.render(this.snapshot);
    
    // 6. Attach PDF & download handlers
    new PDFGenerator().attachButton();
    new SnapshotStorage().attachDownloadButton(this.snapshot);
  }
  
  renderFromSnapshot(snapshotJSON) {
    // Parse JSON
    this.snapshot = JSON.parse(snapshotJSON);
    
    // Render results directly
    const resultsPage = new ResultsPage();
    resultsPage.render(this.snapshot);
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
```

---

## 8. CODE ORGANIZATION BEST PRACTICES

### 8.1 File Size & Responsibility

- **One class per file** (except utils)
- **Max 300 lines per file** (break into smaller modules if larger)
- **Clear naming**: `github.js` (API client), `extractor.js` (data fetching), `analyzer.js` (analysis)

### 8.2 Dependencies & Imports

Use simple script tags in `index.html`:
```html
<script src="js/config.js"></script>
<script src="js/utils/storage.js"></script>
<script src="js/api/github.js"></script>
<script src="js/data/extractor.js"></script>
<script src="js/data/analyzer.js"></script>
<script src="js/data/snapshot.js"></script>
<script src="js/ui/sections/header.js"></script>
<!-- ... all sections ... -->
<script src="js/ui/results.js"></script>
<script src="js/ui/pdf-generator.js"></script>
<script src="js/main.js"></script>
```

**Order matters**: Config first, then utils, then API, then data, then UI, then main.

### 8.3 Error Handling

Wrap API calls:
```javascript
async getUser() {
  try {
    const response = await fetch(`${this.baseURL}/users/${this.username}`, {
      headers: { 'Authorization': `token ${this.token}` }
    });
    
    if (!response.ok) {
      if (response.status === 404) throw new Error('User not found');
      if (response.status === 403) throw new Error('Rate limit exceeded');
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error; // Let main.js handle UI feedback
  }
}
```

In main.js:
```javascript
async generateSnapshot(username, token, startDate, endDate) {
  try {
    // ... fetching & analyzing ...
  } catch (error) {
    const form = document.getElementById('input-section');
    form.innerHTML = `<div class="error">${error.message}</div>`;
    // Show input form again so user can retry
  }
}
```

### 8.4 Data Flow Diagram

```
┌─────────────┐
│  index.html │ (main HTML shell)
└──────┬──────┘
       │
       ├─→ InputForm (user enters username/token/dates)
       │
       ├─→ main.js (orchestrator)
       │   ├─→ github.js (API client)
       │   │   └─→ fetch data from GitHub
       │   │
       │   ├─→ extractor.js (structure data)
       │   │   └─→ raw data object
       │   │
       │   ├─→ analyzer.js (analyze & compute)
       │   │   └─→ metrics & insights
       │   │
       │   ├─→ snapshot.js (combine)
       │   │   └─→ JSON snapshot
       │   │
       │   └─→ ResultsPage (render UI)
       │       ├─→ header.js
       │       ├─→ contribution-graph.js
       │       ├─→ stats.js
       │       ├─→ code-footprint.js
       │       ├─→ time-patterns.js
       │       ├─→ highlights.js
       │       ├─→ collaboration.js
       │       ├─→ persona.js
       │       ├─→ top-repos.js
       │       └─→ cta.js
       │
       └─→ PDF/JSON Export (user downloads)
```

---

## 9. GITHUB API CHEAT SHEET

### Public Data (No Token Required)
```
GET /users/{username}
GET /users/{username}/repos
GET /repos/{owner}/{repo}/commits?since=2024-01-01&until=2024-12-31
```

### With Token (More Complete)
```
GET /user/repos (includes private)
GET /repos/{owner}/{repo}/commits (faster rate limit)
GET /user/issues?state=all (user's issues)
GET /user/pulls?state=all (user's PRs)
GET /repos/{owner}/{repo}/pulls/{number}/reviews
```

### Rate Limits
- **Without token**: 60 requests/hour
- **With token**: 5,000 requests/hour
- **Check remaining**: response headers include `X-RateLimit-Remaining`

---

## 10. TESTING CHECKLIST BEFORE LAUNCH

- [ ] Test with public user (no token)
- [ ] Test with private repos (with token)
- [ ] Test date range filtering
- [ ] Test auto-detect tenure start
- [ ] Test PDF generation (multi-page)
- [ ] Test JSON download & re-upload
- [ ] Test all 4 themes (Dark, Light, Cyber, Sunset)
- [ ] Test mobile responsiveness
- [ ] Test error handling (invalid username, rate limit)
- [ ] Performance: test with high-activity user (1000+ commits)

---

## 11. DEPLOYMENT

**Option A: GitHub Pages (Free)**
```bash
git push origin main
# Enable Pages in repo settings → Deploy from main branch
# Site: https://username.github.io/githubWrap/
```

**Option B: Vercel (Free)**
```bash
npm i -g vercel
vercel
# Auto-deploys on git push
```

**Option C: Static Hosting (Netlify, Firebase)**
- Just `git push` to trigger auto-deploy

**All options**: Zero backend needed, instant global CDN.

---

## 12. NEXT STEPS FOR DEVELOPER

1. **Create file structure** above in your repo
2. **Implement `js/api/github.js`** first (core API client)
3. **Implement `js/data/extractor.js`** (fetch & structure)
4. **Implement `js/data/analyzer.js`** (compute metrics)
5. **Implement each section** in `js/ui/sections/`
6. **Implement `js/ui/results.js`** (combine & render)
7. **Implement `js/main.js`** (orchestration)
8. **Test thoroughly** with real users
9. **Deploy** to GitHub Pages

---

**Ready to code? Start with `js/api/github.js` — that's the foundation for everything else.**

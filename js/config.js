// Configuration & Constants

const CONFIG = {
  GITHUB_API_BASE: 'https://api.github.com',
  GITHUB_GRAPHQL: 'https://api.github.com/graphql',

  // API Limits
  ITEMS_PER_PAGE: 30,
  MAX_PAGES: 100, // Max 3000 items per endpoint

  // Feature Detection
  FEATURE_KEYWORDS: ['feat:', 'feature', 'new', 'launch', 'release', 'add', 'implement'],
  REFACTOR_KEYWORDS: ['refactor', 'cleanup', 'reorganize', 'migrate', 'rewrite', 'restructure'],
  BUGFIX_KEYWORDS: ['fix:', 'bug', 'issue', 'crash', 'error', 'patch'],

  // Contribution Graph
  CONTRIBUTION_LEVELS: {
    0: { label: 'l0', count: 0 },
    1: { label: 'l1', count: 1 },
    2: { label: 'l2', count: 5 },
    3: { label: 'l3', count: 10 },
    4: { label: 'l4', count: 20 }
  },

  // Personas
  PERSONAS: {
    'The Debugger': { emoji: '🔍', description: 'You find and fix the bugs others miss' },
    'The Architect': { emoji: '🏗️', description: 'You design systems others build upon' },
    'The Speedster': { emoji: '⚡', description: 'Your commits are lightning fast and consistent' },
    'The Collaborator': { emoji: '👥', description: 'You make your team better every day' },
    'The Night Owl': { emoji: '🦉', description: 'You code when the world sleeps' },
    'The DevOps Wizard': { emoji: '⚙️', description: 'You keep the infrastructure running smoothly' },
    'The Polyglot': { emoji: '🗣️', description: 'You master multiple languages with ease' },
    'The Refactor King': { emoji: '👑', description: 'You leave code cleaner than you found it' }
  },

  // Language Colors (subset - expand as needed)
  LANGUAGE_COLORS: {
    'JavaScript': '#f1e05a',
    'TypeScript': '#2b7489',
    'Python': '#3572A5',
    'Java': '#b07219',
    'C++': '#f34b7d',
    'C#': '#239120',
    'Go': '#00ADD8',
    'Rust': '#ce422b',
    'Ruby': '#cc342d',
    'PHP': '#777bb4',
    'Swift': '#FA7343',
    'Kotlin': '#F18E33',
    'Shell': '#89e051',
    'HTML': '#e34c26',
    'CSS': '#563d7c',
    'SCSS': '#c6538c',
    'SQL': '#e38c00',
    'JSON': '#292929',
    'Markdown': '#083fa1',
    'YAML': '#cb171e'
  },

  // Batch request settings
  BATCH_SIZE: 5, // Concurrent requests
  RATE_LIMIT_BUFFER: 5, // Keep 5 requests as safety buffer

  // UI
  MAX_ITEMS_IN_SECTION: {
    topRepos: 10,
    biggestCommits: 10,
    shippedFeatures: 5,
    topReviewers: 5,
  }
};

// Month names
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

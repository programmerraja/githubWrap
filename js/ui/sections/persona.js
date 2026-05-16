// Persona Section - Developer Badge

class PersonaSection {
  static render(snapshot) {
    const { persona } = snapshot;
    if (!persona) return '';

    return `
      <div class="stat-card full-width persona-card">
        <div class="stat-label"><span class="stat-icon">🎭</span> Your Developer Persona</div>

        <div class="persona-display">
          <div class="persona-emoji">${persona.emoji || '💻'}</div>
          <div class="persona-content">
            <h2 class="persona-title">${persona.title || 'The Developer'}</h2>
            <p class="persona-description">${persona.description || 'You write code that changes the world.'}</p>
          </div>
        </div>
      </div>
    `;
  }
}

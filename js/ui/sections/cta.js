// CTA Section - Call-to-Action for Download & Share

class CTASection {
  static render(snapshot) {
    return `
      <div class="cta-section">
        <div class="cta-content">
          <h2>Save Your Snapshot</h2>
          <p>Download your snapshot as JSON to keep forever, or generate a PDF to share with your team.</p>
        </div>

        <div class="cta-buttons">
          <button id="download-json-btn" class="cta-button primary">
            <span>💾</span> Download JSON
          </button>
          <button id="download-pdf-btn" class="cta-button secondary">
            <span>📄</span> Download PDF
          </button>
          <button id="share-btn" class="cta-button secondary">
            <span>🔗</span> Copy Share Link
          </button>
        </div>

        <div class="cta-footer">
          <p class="cta-subtitle">Upload your JSON anytime to regenerate your snapshot</p>
        </div>
      </div>
    `;
  }
}

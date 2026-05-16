// PDF Generator - Export snapshot to PDF

class PDFGenerator {
  static async generatePDF(username, date) {
    try {
      const element = document.getElementById("capture-area");
      if (!element) throw new Error("Capture area not found");

      const opt = {
        margin: 10,
        filename: `github-wrapped-${username}-${date}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
      };

      // Show loading state
      const btn = document.getElementById("download-pdf-btn");
      const originalText = btn.innerHTML;
      btn.innerHTML = "<span>⏳</span> Generating PDF...";
      btn.disabled = true;

      // Generate PDF
      await html2pdf().set(opt).from(element).save();

      // Restore button
      btn.innerHTML = originalText;
      btn.disabled = false;
    } catch (error) {
      console.error("PDF generation failed:", error);
    }
  }
}

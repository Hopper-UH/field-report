import { Report } from '../types';

declare const html2canvas: any;
declare const jspdf: any;

export const generatePDF = async (report: Report, containerId: string) => {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Select all pages within the container (Main report + Image pages)
  const pages = container.querySelectorAll('.report-page');

  if (pages.length === 0) {
    alert('No report pages found to generate.');
    return;
  }

  try {
    const { jsPDF } = jspdf;
    // A4 dimensions in mm: 210 x 297
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = 210;
    const pdfHeight = 297;

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i] as HTMLElement;

      // Add a new page for every element after the first one
      if (i > 0) {
        pdf.addPage();
      }

      // Capture the DOM element
      const canvas = await html2canvas(page, {
        scale: 2, // Higher resolution for better quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff', // Ensure white background
        windowWidth: page.scrollWidth,
        windowHeight: page.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      const imgProps = pdf.getImageProperties(imgData);
      
      // Calculate height to fit width (keeping aspect ratio)
      const pdfImageHeight = (imgProps.height * pdfWidth) / imgProps.width;

      // If the image is taller than A4, we might need to fit it, 
      // but for this specific "Report Page" design, we assume it fits or scales down.
      // We render it at (0,0) covering the width.
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfImageHeight);
    }
    
    const fileName = `${report.projectName.replace(/\s+/g, '_')}_${report.date}_Report.pdf`;
    pdf.save(fileName);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try using the browser print option.');
  }
};
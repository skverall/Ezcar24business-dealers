/**
 * PDF Generation Service
 *
 * Provides methods to generate PDF from inspection reports.
 * Uses Supabase Edge Function as a proxy to external PDF rendering services.
 */

import { supabase } from '@/lib/supabase';
import html2pdf from 'html2pdf.js';

export interface PDFGenerationOptions {
  reportSlug?: string;
  reportId?: string;
}

export interface PDFGenerationResult {
  success: boolean;
  pdfUrl?: string;
  printUrl?: string;
  error?: string;
  message?: string;
}

/**
 * Generate PDF using Supabase Edge Function
 */
export async function generatePDF(options: PDFGenerationOptions): Promise<PDFGenerationResult> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-pdf', {
      body: options
    });

    if (error) {
      console.error('PDF generation error:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate PDF'
      };
    }

    // If we got a PDF buffer back
    if (data instanceof ArrayBuffer || data instanceof Blob) {
      const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      return {
        success: true,
        pdfUrl: url
      };
    }

    // If we got a printUrl back (fallback mode)
    if (data?.printUrl) {
      return {
        success: true,
        printUrl: data.printUrl,
        message: data.message
      };
    }

    return {
      success: false,
      error: 'Unexpected response from PDF service'
    };

  } catch (error: any) {
    console.error('PDF generation failed:', error);
    return {
      success: false,
      error: error.message || 'PDF generation failed'
    };
  }
}

/**
 * Client-side PDF generation using browser print
 * Opens the report in print mode in a new window
 */
export function generatePDFClientSide(reportSlug: string): void {
  const printUrl = `${window.location.origin}/report/${reportSlug}?print=true`;

  // Open in new window with print dialog
  const printWindow = window.open(printUrl, '_blank');

  if (printWindow) {
    // Wait for page to load, then trigger print
    printWindow.addEventListener('load', () => {
      setTimeout(() => {
        printWindow.print();
      }, 1000);
    });
  }
}

/**
 * Download PDF from blob URL
 */
export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate PDF directly without print dialog
 * Opens report in hidden iframe, renders to PDF, downloads automatically
 */
export async function generatePDFDirect(reportSlug: string, reportData?: any): Promise<{success: boolean, error?: string}> {
  try {
    // Create a hidden iframe to load the print-optimized version
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    // Load the print-optimized URL
    const printUrl = `${window.location.origin}/report/${reportSlug}?print=true`;

    return new Promise((resolve) => {
      iframe.onload = async () => {
        try {
          // Wait a bit for all content to load (images, etc.)
          await new Promise(r => setTimeout(r, 2000));

          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (!iframeDoc) {
            throw new Error('Cannot access iframe content');
          }

          // Get the report element
          const element = iframeDoc.body;

          // Generate filename
          const carInfo = reportData?.brand && reportData?.model
            ? `${reportData.year || ''}_${reportData.brand}_${reportData.model}`.replace(/\s+/g, '_')
            : 'Inspection_Report';
          const filename = `EZCAR24_${carInfo}_${reportSlug.slice(0, 8)}.pdf`;

          // Configure PDF options
          const opt = {
            margin: [10, 10, 10, 10],
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
              scale: 2,
              useCORS: true,
              logging: false,
              letterRendering: true,
              allowTaint: true,
              backgroundColor: '#ffffff'
            },
            jsPDF: {
              unit: 'mm',
              format: 'a4',
              orientation: 'portrait',
              compress: true
            },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
          };

          // Generate and download PDF
          await html2pdf().set(opt).from(element).save();

          // Cleanup
          document.body.removeChild(iframe);
          resolve({ success: true });

        } catch (error: any) {
          console.error('PDF generation error:', error);
          document.body.removeChild(iframe);
          resolve({ success: false, error: error.message });
        }
      };

      iframe.onerror = () => {
        document.body.removeChild(iframe);
        resolve({ success: false, error: 'Failed to load report' });
      };

      iframe.src = printUrl;
    });

  } catch (error: any) {
    console.error('PDF direct download error:', error);
    return { success: false, error: error.message };
  }
}

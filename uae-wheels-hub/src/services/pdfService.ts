/**
 * PDF Generation Service
 *
 * Provides methods to generate PDF from inspection reports.
 * Uses Supabase Edge Function as a proxy to external PDF rendering services.
 */

import { supabase } from '@/lib/supabase';

const sanitizeFilePart = (value: string) =>
  value
    .toString()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '');

const buildReportFileName = (reportSlug?: string, reportData?: any) => {
  const parts = [
    reportData?.year,
    reportData?.brand || reportData?.make,
    reportData?.model,
    reportData?.vin ? reportData.vin.slice(-6) : null
  ]
    .filter(Boolean)
    .map((value) => sanitizeFilePart(String(value)));

  const baseName = parts.length
    ? `EZCAR24_${parts.join('_')}`
    : reportSlug
      ? `EZCAR24_${sanitizeFilePart(reportSlug)}`
      : 'EZCAR24_Report';

  return `${baseName}.pdf`;
};

const triggerObjectUrlDownload = (url: string, filename: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Give the browser a moment to start the download before revoking
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};

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
      body: options,
      responseType: 'arrayBuffer'
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
      const buffer = data instanceof Blob ? await data.arrayBuffer() : data;
      const decoder = new TextDecoder();
      const preview = decoder.decode(buffer.slice(0, 200)).trim();

      // Some environments return JSON (fallback) even when responseType is arraybuffer
      if (preview.startsWith('{')) {
        try {
          const json = JSON.parse(decoder.decode(buffer));
          if (json?.printUrl) {
            return {
              success: true,
              printUrl: json.printUrl,
              message: json.message
            };
          }
          if (json?.error) {
            return { success: false, error: json.error };
          }
        } catch (_) {
          // Ignore parse errors and treat as PDF
        }
      }

      const blob = data instanceof Blob ? data : new Blob([buffer], { type: 'application/pdf' });
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
  const printUrl = `${window.location.origin}/report/${reportSlug}?print=true&pdf=1`;

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
  triggerObjectUrlDownload(url, filename);
}

/**
 * Generate PDF directly by opening print dialog
 * More reliable than html2pdf.js for complex layouts
 */
export async function generatePDFDirect(reportSlug: string, reportData?: any): Promise<{success: boolean, error?: string, usedFallback?: boolean}> {
  try {
    const filename = buildReportFileName(reportSlug, reportData);
    const pdfResult = await generatePDF({ reportSlug });

    if (pdfResult.success && pdfResult.pdfUrl) {
      triggerObjectUrlDownload(pdfResult.pdfUrl, filename);
      return { success: true, usedFallback: false };
    }

    const printUrl = pdfResult.printUrl || `${window.location.origin}/report/${reportSlug}?print=true&pdf=1`;
    const printWindow = window.open(printUrl, '_blank', 'width=1200,height=900');

    if (!printWindow) {
      return { success: false, error: 'Popup blocked' };
    }

    // Wait for page to load, then trigger print
    printWindow.addEventListener('load', () => {
      setTimeout(() => {
        printWindow.print();
      }, 1000);
    });
    printWindow.addEventListener('afterprint', () => {
      printWindow.close();
    });

    return { success: true, usedFallback: true, error: pdfResult.error };

  } catch (error: any) {
    console.error('PDF generation error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * PDF Generation Service
 *
 * Provides methods to generate PDF from inspection reports.
 * Uses Supabase Edge Function as a proxy to external PDF rendering services.
 */

import { supabase } from '@/lib/supabase';

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
 * Generate PDF directly by opening print dialog
 * More reliable than html2pdf.js for complex layouts
 */
export async function generatePDFDirect(reportSlug: string, reportData?: any): Promise<{success: boolean, error?: string}> {
  try {
    // Open print-optimized version in new window
    const printUrl = `${window.location.origin}/report/${reportSlug}?print=true`;
    const printWindow = window.open(printUrl, '_blank', 'width=1200,height=900');

    if (!printWindow) {
      return { success: false, error: 'Popup blocked' };
    }

    // Wait for page to load, then trigger print
    printWindow.addEventListener('load', () => {
      setTimeout(() => {
        printWindow.print();
      }, 2000);
    });

    return { success: true };

  } catch (error: any) {
    console.error('PDF generation error:', error);
    return { success: false, error: error.message };
  }
}

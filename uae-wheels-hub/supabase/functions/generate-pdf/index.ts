// Supabase Edge Function: generate-pdf
// Generates a PDF from a published car inspection report using an external rendering service
// This function acts as a secure proxy to external PDF generation services

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ReqBody = {
  reportSlug?: string;
  reportId?: string;
};

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: ReqBody = {};
  try {
    body = await req.json();
  } catch (_) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { reportSlug, reportId } = body;
  if (!reportSlug && !reportId) {
    return new Response(JSON.stringify({ error: "Missing reportSlug or reportId" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const pdfApiKey = Deno.env.get("PDF_SERVICE_API_KEY"); // API key for external PDF service
  const pdfServiceUrl = Deno.env.get("PDF_SERVICE_URL"); // URL of PDF rendering service

  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // Verify report exists and is published
    let query = supabase
      .from('inspection_reports')
      .select('id, share_slug, status, make, model, year');

    if (reportSlug) {
      query = query.eq('share_slug', reportSlug);
    } else if (reportId) {
      query = query.eq('id', reportId);
    }

    const { data: report, error: reportError } = await query.single();

    if (reportError || !report) {
      return new Response(JSON.stringify({ error: "Report not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (report.status !== 'frozen') {
      return new Response(JSON.stringify({ error: "Report must be published before generating PDF" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Construct the URL to render
    const baseUrl = Deno.env.get("PUBLIC_SITE_URL") || "https://www.ezcar24.com";
    const renderUrl = `${baseUrl}/report/${report.share_slug}?print=true`;

    console.log('Generating PDF for URL:', renderUrl);

    // Option 1: Use external PDF service (Browserless, PDFShift, etc.)
    if (pdfServiceUrl && pdfApiKey) {
      const pdfResponse = await fetch(pdfServiceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pdfApiKey}`
        },
        body: JSON.stringify({
          url: renderUrl,
          options: {
            format: 'A4',
            printBackground: true,
            margin: {
              top: '20mm',
              right: '15mm',
              bottom: '20mm',
              left: '15mm'
            },
            waitUntil: 'networkidle0',
            waitForSelector: '[data-pdf-ready="true"]'
          }
        })
      });

      if (!pdfResponse.ok) {
        throw new Error(`PDF service returned ${pdfResponse.status}`);
      }

      const pdfBuffer = await pdfResponse.arrayBuffer();
      const filename = `ezcar24-report-${report.make}-${report.model}-${report.year}.pdf`
        .toLowerCase()
        .replace(/\s+/g, '-');

      return new Response(pdfBuffer, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // Option 2: Fallback - Return URL for client-side generation
    // (Using window.print() or html2pdf.js on the frontend)
    return new Response(JSON.stringify({
      printUrl: renderUrl,
      message: "PDF service not configured. Use print URL for client-side generation.",
      reportInfo: {
        make: report.make,
        model: report.model,
        year: report.year,
        slug: report.share_slug
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to generate PDF",
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

import { next } from '@vercel/edge';

export const config = {
    matcher: '/report/:path*',
};

export default async function middleware(request: Request) {
    const url = new URL(request.url);
    const userAgent = request.headers.get('user-agent') || '';

    // 1. Check if it's a social bot
    const isBot = /bot|googlebot|crawler|spider|robot|crawling|facebookexternalhit|whatsapp|telegram|twitterbot|slackbot|discordbot/i.test(userAgent);

    // If not a bot and not requesting the specific route pattern, continue
    if (!isBot) {
        return next();
    }

    // 2. Extract slug
    // Path is like /report/SLUG
    const match = url.pathname.match(/\/report\/([^\/]+)/);
    if (!match) return next();

    const slug = match[1];

    // 3. Environment Variables
    // In Vercel Edge, these are accessed via process.env if configured
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.warn('Missing Supabase env vars in middleware');
        return next();
    }

    try {
        // 4. Fetch Report Data via Supabase REST API
        // We select the report and the linked listing data
        const apiUrl = `${SUPABASE_URL}/rest/v1/reports?share_slug=eq.${slug}&select=*,listing:listings(year,make,model,title)`;

        const response = await fetch(apiUrl, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Supabase fetch failed', response.status);
            return next();
        }

        const data = await response.json();
        const report = data?.[0];

        // If no report found, just serve default
        if (!report) return next();

        // 5. Construct Metadata
        // Default fallback
        let title = 'EZCAR24 - Premium Car Inspection';
        let description = 'View detailed 150+ point inspection report.';
        let image = 'https://www.ezcar24.com/favicon-192.png?v=2'; // Fallback image

        // Dynamic data
        if (report.listing) {
            const year = report.listing.year || '';
            const make = report.listing.make || '';
            const model = report.listing.model || '';
            title = `${year} ${make} ${model} - Inspection Report`.trim();
            if (!title) title = report.listing.title || 'Car Inspection Report';
        } else if (report.vin) {
            title = `Vehicle Inspection: ${report.vin}`;
        }

        if (report.overall_condition) {
            const condition = report.overall_condition.charAt(0).toUpperCase() + report.overall_condition.slice(1);
            description = `Condition: ${condition}. Verified by EZCAR24. Tap to see full details and photos.`;
        }

        // Try to get the first photo if available
        // We need to fetch photos? or relies on the report object having them?
        // The query above select=* includes columns but not relations unless specified. 
        // Let's iterate: to get photos we need another join or separate query.
        // For speed, let's try to fetch photos in the same query:
        // select=*,listing:listings(...),photos:report_photos(storage_path,sort_order)
        // BUT we already ran the query. Let's optimize in next edit if needed.
        // For now, let's stick to the main image or just title.

        // NOTE: Generating a dynamic image would be better, but title is the user's main request.

        // 6. Return HTML with OG Tags
        const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>${title}</title>
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${description}" />
        <meta property="og:image" content="${image}" />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${title}" />
        <meta name="twitter:description" content="${description}" />
        <meta name="twitter:image" content="${image}" />
        <!-- Redirect regular users just in case -->
        <meta http-equiv="refresh" content="0;url=${request.url}" />
      </head>
      <body>
         <h1>${title}</h1>
         <p>${description}</p>
         <img src="${image}" alt="Preview" style="max-width:100%;" />
         <p>Redirecting to report...</p>
      </body>
      </html>
    `;

        return new Response(html, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });

    } catch (err) {
        console.error('Middleware error:', err);
        return next();
    }
}

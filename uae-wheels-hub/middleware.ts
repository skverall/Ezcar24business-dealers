import { next } from '@vercel/edge';

export const config = {
    matcher: [
        '/report/:path*',
        '/en/report/:path*',
        '/ar/report/:path*',
    ],
};

export default async function middleware(request: Request) {
    const url = new URL(request.url);
    const userAgent = request.headers.get('user-agent') || '';

    // 1. Check if it's a social bot
    const isBot = /bot|googlebot|crawler|spider|robot|crawling|facebookexternalhit|whatsapp|telegram|twitterbot|slackbot|discordbot/i.test(userAgent);

    // If not a bot, continue
    if (!isBot) {
        return next();
    }

    // 2. Extract slug
    // Path is like /report/SLUG or /en/report/SLUG
    const match = url.pathname.match(/\/report\/([^\/]+)/);
    if (!match) return next();

    const slug = match[1];

    // 3. Environment Variables
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.warn('Missing Supabase env vars in middleware');
        return next();
    }

    try {
        // 4. Fetch Report Data via Supabase RPC
        // We use the same RPC as the public report page to ensure we can access the data
        const apiUrl = `${SUPABASE_URL}/rest/v1/rpc/get_report_by_slug`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ p_slug: slug })
        });

        if (!response.ok) {
            console.error('Supabase RPC fetch failed', response.status);
            return next();
        }

        const rawData = await response.json();
        // RPC might return the object directly or an array depending on definition
        const report = Array.isArray(rawData) ? rawData[0] : rawData;

        // If no report found or empty, just serve default
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

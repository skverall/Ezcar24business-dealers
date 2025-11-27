import { supabase } from '@/integrations/supabase/client';

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

export const generateSitemap = async (): Promise<string> => {
  const baseUrl = 'https://ezcar24.com';
  const urls: SitemapUrl[] = [];

  // Static pages
  const staticPages = [
    { path: '/', changefreq: 'daily' as const, priority: 1.0 },
    { path: '/browse', changefreq: 'daily' as const, priority: 0.9 },
    { path: '/about', changefreq: 'monthly' as const, priority: 0.7 },
    { path: '/privacy-policy', changefreq: 'yearly' as const, priority: 0.5 },
    { path: '/terms-of-service', changefreq: 'yearly' as const, priority: 0.5 },
    { path: '/cookie-policy', changefreq: 'yearly' as const, priority: 0.5 },
  ];

  staticPages.forEach(page => {
    urls.push({
      loc: `${baseUrl}${page.path}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: page.changefreq,
      priority: page.priority,
    });
  });

  try {
    // Fetch all active car listings
    const { data: listings, error } = await supabase
      .from('listings')
      .select('id, updated_at, status')
      .eq('status', 'active')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching listings for sitemap:', error);
    } else if (listings) {
      // Add car detail pages
      listings.forEach(listing => {
        urls.push({
          loc: `${baseUrl}/car/${listing.id}`,
          lastmod: new Date(listing.updated_at).toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: 0.8,
        });
      });
    }
  } catch (error) {
    console.error('Error generating sitemap:', error);
  }

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return xml;
};

export const downloadSitemap = async () => {
  try {
    const sitemapXml = await generateSitemap();
    const blob = new Blob([sitemapXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sitemap.xml';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Error downloading sitemap:', error);
    return false;
  }
};

// Function to update sitemap.xml file (for development)
export const updateSitemapFile = async () => {
  try {
    const sitemapXml = await generateSitemap();
    console.log('Generated sitemap.xml:');
    console.log(sitemapXml);
    return sitemapXml;
  } catch (error) {
    console.error('Error updating sitemap:', error);
    return null;
  }
};

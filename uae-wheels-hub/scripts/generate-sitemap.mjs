#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

const SITE_URL = process.env.VITE_SITE_URL || 'https://ezcar24.com';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.warn('[sitemap] Missing Supabase env (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Skipping dynamic sitemap.');
  process.exit(0);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

async function fetchListings() {
  const { data, error } = await supabase
    .from('listings')
    .select('id, updated_at')
    .eq('moderation_status', 'approved')
    .eq('status', 'active')
    .eq('is_draft', false)
    .is('deleted_at', null)
    .limit(5000);

  if (error) {
    console.warn('[sitemap] Failed to fetch listings:', error.message);
    return [];
  }
  return data || [];
}

function formatDate(d) {
  try { return new Date(d).toISOString().slice(0, 10); } catch { return '2024-01-01'; }
}

function buildXml(staticUrls, listingUrls) {
  const urls = [...staticUrls, ...listingUrls];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

function urlNode(loc, { lastmod = '2024-01-01', changefreq = 'daily', priority = '0.7' } = {}) {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

async function main() {
  const staticPages = [
    urlNode(`${SITE_URL}/`, { lastmod: '2024-01-01', changefreq: 'daily', priority: '1.0' }),
    urlNode(`${SITE_URL}/browse`, { lastmod: '2024-01-01', changefreq: 'daily', priority: '0.9' }),
    urlNode(`${SITE_URL}/about`, { lastmod: '2024-01-01', changefreq: 'monthly', priority: '0.7' }),
    urlNode(`${SITE_URL}/privacy-policy`, { lastmod: '2024-01-01', changefreq: 'yearly', priority: '0.5' }),
    urlNode(`${SITE_URL}/terms-of-service`, { lastmod: '2024-01-01', changefreq: 'yearly', priority: '0.5' }),
    urlNode(`${SITE_URL}/cookie-policy`, { lastmod: '2024-01-01', changefreq: 'yearly', priority: '0.5' }),
  ];

  const listings = await fetchListings();
  const listingNodes = listings.map(l => urlNode(`${SITE_URL}/car/${l.id}`, {
    lastmod: formatDate(l.updated_at || new Date().toISOString()),
    changefreq: 'weekly',
    priority: '0.8'
  }));

  const xml = buildXml(staticPages, listingNodes);
  const outPath = path.resolve(process.cwd(), 'public', 'sitemap.xml');
  fs.writeFileSync(outPath, xml, 'utf-8');
  console.log(`[sitemap] Wrote ${outPath} with ${listingNodes.length} listing URLs.`);
}

main().catch(err => {
  console.error('[sitemap] Error:', err);
  process.exit(1);
});


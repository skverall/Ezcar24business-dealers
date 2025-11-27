/**
 * Image URL utility for handling Supabase storage URLs through proxy
 */

const ORIGINAL_SUPABASE_URL = 'https://haordpdxyyreliyzmire.supabase.co';
const PROXY_URL = 'https://supabaseproxy.aydmaxx.workers.dev';

export function toOriginalSupabaseUrl(url: string): string {
  if (!url) return url;
  return url.replace(PROXY_URL, ORIGINAL_SUPABASE_URL);
}

/**
 * Convert Supabase storage URL to proxy URL
 * @param url Original Supabase storage URL
 * @returns Proxied URL
 */
export function getProxiedImageUrl(url: string): string {
  if (!url) return url;
  
  // If URL already uses proxy, return as is
  if (url.includes(PROXY_URL)) {
    return url;
  }
  
  // Replace original Supabase URL with proxy URL
  if (url.includes(ORIGINAL_SUPABASE_URL)) {
    return url.replace(ORIGINAL_SUPABASE_URL, PROXY_URL);
  }
  
  // If it's a relative URL or different format, return as is
  return url;
}

/**
 * Process an array of listing images to use proxy URLs
 * @param images Array of listing images
 * @returns Array with proxied URLs
 */
export function processListingImages(images: any[]): any[] {
  if (!images || !Array.isArray(images)) return images;
  
  return images.map(image => ({
    ...image,
    url: getProxiedImageUrl(image.url)
  }));
}

/**
 * Process a single listing object to use proxy URLs for images
 * @param listing Listing object with listing_images
 * @returns Listing with proxied image URLs
 */
export function processListingWithImages(listing: any): any {
  if (!listing) return listing;
  
  const processed = { ...listing };
  
  // Process listing_images array if it exists
  if (processed.listing_images) {
    processed.listing_images = processListingImages(processed.listing_images);
  }
  
  return processed;
}

/**
 * Image URL utility for handling Supabase storage URLs through proxy
 */

const ORIGINAL_SUPABASE_URL = 'https://haordpdxyyreliyzmire.supabase.co';
// Legacy proxy URL (no longer used). Kept for backwards compatibility with stored URLs.
const LEGACY_PROXY_URL = 'https://supabaseproxy.aydmaxx.workers.dev';

export function toOriginalSupabaseUrl(url: string): string {
  if (!url) return url;
  return url.replace(LEGACY_PROXY_URL, ORIGINAL_SUPABASE_URL);
}

/**
 * Convert Supabase storage URL to proxy URL
 * @param url Original Supabase storage URL
 * @returns Proxied URL
 */
export function getProxiedImageUrl(url: string): string {
  if (!url) return url;
  
  // If URL uses legacy proxy, convert back to the original Supabase domain
  if (url.includes(LEGACY_PROXY_URL)) {
    return url.replace(LEGACY_PROXY_URL, ORIGINAL_SUPABASE_URL);
  }

  // If it's already the original or any other URL, return as-is
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

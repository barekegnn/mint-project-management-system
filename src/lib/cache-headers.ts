/**
 * Cache header utilities for API routes
 * Implements caching strategies for different types of content
 */

export type CacheStrategy = 
  | "no-cache"           // Always revalidate
  | "static"             // Cache for 1 year (immutable content)
  | "short"              // Cache for 5 minutes
  | "medium"             // Cache for 1 hour
  | "long"               // Cache for 1 day
  | "stale-while-revalidate"; // Cache but revalidate in background

/**
 * Get Cache-Control header value for a given strategy
 */
export function getCacheHeader(strategy: CacheStrategy): string {
  switch (strategy) {
    case "no-cache":
      return "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
    
    case "static":
      return "public, max-age=31536000, immutable";
    
    case "short":
      return "public, max-age=300, s-maxage=300";
    
    case "medium":
      return "public, max-age=3600, s-maxage=3600";
    
    case "long":
      return "public, max-age=86400, s-maxage=86400";
    
    case "stale-while-revalidate":
      return "public, max-age=60, stale-while-revalidate=300";
    
    default:
      return "no-store, no-cache, must-revalidate";
  }
}

/**
 * Add cache headers to a Response object
 */
export function withCacheHeaders(
  response: Response,
  strategy: CacheStrategy
): Response {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", getCacheHeader(strategy));
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Create a Response with cache headers
 */
export function cachedResponse(
  data: any,
  strategy: CacheStrategy,
  status: number = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": getCacheHeader(strategy),
    },
  });
}

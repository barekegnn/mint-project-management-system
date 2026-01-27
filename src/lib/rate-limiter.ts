/**
 * Rate Limiter Middleware
 * 
 * Simple in-memory rate limiter for authentication endpoints.
 * Limits requests per IP address to prevent brute force attacks.
 * 
 * Note: In serverless environments (Vercel), this is per-instance.
 * For distributed rate limiting, consider using Redis or Vercel KV.
 */

import { NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Store rate limit data in memory (per instance)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes (only in non-test environments)
let cleanupInterval: NodeJS.Timeout | null = null;
if (process.env.NODE_ENV !== 'test') {
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed within the window
   * @default 5
   */
  maxRequests?: number;
  
  /**
   * Time window in milliseconds
   * @default 900000 (15 minutes)
   */
  windowMs?: number;
  
  /**
   * Custom message to return when rate limit is exceeded
   */
  message?: string;
}

/**
 * Get client IP address from request
 */
function getClientIp(request: Request): string {
  // Try to get IP from various headers (Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  // Fallback to a default (shouldn't happen in production)
  return 'unknown';
}

/**
 * Rate limit middleware for API routes
 * 
 * @example
 * ```ts
 * export const POST = rateLimit(async (request: Request) => {
 *   // Your route handler
 * }, { maxRequests: 5, windowMs: 15 * 60 * 1000 });
 * ```
 */
export function rateLimit(
  handler: (request: Request) => Promise<Response>,
  config: RateLimitConfig = {}
) {
  const {
    maxRequests = 5,
    windowMs = 15 * 60 * 1000, // 15 minutes
    message = 'Too many requests. Please try again later.',
  } = config;

  return async (request: Request): Promise<Response> => {
    const clientIp = getClientIp(request);
    const now = Date.now();
    const key = `${clientIp}:${request.url}`;
    
    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);
    
    if (!entry || entry.resetTime < now) {
      // Create new entry or reset expired entry
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(key, entry);
    }
    
    // Increment request count
    entry.count++;
    
    // Check if rate limit exceeded
    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      
      return NextResponse.json(
        {
          error: message,
          retryAfter: `${retryAfter} seconds`,
          limit: maxRequests,
          window: `${windowMs / 1000} seconds`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': entry.resetTime.toString(),
          },
        }
      );
    }
    
    // Add rate limit headers to response
    const response = await handler(request);
    
    // Clone response to add headers
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('X-RateLimit-Limit', maxRequests.toString());
    newResponse.headers.set('X-RateLimit-Remaining', (maxRequests - entry.count).toString());
    newResponse.headers.set('X-RateLimit-Reset', entry.resetTime.toString());
    
    return newResponse;
  };
}

/**
 * Check if an IP is currently rate limited
 * Useful for testing
 */
export function isRateLimited(ip: string, url: string): boolean {
  const key = `${ip}:${url}`;
  const entry = rateLimitStore.get(key);
  
  if (!entry) {
    return false;
  }
  
  const now = Date.now();
  if (entry.resetTime < now) {
    return false;
  }
  
  return entry.count > 5; // Default max
}

/**
 * Clear rate limit for an IP (useful for testing)
 */
export function clearRateLimit(ip: string, url: string): void {
  const key = `${ip}:${url}`;
  rateLimitStore.delete(key);
}

/**
 * Clear all rate limits (useful for testing)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Get current rate limit status for an IP
 */
export function getRateLimitStatus(ip: string, url: string): {
  count: number;
  resetTime: number;
  isLimited: boolean;
} | null {
  const key = `${ip}:${url}`;
  const entry = rateLimitStore.get(key);
  
  if (!entry) {
    return null;
  }
  
  const now = Date.now();
  if (entry.resetTime < now) {
    return null;
  }
  
  return {
    count: entry.count,
    resetTime: entry.resetTime,
    isLimited: entry.count > 5, // Default max
  };
}

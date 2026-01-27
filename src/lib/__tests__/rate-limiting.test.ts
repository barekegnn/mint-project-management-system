/**
 * Property-Based Tests for Rate Limiting
 * 
 * Property 7: Rate Limiting on Authentication Endpoints
 * Validates: Requirements US-3.6
 * 
 * This test verifies that authentication endpoints properly implement
 * rate limiting to prevent brute force attacks.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  rateLimit,
  clearAllRateLimits,
  getRateLimitStatus,
  isRateLimited,
} from '../rate-limiter';

describe('Property 7: Rate Limiting on Authentication Endpoints', () => {
  beforeEach(() => {
    // Clear all rate limits before each test
    clearAllRateLimits();
  });

  describe('Rate limiter configuration', () => {
    it('should accept custom configuration', async () => {
      const handler = rateLimit(
        async (request: Request) => {
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        },
        {
          maxRequests: 3,
          windowMs: 60000, // 1 minute
          message: 'Custom rate limit message',
        }
      );

      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
      });

      // First 3 requests should succeed
      for (let i = 0; i < 3; i++) {
        const response = await handler(request);
        expect(response.status).toBe(200);
      }

      // 4th request should be rate limited
      const response = await handler(request);
      expect(response.status).toBe(429);
      
      const body = await response.json();
      expect(body.error).toBe('Custom rate limit message');
    });

    it('should use default configuration when not specified', async () => {
      const handler = rateLimit(async (request: Request) => {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });

      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-forwarded-for': '192.168.1.2',
        },
      });

      // Default is 5 requests
      for (let i = 0; i < 5; i++) {
        const response = await handler(request);
        expect(response.status).toBe(200);
      }

      // 6th request should be rate limited
      const response = await handler(request);
      expect(response.status).toBe(429);
    });
  });

  describe('Rate limit enforcement', () => {
    it('should block requests after exceeding limit', async () => {
      const handler = rateLimit(
        async (request: Request) => {
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        },
        { maxRequests: 3, windowMs: 60000 }
      );

      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-forwarded-for': '192.168.1.3',
        },
      });

      // Make 3 successful requests
      for (let i = 0; i < 3; i++) {
        const response = await handler(request);
        expect(response.status).toBe(200);
      }

      // Next request should be blocked
      const blockedResponse = await handler(request);
      expect(blockedResponse.status).toBe(429);
      
      const body = await blockedResponse.json();
      expect(body.error).toBeDefined();
      expect(body.limit).toBe(3);
    });

    it('should include rate limit headers in responses', async () => {
      const handler = rateLimit(
        async (request: Request) => {
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        },
        { maxRequests: 5, windowMs: 60000 }
      );

      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-forwarded-for': '192.168.1.4',
        },
      });

      const response = await handler(request);
      
      expect(response.headers.get('X-RateLimit-Limit')).toBe('5');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('4');
      expect(response.headers.get('X-RateLimit-Reset')).toBeDefined();
    });

    it('should include Retry-After header when rate limited', async () => {
      const handler = rateLimit(
        async (request: Request) => {
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        },
        { maxRequests: 2, windowMs: 60000 }
      );

      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-forwarded-for': '192.168.1.5',
        },
      });

      // Exceed limit
      await handler(request);
      await handler(request);
      const blockedResponse = await handler(request);

      expect(blockedResponse.status).toBe(429);
      expect(blockedResponse.headers.get('Retry-After')).toBeDefined();
      
      const retryAfter = parseInt(blockedResponse.headers.get('Retry-After') || '0');
      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThanOrEqual(60);
    });
  });

  describe('IP-based rate limiting', () => {
    it('should track requests per IP address', async () => {
      const handler = rateLimit(
        async (request: Request) => {
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        },
        { maxRequests: 2, windowMs: 60000 }
      );

      const ip1Request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'x-forwarded-for': '192.168.1.10' },
      });

      const ip2Request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'x-forwarded-for': '192.168.1.11' },
      });

      // IP1 makes 2 requests (at limit)
      await handler(ip1Request);
      await handler(ip1Request);

      // IP2 should still be able to make requests
      const ip2Response = await handler(ip2Request);
      expect(ip2Response.status).toBe(200);

      // IP1 should be blocked
      const ip1BlockedResponse = await handler(ip1Request);
      expect(ip1BlockedResponse.status).toBe(429);
    });

    it('should handle different IP header formats', async () => {
      const handler = rateLimit(
        async (request: Request) => {
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        },
        { maxRequests: 2, windowMs: 60000 }
      );

      // Test x-forwarded-for
      const forwardedRequest = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'x-forwarded-for': '192.168.1.20' },
      });

      // Test x-real-ip
      const realIpRequest = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'x-real-ip': '192.168.1.21' },
      });

      // Test cf-connecting-ip (Cloudflare)
      const cfRequest = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'cf-connecting-ip': '192.168.1.22' },
      });

      // All should work independently
      const response1 = await handler(forwardedRequest);
      const response2 = await handler(realIpRequest);
      const response3 = await handler(cfRequest);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response3.status).toBe(200);
    });

    it('should handle multiple IPs in x-forwarded-for header', async () => {
      const handler = rateLimit(
        async (request: Request) => {
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        },
        { maxRequests: 2, windowMs: 60000 }
      );

      // x-forwarded-for can contain multiple IPs (proxy chain)
      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'x-forwarded-for': '192.168.1.30, 10.0.0.1, 172.16.0.1',
        },
      });

      // Should use the first IP
      await handler(request);
      await handler(request);
      
      const blockedResponse = await handler(request);
      expect(blockedResponse.status).toBe(429);
    });
  });

  describe('Property: Rate limiting is consistent and predictable', () => {
    it('should consistently enforce limits across multiple requests', async () => {
      const maxRequests = 5;
      const handler = rateLimit(
        async (request: Request) => {
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        },
        { maxRequests, windowMs: 60000 }
      );

      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'x-forwarded-for': '192.168.1.40' },
      });

      // Exactly maxRequests should succeed
      for (let i = 0; i < maxRequests; i++) {
        const response = await handler(request);
        expect(response.status).toBe(200);
      }

      // All subsequent requests should be blocked
      for (let i = 0; i < 3; i++) {
        const response = await handler(request);
        expect(response.status).toBe(429);
      }
    });

    it('should decrement remaining count correctly', async () => {
      const maxRequests = 5;
      const handler = rateLimit(
        async (request: Request) => {
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        },
        { maxRequests, windowMs: 60000 }
      );

      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'x-forwarded-for': '192.168.1.50' },
      });

      for (let i = 0; i < maxRequests; i++) {
        const response = await handler(request);
        const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0');
        expect(remaining).toBe(maxRequests - i - 1);
      }
    });
  });

  describe('Property: Rate limits reset after time window', () => {
    it('should allow requests after window expires', async () => {
      const windowMs = 100; // 100ms for testing
      const handler = rateLimit(
        async (request: Request) => {
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        },
        { maxRequests: 2, windowMs }
      );

      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'x-forwarded-for': '192.168.1.60' },
      });

      // Exceed limit
      await handler(request);
      await handler(request);
      const blockedResponse = await handler(request);
      expect(blockedResponse.status).toBe(429);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, windowMs + 50));

      // Should be able to make requests again
      const newResponse = await handler(request);
      expect(newResponse.status).toBe(200);
    });
  });

  describe('Error response format', () => {
    it('should return properly formatted error response', async () => {
      const handler = rateLimit(
        async (request: Request) => {
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        },
        { maxRequests: 1, windowMs: 60000, message: 'Rate limit exceeded' }
      );

      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'x-forwarded-for': '192.168.1.70' },
      });

      // Exceed limit
      await handler(request);
      const response = await handler(request);

      expect(response.status).toBe(429);
      
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('retryAfter');
      expect(body).toHaveProperty('limit');
      expect(body).toHaveProperty('window');
      expect(body.error).toBe('Rate limit exceeded');
    });
  });
});

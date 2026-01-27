/**
 * Property-Based Tests for Caching Headers
 * 
 * **Property 5: Proper Caching Headers**
 * **Validates: Requirements US-3.3**
 * 
 * These tests verify that:
 * 1. All cache strategies return valid Cache-Control headers
 * 2. Cache headers follow HTTP specification format
 * 3. Cache durations are appropriate for each strategy
 * 4. Headers are properly applied to responses
 */

import { getCacheHeader, withCacheHeaders, cachedResponse, CacheStrategy } from '../cache-headers';

describe('Property 5: Proper Caching Headers', () => {
  const strategies: CacheStrategy[] = [
    'no-cache',
    'static',
    'short',
    'medium',
    'long',
    'stale-while-revalidate',
  ];

  describe('Cache header generation', () => {
    it('should return valid Cache-Control headers for all strategies', () => {
      strategies.forEach(strategy => {
        const header = getCacheHeader(strategy);
        
        // Header should be a non-empty string
        expect(typeof header).toBe('string');
        expect(header.length).toBeGreaterThan(0);
        
        // Header should contain valid cache directives
        expect(header).toMatch(/^[a-z0-9\-,\s=]+$/i);
      });
    });

    it('should include appropriate directives for each strategy', () => {
      // no-cache should prevent caching
      expect(getCacheHeader('no-cache')).toContain('no-cache');
      expect(getCacheHeader('no-cache')).toContain('no-store');
      
      // static should have long max-age and immutable
      expect(getCacheHeader('static')).toContain('max-age=31536000');
      expect(getCacheHeader('static')).toContain('immutable');
      
      // short should have 5 minute cache
      expect(getCacheHeader('short')).toContain('max-age=300');
      
      // medium should have 1 hour cache
      expect(getCacheHeader('medium')).toContain('max-age=3600');
      
      // long should have 1 day cache
      expect(getCacheHeader('long')).toContain('max-age=86400');
      
      // stale-while-revalidate should have both directives
      expect(getCacheHeader('stale-while-revalidate')).toContain('stale-while-revalidate');
    });
  });

  describe('Response header application', () => {
    it('should add Cache-Control header to responses', () => {
      const originalResponse = new Response(JSON.stringify({ data: 'test' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

      strategies.forEach(strategy => {
        const cachedResp = withCacheHeaders(originalResponse.clone(), strategy);
        
        const cacheControl = cachedResp.headers.get('Cache-Control');
        expect(cacheControl).toBeDefined();
        expect(cacheControl).toBe(getCacheHeader(strategy));
      });
    });

    it('should preserve existing headers when adding cache headers', () => {
      const originalResponse = new Response(JSON.stringify({ data: 'test' }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Header': 'custom-value',
        },
      });

      const cachedResp = withCacheHeaders(originalResponse, 'medium');
      
      expect(cachedResp.headers.get('Content-Type')).toBe('application/json');
      expect(cachedResp.headers.get('X-Custom-Header')).toBe('custom-value');
      expect(cachedResp.headers.get('Cache-Control')).toBeDefined();
    });
  });

  describe('Cached response creation', () => {
    it('should create responses with cache headers', () => {
      const data = { message: 'test data' };
      
      strategies.forEach(strategy => {
        const response = cachedResponse(data, strategy);
        
        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('application/json');
        expect(response.headers.get('Cache-Control')).toBe(getCacheHeader(strategy));
      });
    });

    it('should support custom status codes', () => {
      const data = { error: 'not found' };
      const response = cachedResponse(data, 'no-cache', 404);
      
      expect(response.status).toBe(404);
      expect(response.headers.get('Cache-Control')).toBeDefined();
    });
  });

  describe('Cache duration properties', () => {
    it('should have appropriate max-age values', () => {
      // no-cache should have max-age=0
      expect(getCacheHeader('no-cache')).toContain('max-age=0');
      
      // short should be 5 minutes (300 seconds)
      expect(getCacheHeader('short')).toContain('max-age=300');
      
      // medium should be 1 hour (3600 seconds)
      expect(getCacheHeader('medium')).toContain('max-age=3600');
      
      // long should be 1 day (86400 seconds)
      expect(getCacheHeader('long')).toContain('max-age=86400');
      
      // static should be 1 year (31536000 seconds)
      expect(getCacheHeader('static')).toContain('max-age=31536000');
    });

    it('should use public caching for cacheable strategies', () => {
      const cacheableStrategies: CacheStrategy[] = ['static', 'short', 'medium', 'long', 'stale-while-revalidate'];
      
      cacheableStrategies.forEach(strategy => {
        expect(getCacheHeader(strategy)).toContain('public');
      });
    });
  });

  describe('HTTP specification compliance', () => {
    it('should use valid Cache-Control directive names', () => {
      const validDirectives = [
        'no-cache',
        'no-store',
        'public',
        'private',
        'max-age',
        's-maxage',
        'must-revalidate',
        'proxy-revalidate',
        'immutable',
        'stale-while-revalidate',
      ];

      strategies.forEach(strategy => {
        const header = getCacheHeader(strategy);
        const directives = header.split(',').map(d => d.trim().split('=')[0]);
        
        directives.forEach(directive => {
          expect(validDirectives).toContain(directive);
        });
      });
    });

    it('should format max-age values correctly', () => {
      const headersWithMaxAge = ['static', 'short', 'medium', 'long', 'stale-while-revalidate'];
      
      headersWithMaxAge.forEach(strategy => {
        const header = getCacheHeader(strategy as CacheStrategy);
        const maxAgeMatch = header.match(/max-age=(\d+)/);
        
        expect(maxAgeMatch).toBeTruthy();
        if (maxAgeMatch) {
          const maxAge = parseInt(maxAgeMatch[1]);
          expect(maxAge).toBeGreaterThan(0);
          expect(Number.isInteger(maxAge)).toBe(true);
        }
      });
    });
  });
});

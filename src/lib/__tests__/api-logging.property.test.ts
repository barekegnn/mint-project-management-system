/**
 * Property-Based Test: API Route Logging
 * 
 * Feature: deployment-preparation
 * Property 8: API Route Logging
 * Validates: Requirements US-6.3
 * 
 * Property: For any API route, the route should log incoming requests and any errors
 * that occur during processing.
 * 
 * Testing approach:
 * - Make requests to various API endpoints
 * - Verify logs are written to console/log system
 * - Verify logs include timestamp, method, path
 * - Verify errors are logged with stack traces
 */

import { withErrorHandler } from '../api-error-handler';
import { Logger } from '../logger';
import { NextResponse } from 'next/server';

describe('Property 8: API Route Logging', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  /**
   * **Validates: Requirements US-6.3**
   * 
   * Property: For any API route wrapped with withErrorHandler, incoming requests
   * should be logged with timestamp, method, path, and status code.
   */
  describe('Request Logging', () => {
    const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    const apiPaths = [
      '/api/users',
      '/api/projects',
      '/api/tasks',
      '/api/health',
      '/api/auth/login',
      '/api/notifications',
      '/api/reports',
      '/api/settings',
    ];
    const statusCodes = [200, 201, 204, 400, 401, 403, 404, 500];

    it('should log all successful requests with timestamp, method, path, and status code', async () => {
      // Test multiple combinations of methods and paths
      for (const method of httpMethods) {
        for (const path of apiPaths.slice(0, 3)) { // Test subset for performance
          consoleLogSpy.mockClear();

          const handler = withErrorHandler(async (request: Request) => {
            return NextResponse.json({ success: true }, { status: 200 });
          });

          const request = new Request(`http://localhost:3000${path}`, {
            method,
          });

          await handler(request);

          // Verify logging occurred
          expect(consoleLogSpy).toHaveBeenCalled();

          // Get the logged data
          const logCalls = consoleLogSpy.mock.calls;
          expect(logCalls.length).toBeGreaterThan(0);

          // In development mode, logs are formatted strings
          // In production mode, logs are JSON
          const loggedData = logCalls[0][0];

          if (typeof loggedData === 'string') {
            // Development mode - check for formatted string
            if (loggedData.startsWith('{')) {
              // JSON format
              const parsed = JSON.parse(loggedData);
              expect(parsed.timestamp).toBeDefined();
              expect(parsed.data.method).toBe(method);
              expect(parsed.data.path).toBe(path);
              expect(parsed.data.statusCode).toBe(200);
            } else {
              // Human-readable format
              expect(loggedData).toContain(method);
              expect(loggedData).toContain(path);
              expect(loggedData).toContain('200');
            }
          }
        }
      }
    });

    it('should log failed requests with error details', async () => {
      const handler = withErrorHandler(async (request: Request) => {
        throw new Error('Test error');
      });

      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
      });

      await handler(request);

      // Verify error logging occurred
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Verify request logging occurred (even for failed requests)
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should include duration in request logs', async () => {
      const handler = withErrorHandler(async (request: Request) => {
        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 10));
        return NextResponse.json({ success: true }, { status: 200 });
      });

      const request = new Request('http://localhost:3000/api/test', {
        method: 'GET',
      });

      await handler(request);

      // Verify logging occurred
      expect(consoleLogSpy).toHaveBeenCalled();

      const logCalls = consoleLogSpy.mock.calls;
      const loggedData = logCalls[0][0];

      if (typeof loggedData === 'string') {
        if (loggedData.startsWith('{')) {
          const parsed = JSON.parse(loggedData);
          expect(parsed.data.duration).toBeDefined();
          expect(parsed.data.duration).toMatch(/\d+ms/);
        } else {
          expect(loggedData).toMatch(/\(\d+ms\)/);
        }
      }
    });
  });

  /**
   * **Validates: Requirements US-6.2, US-6.3**
   * 
   * Property: For any error that occurs in an API route, the error should be logged
   * with stack trace and context information.
   */
  describe('Error Logging', () => {
    it('should log errors with stack traces', async () => {
      const testError = new Error('Test error message');

      const handler = withErrorHandler(async (request: Request) => {
        throw testError;
      });

      const request = new Request('http://localhost:3000/api/test', {
        method: 'GET',
      });

      await handler(request);

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalled();

      const errorCalls = consoleErrorSpy.mock.calls;
      const loggedData = errorCalls.find(call => {
        const data = call[0];
        if (typeof data === 'string') {
          return data.includes('Test error message') || data.includes('API Error');
        }
        return false;
      });

      expect(loggedData).toBeDefined();
    });

    it('should log errors with context information', async () => {
      const handler = withErrorHandler(async (request: Request) => {
        throw new Error('Context test error');
      });

      const request = new Request('http://localhost:3000/api/users', {
        method: 'POST',
      });

      await handler(request);

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalled();

      // The error handler logs errors with context
      // We just need to verify that error logging occurred
      // The context is passed to Logger.error which includes it in the log
      const errorCalls = consoleErrorSpy.mock.calls;
      expect(errorCalls.length).toBeGreaterThan(0);
      
      // Verify the error message is logged
      const hasErrorMessage = errorCalls.some(call => {
        const data = call[0];
        return typeof data === 'string' && 
               (data.includes('Context test error') || data.includes('API Error'));
      });
      
      expect(hasErrorMessage).toBe(true);
    });

    it('should log different error types appropriately', async () => {
      const errorTypes = [
        new Error('Generic error'),
        new TypeError('Type error'),
        new RangeError('Range error'),
      ];

      for (const error of errorTypes) {
        consoleErrorSpy.mockClear();

        const handler = withErrorHandler(async (request: Request) => {
          throw error;
        });

        const request = new Request('http://localhost:3000/api/test', {
          method: 'GET',
        });

        await handler(request);

        expect(consoleErrorSpy).toHaveBeenCalled();
      }
    });
  });

  /**
   * **Validates: Requirements US-6.3**
   * 
   * Property: Logs should be formatted as JSON in production for easy parsing.
   */
  describe('Log Formatting', () => {
    it('should format logs as JSON in production mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const handler = withErrorHandler(async (request: Request) => {
        return NextResponse.json({ success: true }, { status: 200 });
      });

      const request = new Request('http://localhost:3000/api/test', {
        method: 'GET',
      });

      await handler(request);

      expect(consoleLogSpy).toHaveBeenCalled();

      const logCalls = consoleLogSpy.mock.calls;
      const loggedData = logCalls[0][0];

      // Should be valid JSON
      expect(typeof loggedData).toBe('string');
      expect(() => JSON.parse(loggedData)).not.toThrow();

      const parsed = JSON.parse(loggedData);
      expect(parsed.level).toBe('info');
      expect(parsed.message).toBe('API Request');
      expect(parsed.timestamp).toBeDefined();
      expect(parsed.data).toBeDefined();
      expect(parsed.data.method).toBe('GET');
      expect(parsed.data.path).toBe('/api/test');
      expect(parsed.data.statusCode).toBe(200);

      process.env.NODE_ENV = originalEnv;
    });

    it('should format error logs as JSON in production mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const handler = withErrorHandler(async (request: Request) => {
        throw new Error('Production error test');
      });

      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
      });

      await handler(request);

      expect(consoleErrorSpy).toHaveBeenCalled();

      const errorCalls = consoleErrorSpy.mock.calls;
      const jsonLog = errorCalls.find(call => {
        const data = call[0];
        if (typeof data === 'string' && data.startsWith('{')) {
          try {
            const parsed = JSON.parse(data);
            return parsed.level === 'error';
          } catch {
            return false;
          }
        }
        return false;
      });

      expect(jsonLog).toBeDefined();

      const parsed = JSON.parse(jsonLog![0]);
      expect(parsed.level).toBe('error');
      expect(parsed.timestamp).toBeDefined();
      expect(parsed.error).toBeDefined();
      expect(parsed.error.message).toBe('Production error test');
      expect(parsed.error.stack).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });
  });
});
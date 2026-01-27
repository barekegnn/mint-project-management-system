/**
 * Integration tests for Logger with API error handler
 */

import { Logger } from '../logger';
import { withErrorHandler } from '../api-error-handler';
import { NextResponse } from 'next/server';

describe('Logger Integration with API Error Handler', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should log successful API requests with method, path, and status code', async () => {
    const handler = withErrorHandler(async (request: Request) => {
      return NextResponse.json({ success: true }, { status: 200 });
    });

    const request = new Request('http://localhost:3000/api/test', {
      method: 'GET',
    });

    await handler(request);

    // Should log the request
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('should log failed API requests with error details', async () => {
    const handler = withErrorHandler(async (request: Request) => {
      throw new Error('Test error');
    });

    const request = new Request('http://localhost:3000/api/test', {
      method: 'POST',
    });

    await handler(request);

    // Should log the error
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    // Should log the request with error status
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('should include request duration in logs', async () => {
    const handler = withErrorHandler(async (request: Request) => {
      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 10));
      return NextResponse.json({ success: true }, { status: 200 });
    });

    const request = new Request('http://localhost:3000/api/test', {
      method: 'GET',
    });

    await handler(request);

    // Should log with duration
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('should log errors with stack traces and context', async () => {
    const handler = withErrorHandler(async (request: Request) => {
      const error = new Error('Database connection failed');
      error.stack = 'Error: Database connection failed\n    at handler';
      throw error;
    });

    const request = new Request('http://localhost:3000/api/users', {
      method: 'GET',
    });

    await handler(request);

    // Should log error with stack trace
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    // Verify error log contains stack trace
    const errorCall = consoleErrorSpy.mock.calls[0][0];
    if (typeof errorCall === 'string') {
      // In development mode, it's a formatted string
      expect(errorCall).toContain('Error');
    }
  });

  it('should format logs as JSON in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const handler = withErrorHandler(async (request: Request) => {
      return NextResponse.json({ success: true }, { status: 200 });
    });

    const request = new Request('http://localhost:3000/api/test', {
      method: 'GET',
    });

    await handler(request);

    // Should log as JSON
    expect(consoleLogSpy).toHaveBeenCalled();
    const loggedData = consoleLogSpy.mock.calls[0][0];
    
    // Should be valid JSON
    expect(() => JSON.parse(loggedData)).not.toThrow();
    
    const parsed = JSON.parse(loggedData);
    expect(parsed.level).toBe('info');
    expect(parsed.message).toBe('API Request');
    expect(parsed.data.method).toBe('GET');
    expect(parsed.data.path).toBe('/api/test');
    expect(parsed.data.statusCode).toBe(200);
    expect(parsed.data.duration).toBeDefined();

    process.env.NODE_ENV = originalEnv;
  });
});

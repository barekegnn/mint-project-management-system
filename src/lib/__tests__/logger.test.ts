/**
 * Tests for Logger utility
 */

import { Logger } from '../logger';

describe('Logger', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleDebugSpy.mockRestore();
  });

  describe('error', () => {
    it('should log error message', () => {
      Logger.error('Test error message');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should log error with stack trace', () => {
      const error = new Error('Test error');
      Logger.error('Error occurred', error);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should log error with context', () => {
      const error = new Error('Test error');
      const context = { userId: '123', action: 'login' };
      Logger.error('Error occurred', error, context);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should format as JSON in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Test error');
      Logger.error('Error occurred', error, { userId: '123' });

      expect(consoleErrorSpy).toHaveBeenCalled();
      const loggedData = consoleErrorSpy.mock.calls[0][0];
      
      // Should be valid JSON
      expect(() => JSON.parse(loggedData)).not.toThrow();
      
      const parsed = JSON.parse(loggedData);
      expect(parsed.level).toBe('error');
      expect(parsed.message).toBe('Error occurred');
      expect(parsed.error).toBeDefined();
      expect(parsed.error.name).toBe('Error');
      expect(parsed.error.message).toBe('Test error');
      expect(parsed.error.stack).toBeDefined();
      expect(parsed.context).toEqual({ userId: '123' });
      expect(parsed.timestamp).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('warn', () => {
    it('should log warning message', () => {
      Logger.warn('Test warning');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should log warning with data', () => {
      Logger.warn('Test warning', { key: 'value' });
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should format as JSON in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      Logger.warn('Warning message', { key: 'value' });

      expect(consoleWarnSpy).toHaveBeenCalled();
      const loggedData = consoleWarnSpy.mock.calls[0][0];
      
      const parsed = JSON.parse(loggedData);
      expect(parsed.level).toBe('warn');
      expect(parsed.message).toBe('Warning message');
      expect(parsed.data).toEqual({ key: 'value' });
      expect(parsed.timestamp).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('info', () => {
    it('should log info message', () => {
      Logger.info('Test info');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log info with data', () => {
      Logger.info('Test info', { key: 'value' });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should format as JSON in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      Logger.info('Info message', { key: 'value' });

      expect(consoleLogSpy).toHaveBeenCalled();
      const loggedData = consoleLogSpy.mock.calls[0][0];
      
      const parsed = JSON.parse(loggedData);
      expect(parsed.level).toBe('info');
      expect(parsed.message).toBe('Info message');
      expect(parsed.data).toEqual({ key: 'value' });
      expect(parsed.timestamp).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('debug', () => {
    it('should log debug message in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      Logger.debug('Test debug');
      expect(consoleDebugSpy).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('should not log debug message in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      Logger.debug('Test debug');
      expect(consoleDebugSpy).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('logRequest', () => {
    it('should log API request with method, path, and status code', () => {
      Logger.logRequest('GET', '/api/users', 200);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log API request with duration', () => {
      Logger.logRequest('POST', '/api/auth/login', 200, 150);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should format as JSON in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      Logger.logRequest('GET', '/api/users', 200, 150);

      expect(consoleLogSpy).toHaveBeenCalled();
      const loggedData = consoleLogSpy.mock.calls[0][0];
      
      const parsed = JSON.parse(loggedData);
      expect(parsed.level).toBe('info');
      expect(parsed.message).toBe('API Request');
      expect(parsed.data.method).toBe('GET');
      expect(parsed.data.path).toBe('/api/users');
      expect(parsed.data.statusCode).toBe(200);
      expect(parsed.data.duration).toBe('150ms');
      expect(parsed.timestamp).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should log failed requests', () => {
      Logger.logRequest('POST', '/api/auth/login', 401);
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('logSlowQuery', () => {
    it('should log slow query when duration exceeds threshold', () => {
      Logger.logSlowQuery('SELECT * FROM users', 600, 500);
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should not log query when duration is below threshold', () => {
      Logger.logSlowQuery('SELECT * FROM users', 400, 500);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should use default threshold of 500ms', () => {
      Logger.logSlowQuery('SELECT * FROM users', 600);
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });
});

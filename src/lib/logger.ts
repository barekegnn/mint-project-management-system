/**
 * Structured Logging Utility
 * 
 * Provides consistent logging across the application with different log levels
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  context?: Record<string, any>;
}

export class Logger {
  /**
   * Log an error
   */
  static error(message: string, error?: Error, context?: Record<string, any>): void {
    const logEntry: LogEntry = {
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    if (process.env.NODE_ENV === 'production') {
      // In production, log as JSON for easy parsing
      console.error(JSON.stringify(logEntry));
    } else {
      // In development, log in a more readable format
      console.error(`\n[ERROR] ${message}`);
      if (error) {
        console.error('Error:', error.message);
        if (error.stack) {
          console.error('Stack:', error.stack);
        }
      }
      if (context) {
        console.error('Context:', context);
      }
      console.error('');
    }
  }

  /**
   * Log a warning
   */
  static warn(message: string, data?: any): void {
    const logEntry: LogEntry = {
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      data,
    };

    if (process.env.NODE_ENV === 'production') {
      console.warn(JSON.stringify(logEntry));
    } else {
      console.warn(`\n[WARN] ${message}`);
      if (data) {
        console.warn('Data:', data);
      }
      console.warn('');
    }
  }

  /**
   * Log an info message
   */
  static info(message: string, data?: any): void {
    const logEntry: LogEntry = {
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      data,
    };

    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(logEntry));
    } else {
      console.log(`[INFO] ${message}`);
      if (data) {
        console.log('Data:', data);
      }
    }
  }

  /**
   * Log a debug message (only in development)
   */
  static debug(message: string, data?: any): void {
    if (process.env.NODE_ENV !== 'production') {
      const logEntry: LogEntry = {
        level: 'debug',
        message,
        timestamp: new Date().toISOString(),
        data,
      };

      console.debug(`[DEBUG] ${message}`);
      if (data) {
        console.debug('Data:', data);
      }
    }
  }

  /**
   * Log API request
   */
  static logRequest(
    method: string,
    path: string,
    statusCode: number,
    duration?: number
  ): void {
    const logEntry = {
      level: 'info' as LogLevel,
      message: 'API Request',
      timestamp: new Date().toISOString(),
      data: {
        method,
        path,
        statusCode,
        duration: duration ? `${duration}ms` : undefined,
      },
    };

    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(logEntry));
    } else {
      const statusEmoji = statusCode < 400 ? '✅' : '❌';
      console.log(
        `${statusEmoji} ${method} ${path} - ${statusCode}${duration ? ` (${duration}ms)` : ''}`
      );
    }
  }

  /**
   * Log slow query warning
   */
  static logSlowQuery(query: string, duration: number, threshold: number = 500): void {
    if (duration > threshold) {
      Logger.warn('Slow query detected', {
        query,
        duration: `${duration}ms`,
        threshold: `${threshold}ms`,
      });
    }
  }
}

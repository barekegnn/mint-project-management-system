/**
 * Centralized Error Handling Utilities
 * 
 * This module provides standardized error classes and handling utilities
 * for consistent error management across the application.
 */

/**
 * Base Application Error
 * All custom errors extend from this class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error (400)
 * Used when user input fails validation
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 400, true, context);
  }
}

/**
 * Authentication Error (401)
 * Used when authentication fails or is missing
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', context?: Record<string, any>) {
    super(message, 401, true, context);
  }
}

/**
 * Authorization Error (403)
 * Used when user doesn't have permission for an action
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', context?: Record<string, any>) {
    super(message, 403, true, context);
  }
}

/**
 * Not Found Error (404)
 * Used when a requested resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', context?: Record<string, any>) {
    super(`${resource} not found`, 404, true, context);
  }
}

/**
 * Conflict Error (409)
 * Used when there's a conflict with existing data
 */
export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 409, true, context);
  }
}

/**
 * Rate Limit Error (429)
 * Used when rate limit is exceeded
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests', context?: Record<string, any>) {
    super(message, 429, true, context);
  }
}

/**
 * Database Error (500)
 * Used for database-related errors
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database error occurred', context?: Record<string, any>) {
    super(message, 500, true, context);
  }
}

/**
 * External Service Error (502)
 * Used when external service (email, storage, etc.) fails
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string, context?: Record<string, any>) {
    super(message || `${service} service unavailable`, 502, true, context);
  }
}

/**
 * Check if an error is operational (expected) or programming error
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Get HTTP status code from error
 */
export function getStatusCode(error: Error): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }
  return 500;
}

/**
 * Get error message safe for client response
 */
export function getClientMessage(error: Error): string {
  if (error instanceof AppError) {
    return error.message;
  }
  
  // Don't expose internal error details to client
  return 'An unexpected error occurred';
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: Error): Record<string, any> {
  const formatted: Record<string, any> = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  };

  if (error instanceof AppError) {
    formatted.statusCode = error.statusCode;
    formatted.isOperational = error.isOperational;
    formatted.context = error.context;
  }

  return formatted;
}

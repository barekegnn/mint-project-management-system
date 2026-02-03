/**
 * API Error Handler
 * 
 * Provides middleware and utilities for handling errors in API routes
 */

import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import {
  AppError,
  DatabaseError,
  ValidationError,
  getStatusCode,
  getClientMessage,
  formatErrorForLogging,
  isOperationalError,
} from './errors';
import { Logger } from './logger';

/**
 * Standard error response format
 */
interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path?: string;
  details?: any;
}

/**
 * Handle Prisma database errors
 */
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): AppError {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const target = (error.meta?.target as string[]) || [];
      return new ValidationError(
        `A record with this ${target.join(', ')} already exists`,
        { prismaCode: error.code, target }
      );
    
    case 'P2025':
      // Record not found
      return new ValidationError('Record not found', { prismaCode: error.code });
    
    case 'P2003':
      // Foreign key constraint violation
      return new ValidationError(
        'Cannot perform this operation due to related records',
        { prismaCode: error.code }
      );
    
    case 'P2014':
      // Required relation violation
      return new ValidationError(
        'Invalid relation: required field is missing',
        { prismaCode: error.code }
      );
    
    default:
      return new DatabaseError('Database operation failed', { prismaCode: error.code });
  }
}

/**
 * Create error response object
 */
function createErrorResponse(
  error: Error,
  path?: string
): ErrorResponse {
  const statusCode = getStatusCode(error);
  const message = getClientMessage(error);

  const response: ErrorResponse = {
    error: error.name,
    message,
    statusCode,
    timestamp: new Date().toISOString(),
  };

  if (path) {
    response.path = path;
  }

  // Include validation details if available
  if (error instanceof ValidationError && error.context) {
    response.details = error.context;
  }

  return response;
}

/**
 * Handle API errors and return appropriate response
 */
export function handleAPIError(
  error: Error,
  context?: {
    path?: string;
    method?: string;
    userId?: string;
  }
): NextResponse {
  // Log the error
  Logger.error('API Error', error, context);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const firstError = error.errors[0];
    const message = firstError?.message || 'Validation failed';
    const field = firstError?.path.join('.') || 'unknown';
    
    const appError = new ValidationError(message, {
      field,
      errors: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    });
    
    const response = createErrorResponse(appError, context?.path);
    return NextResponse.json(response, { status: 400 });
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const appError = handlePrismaError(error);
    const response = createErrorResponse(appError, context?.path);
    return NextResponse.json(response, { status: appError.statusCode });
  }

  // Handle Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    const appError = new ValidationError('Invalid data provided');
    const response = createErrorResponse(appError, context?.path);
    return NextResponse.json(response, { status: 400 });
  }

  // Handle application errors
  if (error instanceof AppError) {
    const response = createErrorResponse(error, context?.path);
    return NextResponse.json(response, { status: error.statusCode });
  }

  // Handle unknown errors
  const statusCode = 500;
  const response: ErrorResponse = {
    error: 'InternalServerError',
    message: 'An unexpected error occurred',
    statusCode,
    timestamp: new Date().toISOString(),
  };

  if (context?.path) {
    response.path = context.path;
  }

  // Log non-operational errors with full details
  if (!isOperationalError(error)) {
    Logger.error('Non-operational error', error, {
      ...context,
      errorDetails: formatErrorForLogging(error),
    });
  }

  return NextResponse.json(response, { status: statusCode });
}

/**
 * Async error handler wrapper for API routes with request logging
 * 
 * Usage:
 * export const GET = withErrorHandler(async (request) => {
 *   // Your route logic here
 * });
 */
export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const startTime = Date.now();
    let response: NextResponse;
    
    // Extract request info if available
    const request = args[0] as Request | undefined;
    const method = request?.method || 'UNKNOWN';
    const path = request ? new URL(request.url).pathname : 'unknown';
    
    try {
      response = await handler(...args);
      
      // Log successful request
      const duration = Date.now() - startTime;
      const statusCode = response.status;
      Logger.logRequest(method, path, statusCode, duration);
      
      return response;
    } catch (error) {
      // Log error and create error response
      const duration = Date.now() - startTime;
      const context = request
        ? {
            path,
            method,
          }
        : undefined;

      response = handleAPIError(
        error instanceof Error ? error : new Error(String(error)),
        context
      );
      
      // Log failed request
      Logger.logRequest(method, path, response.status, duration);
      
      return response;
    }
  };
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): void {
  const missing = requiredFields.filter(field => !data[field]);
  
  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missing.join(', ')}`,
      { missingFields: missing }
    );
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format', { email });
  }
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): void {
  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    throw new ValidationError('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    throw new ValidationError('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    throw new ValidationError('Password must contain at least one number');
  }
}

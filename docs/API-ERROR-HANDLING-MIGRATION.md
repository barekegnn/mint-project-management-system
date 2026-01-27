# API Error Handling Migration Guide

This guide explains how to migrate existing API routes to use the new centralized error handling system.

## Overview

The new error handling system provides:
- ✅ Consistent error responses across all endpoints
- ✅ Automatic error logging with context
- ✅ Type-safe error classes
- ✅ Proper HTTP status codes
- ✅ Request/response timing
- ✅ Prisma error handling

## Migration Steps

### Step 1: Import Required Utilities

```typescript
// Old imports
import { NextResponse } from "next/server";

// New imports
import { NextResponse } from "next/server";
import { withErrorHandler, validateRequiredFields } from "@/lib/api-error-handler";
import { ValidationError, AuthenticationError, NotFoundError } from "@/lib/errors";
import { Logger } from "@/lib/logger";
```

### Step 2: Wrap Handler with `withErrorHandler`

**Before:**
```typescript
export async function POST(request: Request) {
  try {
    // Route logic
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
```

**After:**
```typescript
export const POST = withErrorHandler(async (request: Request) => {
  // Route logic - no try/catch needed!
});
```

### Step 3: Replace Manual Validation with Utilities

**Before:**
```typescript
if (!email || !password) {
  return NextResponse.json(
    { message: "Email and password are required" },
    { status: 400 }
  );
}
```

**After:**
```typescript
validateRequiredFields(body, ['email', 'password']);
validateEmail(email);
```

### Step 4: Throw Errors Instead of Returning Error Responses

**Before:**
```typescript
if (!user) {
  return NextResponse.json(
    { message: "User not found" },
    { status: 404 }
  );
}
```

**After:**
```typescript
if (!user) {
  throw new NotFoundError('User');
}
```

### Step 5: Add Request Logging

```typescript
const startTime = Date.now();

// ... route logic ...

const duration = Date.now() - startTime;
Logger.logRequest('POST', '/api/your-route', 200, duration);
```

## Error Classes Reference

### ValidationError (400)
Use when user input is invalid:
```typescript
throw new ValidationError('Invalid email format');
throw new ValidationError('Password too short', { minLength: 8 });
```

### AuthenticationError (401)
Use when authentication fails:
```typescript
throw new AuthenticationError('Invalid credentials');
throw new AuthenticationError('Token expired');
```

### AuthorizationError (403)
Use when user lacks permissions:
```typescript
throw new AuthorizationError('Admin access required');
```

### NotFoundError (404)
Use when resource doesn't exist:
```typescript
throw new NotFoundError('User');
throw new NotFoundError('Project');
```

### ConflictError (409)
Use when there's a data conflict:
```typescript
throw new ConflictError('Email already exists');
```

### DatabaseError (500)
Use for database errors (usually auto-handled):
```typescript
throw new DatabaseError('Failed to save record');
```

## Complete Example

### Before Migration:
```typescript
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { message: "ID is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### After Migration:
```typescript
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withErrorHandler } from "@/lib/api-error-handler";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { Logger } from "@/lib/logger";

export const GET = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    throw new ValidationError('ID is required');
  }

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  const duration = Date.now() - startTime;
  Logger.logRequest('GET', '/api/users', 200, duration);

  return NextResponse.json(user);
});
```

## Benefits

1. **Less Boilerplate**: No need for try/catch blocks
2. **Consistent Responses**: All errors follow the same format
3. **Better Logging**: Automatic error logging with context
4. **Type Safety**: TypeScript knows about error types
5. **Easier Testing**: Errors are predictable and testable
6. **Prisma Integration**: Database errors are automatically handled

## Validation Helpers

### validateRequiredFields
```typescript
validateRequiredFields(body, ['email', 'password', 'name']);
```

### validateEmail
```typescript
validateEmail(email); // Throws if invalid format
```

### validatePassword
```typescript
validatePassword(password); // Checks strength requirements
```

## Logging Best Practices

```typescript
// Log successful operations
Logger.info('User created', { userId: user.id });

// Log warnings
Logger.warn('Slow query detected', { query, duration });

// Log errors (automatic in withErrorHandler)
Logger.error('Failed to send email', error, { userId });

// Log requests (for monitoring)
Logger.logRequest('POST', '/api/users', 201, duration);
```

## Migration Checklist

For each API route:
- [ ] Import error handling utilities
- [ ] Wrap handler with `withErrorHandler`
- [ ] Replace manual validation with utility functions
- [ ] Replace error responses with thrown errors
- [ ] Add request logging
- [ ] Remove try/catch blocks
- [ ] Test the endpoint

## Testing

After migration, test each endpoint:
1. ✅ Valid requests return correct data
2. ✅ Invalid requests return 400 with error details
3. ✅ Missing resources return 404
4. ✅ Auth failures return 401
5. ✅ Permission issues return 403
6. ✅ Server errors return 500 with safe message
7. ✅ Errors are logged properly

## Priority Routes to Migrate

1. **Authentication routes** (highest priority)
   - `/api/auth/login`
   - `/api/auth/me`
   - `/api/users/activate`

2. **User management routes**
   - `/api/users/*`
   - `/api/users/me/*`

3. **Core business logic routes**
   - `/api/projects/*`
   - `/api/tasks/*`
   - `/api/reports/*`

4. **Other routes**
   - All remaining API routes

## Notes

- The `withErrorHandler` automatically catches and handles all errors
- Prisma errors are automatically converted to appropriate AppErrors
- All errors are logged with full context
- Client receives safe, consistent error messages
- Stack traces are never exposed to clients

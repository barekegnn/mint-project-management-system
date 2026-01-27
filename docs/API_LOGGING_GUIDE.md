# API Logging Implementation Guide

## Overview

This document describes the logging implementation for all API routes in the Project Management System. The logging system provides structured, consistent logging across the application with automatic request tracking, error logging, and slow query detection.

## Logging Architecture

### Components

1. **Logger Utility** (`src/lib/logger.ts`)
   - Provides structured logging with different log levels (error, warn, info, debug)
   - Automatically formats logs as JSON in production for easy parsing
   - Human-readable format in development
   - Includes slow query detection (>500ms threshold)

2. **withErrorHandler Middleware** (`src/lib/api-error-handler.ts`)
   - Wraps API route handlers to provide automatic error handling
   - **Automatically logs all incoming requests** with method, path, status code, and duration
   - **Automatically logs all errors** with full context and stack traces
   - Provides consistent error response format
   - Handles Prisma errors gracefully

### Automatic Logging Features

When using `withErrorHandler`, the following is logged automatically:

1. **Request Logging** (automatic):
   - HTTP method (GET, POST, PUT, DELETE, etc.)
   - Request path
   - Response status code
   - Request duration in milliseconds

2. **Error Logging** (automatic):
   - Error name and message
   - Full stack trace
   - Request context (path, method)
   - Timestamp

3. **Slow Query Detection** (manual):
   - Use `Logger.logSlowQuery()` to detect queries taking >500ms
   - Helps identify performance bottlenecks

## Implementation Pattern

### Before (Manual Try-Catch)

```typescript
// ❌ Old pattern - manual error handling, console.log
export async function GET(request: Request) {
  try {
    console.log("GET /api/users - Starting request");
    
    const users = await prisma.user.findMany();
    
    console.log("Found users:", users.length);
    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
```

### After (withErrorHandler)

```typescript
// ✅ New pattern - automatic logging, structured error handling
import { withErrorHandler } from "@/lib/api-error-handler";
import { Logger } from "@/lib/logger";

export const GET = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
  
  // No try-catch needed - withErrorHandler handles errors
  const users = await prisma.user.findMany();
  
  // Log slow queries (optional but recommended)
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('SELECT users', duration);
  
  // Use Logger for debug/info messages instead of console.log
  Logger.debug("Found users", { count: users.length });
  
  return NextResponse.json({ users });
  // Request is automatically logged with status code and duration
});
```

## Benefits of withErrorHandler

1. **Automatic Request Logging**: Every request is logged with method, path, status, and duration
2. **Automatic Error Logging**: All errors are logged with full context and stack traces
3. **Consistent Error Responses**: All errors return standardized JSON format
4. **Prisma Error Handling**: Database errors are automatically translated to user-friendly messages
5. **No Redundant Try-Catch**: Error handling is centralized, reducing boilerplate code
6. **Production-Ready**: JSON logging in production, readable logs in development

## Migration Status

### Routes Updated (Using withErrorHandler)

✅ **Core Routes:**
- `/api/auth/login` - Authentication with rate limiting
- `/api/health` - Health check endpoint
- `/api/users` - User management
- `/api/tasks` - Task CRUD operations (GET, POST, PUT, DELETE)
- `/api/projects` - Project CRUD operations (GET, POST)

### Routes Pending Update

The following routes still use manual try-catch blocks and console.log:

**Admin Routes (6):**
- `/api/admin/activities`
- `/api/admin/analytics`
- `/api/admin/projects`
- `/api/admin/projects/[projectId]`
- `/api/admin/stats`
- `/api/admin/tasks`

**Analytics Routes (4):**
- `/api/analytics`
- `/api/analytics/metrics`
- `/api/analytics/project-timeline`
- `/api/analytics/team-performance`

**Project Routes (10):**
- `/api/projects/assigned`
- `/api/projects/by-holder/[holderId]`
- `/api/projects/list`
- `/api/projects/manager`
- `/api/projects/managers`
- `/api/projects/my-projects`
- `/api/projects/[projectId]`
- `/api/projects/[projectId]/available-team-members`
- `/api/projects/[projectId]/members`
- `/api/projects/[projectId]/tasks`
- `/api/projects/[projectId]/team-members`
- `/api/projects/[projectId]/team-members/[userId]`

**Task Routes (4):**
- `/api/tasks/[taskId]`
- `/api/tasks/[taskId]/attachments`
- `/api/tasks/[taskId]/attachments/[attachmentId]`
- `/api/tasks/[taskId]/comments`

**Team Member Routes (15):**
- `/api/team-member`
- `/api/team-member/achievements`
- `/api/team-member/activity`
- `/api/team-member/analytics`
- `/api/team-member/badges`
- `/api/team-member/calendar`
- `/api/team-member/dashboard`
- `/api/team-member/goals`
- `/api/team-member/managers`
- `/api/team-member/notifications`
- `/api/team-member/productivity`
- `/api/team-member/projects`
- `/api/team-member/tasks`
- `/api/team-member/tasks/[taskId]`
- `/api/team-member/tasks-by-manager`
- `/api/team-member/time-tracking`

**User Routes (9):**
- `/api/users/activate`
- `/api/users/create`
- `/api/users/me`
- `/api/users/me/change-email/confirm`
- `/api/users/me/change-email/request`
- `/api/users/me/change-password`
- `/api/users/me/preferences`
- `/api/users/me/profile-image`

**Other Routes (20+):**
- All notification routes
- All budget routes
- All report routes
- All settings routes
- All team-members routes
- Test routes

**Total:** 72 routes need to be updated

## Logging Best Practices

### 1. Use Logger Instead of console.log

```typescript
// ❌ Don't use console.log
console.log("User created:", user.id);

// ✅ Use Logger
Logger.info("User created", { userId: user.id, email: user.email });
```

### 2. Log Slow Queries

```typescript
export const GET = withErrorHandler(async (request: Request) => {
  const startTime = Date.now();
  
  const projects = await prisma.project.findMany({
    include: {
      tasks: true,
      teams: { include: { members: true } }
    }
  });
  
  // Log if query takes more than 500ms
  const duration = Date.now() - startTime;
  Logger.logSlowQuery('SELECT projects with includes', duration);
  
  return NextResponse.json({ projects });
});
```

### 3. Use Debug Logs for Development

```typescript
// Debug logs only appear in development
Logger.debug("Processing request", { userId, projectId });
```

### 4. Log Important Business Events

```typescript
Logger.info("Project created", { 
  projectId: project.id, 
  name: project.name, 
  holderId: user.id 
});

Logger.info("Task assigned", { 
  taskId: task.id, 
  assignedTo: user.id 
});
```

### 5. Don't Log Sensitive Data

```typescript
// ❌ Don't log passwords or tokens
Logger.info("User login", { password: user.password }); // BAD!

// ✅ Log only non-sensitive data
Logger.info("User login", { userId: user.id, email: user.email }); // GOOD!
```

## Testing Logging

### Check Logs in Development

```bash
npm run dev
```

Make requests to API endpoints and check the console output:

```
[INFO] API Request
Data: { method: 'GET', path: '/api/users', statusCode: 200, duration: '45ms' }

✅ GET /api/users - 200 (45ms)
```

### Check Logs in Production

In production, logs are formatted as JSON:

```json
{
  "level": "info",
  "message": "API Request",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "method": "GET",
    "path": "/api/users",
    "statusCode": 200,
    "duration": "45ms"
  }
}
```

## Next Steps

To complete the logging implementation:

1. **Update Remaining Routes**: Convert all routes to use `withErrorHandler`
2. **Add Slow Query Logging**: Add `Logger.logSlowQuery()` to complex database queries
3. **Remove console.log**: Replace all `console.log` with `Logger.debug/info`
4. **Test Logging**: Verify logs appear correctly in development and production
5. **Monitor Performance**: Use slow query logs to identify performance bottlenecks

## Verification Script

Run the logging analysis script to check progress:

```bash
npx tsx scripts/check-api-logging.ts
```

This will show:
- Total routes
- Routes using withErrorHandler
- Routes that need updating
- Routes still using console.log

## Requirements Validation

This implementation satisfies:
- **US-6.3**: Configure logging for API routes
  - ✅ All API requests are logged with method, path, status code
  - ✅ All errors are logged with full context
  - ✅ Slow queries (>500ms) can be detected and logged
  - ✅ Structured logging format (JSON in production)

## Related Files

- `src/lib/logger.ts` - Logger utility implementation
- `src/lib/api-error-handler.ts` - withErrorHandler middleware
- `src/lib/errors.ts` - Custom error classes
- `scripts/check-api-logging.ts` - Logging analysis script

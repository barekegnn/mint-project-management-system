# API Documentation

This document provides comprehensive documentation for all API endpoints in the Project Management System.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Base URL](#base-url)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)
  - [Authentication](#authentication-endpoints)
  - [Users](#user-endpoints)
  - [Projects](#project-endpoints)
  - [Tasks](#task-endpoints)
  - [Teams](#team-endpoints)
  - [Budgets](#budget-endpoints)
  - [Reports](#report-endpoints)
  - [Notifications](#notification-endpoints)
  - [Messages](#message-endpoints)
  - [Analytics](#analytics-endpoints)
  - [Admin](#admin-endpoints)
  - [Health](#health-endpoints)

---

## Overview

The Project Management System API is a RESTful API built with Next.js API Routes. All endpoints return JSON responses and use standard HTTP methods and status codes.

### API Version

Current Version: `1.0.0`

### Content Type

All requests and responses use `application/json` content type.

---

## Authentication

The API uses JWT (JSON Web Token) based authentication. Tokens are stored in httpOnly cookies for security.

### Authentication Flow

1. **Login**: POST to `/api/auth/login` with credentials
2. **Token**: Receive JWT token in httpOnly cookie
3. **Authenticated Requests**: Token automatically sent with subsequent requests
4. **Logout**: POST to `/api/logout` to clear token

### Authentication Header

For API clients that don't support cookies, you can send the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Roles

The system supports three user roles:
- `ADMIN`: Full system access
- `PROJECT_MANAGER`: Can manage projects and teams
- `TEAM_MEMBER`: Can view and update assigned tasks

---

## Base URL

### Development
```
http://localhost:3000/api
```

### Production
```
https://yourapp.vercel.app/api
```

---

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```


### Error Response

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "statusCode": 400
}
```

### Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |
| 503 | Service Unavailable - Service temporarily unavailable |

---

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Descriptive error message",
  "code": "ERROR_CODE",
  "statusCode": 400
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Input validation failed
- `AUTH_ERROR`: Authentication failed
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `DATABASE_ERROR`: Database operation failed
- `INTERNAL_ERROR`: Unexpected server error

---

## Rate Limiting

Authentication endpoints are rate-limited to prevent abuse:

- **Login**: 5 attempts per 15 minutes per IP
- **Register**: 3 attempts per hour per IP
- **Password Reset**: 3 attempts per hour per IP

When rate limit is exceeded, you'll receive a 429 status code:

```json
{
  "error": "Too many requests. Please try again later.",
  "retryAfter": 900
}
```

---

## Endpoints


### Authentication Endpoints

#### POST /api/auth/login

Authenticate user and receive JWT token.

**Authentication**: None (public endpoint)

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200):
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "PROJECT_MANAGER"
  },
  "message": "Login successful"
}
```

**Errors**:
- 400: Invalid credentials
- 429: Too many login attempts

---

#### GET /api/auth/me

Get current authenticated user information.

**Authentication**: Required

**Response** (200):
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "PROJECT_MANAGER",
    "status": "ACTIVE",
    "emailVerified": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errors**:
- 401: Not authenticated

---

#### POST /api/logout

Logout user and clear authentication token.

**Authentication**: Required

**Response** (200):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

#### POST /api/forgot-password

Request password reset email.

**Authentication**: None (public endpoint)

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

**Errors**:
- 404: Email not found
- 429: Too many reset attempts

---


### User Endpoints

#### GET /api/users

Get list of all users (Admin only).

**Authentication**: Required (Admin)

**Query Parameters**:
- `role` (optional): Filter by role (ADMIN, PROJECT_MANAGER, TEAM_MEMBER)
- `status` (optional): Filter by status (ACTIVE, INACTIVE, SUSPENDED)

**Response** (200):
```json
{
  "users": [
    {
      "id": "user-id",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "PROJECT_MANAGER",
      "status": "ACTIVE",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### POST /api/users/create

Create a new user (Admin only).

**Authentication**: Required (Admin)

**Request Body**:
```json
{
  "email": "newuser@example.com",
  "fullName": "Jane Smith",
  "password": "SecurePass123!",
  "role": "TEAM_MEMBER"
}
```

**Response** (201):
```json
{
  "success": true,
  "user": {
    "id": "new-user-id",
    "email": "newuser@example.com",
    "fullName": "Jane Smith",
    "role": "TEAM_MEMBER"
  },
  "message": "User created successfully"
}
```

**Errors**:
- 400: Validation error (invalid email, weak password, etc.)
- 409: Email already exists

---

#### GET /api/users/me

Get current user profile.

**Authentication**: Required

**Response** (200):
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "PROJECT_MANAGER",
    "status": "ACTIVE",
    "emailVerified": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### PUT /api/users/me

Update current user profile.

**Authentication**: Required

**Request Body**:
```json
{
  "fullName": "John Updated Doe",
  "phone": "+1234567890"
}
```

**Response** (200):
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "fullName": "John Updated Doe",
    "phone": "+1234567890"
  },
  "message": "Profile updated successfully"
}
```

---

#### POST /api/users/me/change-password

Change current user password.

**Authentication**: Required

**Request Body**:
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Errors**:
- 400: Current password incorrect
- 400: New password doesn't meet requirements

---


### Project Endpoints

#### GET /api/projects

Get list of projects (filtered by user role).

**Authentication**: Required

**Query Parameters**:
- `status` (optional): Filter by status (ACTIVE, COMPLETED, ON_HOLD, CANCELLED)
- `search` (optional): Search by project name

**Response** (200):
```json
{
  "projects": [
    {
      "id": "project-id",
      "name": "Ministry Digital Portal",
      "description": "Digital transformation project",
      "status": "ACTIVE",
      "budget": "500000",
      "dueDate": "2024-12-31T00:00:00.000Z",
      "holder": {
        "id": "pm-id",
        "fullName": "Project Manager"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### POST /api/projects

Create a new project (Admin or Project Manager).

**Authentication**: Required (Admin or Project Manager)

**Request Body**:
```json
{
  "name": "New Project",
  "description": "Project description",
  "status": "ACTIVE",
  "budget": "100000",
  "dueDate": "2024-12-31",
  "holderId": "pm-user-id"
}
```

**Response** (201):
```json
{
  "success": true,
  "project": {
    "id": "new-project-id",
    "name": "New Project",
    "status": "ACTIVE",
    "budget": "100000"
  },
  "message": "Project created successfully"
}
```

**Errors**:
- 400: Validation error
- 403: Insufficient permissions

---

#### GET /api/projects/[projectId]

Get project details by ID.

**Authentication**: Required

**Response** (200):
```json
{
  "project": {
    "id": "project-id",
    "name": "Ministry Digital Portal",
    "description": "Detailed description",
    "status": "ACTIVE",
    "budget": "500000",
    "dueDate": "2024-12-31T00:00:00.000Z",
    "holder": {
      "id": "pm-id",
      "fullName": "Project Manager",
      "email": "pm@example.com"
    },
    "tasks": [
      {
        "id": "task-id",
        "title": "Task title",
        "status": "IN_PROGRESS"
      }
    ],
    "teamMembers": [
      {
        "id": "member-id",
        "fullName": "Team Member"
      }
    ]
  }
}
```

**Errors**:
- 404: Project not found
- 403: No access to this project

---

#### PUT /api/projects/[projectId]

Update project details.

**Authentication**: Required (Admin or Project Manager)

**Request Body**:
```json
{
  "name": "Updated Project Name",
  "status": "COMPLETED",
  "budget": "550000"
}
```

**Response** (200):
```json
{
  "success": true,
  "project": {
    "id": "project-id",
    "name": "Updated Project Name",
    "status": "COMPLETED"
  },
  "message": "Project updated successfully"
}
```

---

#### DELETE /api/projects/[projectId]

Delete a project (Admin only).

**Authentication**: Required (Admin)

**Response** (200):
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

**Errors**:
- 404: Project not found
- 403: Only admins can delete projects

---


### Task Endpoints

#### GET /api/tasks

Get list of tasks (filtered by user role and permissions).

**Authentication**: Required

**Query Parameters**:
- `projectId` (optional): Filter by project
- `status` (optional): Filter by status (TODO, IN_PROGRESS, COMPLETED, CANCELLED)
- `priority` (optional): Filter by priority (LOW, MEDIUM, HIGH, URGENT)
- `assignedToId` (optional): Filter by assigned user

**Response** (200):
```json
{
  "tasks": [
    {
      "id": "task-id",
      "title": "Implement authentication",
      "description": "Build secure auth system",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "dueDate": "2024-02-15T00:00:00.000Z",
      "project": {
        "id": "project-id",
        "name": "Ministry Portal"
      },
      "assignedTo": {
        "id": "user-id",
        "fullName": "Team Member"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### POST /api/tasks

Create a new task.

**Authentication**: Required (Admin or Project Manager)

**Request Body**:
```json
{
  "title": "New Task",
  "description": "Task description",
  "status": "TODO",
  "priority": "MEDIUM",
  "projectId": "project-id",
  "assignedToId": "user-id",
  "dueDate": "2024-03-01"
}
```

**Response** (201):
```json
{
  "success": true,
  "task": {
    "id": "new-task-id",
    "title": "New Task",
    "status": "TODO",
    "priority": "MEDIUM"
  },
  "message": "Task created successfully"
}
```

---

#### GET /api/tasks/[taskId]

Get task details by ID.

**Authentication**: Required

**Response** (200):
```json
{
  "task": {
    "id": "task-id",
    "title": "Implement authentication",
    "description": "Detailed description",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "dueDate": "2024-02-15T00:00:00.000Z",
    "project": {
      "id": "project-id",
      "name": "Ministry Portal"
    },
    "assignedTo": {
      "id": "user-id",
      "fullName": "Team Member",
      "email": "team@example.com"
    },
    "comments": [
      {
        "id": "comment-id",
        "content": "Comment text",
        "author": {
          "fullName": "John Doe"
        },
        "createdAt": "2024-01-15T00:00:00.000Z"
      }
    ],
    "attachments": [
      {
        "id": "attachment-id",
        "fileName": "document.pdf",
        "fileUrl": "https://..."
      }
    ]
  }
}
```

---

#### PUT /api/tasks/[taskId]

Update task details.

**Authentication**: Required

**Request Body**:
```json
{
  "title": "Updated Task Title",
  "status": "COMPLETED",
  "priority": "HIGH"
}
```

**Response** (200):
```json
{
  "success": true,
  "task": {
    "id": "task-id",
    "title": "Updated Task Title",
    "status": "COMPLETED"
  },
  "message": "Task updated successfully"
}
```

---

#### DELETE /api/tasks/[taskId]

Delete a task.

**Authentication**: Required (Admin or Project Manager)

**Response** (200):
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

---

#### POST /api/tasks/[taskId]/comments

Add a comment to a task.

**Authentication**: Required

**Request Body**:
```json
{
  "content": "This is a comment on the task"
}
```

**Response** (201):
```json
{
  "success": true,
  "comment": {
    "id": "comment-id",
    "content": "This is a comment on the task",
    "author": {
      "fullName": "John Doe"
    },
    "createdAt": "2024-01-20T00:00:00.000Z"
  },
  "message": "Comment added successfully"
}
```

---


### Budget Endpoints

#### GET /api/budgets

Get list of budget entries.

**Authentication**: Required (Admin or Project Manager)

**Query Parameters**:
- `projectId` (optional): Filter by project
- `department` (optional): Filter by department

**Response** (200):
```json
{
  "budgets": [
    {
      "id": "budget-id",
      "amount": "50000",
      "department": "IT",
      "description": "Software licenses",
      "project": {
        "id": "project-id",
        "name": "Ministry Portal"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### POST /api/budgets

Create a new budget entry.

**Authentication**: Required (Admin or Project Manager)

**Request Body**:
```json
{
  "amount": "25000",
  "department": "HR",
  "description": "Training budget",
  "projectId": "project-id"
}
```

**Response** (201):
```json
{
  "success": true,
  "budget": {
    "id": "new-budget-id",
    "amount": "25000",
    "department": "HR"
  },
  "message": "Budget entry created successfully"
}
```

---

### Report Endpoints

#### GET /api/reports

Get list of reports.

**Authentication**: Required

**Query Parameters**:
- `projectId` (optional): Filter by project
- `status` (optional): Filter by status (DRAFT, SUBMITTED, APPROVED, REJECTED)

**Response** (200):
```json
{
  "reports": [
    {
      "id": "report-id",
      "title": "Monthly Progress Report",
      "status": "SUBMITTED",
      "project": {
        "id": "project-id",
        "name": "Ministry Portal"
      },
      "submittedBy": {
        "fullName": "Team Member"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### POST /api/reports

Create a new report.

**Authentication**: Required

**Request Body**:
```json
{
  "title": "Weekly Status Report",
  "content": "Report content here...",
  "projectId": "project-id",
  "status": "DRAFT"
}
```

**Response** (201):
```json
{
  "success": true,
  "report": {
    "id": "new-report-id",
    "title": "Weekly Status Report",
    "status": "DRAFT"
  },
  "message": "Report created successfully"
}
```

---

#### POST /api/reports/generate

Generate a project report.

**Authentication**: Required (Admin or Project Manager)

**Request Body**:
```json
{
  "projectId": "project-id",
  "reportType": "PROGRESS",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}
```

**Response** (200):
```json
{
  "success": true,
  "report": {
    "projectName": "Ministry Portal",
    "period": "January 2024",
    "tasksCompleted": 15,
    "tasksInProgress": 8,
    "tasksPending": 3,
    "budgetUsed": "350000",
    "budgetRemaining": "150000"
  }
}
```

---


### Notification Endpoints

#### GET /api/notifications

Get user notifications.

**Authentication**: Required

**Query Parameters**:
- `unreadOnly` (optional): Filter unread notifications (true/false)
- `limit` (optional): Limit number of results (default: 50)

**Response** (200):
```json
{
  "notifications": [
    {
      "id": "notification-id",
      "type": "TASK_ASSIGNED",
      "title": "New task assigned",
      "message": "You have been assigned to: Implement authentication",
      "read": false,
      "createdAt": "2024-01-20T00:00:00.000Z",
      "relatedId": "task-id"
    }
  ],
  "unreadCount": 5
}
```

---

#### GET /api/notifications/unread-count

Get count of unread notifications.

**Authentication**: Required

**Response** (200):
```json
{
  "count": 5
}
```

---

#### PUT /api/notifications/[id]

Mark notification as read.

**Authentication**: Required

**Response** (200):
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

### Message Endpoints

#### GET /api/messages

Get user messages.

**Authentication**: Required

**Query Parameters**:
- `conversationId` (optional): Filter by conversation
- `unreadOnly` (optional): Filter unread messages

**Response** (200):
```json
{
  "messages": [
    {
      "id": "message-id",
      "content": "Hello, how is the project going?",
      "sender": {
        "id": "sender-id",
        "fullName": "John Doe"
      },
      "recipient": {
        "id": "recipient-id",
        "fullName": "Jane Smith"
      },
      "read": false,
      "createdAt": "2024-01-20T10:30:00.000Z"
    }
  ]
}
```

---

#### POST /api/messages

Send a new message.

**Authentication**: Required

**Request Body**:
```json
{
  "recipientId": "user-id",
  "content": "Message content here",
  "subject": "Project Update"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": {
    "id": "new-message-id",
    "content": "Message content here",
    "createdAt": "2024-01-20T10:35:00.000Z"
  },
  "message": "Message sent successfully"
}
```

---


### Analytics Endpoints

#### GET /api/analytics

Get general analytics data.

**Authentication**: Required (Admin or Project Manager)

**Response** (200):
```json
{
  "analytics": {
    "totalProjects": 15,
    "activeProjects": 8,
    "completedProjects": 7,
    "totalTasks": 120,
    "completedTasks": 85,
    "totalUsers": 25,
    "activeUsers": 22
  }
}
```

---

#### GET /api/analytics/metrics

Get detailed metrics.

**Authentication**: Required (Admin or Project Manager)

**Query Parameters**:
- `startDate` (optional): Start date for metrics
- `endDate` (optional): End date for metrics

**Response** (200):
```json
{
  "metrics": {
    "projectCompletionRate": 75.5,
    "taskCompletionRate": 82.3,
    "averageTaskDuration": 5.2,
    "budgetUtilization": 68.5,
    "teamProductivity": 85.0
  }
}
```

---

#### GET /api/analytics/project-timeline

Get project timeline data.

**Authentication**: Required (Admin or Project Manager)

**Query Parameters**:
- `projectId` (required): Project ID

**Response** (200):
```json
{
  "timeline": [
    {
      "date": "2024-01-01",
      "tasksCompleted": 3,
      "tasksCreated": 5,
      "milestone": "Phase 1 Complete"
    },
    {
      "date": "2024-01-15",
      "tasksCompleted": 7,
      "tasksCreated": 2
    }
  ]
}
```

---

#### GET /api/analytics/team-performance

Get team performance metrics.

**Authentication**: Required (Admin or Project Manager)

**Response** (200):
```json
{
  "teamPerformance": [
    {
      "teamMember": {
        "id": "user-id",
        "fullName": "John Doe"
      },
      "tasksCompleted": 15,
      "tasksInProgress": 3,
      "averageCompletionTime": 4.5,
      "productivityScore": 88.5
    }
  ]
}
```

---

### Admin Endpoints

#### GET /api/admin/stats

Get system-wide statistics (Admin only).

**Authentication**: Required (Admin)

**Response** (200):
```json
{
  "stats": {
    "totalUsers": 50,
    "totalProjects": 25,
    "totalTasks": 300,
    "activeUsers": 45,
    "systemUptime": 99.8,
    "storageUsed": "2.5GB"
  }
}
```

---

#### GET /api/admin/activities

Get recent system activities (Admin only).

**Authentication**: Required (Admin)

**Query Parameters**:
- `limit` (optional): Number of activities to return (default: 50)

**Response** (200):
```json
{
  "activities": [
    {
      "id": "activity-id",
      "type": "USER_CREATED",
      "description": "New user registered: john@example.com",
      "user": {
        "fullName": "Admin User"
      },
      "createdAt": "2024-01-20T10:00:00.000Z"
    }
  ]
}
```

---

#### GET /api/admin/projects

Get all projects with admin view (Admin only).

**Authentication**: Required (Admin)

**Response** (200):
```json
{
  "projects": [
    {
      "id": "project-id",
      "name": "Ministry Portal",
      "status": "ACTIVE",
      "holder": {
        "fullName": "Project Manager"
      },
      "taskCount": 25,
      "completedTaskCount": 18,
      "budget": "500000",
      "budgetUsed": "350000"
    }
  ]
}
```

---


### Health Endpoints

#### GET /api/health

Get system health status.

**Authentication**: None (public endpoint)

**Response** (200 - Healthy):
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:00:00.000Z",
  "services": [
    {
      "service": "database",
      "status": "healthy",
      "latency": 45
    },
    {
      "service": "api",
      "status": "healthy",
      "latency": 2
    }
  ],
  "uptime": 123456.78
}
```

**Response** (503 - Unhealthy):
```json
{
  "status": "unhealthy",
  "timestamp": "2024-01-20T10:00:00.000Z",
  "services": [
    {
      "service": "database",
      "status": "down",
      "message": "Database connection failed"
    },
    {
      "service": "api",
      "status": "healthy",
      "latency": 2
    }
  ],
  "uptime": 123456.78
}
```

**Status Values**:
- `healthy`: All services operational
- `degraded`: Some services slow but operational
- `unhealthy`: One or more services down

---

## Example Requests

### Using cURL

#### Login
```bash
curl -X POST https://yourapp.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@demo.com",
    "password": "Admin@123"
  }' \
  -c cookies.txt
```

#### Get Projects (with cookie)
```bash
curl -X GET https://yourapp.vercel.app/api/projects \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

#### Create Task
```bash
curl -X POST https://yourapp.vercel.app/api/tasks \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "New Task",
    "description": "Task description",
    "status": "TODO",
    "priority": "MEDIUM",
    "projectId": "project-id",
    "assignedToId": "user-id"
  }'
```

### Using JavaScript (Fetch API)

#### Login
```javascript
const response = await fetch('https://yourapp.vercel.app/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Important for cookies
  body: JSON.stringify({
    email: 'admin@demo.com',
    password: 'Admin@123',
  }),
});

const data = await response.json();
console.log(data);
```

#### Get Projects
```javascript
const response = await fetch('https://yourapp.vercel.app/api/projects', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Important for cookies
});

const data = await response.json();
console.log(data.projects);
```

#### Create Task
```javascript
const response = await fetch('https://yourapp.vercel.app/api/tasks', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    title: 'New Task',
    description: 'Task description',
    status: 'TODO',
    priority: 'MEDIUM',
    projectId: 'project-id',
    assignedToId: 'user-id',
  }),
});

const data = await response.json();
console.log(data);
```

---

## Pagination

For endpoints that return lists, pagination is supported:

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response includes pagination metadata**:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Filtering and Sorting

Many list endpoints support filtering and sorting:

**Common Query Parameters**:
- `sort`: Field to sort by (e.g., `createdAt`, `name`)
- `order`: Sort order (`asc` or `desc`)
- `search`: Search term for text fields

**Example**:
```
GET /api/projects?status=ACTIVE&sort=createdAt&order=desc&search=portal
```

---

## Webhooks (Future Feature)

Webhook support is planned for future releases to enable real-time integrations.

---

## API Versioning

The API currently uses implicit versioning. Future versions will use URL-based versioning:

- Current: `/api/endpoint`
- Future: `/api/v2/endpoint`

---

## Rate Limits

| Endpoint Type | Limit |
|---------------|-------|
| Authentication | 5 requests per 15 minutes |
| Read Operations | 100 requests per minute |
| Write Operations | 30 requests per minute |
| Admin Operations | 50 requests per minute |

---

## Support

For API support:
- Check this documentation
- Review error messages in responses
- Check application logs
- Contact development team

---

## Changelog

### Version 1.0.0 (Current)
- Initial API release
- Authentication endpoints
- User management
- Project management
- Task management
- Budget tracking
- Reports and analytics
- Notifications and messaging
- Health monitoring

---

**Last Updated**: January 2024

**API Version**: 1.0.0

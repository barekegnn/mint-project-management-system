# Deployment Preparation and Optimization - Design Document

## Overview

This design document outlines the technical approach for preparing and deploying a Next.js 15 Project Management System to production using 100% free services (no credit card required). The system was built for the Ethiopian Ministry of Innovation and Technology and will be deployed as a portfolio showcase.

### Current Architecture

**Tech Stack:**
- Frontend: Next.js 15 (App Router), React 19, TypeScript
- Backend: Next.js API Routes
- Database: PostgreSQL (currently local)
- ORM: Prisma
- Authentication: Custom JWT + NextAuth (mixed implementation)
- File Storage: AWS S3 (requires migration)
- Email: Gmail SMTP (teammate's credentials)

**Current Issues:**
- Hardcoded credentials in .env (teammate's configuration)
- Mixed authentication strategies (JWT and NextAuth)
- AWS S3 dependency (requires credit card)
- Local PostgreSQL database
- No production configuration
- Commented-out code and unused imports
- Missing environment variable documentation

### Target Architecture

**Deployment Stack (100% Free):**
- Hosting: Vercel Free Tier
- Database: Neon PostgreSQL (0.5GB free, no credit card)
- File Storage: Vercel Blob (1GB free) OR Cloudinary (25GB free)
- Email: Gmail SMTP (new account with App Password)
- Monitoring: Vercel Analytics + UptimeRobot
- Domain: Vercel subdomain (yourapp.vercel.app)


### Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
    end
    
    subgraph "Vercel Free Tier"
        NextJS[Next.js 15 App]
        API[API Routes]
        Auth[Authentication Layer]
    end
    
    subgraph "Data Layer"
        Neon[(Neon PostgreSQL<br/>0.5GB Free)]
        Blob[Vercel Blob<br/>1GB Free]
    end
    
    subgraph "External Services"
        Gmail[Gmail SMTP<br/>Free]
        Analytics[Vercel Analytics<br/>Free]
        Uptime[UptimeRobot<br/>Free]
    end
    
    Browser -->|HTTPS| NextJS
    NextJS --> API
    API --> Auth
    Auth --> Neon
    API --> Neon
    API --> Blob
    API --> Gmail
    NextJS --> Analytics
    Uptime -->|Health Check| NextJS
    
    style Vercel fill:#000,stroke:#fff,color:#fff
    style Neon fill:#0ea5e9,stroke:#fff,color:#fff
    style Blob fill:#000,stroke:#fff,color:#fff
    style Gmail fill:#ea4335,stroke:#fff,color:#fff
```

### Data Flow

1. **User Request Flow:**
   - User accesses app via HTTPS (Vercel subdomain)
   - Next.js handles routing and SSR
   - API routes process business logic
   - Prisma queries Neon PostgreSQL
   - Response rendered and cached

2. **Authentication Flow:**
   - User submits credentials
   - JWT token generated and stored in httpOnly cookie
   - Token validated on protected routes
   - Session managed server-side

3. **File Upload Flow:**
   - User uploads file via form
   - API route receives multipart data
   - File stored in Vercel Blob
   - URL saved in Neon database
   - Presigned URL generated for access

4. **Email Notification Flow:**
   - System event triggers email
   - Nodemailer connects to Gmail SMTP
   - Email sent via App Password
   - Delivery status logged



## Architecture

### Component Architecture

```mermaid
graph LR
    subgraph "Frontend Components"
        UI[UI Components]
        Forms[Form Components]
        Charts[Chart Components]
    end
    
    subgraph "API Layer"
        AuthAPI[Auth API]
        ProjectAPI[Project API]
        TaskAPI[Task API]
        UserAPI[User API]
        FileAPI[File API]
        EmailAPI[Email API]
    end
    
    subgraph "Business Logic"
        AuthService[Auth Service]
        ProjectService[Project Service]
        TaskService[Task Service]
        FileService[File Service]
        EmailService[Email Service]
    end
    
    subgraph "Data Access"
        Prisma[Prisma Client]
    end
    
    UI --> AuthAPI
    Forms --> ProjectAPI
    Forms --> TaskAPI
    Charts --> ProjectAPI
    
    AuthAPI --> AuthService
    ProjectAPI --> ProjectService
    TaskAPI --> TaskService
    FileAPI --> FileService
    EmailAPI --> EmailService
    
    AuthService --> Prisma
    ProjectService --> Prisma
    TaskService --> Prisma
    FileService --> Prisma
    EmailService --> Prisma
```

### Authentication Strategy

**Current State:**
- Mixed implementation using both JWT and NextAuth
- JWT tokens for API authentication
- NextAuth for OAuth (not fully implemented)
- Inconsistent session management

**Target State:**
- Standardize on JWT-based authentication
- Remove NextAuth dependencies (not needed for current features)
- Implement consistent token validation middleware
- Use httpOnly cookies for token storage
- Refresh token mechanism for extended sessions

**Authentication Flow:**
```typescript
// Simplified authentication flow
1. User Login → Validate credentials → Generate JWT → Set httpOnly cookie
2. Protected Route → Extract token → Verify JWT → Allow/Deny access
3. Token Refresh → Check expiry → Generate new token → Update cookie
4. User Logout → Clear cookie → Invalidate session
```



## Components and Interfaces

### 1. Credential Setup Component

**Purpose:** Manage creation and configuration of all required free service accounts.

**Interface:**
```typescript
interface CredentialSetup {
  // Gmail SMTP Configuration
  createGmailAccount(): Promise<GmailConfig>;
  enableTwoFactor(): Promise<void>;
  generateAppPassword(): Promise<string>;
  
  // Neon Database Configuration
  signupNeon(): Promise<NeonConfig>;
  createDatabase(): Promise<DatabaseConnection>;
  getConnectionString(): Promise<string>;
  
  // Secret Generation
  generateJWTSecret(): string;
  generateNextAuthSecret(): string;
  
  // Environment Variable Management
  createEnvFile(config: EnvironmentConfig): void;
  validateEnvVariables(): ValidationResult;
}

interface GmailConfig {
  email: string;
  appPassword: string;
  smtpHost: string;
  smtpPort: number;
  secure: boolean;
}

interface NeonConfig {
  projectId: string;
  databaseName: string;
  connectionString: string;
  pooledConnectionString: string;
}

interface EnvironmentConfig {
  database: NeonConfig;
  email: GmailConfig;
  auth: {
    jwtSecret: string;
    nextAuthSecret: string;
    nextAuthUrl: string;
  };
  storage: StorageConfig;
}
```

**Implementation Steps:**
1. Create new Gmail account (manual)
2. Enable 2FA in Gmail settings (manual)
3. Generate App Password in Gmail (manual)
4. Sign up for Neon via GitHub OAuth (manual)
5. Create new database in Neon dashboard (manual)
6. Copy connection strings (manual)
7. Generate secrets using Node.js crypto (automated)
8. Create .env file with all credentials (automated)



### 2. Code Cleanup Component

**Purpose:** Remove hardcoded credentials, unused code, and security vulnerabilities.

**Interface:**
```typescript
interface CodeCleanup {
  // Credential Removal
  removeHardcodedCredentials(): Promise<CleanupReport>;
  scanForSecrets(): Promise<SecretScanResult[]>;
  
  // Code Quality
  removeCommentedCode(): Promise<void>;
  removeUnusedImports(): Promise<void>;
  standardizeErrorHandling(): Promise<void>;
  
  // Security
  addInputValidation(): Promise<void>;
  implementRateLimiting(): Promise<void>;
  sanitizeUserInputs(): Promise<void>;
  
  // Documentation
  createEnvExample(): void;
  updateGitignore(): void;
}

interface CleanupReport {
  filesScanned: number;
  credentialsRemoved: number;
  commentsRemoved: number;
  importsRemoved: number;
  securityIssues: SecurityIssue[];
}

interface SecurityIssue {
  file: string;
  line: number;
  type: 'hardcoded_secret' | 'sql_injection' | 'xss' | 'missing_validation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
}
```

**Cleanup Checklist:**
- [ ] Remove all hardcoded credentials from .env
- [ ] Create .env.example with placeholder values
- [ ] Update .gitignore to exclude .env, .env.local, .env.production
- [ ] Remove commented-out code blocks
- [ ] Remove unused imports and dependencies
- [ ] Standardize error handling across API routes
- [ ] Add Zod validation to all API endpoints
- [ ] Implement rate limiting on auth endpoints
- [ ] Remove AWS S3 related code
- [ ] Clean up mixed authentication code (JWT vs NextAuth)



### 3. File Storage Migration Component

**Purpose:** Migrate from AWS S3 to free alternatives (Vercel Blob or Cloudinary).

**Option A: Vercel Blob (Recommended)**

```typescript
interface VercelBlobStorage {
  // Upload Operations
  uploadFile(file: File, path: string): Promise<BlobUploadResult>;
  uploadMultiple(files: File[]): Promise<BlobUploadResult[]>;
  
  // Download Operations
  getFileUrl(blobId: string): Promise<string>;
  downloadFile(blobId: string): Promise<Blob>;
  
  // Management
  deleteFile(blobId: string): Promise<void>;
  listFiles(prefix?: string): Promise<BlobMetadata[]>;
  
  // Migration
  migrateFromS3(): Promise<MigrationReport>;
}

interface BlobUploadResult {
  url: string;
  pathname: string;
  contentType: string;
  contentDisposition: string;
}

interface BlobMetadata {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
}
```

**Implementation:**
```typescript
// Install Vercel Blob SDK
// npm install @vercel/blob

import { put, del, list } from '@vercel/blob';

// Upload file
export async function uploadToBlob(file: File) {
  const blob = await put(file.name, file, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  
  return {
    url: blob.url,
    pathname: blob.pathname,
  };
}

// Delete file
export async function deleteFromBlob(url: string) {
  await del(url, {
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
}

// List files
export async function listBlobFiles() {
  const { blobs } = await list({
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  
  return blobs;
}
```

**Option B: Cloudinary (Alternative)**

```typescript
interface CloudinaryStorage {
  uploadFile(file: File): Promise<CloudinaryUploadResult>;
  deleteFile(publicId: string): Promise<void>;
  getOptimizedUrl(publicId: string, options: TransformOptions): string;
}

interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  resourceType: string;
}
```

**Option C: Disable File Uploads (Temporary)**

```typescript
// Modify file upload endpoints to return error
export async function POST(request: Request) {
  return Response.json(
    { error: 'File uploads temporarily disabled' },
    { status: 503 }
  );
}

// Update UI to hide upload buttons
const UPLOADS_ENABLED = process.env.ENABLE_UPLOADS === 'true';
```



### 4. Database Migration Component

**Purpose:** Migrate from local PostgreSQL to Neon cloud database.

**Interface:**
```typescript
interface DatabaseMigration {
  // Schema Management
  exportSchema(): Promise<string>;
  validateSchema(): Promise<ValidationResult>;
  
  // Migration Execution
  runMigrations(connectionString: string): Promise<MigrationResult>;
  seedDatabase(data: SeedData): Promise<void>;
  
  // Connection Management
  testConnection(connectionString: string): Promise<boolean>;
  setupConnectionPooling(): Promise<void>;
  
  // Data Transfer
  exportData(): Promise<DatabaseDump>;
  importData(dump: DatabaseDump): Promise<void>;
}

interface MigrationResult {
  success: boolean;
  migrationsRun: string[];
  errors: MigrationError[];
  duration: number;
}

interface SeedData {
  users: User[];
  projects: Project[];
  tasks: Task[];
  teams: Team[];
}
```

**Migration Steps:**

1. **Export Current Schema:**
```bash
# Prisma automatically handles schema
npx prisma migrate dev --name init
npx prisma generate
```

2. **Create Neon Database:**
```typescript
// Manual steps:
// 1. Go to neon.tech
// 2. Sign in with GitHub
// 3. Create new project
// 4. Create database
// 5. Copy connection string
```

3. **Update Environment Variables:**
```bash
# .env
DATABASE_URL="postgresql://[user]:[password]@[host]/[database]?sslmode=require"

# For connection pooling (recommended for serverless)
DATABASE_URL="postgresql://[user]:[password]@[host]/[database]?sslmode=require&pgbouncer=true"
```

4. **Run Migrations:**
```bash
# Push schema to Neon
npx prisma db push

# Or use migrations
npx prisma migrate deploy
```

5. **Seed Database:**
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.create({
    data: {
      fullName: 'System Administrator',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: new Date(),
    },
  });

  // Create demo project manager
  const pmPassword = await bcrypt.hash('PM@123', 10);
  const pm = await prisma.user.create({
    data: {
      fullName: 'Project Manager Demo',
      email: 'pm@example.com',
      password: pmPassword,
      role: 'PROJECT_MANAGER',
      status: 'ACTIVE',
      emailVerified: new Date(),
    },
  });

  // Create demo team member
  const tmPassword = await bcrypt.hash('TM@123', 10);
  const tm = await prisma.user.create({
    data: {
      fullName: 'Team Member Demo',
      email: 'team@example.com',
      password: tmPassword,
      role: 'TEAM_MEMBER',
      status: 'ACTIVE',
      emailVerified: new Date(),
    },
  });

  // Create demo project
  const project = await prisma.project.create({
    data: {
      name: 'Demo Project - Ministry Portal',
      description: 'Sample project showcasing the system capabilities',
      status: 'ACTIVE',
      holderId: pm.id,
      budget: '500000',
      dueDate: new Date('2024-12-31'),
    },
  });

  // Create demo tasks
  await prisma.task.createMany({
    data: [
      {
        title: 'Design Database Schema',
        description: 'Create comprehensive database design',
        status: 'COMPLETED',
        priority: 'HIGH',
        projectId: project.id,
        assignedToId: tm.id,
      },
      {
        title: 'Implement Authentication',
        description: 'Build secure authentication system',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        projectId: project.id,
        assignedToId: tm.id,
      },
      {
        title: 'Create Dashboard UI',
        description: 'Design and implement dashboard',
        status: 'TODO',
        priority: 'MEDIUM',
        projectId: project.id,
        assignedToId: tm.id,
      },
    ],
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

6. **Run Seed:**
```bash
npx prisma db seed
```



### 5. Deployment Configuration Component

**Purpose:** Configure Vercel deployment with all necessary environment variables and settings.

**Interface:**
```typescript
interface DeploymentConfig {
  // Vercel Setup
  connectGitHub(): Promise<void>;
  createVercelProject(): Promise<VercelProject>;
  configureEnvironmentVariables(vars: EnvironmentVariables): Promise<void>;
  
  // Build Configuration
  configureBuildSettings(): Promise<BuildConfig>;
  optimizeForProduction(): Promise<void>;
  
  // Domain Management
  setupCustomDomain(domain: string): Promise<void>;
  configureSSL(): Promise<void>;
  
  // Deployment
  triggerDeployment(): Promise<DeploymentResult>;
  monitorDeployment(deploymentId: string): Promise<DeploymentStatus>;
}

interface VercelProject {
  id: string;
  name: string;
  framework: string;
  buildCommand: string;
  outputDirectory: string;
  installCommand: string;
}

interface EnvironmentVariables {
  DATABASE_URL: string;
  BLOB_READ_WRITE_TOKEN: string;
  JWT_SECRET: string;
  NEXTAUTH_SECRET: string;
  NEXTAUTH_URL: string;
  SMTP_HOST: string;
  SMTP_PORT: string;
  SMTP_SECURE: string;
  SMTP_USER: string;
  SMTP_PASSWORD: string;
  SMTP_FROM: string;
}
```

**Vercel Configuration:**

1. **vercel.json:**
```json
{
  "buildCommand": "prisma generate && next build",
  "devCommand": "next dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "DATABASE_URL": "@database_url",
    "BLOB_READ_WRITE_TOKEN": "@blob_token",
    "JWT_SECRET": "@jwt_secret",
    "NEXTAUTH_SECRET": "@nextauth_secret",
    "NEXTAUTH_URL": "@nextauth_url",
    "SMTP_HOST": "@smtp_host",
    "SMTP_PORT": "@smtp_port",
    "SMTP_SECURE": "@smtp_secure",
    "SMTP_USER": "@smtp_user",
    "SMTP_PASSWORD": "@smtp_password",
    "SMTP_FROM": "@smtp_from"
  }
}
```

2. **next.config.js:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Image optimization
  images: {
    domains: ['vercel.blob.core.windows.net', 'res.cloudinary.com'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Environment variables
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
  
  // Production optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

3. **package.json scripts:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "postinstall": "prisma generate",
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
```



### 6. Monitoring and Logging Component

**Purpose:** Implement free monitoring, error tracking, and health checks.

**Interface:**
```typescript
interface MonitoringSystem {
  // Analytics
  trackPageView(page: string): void;
  trackEvent(event: string, properties: Record<string, any>): void;
  
  // Error Tracking
  logError(error: Error, context: ErrorContext): void;
  captureException(error: Error): void;
  
  // Health Checks
  checkDatabaseHealth(): Promise<HealthStatus>;
  checkEmailHealth(): Promise<HealthStatus>;
  checkStorageHealth(): Promise<HealthStatus>;
  
  // Performance Monitoring
  measurePerformance(metric: string, value: number): void;
  trackAPILatency(endpoint: string, duration: number): void;
}

interface HealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  lastChecked: Date;
  message?: string;
}

interface ErrorContext {
  userId?: string;
  endpoint: string;
  method: string;
  statusCode: number;
  timestamp: Date;
}
```

**Implementation:**

1. **Health Check Endpoint:**
```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    services: {
      database: 'unknown',
      api: 'healthy',
    },
  };

  try {
    // Check database connection
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    
    checks.services.database = latency < 1000 ? 'healthy' : 'degraded';
    
    return NextResponse.json(checks, { status: 200 });
  } catch (error) {
    checks.status = 'unhealthy';
    checks.services.database = 'down';
    
    return NextResponse.json(checks, { status: 503 });
  }
}
```

2. **Error Logging Utility:**
```typescript
// lib/logger.ts
export class Logger {
  static error(message: string, error: Error, context?: any) {
    const logEntry = {
      level: 'error',
      message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
      timestamp: new Date().toISOString(),
    };
    
    console.error(JSON.stringify(logEntry));
    
    // In production, could send to external service
    if (process.env.NODE_ENV === 'production') {
      // Send to logging service
    }
  }
  
  static info(message: string, data?: any) {
    console.log(JSON.stringify({
      level: 'info',
      message,
      data,
      timestamp: new Date().toISOString(),
    }));
  }
  
  static warn(message: string, data?: any) {
    console.warn(JSON.stringify({
      level: 'warn',
      message,
      data,
      timestamp: new Date().toISOString(),
    }));
  }
}
```

3. **API Error Handler:**
```typescript
// lib/api-error-handler.ts
import { NextResponse } from 'next/server';
import { Logger } from './logger';

export function handleAPIError(error: Error, context: any) {
  Logger.error('API Error', error, context);
  
  if (error.name === 'PrismaClientKnownRequestError') {
    return NextResponse.json(
      { error: 'Database error occurred' },
      { status: 500 }
    );
  }
  
  if (error.name === 'ValidationError') {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
  
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

4. **UptimeRobot Configuration:**
```
Monitor Type: HTTP(s)
URL: https://yourapp.vercel.app/api/health
Interval: 5 minutes
Alert Contacts: Your email
```



## Data Models

### Environment Configuration Model

```typescript
// types/environment.ts
export interface EnvironmentConfig {
  // Database
  DATABASE_URL: string;
  
  // Authentication
  JWT_SECRET: string;
  NEXTAUTH_SECRET: string;
  NEXTAUTH_URL: string;
  
  // Email/SMTP
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_SECURE: boolean;
  SMTP_USER: string;
  SMTP_PASSWORD: string;
  SMTP_FROM: string;
  
  // File Storage
  BLOB_READ_WRITE_TOKEN?: string;
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
  
  // Feature Flags
  ENABLE_UPLOADS: boolean;
  ENABLE_EMAIL: boolean;
  
  // Monitoring
  VERCEL_ANALYTICS_ID?: string;
}

export function validateEnvironment(): EnvironmentConfig {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASSWORD',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    JWT_SECRET: process.env.JWT_SECRET!,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL!,
    SMTP_HOST: process.env.SMTP_HOST!,
    SMTP_PORT: parseInt(process.env.SMTP_PORT || '465'),
    SMTP_SECURE: process.env.SMTP_SECURE === 'true',
    SMTP_USER: process.env.SMTP_USER!,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD!,
    SMTP_FROM: process.env.SMTP_FROM || process.env.SMTP_USER!,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    ENABLE_UPLOADS: process.env.ENABLE_UPLOADS === 'true',
    ENABLE_EMAIL: process.env.ENABLE_EMAIL !== 'false',
  };
}
```

### Deployment Status Model

```typescript
// types/deployment.ts
export interface DeploymentStatus {
  id: string;
  status: 'queued' | 'building' | 'ready' | 'error' | 'canceled';
  url: string;
  createdAt: Date;
  readyAt?: Date;
  buildingAt?: Date;
  error?: DeploymentError;
  meta: {
    githubCommitSha: string;
    githubCommitMessage: string;
    githubCommitAuthor: string;
  };
}

export interface DeploymentError {
  code: string;
  message: string;
  link?: string;
}
```

### Migration Status Model

```typescript
// types/migration.ts
export interface MigrationStatus {
  id: string;
  name: string;
  appliedAt: Date;
  executionTime: number;
  status: 'pending' | 'applied' | 'failed';
  error?: string;
}

export interface DatabaseSeedStatus {
  usersCreated: number;
  projectsCreated: number;
  tasksCreated: number;
  teamsCreated: number;
  errors: string[];
  completedAt: Date;
}
```

### Service Health Model

```typescript
// types/health.ts
export interface ServiceHealth {
  service: 'database' | 'email' | 'storage' | 'api';
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  lastChecked: Date;
  message?: string;
  details?: Record<string, any>;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'down';
  services: ServiceHealth[];
  timestamp: Date;
  version: string;
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: No Hardcoded Credentials in Codebase

*For any* source code file in the project, the file should not contain hardcoded credentials, API keys, passwords, or sensitive tokens (excluding test fixtures and example files).

**Validates: Requirements US-2.1**

**Testing Approach:**
- Scan all .ts, .tsx, .js, .jsx files
- Check for patterns: password=, api_key=, secret=, token=, AWS credentials
- Exclude: .env.example, test files, mock data
- Verify no matches found

### Property 2: Consistent Error Handling Across API Routes

*For any* API route file in the app/api directory, the route should use the standardized error handling pattern with try-catch blocks and proper error responses.

**Validates: Requirements US-2.5**

**Testing Approach:**
- Parse all route.ts files in app/api
- Verify each route handler has try-catch block
- Verify catch blocks use error handler utility
- Verify error responses follow standard format

### Property 3: Input Validation on All API Endpoints

*For any* API endpoint that accepts user input, the endpoint should validate input using Zod schemas before processing.

**Validates: Requirements US-2.6**

**Testing Approach:**
- Identify all POST, PUT, PATCH endpoints
- Verify each endpoint parses request body with Zod
- Verify validation errors return 400 status
- Test with invalid inputs to confirm rejection

### Property 4: Service Health Verification

*For any* configured external service (database, email, storage), the service should be reachable and functional when health checks are performed.

**Validates: Requirements US-2.5.7, US-4.5, US-5.5**

**Testing Approach:**
- Test database connection with simple query
- Test email service by sending test email
- Test file storage by uploading/retrieving test file
- Verify all services return healthy status
- Measure latency is within acceptable range (<1000ms)

### Property 5: Proper Caching Headers

*For any* API route or page that serves cacheable content, the response should include appropriate cache-control headers.

**Validates: Requirements US-3.3**

**Testing Approach:**
- Make requests to API endpoints
- Verify Cache-Control headers present
- Verify static assets have long cache times
- Verify dynamic content has appropriate cache strategy

### Property 6: Error Boundaries in Components

*For any* page component in the application, the component should be wrapped with an error boundary to handle runtime errors gracefully.

**Validates: Requirements US-3.5**

**Testing Approach:**
- Check that root layout has error boundary
- Verify error.tsx files exist for route segments
- Test that errors are caught and displayed properly
- Verify errors don't crash the entire app

### Property 7: Rate Limiting on Authentication Endpoints

*For any* authentication-related API endpoint (login, register, password reset), the endpoint should implement rate limiting to prevent abuse.

**Validates: Requirements US-3.6**

**Testing Approach:**
- Make multiple rapid requests to auth endpoints
- Verify rate limit is enforced (429 status)
- Verify rate limit resets after time window
- Verify legitimate requests still work

### Property 8: API Route Logging

*For any* API route, the route should log incoming requests and any errors that occur during processing.

**Validates: Requirements US-6.3**

**Testing Approach:**
- Make requests to various API endpoints
- Verify logs are written to console/log system
- Verify logs include timestamp, method, path
- Verify errors are logged with stack traces

### Property 9: Environment Variable Documentation Completeness

*For any* environment variable used in the codebase, the variable should be documented in .env.example with a descriptive comment.

**Validates: Requirements US-7.2**

**Testing Approach:**
- Scan codebase for process.env usage
- Extract all environment variable names
- Verify each variable exists in .env.example
- Verify .env.example has comments explaining each variable

### Property 10: Mobile Responsive Design

*For any* page in the application, the page should render correctly and be usable on mobile viewport sizes (320px to 768px width).

**Validates: Requirements US-8.6**

**Testing Approach:**
- Test pages at various viewport widths
- Verify no horizontal scrolling
- Verify touch targets are adequate size
- Verify text is readable without zooming
- Verify navigation works on mobile



## Error Handling

### Error Handling Strategy

**Centralized Error Handler:**
```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message, 'VALIDATION_ERROR');
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(401, message, 'AUTH_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(403, message, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'NOT_FOUND');
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(500, message, 'DATABASE_ERROR');
  }
}
```

**API Route Error Handler:**
```typescript
// lib/api-handler.ts
import { NextRequest, NextResponse } from 'next/server';
import { AppError } from './errors';
import { Logger } from './logger';

export function withErrorHandler(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      return await handler(req);
    } catch (error) {
      if (error instanceof AppError) {
        Logger.warn('Application error', {
          code: error.code,
          message: error.message,
          statusCode: error.statusCode,
        });
        
        return NextResponse.json(
          {
            error: error.message,
            code: error.code,
          },
          { status: error.statusCode }
        );
      }
      
      Logger.error('Unexpected error', error as Error, {
        path: req.nextUrl.pathname,
        method: req.method,
      });
      
      return NextResponse.json(
        {
          error: 'Internal server error',
          code: 'INTERNAL_ERROR',
        },
        { status: 500 }
      );
    }
  };
}
```

**Usage in API Routes:**
```typescript
// app/api/projects/route.ts
import { withErrorHandler } from '@/lib/api-handler';
import { ValidationError, AuthenticationError } from '@/lib/errors';

export const GET = withErrorHandler(async (req) => {
  const token = req.cookies.get('token');
  
  if (!token) {
    throw new AuthenticationError();
  }
  
  // ... rest of handler
  
  return NextResponse.json({ projects });
});
```

### Database Error Handling

```typescript
// lib/db-error-handler.ts
import { Prisma } from '@prisma/client';
import { DatabaseError, NotFoundError, ValidationError } from './errors';

export function handlePrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        throw new ValidationError('A record with this value already exists');
      case 'P2025':
        throw new NotFoundError('Record');
      case 'P2003':
        throw new ValidationError('Referenced record does not exist');
      default:
        throw new DatabaseError(`Database error: ${error.code}`);
    }
  }
  
  if (error instanceof Prisma.PrismaClientValidationError) {
    throw new ValidationError('Invalid data provided');
  }
  
  throw new DatabaseError('An unexpected database error occurred');
}
```

### Frontend Error Handling

**Error Boundary:**
```typescript
// app/error.tsx
'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
        <p className="text-gray-600 mb-4">
          We're sorry, but something unexpected happened.
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
```

**Global Error Handler:**
```typescript
// app/global-error.tsx
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Critical Error</h2>
            <p className="text-gray-600 mb-4">
              A critical error occurred. Please refresh the page.
            </p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Refresh
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
```

### Email Error Handling

```typescript
// lib/email-handler.ts
import nodemailer from 'nodemailer';
import { Logger } from './logger';

export async function sendEmailSafely(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });

    Logger.info('Email sent successfully', { to, subject });
    return true;
  } catch (error) {
    Logger.error('Failed to send email', error as Error, { to, subject });
    return false;
  }
}
```



## Testing Strategy

### Dual Testing Approach

This project will use both unit testing and property-based testing to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Both approaches are complementary and necessary for comprehensive coverage. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across many inputs.

### Testing Tools

**Unit Testing:**
- Framework: Jest or Vitest
- React Testing: React Testing Library
- API Testing: Supertest or built-in fetch

**Property-Based Testing:**
- Library: fast-check (TypeScript/JavaScript)
- Configuration: Minimum 100 iterations per property test
- Each property test must reference its design document property

**Test Tag Format:**
```typescript
// Feature: deployment-preparation, Property 1: No Hardcoded Credentials
```

### Unit Test Examples

**1. Environment Variable Validation:**
```typescript
// __tests__/environment.test.ts
import { validateEnvironment } from '@/types/environment';

describe('Environment Configuration', () => {
  it('should throw error when required variables are missing', () => {
    const originalEnv = process.env;
    process.env = {};
    
    expect(() => validateEnvironment()).toThrow('Missing required environment variables');
    
    process.env = originalEnv;
  });
  
  it('should parse SMTP_PORT as number', () => {
    process.env.SMTP_PORT = '465';
    const config = validateEnvironment();
    
    expect(typeof config.SMTP_PORT).toBe('number');
    expect(config.SMTP_PORT).toBe(465);
  });
  
  it('should default ENABLE_UPLOADS to false when not set', () => {
    delete process.env.ENABLE_UPLOADS;
    const config = validateEnvironment();
    
    expect(config.ENABLE_UPLOADS).toBe(false);
  });
});
```

**2. Health Check Endpoint:**
```typescript
// __tests__/api/health.test.ts
import { GET } from '@/app/api/health/route';

describe('Health Check API', () => {
  it('should return 200 when all services are healthy', async () => {
    const response = await GET();
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.services.database).toBe('healthy');
  });
  
  it('should return 503 when database is down', async () => {
    // Mock database failure
    jest.spyOn(prisma, '$queryRaw').mockRejectedValue(new Error('Connection failed'));
    
    const response = await GET();
    const data = await response.json();
    
    expect(response.status).toBe(503);
    expect(data.status).toBe('unhealthy');
    expect(data.services.database).toBe('down');
  });
});
```

**3. Error Handler:**
```typescript
// __tests__/lib/api-handler.test.ts
import { withErrorHandler } from '@/lib/api-handler';
import { ValidationError, AuthenticationError } from '@/lib/errors';

describe('API Error Handler', () => {
  it('should return 400 for ValidationError', async () => {
    const handler = withErrorHandler(async () => {
      throw new ValidationError('Invalid input');
    });
    
    const response = await handler(new Request('http://localhost'));
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid input');
    expect(data.code).toBe('VALIDATION_ERROR');
  });
  
  it('should return 401 for AuthenticationError', async () => {
    const handler = withErrorHandler(async () => {
      throw new AuthenticationError();
    });
    
    const response = await handler(new Request('http://localhost'));
    
    expect(response.status).toBe(401);
  });
  
  it('should return 500 for unexpected errors', async () => {
    const handler = withErrorHandler(async () => {
      throw new Error('Unexpected error');
    });
    
    const response = await handler(new Request('http://localhost'));
    const data = await response.json();
    
    expect(response.status).toBe(500);
    expect(data.code).toBe('INTERNAL_ERROR');
  });
});
```

### Property-Based Test Examples

**1. No Hardcoded Credentials (Property 1):**
```typescript
// __tests__/properties/credentials.test.ts
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// Feature: deployment-preparation, Property 1: No Hardcoded Credentials
describe('Property: No Hardcoded Credentials', () => {
  it('should not contain hardcoded credentials in any source file', async () => {
    const sourceFiles = await glob('**/*.{ts,tsx,js,jsx}', {
      ignore: ['node_modules/**', '.next/**', '__tests__/**', '*.test.*', '.env.example'],
    });
    
    const credentialPatterns = [
      /password\s*=\s*["'][^"']+["']/i,
      /api[_-]?key\s*=\s*["'][^"']+["']/i,
      /secret\s*=\s*["'][^"']+["']/i,
      /token\s*=\s*["'][^"']+["']/i,
      /aws[_-]?access[_-]?key/i,
      /smtp[_-]?password\s*=\s*["'][^"']+["']/i,
    ];
    
    const violations: string[] = [];
    
    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      
      for (const pattern of credentialPatterns) {
        if (pattern.test(content)) {
          violations.push(`${file}: Found potential hardcoded credential`);
        }
      }
    }
    
    expect(violations).toEqual([]);
  }, 10000);
});
```

**2. Consistent Error Handling (Property 2):**
```typescript
// __tests__/properties/error-handling.test.ts
import * as fc from 'fast-check';
import * as fs from 'fs';
import { glob } from 'glob';

// Feature: deployment-preparation, Property 2: Consistent Error Handling
describe('Property: Consistent Error Handling', () => {
  it('should have try-catch blocks in all API route handlers', async () => {
    const routeFiles = await glob('app/api/**/route.ts');
    
    const violations: string[] = [];
    
    for (const file of routeFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      
      // Check for withErrorHandler wrapper or try-catch
      const hasErrorHandler = 
        content.includes('withErrorHandler') ||
        (content.includes('try') && content.includes('catch'));
      
      if (!hasErrorHandler) {
        violations.push(`${file}: Missing error handling`);
      }
    }
    
    expect(violations).toEqual([]);
  });
});
```

**3. Service Health Verification (Property 4):**
```typescript
// __tests__/properties/service-health.test.ts
import * as fc from 'fast-check';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

// Feature: deployment-preparation, Property 4: Service Health Verification
describe('Property: Service Health Verification', () => {
  it('should verify database connection is healthy', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        const start = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        const latency = Date.now() - start;
        
        expect(latency).toBeLessThan(1000);
      }),
      { numRuns: 100 }
    );
  });
  
  it('should verify email service is configured', async () => {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    
    await expect(transporter.verify()).resolves.toBe(true);
  });
});
```

**4. Environment Variable Documentation (Property 9):**
```typescript
// __tests__/properties/env-documentation.test.ts
import * as fc from 'fast-check';
import * as fs from 'fs';
import { glob } from 'glob';

// Feature: deployment-preparation, Property 9: Environment Variable Documentation
describe('Property: Environment Variable Documentation', () => {
  it('should document all environment variables in .env.example', async () => {
    // Find all process.env usage
    const sourceFiles = await glob('**/*.{ts,tsx,js,jsx}', {
      ignore: ['node_modules/**', '.next/**'],
    });
    
    const envVars = new Set<string>();
    const envVarPattern = /process\.env\.([A-Z_]+)/g;
    
    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      let match;
      
      while ((match = envVarPattern.exec(content)) !== null) {
        envVars.add(match[1]);
      }
    }
    
    // Check .env.example
    const envExample = fs.readFileSync('.env.example', 'utf-8');
    const missingVars: string[] = [];
    
    for (const varName of envVars) {
      if (!envExample.includes(varName)) {
        missingVars.push(varName);
      }
    }
    
    expect(missingVars).toEqual([]);
  });
});
```

**5. Mobile Responsive Design (Property 10):**
```typescript
// __tests__/properties/responsive-design.test.ts
import * as fc from 'fast-check';
import { render } from '@testing-library/react';

// Feature: deployment-preparation, Property 10: Mobile Responsive Design
describe('Property: Mobile Responsive Design', () => {
  const viewportWidths = fc.integer({ min: 320, max: 768 });
  
  it('should render pages without horizontal scroll on mobile', async () => {
    await fc.assert(
      fc.asyncProperty(viewportWidths, async (width) => {
        // Set viewport
        global.innerWidth = width;
        
        // Test key pages
        const pages = ['/dashboard', '/projects', '/tasks'];
        
        for (const page of pages) {
          // Render page component
          // Check that content width <= viewport width
          // This would require actual component imports
        }
      }),
      { numRuns: 100 }
    );
  });
});
```

### Test Configuration

**package.json:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --reporter=verbose",
    "test:properties": "vitest run --grep='Property:' --reporter=verbose",
    "test:coverage": "vitest run --coverage"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "fast-check": "^3.15.0"
  }
}
```

**vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.next/',
        '__tests__/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

### Integration Testing

**Deployment Verification Script:**
```typescript
// scripts/verify-deployment.ts
import fetch from 'node-fetch';

async function verifyDeployment(baseUrl: string) {
  const checks = {
    health: false,
    auth: false,
    database: false,
  };
  
  try {
    // Check health endpoint
    const healthRes = await fetch(`${baseUrl}/api/health`);
    checks.health = healthRes.status === 200;
    
    // Check auth endpoint exists
    const authRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'test' }),
    });
    checks.auth = authRes.status === 400 || authRes.status === 401;
    
    // Check database via health
    const healthData = await healthRes.json();
    checks.database = healthData.services?.database === 'healthy';
    
    console.log('Deployment Verification:', checks);
    
    const allPassed = Object.values(checks).every(v => v);
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}

const deploymentUrl = process.env.DEPLOYMENT_URL || 'http://localhost:3000';
verifyDeployment(deploymentUrl);
```



## Deployment Procedures

### Step-by-Step Deployment Guide

#### Phase 1: Credential Setup (Manual)

**1. Create Gmail Account:**
```
1. Go to gmail.com
2. Click "Create account"
3. Fill in details (use professional name for portfolio)
4. Complete verification
5. Save credentials securely
```

**2. Enable 2FA and Generate App Password:**
```
1. Go to Google Account settings
2. Security → 2-Step Verification → Enable
3. Security → App passwords
4. Select "Mail" and "Other (Custom name)"
5. Name it "Project Management System"
6. Copy the 16-character password
7. Save this password (you won't see it again)
```

**3. Sign Up for Neon:**
```
1. Go to neon.tech
2. Click "Sign up" → "Continue with GitHub"
3. Authorize Neon to access GitHub
4. Create new project: "project-management-system"
5. Select region closest to you
6. Wait for database creation
```

**4. Get Neon Connection Strings:**
```
1. In Neon dashboard, go to project
2. Click "Connection Details"
3. Copy "Connection string" (for migrations)
4. Copy "Pooled connection string" (for production)
5. Save both strings
```

**5. Generate Secrets:**
```bash
# Run this in your terminal
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('base64'))"
node -e "console.log('NEXTAUTH_SECRET=' + require('crypto').randomBytes(32).toString('base64'))"
```

#### Phase 2: Local Environment Setup

**1. Create .env File:**
```bash
# Copy example and fill in your credentials
cp .env.example .env
```

**2. Update .env with Your Credentials:**
```bash
# Database (use pooled connection for production)
DATABASE_URL="postgresql://[user]:[password]@[host]/[database]?sslmode=require&pgbouncer=true"

# Authentication
JWT_SECRET="[generated secret from step 5]"
NEXTAUTH_SECRET="[generated secret from step 5]"
NEXTAUTH_URL="http://localhost:3000"

# Email/SMTP
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="[your gmail address]"
SMTP_PASSWORD="[your app password from step 2]"
SMTP_FROM="Project Management System <[your gmail]>"

# File Storage (Vercel Blob - will get token later)
BLOB_READ_WRITE_TOKEN=""
ENABLE_UPLOADS="false"

# Feature Flags
ENABLE_EMAIL="true"
```

**3. Install Dependencies:**
```bash
npm install
```

**4. Run Database Migrations:**
```bash
# Generate Prisma client
npx prisma generate

# Push schema to Neon
npx prisma db push

# Seed database with demo data
npx prisma db seed
```

**5. Test Locally:**
```bash
# Start development server
npm run dev

# Open http://localhost:3000
# Try logging in with demo credentials:
# Admin: admin@example.com / Admin@123
# PM: pm@example.com / PM@123
# Team: team@example.com / TM@123
```

#### Phase 3: Code Cleanup

**1. Remove Hardcoded Credentials:**
```bash
# Search for hardcoded credentials
grep -r "password=" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules .
grep -r "api_key=" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules .

# Remove any found credentials and replace with process.env
```

**2. Create .env.example:**
```bash
# Create template file
cat > .env.example << 'EOF'
# Database Configuration
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require&pgbouncer=true"

# Authentication Secrets
JWT_SECRET="generate-with-crypto-randomBytes"
NEXTAUTH_SECRET="generate-with-crypto-randomBytes"
NEXTAUTH_URL="http://localhost:3000"

# Email/SMTP Configuration (Gmail)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-gmail-app-password"
SMTP_FROM="Project Management System <your-email@gmail.com>"

# File Storage (Vercel Blob)
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"
ENABLE_UPLOADS="true"

# Feature Flags
ENABLE_EMAIL="true"
EOF
```

**3. Update .gitignore:**
```bash
# Ensure these are in .gitignore
cat >> .gitignore << 'EOF'

# Environment variables
.env
.env.local
.env.production
.env.development

# Vercel
.vercel
EOF
```

**4. Remove Commented Code:**
```bash
# Manually review and remove commented-out code blocks
# Focus on .env, API routes, and configuration files
```

#### Phase 4: Vercel Deployment

**1. Push to GitHub:**
```bash
# Ensure .env is NOT committed
git status  # Should not show .env

# Commit changes
git add .
git commit -m "Prepare for deployment: clean credentials, add env example"
git push origin main
```

**2. Create Vercel Account:**
```
1. Go to vercel.com
2. Click "Sign Up"
3. Choose "Continue with GitHub"
4. Authorize Vercel
```

**3. Import Project:**
```
1. Click "Add New..." → "Project"
2. Import your GitHub repository
3. Configure project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: npm run build
   - Output Directory: .next
   - Install Command: npm install
```

**4. Configure Environment Variables:**
```
1. In project settings, go to "Environment Variables"
2. Add all variables from your .env file:
   - DATABASE_URL (use pooled connection string)
   - JWT_SECRET
   - NEXTAUTH_SECRET
   - NEXTAUTH_URL (will be https://yourapp.vercel.app)
   - SMTP_HOST
   - SMTP_PORT
   - SMTP_SECURE
   - SMTP_USER
   - SMTP_PASSWORD
   - SMTP_FROM
   - ENABLE_EMAIL
   - ENABLE_UPLOADS (set to false initially)
3. Click "Save"
```

**5. Deploy:**
```
1. Click "Deploy"
2. Wait for build to complete (2-5 minutes)
3. Click on deployment URL
4. Verify site loads
```

**6. Update NEXTAUTH_URL:**
```
1. Copy your Vercel deployment URL (e.g., yourapp.vercel.app)
2. Go to Environment Variables
3. Update NEXTAUTH_URL to https://yourapp.vercel.app
4. Redeploy
```

#### Phase 5: File Storage Setup (Optional)

**Option A: Enable Vercel Blob**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Create Blob store
vercel blob create

# Get token
vercel env pull .env.production

# Copy BLOB_READ_WRITE_TOKEN from .env.production
# Add to Vercel environment variables
# Set ENABLE_UPLOADS=true
# Redeploy
```

**Option B: Use Cloudinary**

```
1. Sign up at cloudinary.com (free tier)
2. Get Cloud Name, API Key, API Secret
3. Add to Vercel environment variables:
   - CLOUDINARY_CLOUD_NAME
   - CLOUDINARY_API_KEY
   - CLOUDINARY_API_SECRET
4. Update file upload code to use Cloudinary SDK
5. Redeploy
```

**Option C: Keep Uploads Disabled**

```
# Leave ENABLE_UPLOADS=false
# File upload features will show "Coming soon" message
```

#### Phase 6: Verification

**1. Test Production Deployment:**
```bash
# Run verification script
DEPLOYMENT_URL=https://yourapp.vercel.app npm run verify-deployment

# Manual checks:
# - Visit site
# - Try logging in with demo credentials
# - Create a project
# - Create a task
# - Check email notifications work
# - Test all major features
```

**2. Set Up Monitoring:**
```
1. Go to uptimerobot.com
2. Sign up (free)
3. Add New Monitor:
   - Type: HTTP(s)
   - URL: https://yourapp.vercel.app/api/health
   - Interval: 5 minutes
   - Alert: Your email
4. Save
```

**3. Enable Vercel Analytics:**
```
1. In Vercel dashboard, go to project
2. Click "Analytics" tab
3. Click "Enable"
4. Analytics will start collecting data
```

#### Phase 7: Documentation

**1. Update README.md:**
```markdown
# Project Management System

A comprehensive project management system built with Next.js 15, React 19, and TypeScript.

## Live Demo

🚀 [View Live Demo](https://yourapp.vercel.app)

## Demo Credentials

- **Admin**: admin@example.com / Admin@123
- **Project Manager**: pm@example.com / PM@123
- **Team Member**: team@example.com / TM@123

## Features

- Multi-role authentication (Admin, PM, Team Member)
- Project and task management
- Team collaboration
- Budget tracking
- Real-time notifications
- Analytics dashboard

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Authentication**: JWT
- **Email**: Gmail SMTP
- **Hosting**: Vercel

## Local Development

See [SETUP.md](./SETUP.md) for detailed setup instructions.

## License

MIT
```

**2. Create SETUP.md:**
```markdown
# Local Development Setup

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or Neon)
- Gmail account with App Password

## Setup Steps

1. Clone repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env`
4. Fill in environment variables
5. Run migrations: `npx prisma db push`
6. Seed database: `npx prisma db seed`
7. Start dev server: `npm run dev`

See full documentation in README.md
```



## Rollback Strategy

### Rollback Scenarios and Procedures

#### Scenario 1: Deployment Fails to Build

**Symptoms:**
- Vercel build fails
- Error messages in build logs
- Deployment status shows "Error"

**Rollback Procedure:**
```bash
# Option A: Revert to previous deployment in Vercel
1. Go to Vercel dashboard → Deployments
2. Find last successful deployment
3. Click "..." → "Promote to Production"
4. Confirm promotion

# Option B: Revert Git commit and redeploy
git revert HEAD
git push origin main
# Vercel will auto-deploy the reverted commit
```

**Prevention:**
- Always test builds locally before pushing: `npm run build`
- Use Vercel preview deployments for testing
- Enable branch protection on main

#### Scenario 2: Database Migration Fails

**Symptoms:**
- Application crashes on startup
- Database connection errors
- Prisma migration errors

**Rollback Procedure:**
```bash
# 1. Identify failed migration
npx prisma migrate status

# 2. Rollback migration in Neon
# Go to Neon dashboard → SQL Editor
# Run rollback SQL manually

# 3. Mark migration as rolled back
npx prisma migrate resolve --rolled-back [migration_name]

# 4. Fix migration file
# Edit prisma/migrations/[migration]/migration.sql

# 5. Re-run migration
npx prisma migrate deploy

# 6. Redeploy application
git commit -am "Fix migration"
git push origin main
```

**Prevention:**
- Test migrations on staging database first
- Use `prisma migrate dev` locally before deploying
- Keep database backups (Neon provides automatic backups)
- Use `prisma db push` for development, `prisma migrate deploy` for production

#### Scenario 3: Environment Variables Misconfigured

**Symptoms:**
- Application starts but features don't work
- Authentication fails
- Email sending fails
- Database connection errors

**Rollback Procedure:**
```bash
# 1. Check current environment variables
# In Vercel dashboard → Settings → Environment Variables

# 2. Compare with working configuration
# Check .env.example for required variables

# 3. Update incorrect variables
# Edit in Vercel dashboard

# 4. Redeploy
# Vercel → Deployments → Latest → "Redeploy"

# 5. Verify with health check
curl https://yourapp.vercel.app/api/health
```

**Prevention:**
- Document all environment variables in .env.example
- Use environment variable validation on startup
- Test locally with production-like environment variables
- Keep a secure backup of working environment variables

#### Scenario 4: Breaking Changes in Dependencies

**Symptoms:**
- Application crashes with dependency errors
- TypeScript compilation errors
- Runtime errors from updated packages

**Rollback Procedure:**
```bash
# 1. Identify problematic dependency
npm ls [package-name]

# 2. Revert to previous version
npm install [package-name]@[previous-version]

# 3. Update package.json with specific version
# Change "^1.2.3" to "1.2.3" to lock version

# 4. Test locally
npm run build
npm run dev

# 5. Commit and deploy
git commit -am "Revert [package-name] to working version"
git push origin main
```

**Prevention:**
- Lock dependency versions in package.json
- Test dependency updates in separate branch
- Use `npm ci` instead of `npm install` in CI/CD
- Review dependency changelogs before updating

#### Scenario 5: Performance Degradation

**Symptoms:**
- Slow page loads (>3 seconds)
- High database query times
- Vercel function timeouts
- High memory usage

**Rollback Procedure:**
```bash
# 1. Identify performance regression
# Check Vercel Analytics for slow pages
# Check Neon dashboard for slow queries

# 2. Revert to last known good deployment
# In Vercel dashboard → Deployments
# Find deployment before performance drop
# Click "..." → "Promote to Production"

# 3. Investigate root cause
# Review recent code changes
# Check database indexes
# Review API route implementations

# 4. Fix performance issue
# Optimize queries
# Add database indexes
# Implement caching

# 5. Test and redeploy
npm run build
# Test locally
git commit -am "Fix performance issue"
git push origin main
```

**Prevention:**
- Monitor performance metrics continuously
- Set up performance budgets
- Test with production-like data volumes
- Use database query optimization tools
- Implement caching strategies

#### Scenario 6: Security Vulnerability Discovered

**Symptoms:**
- Security scanner alerts
- Unauthorized access attempts
- Data breach indicators
- Dependency vulnerability warnings

**Immediate Actions:**
```bash
# 1. Assess severity
# Check vulnerability details
# Determine if actively exploited

# 2. If critical, take site offline temporarily
# In Vercel dashboard → Settings → Deployment Protection
# Enable "Password Protection" or "Trusted IPs Only"

# 3. Fix vulnerability
# Update vulnerable dependency
npm audit fix

# Or patch code vulnerability
# Edit affected files

# 4. Test fix
npm run build
npm run test

# 5. Deploy fix immediately
git commit -am "Security fix: [description]"
git push origin main

# 6. Remove deployment protection
# After verifying fix works
```

**Prevention:**
- Run `npm audit` regularly
- Enable Dependabot alerts on GitHub
- Follow security best practices
- Implement rate limiting
- Use input validation everywhere
- Keep dependencies updated

### Emergency Contacts and Resources

**Service Status Pages:**
- Vercel: https://www.vercel-status.com/
- Neon: https://neonstatus.com/
- Gmail: https://www.google.com/appsstatus

**Support Channels:**
- Vercel: https://vercel.com/support
- Neon: https://neon.tech/docs/introduction
- Next.js: https://nextjs.org/docs

**Backup Procedures:**

**Database Backup:**
```bash
# Neon provides automatic backups
# To create manual backup:
# 1. Go to Neon dashboard
# 2. Select project
# 3. Click "Backups" tab
# 4. Click "Create backup"

# To restore from backup:
# 1. Go to Neon dashboard
# 2. Select project
# 3. Click "Backups" tab
# 4. Find backup
# 5. Click "Restore"
```

**Code Backup:**
```bash
# Code is backed up in GitHub
# To restore:
git checkout [commit-hash]
git push origin main --force

# Or create new branch from old commit:
git checkout -b rollback-branch [commit-hash]
git push origin rollback-branch
# Then deploy rollback-branch in Vercel
```

**Environment Variables Backup:**
```bash
# Export current environment variables
vercel env pull .env.backup

# Store .env.backup securely (NOT in git)
# To restore:
# Manually add variables back in Vercel dashboard
```

### Rollback Testing

**Test Rollback Procedures Regularly:**
```bash
# 1. Create test deployment
vercel --prod

# 2. Intentionally break something
# (in a test branch)

# 3. Practice rollback
# Follow rollback procedures

# 4. Verify rollback works
# Check site functionality

# 5. Document any issues
# Update rollback procedures
```

### Post-Rollback Actions

**After Any Rollback:**
1. Document what went wrong
2. Document what was done to fix it
3. Update rollback procedures if needed
4. Conduct post-mortem meeting
5. Implement preventive measures
6. Update monitoring/alerts
7. Communicate status to stakeholders

**Incident Report Template:**
```markdown
# Incident Report

**Date:** [Date and time]
**Severity:** [Critical/High/Medium/Low]
**Duration:** [How long was site affected]

## What Happened
[Description of the incident]

## Root Cause
[What caused the issue]

## Resolution
[How it was fixed]

## Rollback Performed
[What rollback steps were taken]

## Prevention
[What will be done to prevent this in future]

## Lessons Learned
[Key takeaways]
```

## Conclusion

This design document provides a comprehensive technical approach for deploying the Project Management System using 100% free services. The deployment strategy prioritizes:

1. **Zero Cost**: All services used are completely free with no credit card required
2. **Security**: Proper credential management and security best practices
3. **Reliability**: Health monitoring, error handling, and rollback procedures
4. **Maintainability**: Clean code, comprehensive testing, and documentation
5. **Performance**: Optimized builds, caching, and database connection pooling

The system is designed to be production-ready while remaining within free tier limits, making it an excellent portfolio piece that demonstrates professional deployment practices.


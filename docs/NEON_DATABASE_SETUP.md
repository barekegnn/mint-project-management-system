# Neon Database Configuration for Serverless Deployment

This document explains the Neon PostgreSQL database configuration optimized for serverless deployment on Vercel.

## Overview

Neon is a serverless PostgreSQL database that provides:
- **Free tier**: 0.5GB storage, no credit card required
- **Connection pooling**: Built-in PgBouncer for serverless environments
- **Auto-scaling**: Automatically scales compute based on demand
- **Auto-pause**: Pauses when inactive to save resources

## Connection Pooling for Serverless

Serverless functions (like Vercel) create new connections for each request. Without connection pooling, you can quickly exhaust database connection limits. Neon solves this with PgBouncer.

### Two Connection Strings

Neon provides two connection strings:

#### 1. Pooled Connection (for application queries)
```
postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require&pgbouncer=true&connection_limit=1
```

**Key features:**
- Uses `-pooler` suffix in hostname
- Includes `pgbouncer=true` parameter
- Includes `connection_limit=1` for serverless optimization
- Use this for `DATABASE_URL` in production

#### 2. Direct Connection (for migrations)
```
postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```

**Key features:**
- No `-pooler` suffix
- No `pgbouncer` parameter
- Direct PostgreSQL connection
- Use this for `DIRECT_DATABASE_URL` for migrations

## Configuration Files

### 1. Prisma Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
}
```

**Why `directUrl`?**
- Prisma uses `url` for queries (pooled connection)
- Prisma uses `directUrl` for migrations (direct connection)
- This separation is crucial for serverless environments

### 2. Prisma Client (`src/lib/prisma.ts`)

```typescript
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};
```

**Configuration details:**
- Logging enabled in development for debugging
- Only error logging in production for performance
- Singleton pattern prevents multiple instances

### 3. Environment Variables (`.env`)

```bash
# Pooled connection for application queries
DATABASE_URL="postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require&pgbouncer=true&connection_limit=1"

# Direct connection for migrations
DIRECT_DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
```

## Connection Pool Settings

### PgBouncer Parameters

- **`pgbouncer=true`**: Enables PgBouncer mode in Prisma
- **`connection_limit=1`**: Limits connections per serverless function
- **`sslmode=require`**: Enforces SSL/TLS encryption

### Why `connection_limit=1`?

In serverless environments:
- Each function instance should use minimal connections
- PgBouncer handles pooling at the database level
- Setting limit to 1 prevents connection exhaustion
- Improves cold start performance

## Testing the Connection

Run the database connection test:

```bash
npm run db:test
```

This script verifies:
1. ✅ Basic connection works
2. ✅ Database version is correct
3. ✅ Connection pool settings are optimal
4. ✅ PgBouncer is enabled
5. ✅ Query performance is acceptable
6. ✅ Concurrent queries work (tests pooling)

### Expected Output

```
✅ All database connection tests passed!
Database: Neon PostgreSQL
Connection pooling: Enabled (PgBouncer)
Average latency: <1000ms
Connection URL: ep-xxx-pooler.region.aws.neon.tech/dbname
```

## Running Migrations

### Development (Local)

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes to database
npx prisma db push

# Or use migrations
npx prisma migrate dev --name migration_name
```

### Production (Vercel)

Migrations run automatically during deployment via the `vercel-build` script:

```json
{
  "scripts": {
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

**Important:** 
- `prisma migrate deploy` uses `DIRECT_DATABASE_URL`
- Application queries use `DATABASE_URL` (pooled)

## Troubleshooting

### Connection Timeout

**Problem:** Queries timeout or fail to connect

**Solutions:**
1. Check if database is paused (Neon auto-pauses after inactivity)
2. Verify connection string is correct
3. Ensure `sslmode=require` is included
4. Check Neon dashboard for database status

### Too Many Connections

**Problem:** "too many connections" error

**Solutions:**
1. Verify `pgbouncer=true` is in DATABASE_URL
2. Check `connection_limit=1` is set
3. Ensure using pooled connection string (with `-pooler`)
4. Review Neon connection limits in dashboard

### Slow Queries

**Problem:** Queries are slower than expected

**Solutions:**
1. Check if database is in cold start (first query after pause)
2. Add database indexes for frequently queried fields
3. Use `select` to limit returned fields
4. Implement pagination for large result sets
5. Review query logs with `npm run db:test`

### Migration Failures

**Problem:** Migrations fail during deployment

**Solutions:**
1. Verify `DIRECT_DATABASE_URL` is set correctly
2. Ensure direct URL doesn't have `pgbouncer=true`
3. Check migration files are committed to git
4. Review Vercel deployment logs

## Best Practices

### 1. Connection Management

- ✅ Always use pooled connection for queries
- ✅ Use direct connection only for migrations
- ✅ Set `connection_limit=1` in serverless
- ✅ Implement singleton pattern for Prisma client

### 2. Query Optimization

- ✅ Add indexes for frequently queried fields
- ✅ Use `select` to limit returned data
- ✅ Implement pagination for large datasets
- ✅ Cache frequently accessed data

### 3. Error Handling

- ✅ Handle connection timeouts gracefully
- ✅ Implement retry logic for transient errors
- ✅ Log errors with context for debugging
- ✅ Monitor connection pool usage

### 4. Security

- ✅ Never commit `.env` to git
- ✅ Use different credentials per environment
- ✅ Rotate database passwords regularly
- ✅ Enable SSL/TLS (`sslmode=require`)

## Vercel Deployment

### Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

```bash
DATABASE_URL=postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require&pgbouncer=true&connection_limit=1

DIRECT_DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```

### Build Configuration

Vercel automatically runs:
1. `npm install` - Install dependencies
2. `prisma generate` - Generate Prisma client
3. `prisma migrate deploy` - Run migrations (uses DIRECT_DATABASE_URL)
4. `next build` - Build Next.js application

## Monitoring

### Neon Dashboard

Monitor your database at [console.neon.tech](https://console.neon.tech):
- Connection count
- Query performance
- Storage usage
- Compute usage
- Auto-pause status

### Application Monitoring

Use the health check endpoint:

```bash
curl https://your-app.vercel.app/api/health
```

Expected response:
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "status": "healthy",
  "services": {
    "database": "healthy",
    "api": "healthy"
  }
}
```

## Resources

- [Neon Documentation](https://neon.tech/docs)
- [Prisma with Neon](https://www.prisma.io/docs/guides/database/neon)
- [Vercel Deployment](https://vercel.com/docs)
- [PgBouncer Documentation](https://www.pgbouncer.org/)

## Summary

✅ **Pooled connection** for application queries (with PgBouncer)  
✅ **Direct connection** for migrations  
✅ **Connection limit** set to 1 for serverless  
✅ **SSL/TLS** enforced for security  
✅ **Singleton pattern** for Prisma client  
✅ **Automatic migrations** during deployment  
✅ **Health monitoring** via API endpoint  

Your database is now optimized for serverless deployment on Vercel! 🚀

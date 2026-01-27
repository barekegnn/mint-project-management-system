# Deployment Verification Script

This script verifies that a deployment is working correctly by testing critical endpoints and services.

## Requirements

**Validates: US-5.5**
- Check health endpoint returns 200
- Verify auth endpoints exist
- Test database connectivity via health check

## Usage

### Test Local Development Server

```bash
npm run verify-deployment
```

This will test `http://localhost:3000` by default.

### Test Production Deployment

```bash
DEPLOYMENT_URL=https://yourapp.vercel.app npm run verify-deployment
```

Replace `yourapp.vercel.app` with your actual Vercel deployment URL.

### Test Staging Environment

```bash
DEPLOYMENT_URL=https://yourapp-staging.vercel.app npm run verify-deployment
```

## What It Checks

The script performs the following verification checks:

### 1. Health Endpoint Check
- **Test**: Makes a GET request to `/api/health`
- **Expected**: Returns 200 (healthy) or 503 (degraded but functional)
- **Validates**: The health endpoint is accessible and responding

### 2. Auth Endpoints Check
- **Test**: Verifies `/api/auth/login` (POST) and `/api/auth/me` (GET) exist
- **Expected**: Returns 400/401 (validation/auth error), not 404
- **Validates**: Authentication endpoints are deployed and accessible

### 3. Database Connectivity Check
- **Test**: Checks database status via health endpoint
- **Expected**: Database service status is 'healthy' or 'degraded'
- **Validates**: Database connection is working

## Exit Codes

- **0**: All checks passed - deployment is healthy
- **1**: One or more checks failed - deployment has issues

## Example Output

### Successful Verification

```
🚀 Starting deployment verification...
📍 Target URL: https://yourapp.vercel.app

📊 Verification Results:

════════════════════════════════════════════════════════════════════════════════

✅ Health Endpoint
   Health endpoint returned 200 OK
   Details: {
     "status": "healthy",
     "uptime": "3600s",
     "services": 2
   }

✅ Auth Endpoint: POST /api/auth/login
   Endpoint exists and responds correctly (400)
   Details: {
     "status": 400
   }

✅ Auth Endpoint: GET /api/auth/me
   Endpoint exists and responds correctly (401)
   Details: {
     "status": 401
   }

✅ Database Connectivity
   Database is healthy (latency: 45ms)
   Details: {
     "status": "healthy",
     "latency": "45ms"
   }

════════════════════════════════════════════════════════════════════════════════

✅ Overall: 4/4 checks passed

🎉 Deployment verification successful! All systems operational.
```

### Failed Verification

```
🚀 Starting deployment verification...
📍 Target URL: https://yourapp.vercel.app

📊 Verification Results:

════════════════════════════════════════════════════════════════════════════════

❌ Health Endpoint
   Health endpoint returned 503 - services are down
   Details: {
     "status": "unhealthy",
     "uptime": "120s",
     "services": [
       "database: down",
       "api: healthy"
     ]
   }

✅ Auth Endpoint: POST /api/auth/login
   Endpoint exists and responds correctly (400)
   Details: {
     "status": 400
   }

✅ Auth Endpoint: GET /api/auth/me
   Endpoint exists and responds correctly (401)
   Details: {
     "status": 401
   }

❌ Database Connectivity
   Database is down: Database connection failed
   Details: {
     "status": "down",
     "message": "Database connection failed"
   }

════════════════════════════════════════════════════════════════════════════════

❌ Overall: 2/4 checks passed

⚠️  Deployment verification failed. Please review the errors above.
```

## Integration with CI/CD

You can use this script in your CI/CD pipeline to verify deployments:

### GitHub Actions Example

```yaml
- name: Verify Deployment
  run: DEPLOYMENT_URL=${{ steps.deploy.outputs.url }} npm run verify-deployment
```

### Vercel Deploy Hook

```bash
# After deployment
vercel deploy --prod
DEPLOYMENT_URL=$(vercel ls --prod | head -n 1) npm run verify-deployment
```

## Troubleshooting

### "Failed to reach health endpoint: fetch failed"

- **Cause**: The deployment URL is not accessible
- **Solution**: Check that the URL is correct and the server is running

### "Health endpoint returned 404"

- **Cause**: The health endpoint is not deployed
- **Solution**: Ensure `/api/health/route.ts` is included in the deployment

### "Database is down"

- **Cause**: Database connection is failing
- **Solution**: 
  - Check DATABASE_URL environment variable is set correctly
  - Verify database is running and accessible
  - Check network connectivity to database

### "Endpoint not found (404)"

- **Cause**: Auth endpoints are not deployed
- **Solution**: Ensure auth route files are included in the deployment

## Files

- `scripts/verify-deployment.js` - Main verification script (JavaScript)
- `scripts/verify-deployment.ts` - TypeScript version (for reference)
- `scripts/README-verify-deployment.md` - This documentation

## Related

- Health Check Endpoint: `src/app/api/health/route.ts`
- Auth Endpoints: `src/app/api/auth/*/route.ts`
- Requirements: `.kiro/specs/deployment-preparation/requirements.md` (US-5.5)

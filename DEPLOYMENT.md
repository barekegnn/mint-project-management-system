# Production Deployment Guide

This guide provides step-by-step instructions for deploying the Project Management System to production using 100% free services (no credit card required).

## Table of Contents

- [Overview](#overview)
- [Deployment Stack](#deployment-stack)
- [Prerequisites](#prerequisites)
- [Phase 1: Credential Setup](#phase-1-credential-setup)
- [Phase 2: Database Setup (Neon)](#phase-2-database-setup-neon)
- [Phase 3: Code Preparation](#phase-3-code-preparation)
- [Phase 4: Vercel Deployment](#phase-4-vercel-deployment)
- [Phase 5: Post-Deployment Verification](#phase-5-post-deployment-verification)
- [Phase 6: Monitoring Setup](#phase-6-monitoring-setup)
- [Phase 7: Optional File Storage](#phase-7-optional-file-storage)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)

---

## Overview

This deployment uses a serverless architecture with the following characteristics:

- **Zero Cost**: All services are 100% free (no credit card required)
- **Automatic Scaling**: Serverless functions scale automatically
- **Global CDN**: Static assets served from edge locations
- **Automatic SSL**: HTTPS enabled by default
- **CI/CD**: Automatic deployments from GitHub
- **Zero Downtime**: Rolling deployments with instant rollback

**Estimated Time**: 30-45 minutes

---

## Deployment Stack

### Services Used (All Free)

| Service | Purpose | Free Tier Limits |
|---------|---------|------------------|
| **Vercel** | Frontend & Backend Hosting | Unlimited personal projects, 100GB bandwidth/month |
| **Neon** | PostgreSQL Database | 0.5GB storage, 10GB data transfer/month |
| **Gmail SMTP** | Email Notifications | Free with App Password |
| **Vercel Blob** | File Storage (Optional) | 1GB storage, 1GB bandwidth/month |
| **Vercel Analytics** | Usage Analytics | Included in free tier |
| **UptimeRobot** | Uptime Monitoring | 50 monitors, 5-minute intervals |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Edge Network                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Next.js    │  │  API Routes  │  │ Static Assets│      │
│  │   Frontend   │  │  (Serverless)│  │     (CDN)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│    Neon     │  │ Vercel Blob │  │ Gmail SMTP  │
│ PostgreSQL  │  │   Storage   │  │    Email    │
└─────────────┘  └─────────────┘  └─────────────┘
```

---

## Prerequisites

Before you begin, ensure you have:

- ✅ **GitHub Account** (free) - https://github.com
- ✅ **Gmail Account** (free) - for SMTP email notifications
- ✅ **Code Ready**: All code committed to GitHub repository
- ✅ **Local Testing**: Application works locally (see [SETUP.md](./SETUP.md))
- ✅ **Environment Variables**: Know all required values

---

## Phase 1: Credential Setup

### 1.1 Create Gmail Account (If Needed)

If you don't have a Gmail account for the application:

1. Go to https://accounts.google.com/signup
2. Fill in the registration form
3. Use a professional name (e.g., `yourproject.notifications@gmail.com`)
4. Complete phone verification
5. Save your credentials securely

### 1.2 Enable 2FA and Generate App Password

**Important**: Gmail requires 2FA to use App Passwords.

1. **Enable 2-Factor Authentication**
   - Go to https://myaccount.google.com/security
   - Click "2-Step Verification"
   - Follow the setup wizard (requires phone)
   - Complete verification

2. **Generate App Password**
   - After enabling 2FA, go back to Security settings
   - Click "App passwords" (under "How you sign in to Google")
   - Sign in again if prompted
   - Select app: **Mail**
   - Select device: **Other (Custom name)**
   - Enter name: `Project Management System`
   - Click **Generate**
   - **Copy the 16-character password** (format: `xxxx xxxx xxxx xxxx`)
   - **Save it securely** - you won't see it again!

### 1.3 Generate Authentication Secrets

Generate secure random secrets for JWT authentication:

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Generate NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Save both outputs** - you'll need them in Phase 4.

---

## Phase 2: Database Setup (Neon)

### 2.1 Sign Up for Neon

1. Go to https://neon.tech
2. Click **"Sign up"**
3. Choose **"Continue with GitHub"**
4. Authorize Neon to access your GitHub account
5. Complete the signup process

### 2.2 Create Database Project

1. In Neon dashboard, click **"Create Project"**
2. Configure project:
   - **Project name**: `project-management-system` (or your preferred name)
   - **Region**: Choose closest to your target users
   - **PostgreSQL version**: Use default (latest)
3. Click **"Create Project"**
4. Wait for database creation (30-60 seconds)

### 2.3 Get Connection Strings

1. In your Neon project dashboard, click **"Connection Details"**
2. You'll see two connection strings:
   - **Connection string**: For migrations
   - **Pooled connection string**: For production (recommended)
3. **Copy the Pooled connection string** (includes `?pgbouncer=true`)
4. It looks like:
   ```
   postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require&pgbouncer=true
   ```
5. **Save this string** - you'll need it in Phase 4

### 2.4 Test Database Connection (Optional)

```bash
# Set DATABASE_URL temporarily
export DATABASE_URL="your-neon-connection-string"

# Test connection
npx prisma db push

# If successful, you'll see tables created
```

---

## Phase 3: Code Preparation

### 3.1 Verify Code is Clean

Before deploying, ensure:

```bash
# Check no .env file is committed
git status

# .env should NOT appear in the output
# If it does, add it to .gitignore and remove from git:
git rm --cached .env
git commit -m "Remove .env from repository"
```

### 3.2 Verify .gitignore

Ensure `.gitignore` includes:

```gitignore
# Environment variables
.env
.env.local
.env.production
.env.development

# Vercel
.vercel

# Dependencies
node_modules/

# Build output
.next/
out/
dist/
```

### 3.3 Create Production Build Locally (Test)

```bash
# Test production build
npm run build

# If successful, you'll see:
# ✓ Compiled successfully
# ✓ Collecting page data
# ✓ Generating static pages
```

If build fails, fix errors before proceeding.

### 3.4 Commit and Push to GitHub

```bash
# Add all changes
git add .

# Commit
git commit -m "Prepare for production deployment"

# Push to main branch
git push origin main
```

---

## Phase 4: Vercel Deployment

### 4.1 Sign Up for Vercel

1. Go to https://vercel.com
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account
5. Complete the signup process

### 4.2 Import Project from GitHub

1. In Vercel dashboard, click **"Add New..."** → **"Project"**
2. Find your repository in the list
3. Click **"Import"**

### 4.3 Configure Project Settings

On the import screen:

1. **Framework Preset**: Next.js (should be auto-detected)
2. **Root Directory**: `./` (leave as default)
3. **Build Command**: `npm run build` (or use default)
4. **Output Directory**: `.next` (or use default)
5. **Install Command**: `npm install` (or use default)

### 4.4 Configure Environment Variables

**Critical Step**: Add all environment variables before deploying.

Click **"Environment Variables"** and add each variable:

#### Database Configuration
```
DATABASE_URL = your-neon-pooled-connection-string
```

#### Authentication Secrets
```
JWT_SECRET = your-generated-jwt-secret
NEXTAUTH_SECRET = your-generated-nextauth-secret
NEXTAUTH_URL = https://yourapp.vercel.app
```
*Note: You'll update NEXTAUTH_URL after first deployment*

#### Email/SMTP Configuration
```
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 465
SMTP_SECURE = true
SMTP_USER = your-email@gmail.com
SMTP_PASSWORD = your-16-character-app-password
SMTP_FROM = Project Management System <your-email@gmail.com>
```

#### Feature Flags
```
ENABLE_EMAIL = true
ENABLE_UPLOADS = false
```
*Note: Set ENABLE_UPLOADS to false initially*

#### Node Environment
```
NODE_ENV = production
```

**Important**: 
- For each variable, select **"Production"** environment
- You can also add to "Preview" and "Development" if needed
- Click **"Add"** after each variable

### 4.5 Deploy

1. After adding all environment variables, click **"Deploy"**
2. Vercel will:
   - Clone your repository
   - Install dependencies
   - Run `prisma generate`
   - Build your Next.js application
   - Deploy to production
3. **Wait for deployment** (2-5 minutes)
4. Watch the build logs for any errors

### 4.6 Get Deployment URL

After successful deployment:

1. You'll see a success screen with your deployment URL
2. It will be in format: `https://yourapp.vercel.app`
3. **Copy this URL**

### 4.7 Update NEXTAUTH_URL

1. In Vercel dashboard, go to your project
2. Click **"Settings"** → **"Environment Variables"**
3. Find **NEXTAUTH_URL**
4. Click **"Edit"**
5. Update value to your actual deployment URL: `https://yourapp.vercel.app`
6. Click **"Save"**
7. **Redeploy**: Go to "Deployments" → Click "..." on latest → "Redeploy"

### 4.8 Run Database Migrations

The `vercel-build` script in `package.json` should automatically run migrations:

```json
"vercel-build": "prisma generate && prisma migrate deploy && next build"
```

If migrations didn't run, you can run them manually:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Run migrations
vercel env pull .env.production
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

### 4.9 Seed Production Database

**Option A: Using Vercel CLI**

```bash
# Pull environment variables
vercel env pull .env.production

# Run seed script
npx prisma db seed
```

**Option B: Using Neon SQL Editor**

1. Go to Neon dashboard
2. Click "SQL Editor"
3. Run seed queries manually (copy from `prisma/seed.js`)

---

## Phase 5: Post-Deployment Verification

### 5.1 Access Your Application

1. Open your deployment URL: `https://yourapp.vercel.app`
2. You should see the login page
3. Check for any console errors in browser DevTools

### 5.2 Test Authentication

Try logging in with demo credentials:

```
Email: admin@demo.com
Password: Admin@123
```

If login fails:
- Check JWT_SECRET and NEXTAUTH_SECRET are set correctly
- Check NEXTAUTH_URL matches your deployment URL
- Check database connection

### 5.3 Test Core Features

After logging in, verify:

- ✅ Dashboard loads with data
- ✅ Projects page displays projects
- ✅ Tasks page displays tasks
- ✅ Navigation works
- ✅ User profile loads
- ✅ No console errors

### 5.4 Test Email Notifications (Optional)

1. Create a new task and assign it to a user
2. Check if email notification is sent
3. If emails don't work:
   - Verify SMTP credentials in Vercel environment variables
   - Check Gmail App Password is correct
   - Check spam folder

### 5.5 Run Deployment Verification Script

```bash
# Set deployment URL
export DEPLOYMENT_URL=https://yourapp.vercel.app

# Run verification
npm run verify-deployment
```

Expected output:
```
✓ Health check: passed
✓ Auth endpoint: passed
✓ Database: healthy
✓ All checks passed!
```

### 5.6 Check Health Endpoint

Visit: `https://yourapp.vercel.app/api/health`

You should see:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-27T...",
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
  "uptime": 123.45
}
```

---

## Phase 6: Monitoring Setup

### 6.1 Enable Vercel Analytics

1. In Vercel dashboard, go to your project
2. Click **"Analytics"** tab
3. Click **"Enable Analytics"**
4. Analytics will start collecting data automatically

Features included:
- Page views and unique visitors
- Top pages and referrers
- Device and browser statistics
- Performance metrics

### 6.2 Set Up UptimeRobot (Optional but Recommended)

1. **Sign up for UptimeRobot**
   - Go to https://uptimerobot.com
   - Click "Sign Up" (free account)
   - Verify your email

2. **Create Monitor**
   - Click "Add New Monitor"
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: Project Management System
   - **URL**: `https://yourapp.vercel.app/api/health`
   - **Monitoring Interval**: 5 minutes
   - Click "Create Monitor"

3. **Set Up Alerts**
   - Click "Add Alert Contact"
   - **Alert Contact Type**: Email
   - **Email**: Your email address
   - Verify email
   - Enable alerts for your monitor

4. **Verify Monitor**
   - Wait 5 minutes
   - Check monitor status is "Up"
   - Test alert by temporarily breaking health endpoint

### 6.3 Set Up Automatic Deployments

Vercel automatically deploys when you push to GitHub:

1. **Configure Branch**
   - In Vercel dashboard → Settings → Git
   - **Production Branch**: `main`
   - **Preview Branches**: Enable for all branches

2. **Test Automatic Deployment**
   ```bash
   # Make a small change
   echo "# Test" >> README.md
   
   # Commit and push
   git add README.md
   git commit -m "Test automatic deployment"
   git push origin main
   ```
   
3. **Watch Deployment**
   - Go to Vercel dashboard → Deployments
   - You should see a new deployment triggered
   - Wait for it to complete

---

## Phase 7: Optional File Storage

### Option A: Enable Vercel Blob

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login and Link Project**
   ```bash
   vercel login
   vercel link
   ```

3. **Create Blob Store**
   ```bash
   vercel blob create
   ```

4. **Get Token**
   ```bash
   vercel env pull .env.production
   ```
   
   Copy `BLOB_READ_WRITE_TOKEN` from `.env.production`

5. **Add to Vercel Environment Variables**
   - Go to Vercel dashboard → Settings → Environment Variables
   - Add `BLOB_READ_WRITE_TOKEN` with the value
   - Set `ENABLE_UPLOADS` to `true`
   - Redeploy

### Option B: Use Cloudinary

1. **Sign Up**
   - Go to https://cloudinary.com
   - Sign up for free account

2. **Get Credentials**
   - Go to Dashboard
   - Copy: Cloud Name, API Key, API Secret

3. **Add to Vercel**
   - Add environment variables:
     ```
     CLOUDINARY_CLOUD_NAME = your-cloud-name
     CLOUDINARY_API_KEY = your-api-key
     CLOUDINARY_API_SECRET = your-api-secret
     ENABLE_UPLOADS = true
     ```
   - Redeploy

### Option C: Keep Uploads Disabled

If you don't need file uploads:
- Leave `ENABLE_UPLOADS=false`
- File upload UI will show "Coming soon" message

---

## Rollback Procedures

### Scenario 1: Deployment Failed

If deployment fails during build:

1. **Check Build Logs**
   - In Vercel dashboard → Deployments
   - Click on failed deployment
   - Review error messages

2. **Fix Locally**
   ```bash
   # Fix the issue
   npm run build  # Test locally
   
   # Commit and push
   git add .
   git commit -m "Fix build error"
   git push origin main
   ```

3. **Vercel will auto-deploy** the fix

### Scenario 2: Deployment Succeeded but App Broken

If deployment succeeded but app doesn't work:

1. **Rollback to Previous Deployment**
   - Go to Vercel dashboard → Deployments
   - Find last working deployment
   - Click "..." → "Promote to Production"
   - Confirm promotion

2. **Investigate Issue**
   - Check environment variables
   - Check database connection
   - Review error logs in Vercel

3. **Fix and Redeploy**
   ```bash
   # Fix the issue locally
   # Test thoroughly
   
   # Deploy fix
   git add .
   git commit -m "Fix production issue"
   git push origin main
   ```

### Scenario 3: Database Migration Failed

If database migration fails:

1. **Check Migration Status**
   ```bash
   vercel env pull .env.production
   npx prisma migrate status
   ```

2. **Rollback Migration** (if needed)
   - Go to Neon dashboard → SQL Editor
   - Run rollback SQL manually
   - Mark migration as rolled back:
     ```bash
     npx prisma migrate resolve --rolled-back migration_name
     ```

3. **Fix Migration**
   - Edit migration file
   - Test locally
   - Redeploy

### Scenario 4: Environment Variable Issue

If environment variables are wrong:

1. **Update in Vercel**
   - Go to Settings → Environment Variables
   - Edit the incorrect variable
   - Save changes

2. **Redeploy**
   - Go to Deployments
   - Click "..." on latest → "Redeploy"
   - Wait for redeployment

---

## Troubleshooting

### Issue: Build Fails with "Module not found"

**Solution**:
```bash
# Ensure all dependencies are in package.json
npm install

# Commit package-lock.json
git add package-lock.json
git commit -m "Update dependencies"
git push origin main
```

### Issue: Database Connection Fails

**Symptoms**: 500 errors, "Can't reach database server"

**Solutions**:
1. **Check DATABASE_URL**
   - Verify it's the pooled connection string
   - Ensure it includes `?sslmode=require&pgbouncer=true`

2. **Check Neon Database**
   - Go to Neon dashboard
   - Verify database is active
   - Check connection limits

3. **Test Connection**
   ```bash
   vercel env pull .env.production
   npx prisma db push
   ```

### Issue: Authentication Not Working

**Symptoms**: Can't log in, JWT errors

**Solutions**:
1. **Check Secrets**
   - Verify JWT_SECRET is set in Vercel
   - Verify NEXTAUTH_SECRET is set
   - Ensure they're not empty

2. **Check NEXTAUTH_URL**
   - Must match your deployment URL exactly
   - Include `https://`
   - No trailing slash

3. **Redeploy**
   - After fixing environment variables
   - Always redeploy for changes to take effect

### Issue: Emails Not Sending

**Symptoms**: No email notifications

**Solutions**:
1. **Check SMTP Credentials**
   - Verify SMTP_USER is correct
   - Verify SMTP_PASSWORD is the App Password (not Gmail password)
   - Check for typos

2. **Test SMTP**
   - Use online SMTP tester
   - Verify Gmail account is active
   - Check 2FA is enabled

3. **Check Logs**
   - In Vercel dashboard → Functions
   - Look for email-related errors

### Issue: Slow Performance

**Symptoms**: Pages load slowly, timeouts

**Solutions**:
1. **Check Database Queries**
   - Review slow query logs in Neon
   - Add database indexes if needed

2. **Check Vercel Limits**
   - Verify you're within free tier limits
   - Check function execution time

3. **Optimize Code**
   - Implement caching
   - Reduce bundle size
   - Lazy load components

### Issue: 404 on API Routes

**Symptoms**: API endpoints return 404

**Solutions**:
1. **Check File Structure**
   - Ensure `app/api/*/route.ts` files exist
   - Verify Next.js App Router structure

2. **Check Build Output**
   - Review build logs
   - Ensure API routes are included in build

3. **Clear Cache**
   - In Vercel dashboard → Settings
   - Clear build cache
   - Redeploy

---

## Post-Deployment Checklist

After successful deployment, verify:

- ✅ Application is accessible via HTTPS
- ✅ All pages load without errors
- ✅ Authentication works (login/logout)
- ✅ Database queries work
- ✅ Email notifications work (if enabled)
- ✅ File uploads work (if enabled)
- ✅ Health endpoint returns healthy status
- ✅ Vercel Analytics is collecting data
- ✅ UptimeRobot monitor is active
- ✅ Automatic deployments work
- ✅ Demo credentials work
- ✅ No console errors in browser
- ✅ Mobile responsive design works
- ✅ Performance is acceptable (<3s load time)

---

## Maintenance

### Regular Tasks

**Weekly**:
- Check UptimeRobot for downtime alerts
- Review Vercel Analytics for usage trends
- Check Neon database storage usage

**Monthly**:
- Review and update dependencies: `npm outdated`
- Check for security vulnerabilities: `npm audit`
- Review error logs in Vercel
- Backup database (Neon provides automatic backups)

**As Needed**:
- Update demo data if needed
- Rotate secrets (JWT_SECRET, etc.)
- Update documentation

### Updating the Application

```bash
# Make changes locally
# Test thoroughly

# Commit and push
git add .
git commit -m "Description of changes"
git push origin main

# Vercel automatically deploys
# Monitor deployment in Vercel dashboard
```

---

## Security Best Practices

- ✅ Never commit `.env` files to Git
- ✅ Use strong, randomly generated secrets
- ✅ Rotate secrets periodically
- ✅ Keep dependencies updated
- ✅ Monitor for security vulnerabilities
- ✅ Use environment variables for all secrets
- ✅ Enable 2FA on all service accounts
- ✅ Review access logs regularly
- ✅ Keep demo credentials separate from real data
- ✅ Use HTTPS only (enforced by Vercel)

---

## Support and Resources

### Documentation
- **Next.js**: https://nextjs.org/docs
- **Vercel**: https://vercel.com/docs
- **Neon**: https://neon.tech/docs
- **Prisma**: https://www.prisma.io/docs

### Service Status Pages
- **Vercel**: https://www.vercel-status.com/
- **Neon**: https://neonstatus.com/
- **Gmail**: https://www.google.com/appsstatus

### Getting Help
- Check application logs in Vercel dashboard
- Review Neon database logs
- Search GitHub issues
- Check service status pages
- Review this documentation

---

## Success! 🎉

Your application is now deployed to production!

**Next Steps**:
1. Share your deployment URL with stakeholders
2. Update README.md with your actual deployment URL
3. Add screenshots to README.md
4. Monitor application performance
5. Gather user feedback
6. Plan future enhancements

**Your deployment URL**: `https://yourapp.vercel.app`

**Demo Credentials**:
- Admin: `admin@demo.com` / `Admin@123`
- PM: `pm@demo.com` / `PM@123`
- Team: `team@demo.com` / `Team@123`

---

**Congratulations on your successful deployment! 🚀**

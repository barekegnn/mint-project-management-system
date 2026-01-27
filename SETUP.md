# Local Development Setup Guide

This guide will walk you through setting up the Project Management System on your local machine for development purposes.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Step 1: Clone the Repository](#step-1-clone-the-repository)
- [Step 2: Install Dependencies](#step-2-install-dependencies)
- [Step 3: Set Up Database](#step-3-set-up-database)
- [Step 4: Configure Email (Gmail SMTP)](#step-4-configure-email-gmail-smtp)
- [Step 5: Generate Secrets](#step-5-generate-secrets)
- [Step 6: Configure Environment Variables](#step-6-configure-environment-variables)
- [Step 7: Initialize Database](#step-7-initialize-database)
- [Step 8: Run the Application](#step-8-run-the-application)
- [Troubleshooting](#troubleshooting)
- [Additional Configuration](#additional-configuration)

---

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

- **Node.js** (version 18.0.0 or higher)
  - Download from: https://nodejs.org/
  - Verify installation: `node --version`
  
- **npm** (comes with Node.js)
  - Verify installation: `npm --version`
  
- **Git**
  - Download from: https://git-scm.com/
  - Verify installation: `git --version`

### Required Accounts

- **PostgreSQL Database** (choose one):
  - **Option A**: Local PostgreSQL installation
    - Download from: https://www.postgresql.org/download/
  - **Option B**: Neon (recommended for cloud-based, free tier)
    - Sign up at: https://neon.tech (use GitHub login)
  
- **Gmail Account** (for email notifications)
  - You'll need to enable 2FA and generate an App Password
  - See [Step 4](#step-4-configure-email-gmail-smtp) for details

---

## Step 1: Clone the Repository

```bash
# Clone the repository
git clone <repository-url>

# Navigate to the project directory
cd project-management-system
```

---

## Step 2: Install Dependencies

```bash
# Install all npm packages
npm install
```

This will install all required dependencies including:
- Next.js, React, TypeScript
- Prisma (database ORM)
- Authentication libraries
- UI components and styling libraries
- Testing frameworks

**Expected output**: You should see a list of installed packages and no errors.

---

## Step 3: Set Up Database

### Option A: Using Neon (Recommended - Free Cloud Database)

1. **Sign up for Neon**
   - Go to https://neon.tech
   - Click "Sign up" and choose "Continue with GitHub"
   - Authorize Neon to access your GitHub account

2. **Create a New Project**
   - Click "Create Project"
   - Project name: `project-management-system` (or your preferred name)
   - Region: Choose the closest region to you
   - PostgreSQL version: Use the default (latest)
   - Click "Create Project"

3. **Get Connection Strings**
   - In your Neon dashboard, click on your project
   - Go to "Connection Details"
   - You'll see two connection strings:
     - **Connection string**: For migrations and development
     - **Pooled connection string**: For production (recommended for serverless)
   - Copy the **Pooled connection string** (it includes `?pgbouncer=true`)
   - Save it for Step 6

### Option B: Using Local PostgreSQL

1. **Install PostgreSQL**
   - Download and install from https://www.postgresql.org/download/
   - During installation, remember your postgres user password

2. **Create Database**
   ```bash
   # Connect to PostgreSQL
   psql -U postgres
   
   # Create database
   CREATE DATABASE project_management;
   
   # Exit psql
   \q
   ```

3. **Get Connection String**
   - Format: `postgresql://postgres:YOUR_PASSWORD@localhost:5432/project_management`
   - Replace `YOUR_PASSWORD` with your postgres password
   - Save it for Step 6

---

## Step 4: Configure Email (Gmail SMTP)

To enable email notifications, you need to set up Gmail SMTP with an App Password.

### 4.1 Enable 2-Factor Authentication

1. Go to your Google Account: https://myaccount.google.com/
2. Click "Security" in the left sidebar
3. Under "How you sign in to Google", click "2-Step Verification"
4. Follow the prompts to enable 2FA (you'll need your phone)

### 4.2 Generate App Password

1. After enabling 2FA, go back to Security settings
2. Under "How you sign in to Google", click "App passwords"
3. You may need to sign in again
4. In the "Select app" dropdown, choose "Mail"
5. In the "Select device" dropdown, choose "Other (Custom name)"
6. Enter a name: `Project Management System`
7. Click "Generate"
8. **Important**: Copy the 16-character password (it looks like: `abcd efgh ijkl mnop`)
9. Save this password - you won't be able to see it again!

### 4.3 SMTP Configuration Details

You'll need these values for Step 6:
- **SMTP Host**: `smtp.gmail.com`
- **SMTP Port**: `465`
- **SMTP Secure**: `true`
- **SMTP User**: Your full Gmail address (e.g., `yourname@gmail.com`)
- **SMTP Password**: The 16-character App Password you just generated

---

## Step 5: Generate Secrets

You need to generate secure random secrets for JWT authentication.

### Using Node.js (Recommended)

```bash
# Generate JWT_SECRET
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('base64'))"

# Generate NEXTAUTH_SECRET
node -e "console.log('NEXTAUTH_SECRET=' + require('crypto').randomBytes(32).toString('base64'))"
```

**Copy both outputs** - you'll need them in Step 6.

### Alternative: Using OpenSSL

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```

---

## Step 6: Configure Environment Variables

### 6.1 Create .env File

```bash
# Copy the example environment file
cp .env.example .env
```

### 6.2 Edit .env File

Open `.env` in your text editor and fill in the values:

```bash
# ============================================
# DATABASE CONFIGURATION
# ============================================
# Use the connection string from Step 3
# For Neon: Use the pooled connection string
# For Local: postgresql://postgres:password@localhost:5432/project_management
DATABASE_URL="your-database-connection-string-here"

# ============================================
# AUTHENTICATION SECRETS
# ============================================
# Use the secrets generated in Step 5
JWT_SECRET="your-generated-jwt-secret-here"
NEXTAUTH_SECRET="your-generated-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# ============================================
# EMAIL/SMTP CONFIGURATION (Gmail)
# ============================================
# Use the values from Step 4
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-16-character-app-password"
SMTP_FROM="Project Management System <your-email@gmail.com>"

# ============================================
# FILE STORAGE (Optional - for development)
# ============================================
# Leave empty for now - file uploads will be disabled
BLOB_READ_WRITE_TOKEN=""
ENABLE_UPLOADS="false"

# ============================================
# FEATURE FLAGS
# ============================================
ENABLE_EMAIL="true"

# ============================================
# DEVELOPMENT SETTINGS
# ============================================
NODE_ENV="development"
```

### 6.3 Verify Configuration

Make sure:
- ✅ No placeholder values remain (like `your-database-connection-string-here`)
- ✅ All secrets are properly generated (not empty)
- ✅ Gmail credentials are correct
- ✅ Database URL is properly formatted
- ✅ File is saved

---

## Step 7: Initialize Database

### 7.1 Generate Prisma Client

```bash
npx prisma generate
```

This generates the Prisma Client based on your schema.

### 7.2 Push Schema to Database

```bash
npx prisma db push
```

This creates all the necessary tables in your database.

**Expected output**: You should see messages about tables being created.

### 7.3 Seed Database with Demo Data

```bash
npx prisma db seed
```

This populates your database with demo users, projects, tasks, and other data.

**Expected output**: You should see:
```
✅ Admin user created
✅ Project Managers created
✅ Team Members created
✅ Projects created
✅ Tasks created
✅ Teams created
✅ Budget entries created
✅ Database seeded successfully!
```

### 7.4 Verify Database (Optional)

```bash
# Open Prisma Studio to view your database
npx prisma studio
```

This opens a web interface at http://localhost:5555 where you can browse your database tables and data.

---

## Step 8: Run the Application

### 8.1 Start Development Server

```bash
npm run dev
```

**Expected output**:
```
> mint@0.1.0 dev
> next dev --turbopack

  ▲ Next.js 15.3.2
  - Local:        http://localhost:3000
  - Environments: .env

 ✓ Starting...
 ✓ Ready in 2.3s
```

### 8.2 Access the Application

1. Open your browser
2. Navigate to: http://localhost:3000
3. You should see the login page

### 8.3 Log In with Demo Account

Use one of these demo accounts:

**Admin Account:**
- Email: `admin@demo.com`
- Password: `Admin@123`

**Project Manager:**
- Email: `pm@demo.com`
- Password: `PM@123`

**Team Member:**
- Email: `team@demo.com`
- Password: `Team@123`

### 8.4 Verify Everything Works

After logging in, check:
- ✅ Dashboard loads with charts and data
- ✅ Projects page shows demo projects
- ✅ Tasks page shows demo tasks
- ✅ Navigation works
- ✅ No console errors in browser DevTools

---

## Troubleshooting

### Issue: Database Connection Failed

**Error**: `Can't reach database server`

**Solutions**:
1. **Check DATABASE_URL**: Make sure it's correctly formatted
2. **For Neon**: Verify your internet connection
3. **For Local PostgreSQL**: 
   - Check if PostgreSQL is running: `pg_isready`
   - Verify credentials are correct
   - Check if database exists: `psql -U postgres -l`

### Issue: Prisma Generate Fails

**Error**: `Prisma schema validation failed`

**Solutions**:
1. Make sure you're in the project root directory
2. Check if `prisma/schema.prisma` exists
3. Run `npm install` again to ensure Prisma is installed

### Issue: Seed Script Fails

**Error**: `Unique constraint failed`

**Solutions**:
1. Database might already have data
2. Reset database:
   ```bash
   npx prisma db push --force-reset
   npx prisma db seed
   ```

### Issue: Email Not Sending

**Error**: `Invalid login` or `Authentication failed`

**Solutions**:
1. **Verify 2FA is enabled** on your Gmail account
2. **Check App Password**: Make sure you copied it correctly (no spaces)
3. **Test SMTP credentials**: Use a tool like https://www.smtper.net/
4. **Check Gmail settings**: Ensure "Less secure app access" is NOT needed (App Passwords bypass this)

### Issue: Port 3000 Already in Use

**Error**: `Port 3000 is already in use`

**Solutions**:
1. **Kill the process using port 3000**:
   ```bash
   # On Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   
   # On Mac/Linux
   lsof -ti:3000 | xargs kill -9
   ```
2. **Or use a different port**:
   ```bash
   PORT=3001 npm run dev
   ```

### Issue: Module Not Found

**Error**: `Cannot find module '@/...'`

**Solutions**:
1. Delete `node_modules` and reinstall:
   ```bash
   rm -rf node_modules
   npm install
   ```
2. Clear Next.js cache:
   ```bash
   rm -rf .next
   npm run dev
   ```

### Issue: TypeScript Errors

**Error**: Various TypeScript compilation errors

**Solutions**:
1. Make sure you're using Node.js 18+: `node --version`
2. Regenerate Prisma Client: `npx prisma generate`
3. Restart your IDE/editor
4. Check `tsconfig.json` exists and is valid

---

## Additional Configuration

### Enable File Uploads (Optional)

To enable file uploads in development:

1. **Option A: Use Vercel Blob (Requires Vercel Account)**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Link project
   vercel link
   
   # Create Blob store
   vercel blob create
   
   # Get token
   vercel env pull .env.local
   ```
   
   Copy `BLOB_READ_WRITE_TOKEN` from `.env.local` to `.env`
   Set `ENABLE_UPLOADS="true"` in `.env`

2. **Option B: Use Cloudinary (Free Tier)**
   - Sign up at https://cloudinary.com
   - Get your Cloud Name, API Key, and API Secret
   - Add to `.env`:
     ```bash
     CLOUDINARY_CLOUD_NAME="your-cloud-name"
     CLOUDINARY_API_KEY="your-api-key"
     CLOUDINARY_API_SECRET="your-api-secret"
     ENABLE_UPLOADS="true"
     ```

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Database Management

```bash
# View database in browser
npx prisma studio

# Reset database (WARNING: Deletes all data)
npx prisma db push --force-reset

# Create a migration
npx prisma migrate dev --name your_migration_name

# View migration status
npx prisma migrate status
```

### Code Quality

```bash
# Run linter
npm run lint

# Format code (if prettier is configured)
npm run format
```

---

## Next Steps

Now that you have the application running locally:

1. **Explore the codebase**: Familiarize yourself with the project structure
2. **Read the documentation**: Check out [API.md](./API.md) for API documentation
3. **Make changes**: Start developing new features or fixing bugs
4. **Run tests**: Ensure your changes don't break existing functionality
5. **Deploy**: When ready, see [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions

---

## Getting Help

If you encounter issues not covered in this guide:

1. **Check the logs**: Look for error messages in the terminal
2. **Browser console**: Check for JavaScript errors in DevTools
3. **Prisma logs**: Enable debug logging: `DEBUG=prisma:* npm run dev`
4. **GitHub Issues**: Search for similar issues or create a new one
5. **Documentation**: Review Next.js, Prisma, and other library docs

---

## Summary Checklist

Before you start development, make sure:

- ✅ Node.js 18+ is installed
- ✅ Repository is cloned
- ✅ Dependencies are installed (`npm install`)
- ✅ Database is set up (Neon or local PostgreSQL)
- ✅ Gmail SMTP is configured with App Password
- ✅ Secrets are generated (JWT_SECRET, NEXTAUTH_SECRET)
- ✅ `.env` file is created and filled out
- ✅ Prisma client is generated (`npx prisma generate`)
- ✅ Database schema is pushed (`npx prisma db push`)
- ✅ Database is seeded (`npx prisma db seed`)
- ✅ Development server is running (`npm run dev`)
- ✅ Application is accessible at http://localhost:3000
- ✅ You can log in with demo credentials

**Happy coding! 🚀**

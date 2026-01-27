# 🚀 Local Development Setup Guide

This guide will help you set up the Project Management System on your local machine for development.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **Git** - [Download](https://git-scm.com/)
- **PostgreSQL** (optional for local development) - [Download](https://www.postgresql.org/)

## 🔧 Step 1: Clone the Repository

```bash
git clone <your-repository-url>
cd <project-directory>
```

## 📦 Step 2: Install Dependencies

```bash
npm install
# or
yarn install
```

## 🔐 Step 3: Set Up Environment Variables

### 3.1 Create .env File

Copy the example environment file:

```bash
cp .env.example .env
```

### 3.2 Generate Secure Secrets

Run the secret generation script:

```bash
node scripts/generate-secrets.js
```

Copy the generated secrets and paste them into your `.env` file for `JWT_SECRET` and `NEXTAUTH_SECRET`.

### 3.3 Configure Database

**Option A: Use Neon (Recommended for Free Cloud Database)**

1. Go to [neon.tech](https://neon.tech)
2. Sign in with your GitHub account (free, no credit card required)
3. Click "Create Project"
4. Give your project a name (e.g., "pms-dev")
5. Select a region close to you
6. Click "Create Project"
7. Copy the connection string from the dashboard
8. Paste it into your `.env` file as `DATABASE_URL`

**Option B: Use Local PostgreSQL**

1. Install PostgreSQL on your machine
2. Create a new database:
   ```bash
   createdb pms_dev
   ```
3. Update your `.env` file:
   ```
   DATABASE_URL="postgresql://postgres:your-password@localhost:5432/pms_dev"
   ```

### 3.4 Configure Email (Gmail SMTP)

1. **Create a Gmail Account** (or use existing)
   - Go to [gmail.com](https://gmail.com)
   - Create a new account (free)

2. **Enable 2-Factor Authentication**
   - Go to [myaccount.google.com/security](https://myaccount.google.com/security)
   - Click "2-Step Verification"
   - Follow the setup process

3. **Generate App Password**
   - Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Other (Custom name)"
   - Enter "Project Management System"
   - Click "Generate"
   - Copy the 16-character password

4. **Update .env File**
   ```env
   SMTP_USER="your-email@gmail.com"
   SMTP_PASSWORD="your-16-char-app-password"
   SMTP_FROM="Project Management System <your-email@gmail.com>"
   EMAIL_USER="your-email@gmail.com"
   EMAIL_PASSWORD="your-16-char-app-password"
   ```

### 3.5 Configure File Storage (Optional)

**For Development**: You can disable file uploads initially:
```env
ENABLE_UPLOADS="false"
```

**For Production**: Set up Vercel Blob (see DEPLOYMENT.md)

### 3.6 Update Application URL

For local development:
```env
NEXTAUTH_URL="http://localhost:3000"
```

## 🗄️ Step 4: Set Up Database

### 4.1 Generate Prisma Client

```bash
npx prisma generate
```

### 4.2 Push Database Schema

```bash
npx prisma db push
```

This will create all the necessary tables in your database.

### 4.3 Seed Database with Demo Data

```bash
npx prisma db seed
```

This will create:
- Admin user: `admin@example.com` / `Admin@123`
- Project Manager: `pm@example.com` / `PM@123`
- Team Member: `team@example.com` / `TM@123`
- Sample projects and tasks

## ▶️ Step 5: Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## ✅ Step 6: Verify Setup

1. **Check Health Endpoint**
   - Visit: http://localhost:3000/api/health
   - Should return: `{"status":"healthy",...}`

2. **Test Login**
   - Go to: http://localhost:3000/login
   - Use demo credentials: `admin@example.com` / `Admin@123`
   - Should successfully log in

3. **Check Database Connection**
   - Run: `npx prisma studio`
   - Opens database GUI at http://localhost:5555
   - Verify tables and data exist

## 🛠️ Useful Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Generate Prisma client
npx prisma generate

# Push schema changes to database
npx prisma db push

# Open Prisma Studio (database GUI)
npx prisma studio

# Seed database
npx prisma db seed

# Generate new secrets
node scripts/generate-secrets.js
```

## 🐛 Troubleshooting

### Database Connection Issues

**Error**: `Can't reach database server`

**Solution**:
- Check your `DATABASE_URL` is correct
- Ensure PostgreSQL is running (if using local)
- Check firewall settings
- Verify network connectivity (if using Neon)

### Email Sending Issues

**Error**: `Invalid login: 535-5.7.8 Username and Password not accepted`

**Solution**:
- Verify you've enabled 2FA on Gmail
- Ensure you're using an App Password, not your regular password
- Check the App Password is copied correctly (no spaces)
- Verify `SMTP_USER` matches the Gmail account

### Prisma Generation Issues

**Error**: `Prisma schema not found`

**Solution**:
```bash
npx prisma generate
npx prisma db push
```

### Port Already in Use

**Error**: `Port 3000 is already in use`

**Solution**:
```bash
# Kill the process using port 3000
# On Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# On Mac/Linux:
lsof -ti:3000 | xargs kill -9

# Or use a different port:
PORT=3001 npm run dev
```

## 📚 Next Steps

- Read [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment guide
- Check [API.md](./API.md) for API documentation
- Review [README.md](./README.md) for project overview

## 🆘 Need Help?

If you encounter issues not covered here:
1. Check the error message carefully
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed
4. Check that services (database, email) are accessible
5. Review the logs for detailed error information

## 🔒 Security Notes

- **NEVER** commit your `.env` file to git
- Use different secrets for development and production
- Keep your App Passwords secure
- Regularly rotate secrets in production
- Use strong passwords for demo accounts in production

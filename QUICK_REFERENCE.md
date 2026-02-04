# Quick Reference Guide

## 🚀 Your Deployment URLs

**Production URL**: `https://your-app.vercel.app` (check Vercel dashboard)  
**GitHub Repository**: https://github.com/barekegnn/mint-project-management-system

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@example.com | Admin@123 |
| **Project Manager** | pm@example.com | PM@123 |
| **Team Member** | team@example.com | Team@123 |

---

## 📱 Quick Commands

### Development
```bash
# Start development server
npm run dev

# Run tests
npm test

# Test authentication errors
npm run test:auth

# Build for production
npm run build
```

### Database
```bash
# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# Seed database
npx prisma db seed

# Open Prisma Studio
npx prisma studio
```

### Deployment
```bash
# Commit changes
git add .
git commit -m "Your message"
git push origin main

# Vercel will auto-deploy!
```

---

## 🔧 Common Tasks

### Add a New User
1. Login as admin
2. Go to `/admin/users`
3. Click "Create User"
4. User receives activation email
5. User sets password via email link

### Create a Project
1. Login as admin
2. Go to `/admin/projects`
3. Click "Add Project"
4. Fill in details
5. Assign project manager

### Assign Tasks
1. Login as project manager
2. Go to `/project-manager/tasks`
3. Create new task
4. Assign to team member
5. Set deadline and priority

### Submit Report
1. Login as team member
2. Go to `/team-member/report`
3. Select task/project
4. Upload file
5. Add description
6. Submit to manager

---

## 🐛 Troubleshooting

### Pages Not Loading
1. Check Vercel deployment status
2. Verify environment variables are set
3. Check browser console for errors
4. Clear browser cache

### Database Connection Issues
1. Verify DATABASE_URL in Vercel
2. Check Neon database is active
3. Ensure connection string includes `?pgbouncer=true`
4. Check Neon dashboard for errors

### Email Not Sending
1. Verify SMTP credentials in Vercel
2. Check Gmail App Password is correct
3. Ensure ENABLE_EMAIL=true
4. Check spam folder

### Authentication Errors
1. Verify JWT_SECRET is set
2. Check NEXTAUTH_SECRET is set
3. Ensure NEXTAUTH_URL matches deployment URL
4. Clear cookies and try again

---

## 📊 Monitoring

### Vercel Dashboard
- View deployment history
- Check build logs
- Monitor analytics
- Manage environment variables

### Neon Dashboard
- Monitor database usage
- View query performance
- Check connection limits
- Manage backups

### Health Check
Visit: `https://your-app.vercel.app/api/health`

Expected response:
```json
{
  "status": "healthy",
  "services": [
    { "service": "database", "status": "healthy" },
    { "service": "api", "status": "healthy" }
  ]
}
```

---

## 🔒 Security Checklist

- ✅ No `.env` file in repository
- ✅ All secrets in Vercel environment variables
- ✅ Rate limiting enabled on auth endpoints
- ✅ Input validation on all API routes
- ✅ JWT tokens expire after 1 day
- ✅ Passwords hashed with bcrypt
- ✅ HTTPS enforced by Vercel

---

## 📞 Quick Links

| Resource | URL |
|----------|-----|
| **Vercel Dashboard** | https://vercel.com/dashboard |
| **Neon Dashboard** | https://console.neon.tech |
| **GitHub Repo** | https://github.com/barekegnn/mint-project-management-system |
| **Next.js Docs** | https://nextjs.org/docs |
| **Prisma Docs** | https://www.prisma.io/docs |

---

## 💡 Pro Tips

1. **Always test locally** before pushing to production
2. **Use meaningful commit messages** for easy rollback
3. **Monitor Vercel Analytics** to understand usage patterns
4. **Keep dependencies updated** monthly
5. **Backup important data** regularly
6. **Document custom changes** for future reference

---

## 🎯 Feature Roadmap Ideas

### Short Term
- [ ] Custom email templates
- [ ] File upload size limits
- [ ] Advanced search filters
- [ ] Export reports to PDF

### Medium Term
- [ ] Two-factor authentication
- [ ] Real-time notifications
- [ ] Calendar integration
- [ ] Mobile app

### Long Term
- [ ] AI-powered insights
- [ ] Advanced analytics
- [ ] Third-party integrations
- [ ] Multi-language support

---

**Last Updated**: February 3, 2026  
**Version**: 1.0.0  
**Status**: Production Ready ✅

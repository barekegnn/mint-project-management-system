# Project Management System

A comprehensive project management system built for the Ethiopian Ministry of Innovation and Technology. This system provides multi-role authentication, project and task management, team collaboration, budget tracking, and analytics capabilities.

## 🌐 Live Demo

🚀 **[View Live Demo](https://mint-pms.vercel.app)** *

Experience the system firsthand with our demo accounts. See the [Demo Credentials](#-demo-credentials) section below for login information.

## 🚀 Features

- **Multi-Role Authentication**: Support for Admin, Project Manager, and Team Member roles
- **Project Management**: Create, track, and manage projects with status updates and deadlines
- **Task Management**: Assign tasks, set priorities, track progress, and manage deadlines
- **Team Collaboration**: Team creation, member management, and project assignments
- **Budget Tracking**: Monitor project budgets, allocations, and expenses by department
- **Real-time Notifications**: Stay updated on project and task changes
- **Messaging System**: Internal messaging between team members
- **Reports & Analytics**: Generate and share project reports
- **Document Management**: Upload and manage project attachments
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router) with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Chakra UI
- **State Management**: React Hooks, SWR for data fetching
- **Forms**: React Hook Form with Zod validation
- **Charts**: Chart.js, Recharts
- **Icons**: Lucide React, React Icons

### Backend
- **API**: Next.js API Routes (serverless)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt password hashing
- **Email**: Nodemailer with Gmail SMTP
- **File Storage**: Vercel Blob / Cloudinary

### DevOps & Deployment
- **Hosting**: Vercel (Frontend & Backend)
- **Database**: Neon PostgreSQL (serverless)
- **CI/CD**: GitHub Actions via Vercel
- **Monitoring**: Vercel Analytics, UptimeRobot

### Testing
- **Unit Tests**: Jest with ts-jest
- **Property-Based Tests**: fast-check
- **Test Coverage**: Comprehensive test suite with 100+ tests

## 🔐 Demo Credentials

The system comes with pre-seeded demo accounts for testing:

### Admin Account
- **Email**: `admin@demo.com`
- **Password**: `Admin@123`
- **Capabilities**: Full system access, user management, system settings

### Project Manager Account
- **Email**: `pm@demo.com`
- **Password**: `PM@123`
- **Capabilities**: Create projects, assign tasks, manage teams, view reports

### Team Member Account
- **Email**: `team@demo.com`
- **Password**: `Team@123`
- **Capabilities**: View assigned tasks, update task status, submit reports

### Additional Demo Accounts
- **Project Manager 2**: `pm2@demo.com` / `PM@123`
- **Team Member 2**: `team2@demo.com` / `Team@123`
- **Team Member 3**: `team3@demo.com` / `Team@123`
- **Team Member 4**: `team4@demo.com` / `Team@123`

## 📦 Demo Data

The seed script creates realistic demo data including:
- **7 Users**: 1 Admin, 2 Project Managers, 4 Team Members
- **3 Projects**: Ministry Digital Portal, E-Government Platform, Smart City Initiative
- **12 Tasks**: Various tasks across projects with different statuses and priorities
- **2 Teams**: Development Team and Design Team
- **5 Budget Entries**: Budget allocations and expenses tracking
- **Multiple Comments, Notifications, and Messages**: Realistic collaboration data

## 📸 Screenshots

> **Note**: Screenshots will be added after deployment. The system includes:
> - Dashboard with analytics and charts
> - Project management interface with Kanban boards
> - Task management with drag-and-drop
> - Team collaboration features
> - Budget tracking and reporting
> - Responsive mobile design

*Screenshots coming soon...*

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or cloud-based like Neon)
- Gmail account with App Password (for email notifications)

### Quick Start

For detailed setup instructions, see **[SETUP.md](./SETUP.md)**.

For deployment instructions, see **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

For API documentation, see **[API.md](./API.md)**.

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and fill in your credentials:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `JWT_SECRET`: Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
   - `NEXTAUTH_SECRET`: Generate with the same command
   - `SMTP_*`: Your Gmail SMTP credentials
   - Other configuration as needed

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Push schema to database
   npx prisma db push
   
   # Seed database with demo data
   npx prisma db seed
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) and log in with one of the demo accounts.

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio to view/edit database
- `npx prisma db seed` - Seed database with demo data

## 🗄️ Database Schema

The system uses PostgreSQL with the following main entities:
- **User**: User accounts with roles and authentication
- **Project**: Projects with status, budget, and deadlines
- **Task**: Tasks with assignments, priorities, and status
- **Team**: Teams with member associations
- **Budget**: Budget tracking by project and department
- **Notification**: System notifications for users
- **Message**: Internal messaging between users
- **Comment**: Task comments and discussions
- **Report**: Project reports and documents
- **Label**: Task labels for categorization

## 🔒 Security Features

- ✅ Password hashing with bcrypt (10 rounds)
- ✅ JWT-based authentication with httpOnly cookies
- ✅ Role-based access control (RBAC)
- ✅ Email verification for new accounts
- ✅ Secure password reset flow
- ✅ Input validation and sanitization (Zod schemas)
- ✅ SQL injection prevention (via Prisma)
- ✅ Rate limiting on authentication endpoints
- ✅ XSS protection with Content Security Policy
- ✅ CSRF protection
- ✅ Secure headers (X-Frame-Options, X-Content-Type-Options)

## ⚡ Performance

- **Initial Load**: < 3 seconds
- **API Response Time**: < 500ms (95th percentile)
- **Lighthouse Score**: 90+ (Performance, Accessibility, Best Practices, SEO)
- **Bundle Size**: Optimized with code splitting and lazy loading
- **Caching**: Implemented for static assets and API responses
- **Database**: Optimized queries with proper indexes

## 📚 Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   └── layout.tsx         # Root layout
├── components/            # React components
├── lib/                   # Utility functions and configurations
├── prisma/               # Database schema and migrations
│   ├── schema.prisma     # Prisma schema
│   └── seed.js           # Database seed script
├── public/               # Static assets
└── types/                # TypeScript type definitions
```

## 🌐 Deployment

This application is designed to be deployed on 100% free services:

### Deployment Stack
- **Frontend & Backend**: Vercel (free tier - unlimited personal projects)
- **Database**: Neon PostgreSQL (free tier - 0.5GB storage)
- **File Storage**: Vercel Blob (free tier - 1GB) or Cloudinary (free tier - 25GB)
- **Email**: Gmail SMTP (free with App Password)
- **Monitoring**: Vercel Analytics (included) + UptimeRobot (free tier)

### Deployment Features
- ✅ Automatic SSL certificates
- ✅ Zero-downtime deployments
- ✅ Automatic deployments from GitHub
- ✅ Environment variable management
- ✅ Built-in CDN for static assets
- ✅ Serverless functions for API routes

For detailed deployment instructions, see **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

## 📄 License

This project was developed as part of an internship at the Ethiopian Ministry of Innovation and Technology.

## 🙏 Acknowledgments

- Ethiopian Ministry of Innovation and Technology for the opportunity
- The development team and mentors who contributed to this project
- Open source community for the amazing tools and libraries

## 🤝 Contributing

This is a portfolio project. For questions or suggestions, please open an issue.

## 📧 Contact

For more information about this project, please contact the development team.

## 🎯 Project Status

- ✅ Development: Complete
- ✅ Testing: Comprehensive test suite with 100+ tests
- ✅ Documentation: Complete
- 🚀 Deployment: Ready for production

---

**Note**: This is a demo system with pre-seeded data. The demo credentials are for testing purposes only. In a production environment, ensure all default credentials are changed and proper security measures are implemented.

**Built with ❤️ in Addis Ababa, Ethiopia** 

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log("🧹 Cleaning existing data...");
  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.report.deleteMany();
  await prisma.message.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.team.deleteMany();
  await prisma.label.deleteMany();
  await prisma.user.deleteMany();

  // Create Admin User
  console.log("👤 Creating admin user...");
  const adminPassword = await bcrypt.hash("Admin@123", 10);
  const admin = await prisma.user.create({
    data: {
      fullName: "System Administrator",
      email: "admin@demo.com",
      password: adminPassword,
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: new Date(),
      activatedAt: new Date(),
      profileImageUrl: null,
    },
  });
  console.log("✅ Admin created:", admin.email);

  // Create Project Manager Users
  console.log("👤 Creating project manager users...");
  const pmPassword = await bcrypt.hash("PM@123", 10);
  const pm1 = await prisma.user.create({
    data: {
      fullName: "Sarah Johnson",
      email: "pm@demo.com",
      password: pmPassword,
      role: "PROJECT_MANAGER",
      status: "ACTIVE",
      emailVerified: new Date(),
      activatedAt: new Date(),
      profileImageUrl: null,
    },
  });

  const pm2 = await prisma.user.create({
    data: {
      fullName: "Michael Chen",
      email: "pm2@demo.com",
      password: pmPassword,
      role: "PROJECT_MANAGER",
      status: "ACTIVE",
      emailVerified: new Date(),
      activatedAt: new Date(),
      profileImageUrl: null,
    },
  });
  console.log("✅ Project managers created:", pm1.email, pm2.email);

  // Create Team Member Users
  console.log("👤 Creating team member users...");
  const tmPassword = await bcrypt.hash("Team@123", 10);
  const tm1 = await prisma.user.create({
    data: {
      fullName: "Alex Martinez",
      email: "team@demo.com",
      password: tmPassword,
      role: "TEAM_MEMBER",
      status: "ACTIVE",
      emailVerified: new Date(),
      activatedAt: new Date(),
      profileImageUrl: null,
    },
  });

  const tm2 = await prisma.user.create({
    data: {
      fullName: "Emily Davis",
      email: "team2@demo.com",
      password: tmPassword,
      role: "TEAM_MEMBER",
      status: "ACTIVE",
      emailVerified: new Date(),
      activatedAt: new Date(),
      profileImageUrl: null,
    },
  });

  const tm3 = await prisma.user.create({
    data: {
      fullName: "James Wilson",
      email: "team3@demo.com",
      password: tmPassword,
      role: "TEAM_MEMBER",
      status: "ACTIVE",
      emailVerified: new Date(),
      activatedAt: new Date(),
      profileImageUrl: null,
    },
  });

  const tm4 = await prisma.user.create({
    data: {
      fullName: "Sophia Brown",
      email: "team4@demo.com",
      password: tmPassword,
      role: "TEAM_MEMBER",
      status: "ACTIVE",
      emailVerified: new Date(),
      activatedAt: new Date(),
      profileImageUrl: null,
    },
  });
  console.log("✅ Team members created:", tm1.email, tm2.email, tm3.email, tm4.email);

  // Create Teams
  console.log("👥 Creating teams...");
  const devTeam = await prisma.team.create({
    data: {
      name: "Development Team",
      members: {
        connect: [{ id: tm1.id }, { id: tm2.id }],
      },
    },
  });

  const designTeam = await prisma.team.create({
    data: {
      name: "Design Team",
      members: {
        connect: [{ id: tm3.id }, { id: tm4.id }],
      },
    },
  });
  console.log("✅ Teams created:", devTeam.name, designTeam.name);

  // Create Labels
  console.log("🏷️  Creating labels...");
  const bugLabel = await prisma.label.create({
    data: { name: "Bug", color: "#ef4444" },
  });
  const featureLabel = await prisma.label.create({
    data: { name: "Feature", color: "#3b82f6" },
  });
  const urgentLabel = await prisma.label.create({
    data: { name: "Urgent", color: "#f59e0b" },
  });
  const documentationLabel = await prisma.label.create({
    data: { name: "Documentation", color: "#10b981" },
  });
  console.log("✅ Labels created");

  // Create Project 1: Ministry Digital Portal
  console.log("📁 Creating projects...");
  const project1 = await prisma.project.create({
    data: {
      name: "Ministry Digital Portal",
      description:
        "A comprehensive digital portal for the Ethiopian Ministry of Innovation and Technology. This portal will serve as the central hub for all ministry operations, including project management, document sharing, and inter-departmental communication.",
      status: "ACTIVE",
      holderId: pm1.id,
      budget: "850000",
      dueDate: new Date("2024-12-31"),
      teams: {
        connect: [{ id: devTeam.id }],
      },
    },
  });

  // Create Project 2: E-Government Platform
  const project2 = await prisma.project.create({
    data: {
      name: "E-Government Platform",
      description:
        "Development of a unified e-government platform to streamline citizen services and improve government efficiency. The platform will integrate multiple government services into a single, user-friendly interface.",
      status: "IN_PROGRESS",
      holderId: pm2.id,
      budget: "1200000",
      dueDate: new Date("2025-06-30"),
      teams: {
        connect: [{ id: devTeam.id }, { id: designTeam.id }],
      },
    },
  });

  // Create Project 3: Smart City Initiative
  const project3 = await prisma.project.create({
    data: {
      name: "Smart City Initiative - Addis Ababa",
      description:
        "Implementation of smart city technologies in Addis Ababa, including IoT sensors, traffic management systems, and public service optimization. This project aims to improve urban living through technology integration.",
      status: "PLANNED",
      holderId: pm1.id,
      budget: "2500000",
      dueDate: new Date("2025-12-31"),
      teams: {
        connect: [{ id: designTeam.id }],
      },
    },
  });
  console.log("✅ Projects created:", project1.name, project2.name, project3.name);

  // Create Budgets for Project 1
  console.log("💰 Creating budgets...");
  await prisma.budget.createMany({
    data: [
      {
        projectId: project1.id,
        department: "Development",
        date: new Date("2024-01-01"),
        status: "Approved",
        allocation: 300000,
        expenses: 245000,
      },
      {
        projectId: project1.id,
        department: "Design",
        date: new Date("2024-01-01"),
        status: "Approved",
        allocation: 150000,
        expenses: 120000,
      },
      {
        projectId: project1.id,
        department: "Testing",
        date: new Date("2024-02-01"),
        status: "Approved",
        allocation: 100000,
        expenses: 75000,
      },
      {
        projectId: project2.id,
        department: "Development",
        date: new Date("2024-01-01"),
        status: "Approved",
        allocation: 500000,
        expenses: 320000,
      },
      {
        projectId: project2.id,
        department: "Infrastructure",
        date: new Date("2024-02-01"),
        status: "Pending",
        allocation: 400000,
        expenses: 0,
      },
    ],
  });
  console.log("✅ Budgets created");

  // Create Tasks for Project 1
  console.log("📋 Creating tasks...");
  const task1 = await prisma.task.create({
    data: {
      title: "Design Database Schema",
      description:
        "Create a comprehensive database schema for the ministry portal, including user management, project tracking, and document storage systems.",
      status: "COMPLETED",
      priority: "HIGH",
      projectId: project1.id,
      assignedToId: tm1.id,
      deadline: new Date("2024-02-15"),
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: "Implement User Authentication",
      description:
        "Build a secure authentication system with JWT tokens, role-based access control, and email verification. Support for multi-factor authentication should be considered.",
      status: "COMPLETED",
      priority: "HIGH",
      projectId: project1.id,
      assignedToId: tm1.id,
      deadline: new Date("2024-03-01"),
      labels: {
        connect: [{ id: featureLabel.id }],
      },
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: "Create Dashboard UI",
      description:
        "Design and implement the main dashboard interface with analytics widgets, project overview cards, and quick action buttons. Should be responsive and accessible.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      projectId: project1.id,
      assignedToId: tm2.id,
      deadline: new Date("2024-04-15"),
      labels: {
        connect: [{ id: featureLabel.id }],
      },
    },
  });

  const task4 = await prisma.task.create({
    data: {
      title: "Implement Project Management Module",
      description:
        "Build the core project management functionality including project creation, task assignment, progress tracking, and milestone management.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      projectId: project1.id,
      assignedToId: tm1.id,
      deadline: new Date("2024-04-30"),
      labels: {
        connect: [{ id: featureLabel.id }],
      },
    },
  });

  const task5 = await prisma.task.create({
    data: {
      title: "Fix Login Page Redirect Issue",
      description:
        "Users are experiencing issues with redirect after login. The page sometimes redirects to 404 instead of the dashboard. Need to investigate and fix the routing logic.",
      status: "TODO",
      priority: "URGENT",
      projectId: project1.id,
      assignedToId: tm2.id,
      deadline: new Date("2024-03-25"),
      labels: {
        connect: [{ id: bugLabel.id }, { id: urgentLabel.id }],
      },
    },
  });

  const task6 = await prisma.task.create({
    data: {
      title: "Write API Documentation",
      description:
        "Create comprehensive API documentation for all endpoints including authentication, projects, tasks, and user management. Include request/response examples and error codes.",
      status: "TODO",
      priority: "MEDIUM",
      projectId: project1.id,
      assignedToId: tm2.id,
      deadline: new Date("2024-05-15"),
      labels: {
        connect: [{ id: documentationLabel.id }],
      },
    },
  });

  // Create Tasks for Project 2
  const task7 = await prisma.task.create({
    data: {
      title: "Research E-Government Best Practices",
      description:
        "Conduct research on international e-government platforms and identify best practices that can be applied to the Ethiopian context.",
      status: "COMPLETED",
      priority: "MEDIUM",
      projectId: project2.id,
      assignedToId: tm3.id,
      deadline: new Date("2024-02-01"),
    },
  });

  const task8 = await prisma.task.create({
    data: {
      title: "Design Citizen Portal Interface",
      description:
        "Create user-friendly interface designs for the citizen-facing portal. Focus on accessibility, multilingual support, and mobile responsiveness.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      projectId: project2.id,
      assignedToId: tm3.id,
      deadline: new Date("2024-04-01"),
      labels: {
        connect: [{ id: featureLabel.id }],
      },
    },
  });

  const task9 = await prisma.task.create({
    data: {
      title: "Integrate Payment Gateway",
      description:
        "Integrate secure payment gateway for government service fees. Support multiple payment methods including mobile money and bank transfers.",
      status: "TODO",
      priority: "HIGH",
      projectId: project2.id,
      assignedToId: tm4.id,
      deadline: new Date("2024-05-01"),
      labels: {
        connect: [{ id: featureLabel.id }],
      },
    },
  });

  const task10 = await prisma.task.create({
    data: {
      title: "Implement Service Request Tracking",
      description:
        "Build a system for citizens to submit and track government service requests. Include status updates, notifications, and feedback mechanisms.",
      status: "TODO",
      priority: "MEDIUM",
      projectId: project2.id,
      assignedToId: tm1.id,
      deadline: new Date("2024-05-15"),
      labels: {
        connect: [{ id: featureLabel.id }],
      },
    },
  });

  // Create Tasks for Project 3
  const task11 = await prisma.task.create({
    data: {
      title: "Conduct Feasibility Study",
      description:
        "Perform comprehensive feasibility study for smart city implementation in Addis Ababa. Assess infrastructure requirements, costs, and potential challenges.",
      status: "TODO",
      priority: "HIGH",
      projectId: project3.id,
      assignedToId: tm3.id,
      deadline: new Date("2024-06-01"),
    },
  });

  const task12 = await prisma.task.create({
    data: {
      title: "Design IoT Sensor Network",
      description:
        "Plan the deployment of IoT sensors across the city for traffic monitoring, air quality measurement, and public safety enhancement.",
      status: "TODO",
      priority: "MEDIUM",
      projectId: project3.id,
      assignedToId: tm4.id,
      deadline: new Date("2024-07-01"),
      labels: {
        connect: [{ id: featureLabel.id }],
      },
    },
  });
  console.log("✅ Tasks created");

  // Create Comments
  console.log("💬 Creating comments...");
  await prisma.comment.createMany({
    data: [
      {
        content:
          "Great work on the database schema! The relationships are well-structured and normalized.",
        taskId: task1.id,
        authorId: pm1.id,
      },
      {
        content:
          "I've completed the initial implementation. Ready for code review.",
        taskId: task2.id,
        authorId: tm1.id,
      },
      {
        content:
          "The authentication flow looks solid. Let's add rate limiting to prevent brute force attacks.",
        taskId: task2.id,
        authorId: pm1.id,
      },
      {
        content:
          "Working on the responsive design. Should have the mobile version ready by end of week.",
        taskId: task3.id,
        authorId: tm2.id,
      },
      {
        content:
          "This is blocking the release. Let's prioritize this fix.",
        taskId: task5.id,
        authorId: pm1.id,
      },
      {
        content:
          "I've identified the issue - it's related to the middleware chain. Working on a fix.",
        taskId: task5.id,
        authorId: tm2.id,
      },
    ],
  });
  console.log("✅ Comments created");

  // Create Notifications
  console.log("🔔 Creating notifications...");
  await prisma.notification.createMany({
    data: [
      {
        type: "TASK_ASSIGNED",
        message: `You have been assigned to task: ${task3.title}`,
        userId: tm2.id,
        projectId: project1.id,
        isRead: false,
      },
      {
        type: "TASK_ASSIGNED",
        message: `You have been assigned to task: ${task5.title}`,
        userId: tm2.id,
        projectId: project1.id,
        isRead: false,
      },
      {
        type: "TASK_STATUS_CHANGED",
        message: `Task "${task2.title}" status changed to COMPLETED`,
        userId: pm1.id,
        projectId: project1.id,
        isRead: true,
      },
      {
        type: "PROJECT_STATUS_CHANGED",
        message: `Project "${project2.name}" status changed to IN_PROGRESS`,
        userId: pm2.id,
        projectId: project2.id,
        isRead: true,
      },
      {
        type: "TASK_ASSIGNED",
        message: `You have been assigned to task: ${task8.title}`,
        userId: tm3.id,
        projectId: project2.id,
        isRead: false,
      },
    ],
  });
  console.log("✅ Notifications created");

  // Create Messages
  console.log("💌 Creating messages...");
  await prisma.message.createMany({
    data: [
      {
        content:
          "Hi Sarah, can you review the authentication implementation when you get a chance?",
        senderId: tm1.id,
        recipientId: pm1.id,
      },
      {
        content:
          "Sure! I'll take a look this afternoon and provide feedback.",
        senderId: pm1.id,
        recipientId: tm1.id,
      },
      {
        content:
          "The dashboard design looks great! A few minor suggestions on the color scheme.",
        senderId: pm1.id,
        recipientId: tm2.id,
      },
      {
        content:
          "Thanks! I'll incorporate your feedback and send an updated version.",
        senderId: tm2.id,
        recipientId: pm1.id,
      },
      {
        content:
          "Michael, we need to discuss the timeline for the payment gateway integration.",
        senderId: admin.id,
        recipientId: pm2.id,
      },
    ],
  });
  console.log("✅ Messages created");

  // Summary
  console.log("\n🎉 Database seeding completed successfully!");
  console.log("\n📊 Summary:");
  console.log("  - Users: 7 (1 Admin, 2 Project Managers, 4 Team Members)");
  console.log("  - Teams: 2");
  console.log("  - Projects: 3");
  console.log("  - Tasks: 12");
  console.log("  - Labels: 4");
  console.log("  - Budgets: 5");
  console.log("  - Comments: 6");
  console.log("  - Notifications: 5");
  console.log("  - Messages: 5");
  console.log("\n🔐 Demo Credentials:");
  console.log("  Admin:");
  console.log("    Email: admin@demo.com");
  console.log("    Password: Admin@123");
  console.log("\n  Project Manager:");
  console.log("    Email: pm@demo.com");
  console.log("    Password: PM@123");
  console.log("\n  Team Member:");
  console.log("    Email: team@demo.com");
  console.log("    Password: Team@123");
  console.log("\n💡 Additional accounts available:");
  console.log("  - pm2@demo.com (Project Manager)");
  console.log("  - team2@demo.com, team3@demo.com, team4@demo.com (Team Members)");
  console.log("  All use the same password pattern: Role@123");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

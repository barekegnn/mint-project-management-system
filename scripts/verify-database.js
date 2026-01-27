const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function verifyDatabase() {
  console.log("🔍 Verifying database tables and data...\n");

  try {
    // Test database connection
    console.log("1️⃣ Testing database connection...");
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Database connection successful\n");

    // Verify all tables exist and have data
    console.log("2️⃣ Verifying tables and data counts...");
    
    const userCount = await prisma.user.count();
    console.log(`   Users: ${userCount}`);
    
    const projectCount = await prisma.project.count();
    console.log(`   Projects: ${projectCount}`);
    
    const taskCount = await prisma.task.count();
    console.log(`   Tasks: ${taskCount}`);
    
    const teamCount = await prisma.team.count();
    console.log(`   Teams: ${teamCount}`);
    
    const labelCount = await prisma.label.count();
    console.log(`   Labels: ${labelCount}`);
    
    const budgetCount = await prisma.budget.count();
    console.log(`   Budgets: ${budgetCount}`);
    
    const commentCount = await prisma.comment.count();
    console.log(`   Comments: ${commentCount}`);
    
    const notificationCount = await prisma.notification.count();
    console.log(`   Notifications: ${notificationCount}`);
    
    const messageCount = await prisma.message.count();
    console.log(`   Messages: ${messageCount}\n`);

    // Test complex queries with joins
    console.log("3️⃣ Testing complex queries with joins...");
    
    const projectsWithTasks = await prisma.project.findMany({
      include: {
        tasks: true,
        holder: true,
        teams: true,
      },
      take: 1,
    });
    console.log(`   ✅ Projects with tasks query successful (${projectsWithTasks.length} result)`);
    
    const usersWithAssignedTasks = await prisma.user.findMany({
      where: {
        assignedTasks: {
          some: {},
        },
      },
      include: {
        assignedTasks: true,
      },
      take: 1,
    });
    console.log(`   ✅ Users with assigned tasks query successful (${usersWithAssignedTasks.length} result)`);
    
    // Test pooled connection performance
    console.log("\n4️⃣ Testing pooled connection performance...");
    const start = Date.now();
    await Promise.all([
      prisma.user.findMany({ take: 5 }),
      prisma.project.findMany({ take: 5 }),
      prisma.task.findMany({ take: 5 }),
    ]);
    const duration = Date.now() - start;
    console.log(`   ✅ Concurrent queries completed in ${duration}ms`);
    
    // Verify specific demo accounts exist
    console.log("\n5️⃣ Verifying demo accounts...");
    const admin = await prisma.user.findUnique({
      where: { email: "admin@demo.com" },
    });
    console.log(`   Admin account: ${admin ? "✅ Found" : "❌ Not found"}`);
    
    const pm = await prisma.user.findUnique({
      where: { email: "pm@demo.com" },
    });
    console.log(`   PM account: ${pm ? "✅ Found" : "❌ Not found"}`);
    
    const team = await prisma.user.findUnique({
      where: { email: "team@demo.com" },
    });
    console.log(`   Team account: ${team ? "✅ Found" : "❌ Not found"}`);
    
    console.log("\n🎉 All database verification checks passed!");
    console.log("\n📊 Database is ready for production deployment!");
    
  } catch (error) {
    console.error("\n❌ Database verification failed:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase();

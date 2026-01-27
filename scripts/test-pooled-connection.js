const { PrismaClient } = require("@prisma/client");

// Test with pooled connection (from DATABASE_URL)
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testPooledConnection() {
  console.log("🔗 Testing Neon Pooled Connection (PgBouncer)...\n");
  console.log("📍 Connection URL:", process.env.DATABASE_URL?.split('@')[1]?.split('?')[0] || 'hidden');
  console.log("🔧 Using PgBouncer:", process.env.DATABASE_URL?.includes('pgbouncer=true') ? 'Yes' : 'No');
  console.log("🔧 Connection limit:", process.env.DATABASE_URL?.includes('connection_limit=1') ? '1' : 'default');
  console.log("");

  try {
    // Test 1: Simple query
    console.log("1️⃣ Test: Simple SELECT query");
    const start1 = Date.now();
    const result = await prisma.$queryRaw`SELECT current_database(), version()`;
    const duration1 = Date.now() - start1;
    console.log(`   ✅ Query successful (${duration1}ms)`);
    console.log(`   Database: ${result[0].current_database}`);
    console.log("");

    // Test 2: Sequential queries (realistic for serverless with connection_limit=1)
    console.log("2️⃣ Test: Sequential queries (serverless pattern)");
    const start2 = Date.now();
    for (let i = 0; i < 5; i++) {
      await prisma.user.count();
      await prisma.project.count();
      await prisma.task.count();
    }
    const duration2 = Date.now() - start2;
    console.log(`   ✅ 15 sequential queries completed (${duration2}ms)`);
    console.log(`   Average: ${(duration2 / 15).toFixed(2)}ms per query`);
    console.log("");

    // Test 3: Complex query with joins
    console.log("3️⃣ Test: Complex query with multiple joins");
    const start3 = Date.now();
    const projects = await prisma.project.findMany({
      include: {
        tasks: {
          include: {
            assignedTo: true,
            comments: {
              include: {
                author: true,
              },
            },
          },
        },
        holder: true,
        teams: {
          include: {
            members: true,
          },
        },
      },
    });
    const duration3 = Date.now() - start3;
    console.log(`   ✅ Complex query successful (${duration3}ms)`);
    console.log(`   Projects loaded: ${projects.length}`);
    console.log(`   Total tasks: ${projects.reduce((sum, p) => sum + p.tasks.length, 0)}`);
    console.log("");

    // Test 4: Transaction test
    console.log("4️⃣ Test: Transaction support");
    const start4 = Date.now();
    await prisma.$transaction(async (tx) => {
      const users = await tx.user.findMany({ take: 1 });
      const projects = await tx.project.findMany({ take: 1 });
      const tasks = await tx.task.findMany({ take: 1 });
      return { users, projects, tasks };
    });
    const duration4 = Date.now() - start4;
    console.log(`   ✅ Transaction completed (${duration4}ms)`);
    console.log("");

    // Test 5: Write operation
    console.log("5️⃣ Test: Write operation (INSERT)");
    const start5 = Date.now();
    const testLabel = await prisma.label.create({
      data: {
        name: "Test Label",
        color: "#000000",
      },
    });
    await prisma.label.delete({
      where: { id: testLabel.id },
    });
    const duration5 = Date.now() - start5;
    console.log(`   ✅ Write operation successful (${duration5}ms)`);
    console.log("");

    // Test 6: Moderate concurrent queries (realistic serverless load)
    console.log("6️⃣ Test: Moderate concurrent queries (3 at a time)");
    const start6 = Date.now();
    for (let i = 0; i < 5; i++) {
      await Promise.all([
        prisma.user.findMany({ take: 1 }),
        prisma.project.findMany({ take: 1 }),
        prisma.task.findMany({ take: 1 }),
      ]);
    }
    const duration6 = Date.now() - start6;
    console.log(`   ✅ 15 queries in batches of 3 completed (${duration6}ms)`);
    console.log(`   Average: ${(duration6 / 15).toFixed(2)}ms per query`);
    console.log("");

    // Summary
    console.log("📊 Performance Summary:");
    console.log(`   Simple query: ${duration1}ms`);
    console.log(`   15 sequential queries: ${duration2}ms (avg: ${(duration2 / 15).toFixed(2)}ms)`);
    console.log(`   Complex join query: ${duration3}ms`);
    console.log(`   Transaction: ${duration4}ms`);
    console.log(`   Write operation: ${duration5}ms`);
    console.log(`   15 batched queries: ${duration6}ms (avg: ${(duration6 / 15).toFixed(2)}ms)`);
    console.log("");

    console.log("🎉 All pooled connection tests passed!");
    console.log("✅ Database is ready for serverless deployment on Vercel!");

  } catch (error) {
    console.error("\n❌ Pooled connection test failed:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testPooledConnection();

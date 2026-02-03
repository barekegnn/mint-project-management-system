// Seed production database
// Run with: node scripts/seed-production.js

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

// Use production database URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log("🌱 Starting production database seed...");
  console.log("📍 Database URL:", process.env.DATABASE_URL?.substring(0, 50) + "...");

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@demo.com" },
  });

  if (existingAdmin) {
    console.log("✅ Demo users already exist. Skipping seed.");
    console.log("\n🔐 Demo Credentials:");
    console.log("  Admin: admin@demo.com / Admin@123");
    console.log("  PM: pm@demo.com / PM@123");
    console.log("  Team: team@demo.com / Team@123");
    return;
  }

  console.log("👤 Creating demo users...");

  // Create Admin User
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

  // Create Project Manager
  const pmPassword = await bcrypt.hash("PM@123", 10);
  const pm = await prisma.user.create({
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
  console.log("✅ Project Manager created:", pm.email);

  // Create Team Member
  const tmPassword = await bcrypt.hash("Team@123", 10);
  const tm = await prisma.user.create({
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
  console.log("✅ Team Member created:", tm.email);

  console.log("\n🎉 Production database seeded successfully!");
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
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

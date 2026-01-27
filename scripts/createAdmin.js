const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = "barekegna@gmail.com";
  const password = "bare1234";
  const fullName = "Barekegn Asefa";
  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: {
      fullName: fullName,
      password: hashedPassword,
      role: "ADMIN",
    },
    create: {
      email,
      fullName: fullName,
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("✅ Admin user created or updated in local DB");
  console.log("Email:", email);
  console.log("Password:", password);
  console.log("Full Name:", fullName);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());

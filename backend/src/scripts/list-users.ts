import { prisma } from "../config/prisma";

async function main() {
  console.log("\n=== Listing All Users ===\n");

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (users.length === 0) {
    console.log("No users found in the database.");
    return;
  }

  console.log(`Total Users: ${users.length}\n`);
  console.log("=".repeat(80));
  
  // Find super admins
  const superAdmins = users.filter((u) => u.role === "SUPER_ADMIN");
  
  if (superAdmins.length > 0) {
    console.log("\n🔑 SUPER ADMIN(S):");
    console.log("-".repeat(40));
    superAdmins.forEach((user) => {
      console.log(`  Name:     ${user.name}`);
      console.log(`  Email:    ${user.email}`);
      console.log(`  Status:  ${user.status}`);
      console.log(`  Created: ${user.createdAt.toISOString()}`);
      console.log("");
    });
  }

  console.log("\n📋 ALL USERS:");
  console.log("-".repeat(40));
  users.forEach((user, index) => {
    const roleLabel = user.role === "SUPER_ADMIN" ? "🔑 SUPER_ADMIN" : "👤 USER";
    console.log(`${index + 1}. ${roleLabel}`);
    console.log(`   Name:     ${user.name}`);
    console.log(`   Email:    ${user.email}`);
    console.log(`   Status:   ${user.status}`);
    console.log(`   Created:  ${user.createdAt.toISOString()}`);
    console.log("");
  });

  console.log("=".repeat(80));
  console.log("\n⚠️  SECURITY NOTE:");
  console.log("  Passwords are stored as bcrypt hashes and cannot be retrieved in plain text.");
  console.log("  This is a security feature to protect user credentials.\n");
}

main()
  .catch((error) => {
    console.error("Error:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

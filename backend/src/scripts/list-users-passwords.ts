import { prisma } from "../config/prisma";

async function main() {
  console.log("\n=== Listing All Users with Password Info ===\n");

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      passwordHash: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (users.length === 0) {
    console.log("No users found in the database.");
    return;
  }

  console.log("Total Users: " + users.length + "\n");
  console.log("============================================================");

  // Show super admins
  const superAdmins = users.filter((u) => u.role === "SUPER_ADMIN");

  if (superAdmins.length > 0) {
    console.log("\nSUPER ADMIN(S):");
    console.log("----------------------------------------");
    superAdmins.forEach((user) => {
      console.log("  Name:        " + user.name);
      console.log("  Email:       " + user.email);
      console.log("  Status:      " + user.status);
      console.log("  Created:     " + user.createdAt.toISOString());
      console.log("  Password:    " + user.passwordHash);
      console.log("");
    });
  }

  console.log("\nALL USERS:");
  console.log("----------------------------------------");
  users.forEach((user, index) => {
    const roleLabel = user.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "USER";
    console.log((index + 1) + ". " + roleLabel);
    console.log("   Name:        " + user.name);
    console.log("   Email:       " + user.email);
    console.log("   Status:      " + user.status);
    console.log("   Created:     " + user.createdAt.toISOString());
    console.log("   Password:   " + user.passwordHash);
    console.log("");
  });

  console.log("============================================================");
  console.log("\nIMPORTANT - About Passwords:");
  console.log("  Passwords are stored as bcrypt hashes (e.g., $2b$12$...)");
  console.log("  bcrypt is a one-way hash function - CANNOT be reversed");
  console.log("  The passwordHash field shows the bcrypt hash, NOT the actual password");
  console.log("\n  To reset a user's password, use reset-super-admin-password.ts");
  console.log("  or create a similar script with the new password.\n");
}

main()
  .catch((error) => {
    console.error("Error:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

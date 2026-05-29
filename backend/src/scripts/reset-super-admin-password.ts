import bcrypt from "bcrypt";
import { prisma } from "../config/prisma";

async function main() {
  const newPassword = process.env.SUPER_ADMIN_PASSWORD;

  if (!newPassword) {
    console.error("SUPER_ADMIN_PASSWORD is required.");
    process.exitCode = 1;
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  // Find super admin user
  const superAdmin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
  });

  if (!superAdmin) {
    console.error("No super admin user found.");
    process.exitCode = 1;
    return;
  }

  await prisma.user.update({
    where: { id: superAdmin.id },
    data: {
      passwordHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
      status: "ACTIVE",
      emailVerifiedAt: superAdmin.emailVerifiedAt ?? new Date(),
    },
  });

  console.log("Super admin password updated successfully.");
  console.log(`   Email: ${superAdmin.email}`);
}

main()
  .catch((error) => {
    console.error("Error:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_USERS = [
  {
    email: "creator@demo.rory.dev",
    username: "demo_creator",
    displayName: "Demo Creator",
    userType: "CREATOR" as const,
  },
  {
    email: "supporter@demo.rory.dev",
    username: "demo_supporter",
    displayName: "Demo Supporter",
    userType: "SUPPORTER" as const,
  },
  {
    email: "mod@demo.rory.dev",
    username: "demo_mod",
    displayName: "Demo Mod",
    userType: "MODERATOR" as const,
  },
];

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function main() {
  const password = "Rory2026!";

  for (const demo of DEMO_USERS) {
    const existing = await prisma.user.findUnique({ where: { email: demo.email } });
    if (existing) {
      console.log(`Skipping existing: ${demo.email}`);
      continue;
    }

    const userId = `seed_${demo.username}`;
    const passwordHash = await hashPassword(password);

    await prisma.user.create({
      data: {
        id: userId,
        email: demo.email,
        name: demo.displayName,
        emailVerified: true,
        username: demo.username,
        displayName: demo.displayName,
        userType: demo.userType,
        isProfileComplete: true,
        accounts: {
          create: {
            id: `acc_${demo.username}`,
            accountId: demo.email,
            providerId: "credential",
            password: passwordHash,
          },
        },
      },
    });

    console.log(`Created: ${demo.email}`);
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

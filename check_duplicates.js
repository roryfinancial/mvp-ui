import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const duplicates = await prisma.$queryRaw`
    SELECT "accountId", "providerId", COUNT(*) as count
    FROM accounts
    GROUP BY "accountId", "providerId"
    HAVING COUNT(*) > 1
  `;
  
  console.log("Duplicate [accountId, providerId] combinations:");
  if (duplicates.length === 0) {
    console.log("No duplicates found. Safe to proceed with unique constraint.");
  } else {
    console.log(JSON.stringify(duplicates, null, 2));
  }
  
  await prisma.$disconnect();
}

main();

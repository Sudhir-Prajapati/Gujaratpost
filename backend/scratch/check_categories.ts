import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, slug: true, nameGu: true, nameHi: true }
  });
  console.log("Categories:", JSON.stringify(categories, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const p = await prisma.post.findUnique({
    where: { articleNumber: 33998 },
    include: { category: true, author: true }
  });
  console.log(JSON.stringify(p, null, 2));

  // Also check category mapping
  // Old categories were IDs like 1, 2, 3, 4, 17, 18, 19, 22, 23, 25, 26, 27
  // Let's see all categories in DB:
  const categories = await prisma.category.findMany();
  console.log('Categories count:', categories.length);
  console.log('Categories sample:', categories.slice(0, 10).map(c => ({ id: c.id, slug: c.slug, name: c.name, nameGu: c.nameGu })));

  await prisma.$disconnect();
}

run().catch(console.error);

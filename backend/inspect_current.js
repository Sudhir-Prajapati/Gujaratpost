const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const tables = await prisma.$queryRawUnsafe('SHOW TABLES');
  console.log('Current database tables:', tables);
  const postsCount = await prisma.post.count();
  const videosCount = await prisma.video.count();
  const categoriesCount = await prisma.category.count();
  console.log({ postsCount, videosCount, categoriesCount });
}

run().catch(console.error).finally(() => prisma.$disconnect());

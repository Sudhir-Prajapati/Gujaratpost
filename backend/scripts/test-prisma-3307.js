const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    await prisma.$connect();
    console.log('Prisma successfully connected to 3307/gujaratpost!');
    const users = await prisma.user.count();
    console.log('Users count:', users);
    const posts = await prisma.post.count();
    console.log('Posts count:', posts);
    await prisma.$disconnect();
  } catch (e) {
    console.error('Prisma connection error:', e.message);
  }
}

test();

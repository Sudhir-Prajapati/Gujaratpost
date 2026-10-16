const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const res = await prisma.$queryRawUnsafe('SELECT * FROM about_settings LIMIT 1');
    console.log('Query raw result:', res);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}
test();

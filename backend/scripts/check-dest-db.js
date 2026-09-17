const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDest() {
  console.log('Connecting to destination Aiven cloud database...');
  const postCount = await prisma.post.count();
  const catCount = await prisma.category.count();
  const authorCount = await prisma.author.count();
  const videoCount = await prisma.video.count();
  const galleryCount = await prisma.galleryPhoto.count();
  const userCount = await prisma.user.count();

  console.log('--- DESTINATION DATABASE STATS ---');
  console.log(`Posts: ${postCount}`);
  console.log(`Categories: ${catCount}`);
  console.log(`Authors: ${authorCount}`);
  console.log(`Videos: ${videoCount}`);
  console.log(`Gallery Photos: ${galleryCount}`);
  console.log(`Users: ${userCount}`);

  if (authorCount > 0) {
    const authors = await prisma.author.findMany({ take: 3 });
    console.log('Sample Authors:', authors.map(a => ({ id: a.id, name: a.nameGu || a.name })));
  }

  await prisma.$disconnect();
}

checkDest().catch(err => {
  console.error('Destination check error:', err.message);
});

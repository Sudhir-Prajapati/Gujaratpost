const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const maxArt = await prisma.post.aggregate({ _max: { articleNumber: true } });
  console.log('Max articleNumber in destination:', maxArt._max.articleNumber);
  
  const withArtNum = await prisma.post.count({ where: { articleNumber: { not: null } } });
  console.log('Posts with articleNumber:', withArtNum);

  const sample = await prisma.post.findMany({ 
    select: { id: true, articleNumber: true, slug: true }, 
    take: 5 
  });
  console.log('Sample destination posts:', sample);

  // Check if any articleNumber in destination conflicts with old news
  const artNumbers = await prisma.post.findMany({
    where: { articleNumber: { not: null } },
    select: { articleNumber: true, slug: true }
  });
  console.log(`Loaded ${artNumbers.length} existing articleNumbers from destination.`);

  await prisma.$disconnect();
}

check().catch(console.error);

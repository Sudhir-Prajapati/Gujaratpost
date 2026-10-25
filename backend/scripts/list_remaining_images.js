const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const remaining = await prisma.post.findMany({
    where: { featuredImage: { contains: 'gujaratpost.in' } },
    select: { id: true, articleNumber: true, featuredImage: true },
    orderBy: { articleNumber: 'asc' }
  });
  console.log('Total remaining:', remaining.length);
  remaining.forEach(p => {
    const filename = p.featuredImage.split('/').pop().split(',')[0].trim();
    console.log(JSON.stringify({ id: p.id, articleNumber: p.articleNumber, url: p.featuredImage, filename }));
  });
  await prisma.$disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });

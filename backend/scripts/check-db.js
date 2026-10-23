const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const readline = require('readline');
const path = require('path');

async function main() {
  console.log('--- Checking Current DB Posts ---');
  const count = await prisma.post.count();
  const minMax = await prisma.post.aggregate({
    _min: { articleNumber: true, createdAt: true },
    _max: { articleNumber: true, createdAt: true }
  });
  console.log('Current DB posts count:', count);
  console.log('articleNumber min/max:', minMax._min.articleNumber, minMax._max.articleNumber);
  console.log('createdAt min/max:', minMax._min.createdAt, minMax._max.createdAt);

  const sampleNew = await prisma.post.findFirst({
    where: { articleNumber: { not: null } },
    orderBy: { articleNumber: 'desc' },
    select: { id: true, articleNumber: true, slug: true, title: true, createdAt: true }
  });
  console.log('Max articleNumber post:', sampleNew);

  const sampleByDate = await prisma.post.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { id: true, articleNumber: true, slug: true, title: true, createdAt: true }
  });
  console.log('Latest post by date:', sampleByDate);

  const withoutArticleNumber = await prisma.post.count({
    where: { articleNumber: null }
  });
  console.log('Posts without articleNumber:', withoutArticleNumber);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

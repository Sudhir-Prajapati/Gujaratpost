const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function checkExistingTitles() {
  const missing = JSON.parse(fs.readFileSync('new_articles_diff.json', 'utf8'));
  console.log(`Checking ${missing.length} articles against current DB...`);

  for (const item of missing) {
    const byArticleNumber = await prisma.post.findUnique({
      where: { articleNumber: item.newsId }
    });

    const bySlug = await prisma.post.findFirst({
      where: {
        OR: [
          { slug: item.newsSlug },
          { slug: { contains: String(item.newsId) } }
        ]
      }
    });

    const byTitle = await prisma.post.findFirst({
      where: {
        OR: [
          { title: { contains: item.newsTitle.substring(0, 30) } },
          { titleGu: { contains: item.newsTitle.substring(0, 30) } }
        ]
      }
    });

    console.log(`\n--- Article ${item.newsId} ---`);
    console.log(`Title: ${item.newsTitle.substring(0, 50)}...`);
    console.log(`Exists by articleNumber? ${!!byArticleNumber}`);
    console.log(`Exists by slug? ${!!bySlug} (found: ${bySlug?.slug || 'none'})`);
    console.log(`Exists by title? ${!!byTitle} (found: ${byTitle?.title?.substring(0, 40) || 'none'})`);
  }

  await prisma.$disconnect();
}

checkExistingTitles().catch(console.error);

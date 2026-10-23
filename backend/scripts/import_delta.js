const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function importDelta() {
  const postsToInsert = JSON.parse(fs.readFileSync('new_posts_to_insert.json', 'utf8'));
  console.log(`Ready to import ${postsToInsert.length} new posts into database...`);

  let insertedCount = 0;
  for (const post of postsToInsert) {
    const existing = await prisma.post.findFirst({
      where: {
        OR: [
          { articleNumber: post.articleNumber },
          { slug: post.slug }
        ]
      }
    });

    if (existing) {
      console.log(`Skipping article ${post.articleNumber} (${post.slug}) - already exists with ID ${existing.id}`);
      continue;
    }

    await prisma.post.create({
      data: {
        id: post.id,
        slug: post.slug,
        articleNumber: post.articleNumber,
        language: post.language,
        title: post.title,
        titleGu: post.titleGu,
        titleHi: post.titleHi,
        excerpt: post.excerpt,
        excerptGu: post.excerptGu,
        excerptHi: post.excerptHi,
        content: post.content,
        contentGu: post.contentGu,
        contentHi: post.contentHi,
        featuredImage: post.featuredImage,
        status: post.status,
        authorId: post.authorId,
        categoryId: post.categoryId,
        readingTime: post.readingTime,
        seoTitle: post.seoTitle,
        seoDescription: post.seoDescription,
        seoKeywords: post.seoKeywords,
        createdAt: new Date(post.createdAt),
        updatedAt: new Date(post.updatedAt)
      }
    });
    console.log(`✓ Inserted article #${post.articleNumber}: ${post.title.substring(0, 50)}...`);
    insertedCount++;
  }

  console.log(`\nImport finished! Inserted: ${insertedCount} new articles.`);
  await prisma.$disconnect();
}

importDelta().catch(console.error);

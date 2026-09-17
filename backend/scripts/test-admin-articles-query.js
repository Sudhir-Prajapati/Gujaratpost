const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function test() {
  console.log('Testing full admin articles query with projection...');
  const page = 1;
  const limit = 10;
  const skip = (page - 1) * limit;
  const where = {};

  try {
    const [articles, total] = await Promise.all([
      prisma.post.findMany({
        where,
        select: {
          id: true,
          slug: true,
          articleNumber: true,
          title: true,
          titleGu: true,
          titleHi: true,
          excerpt: true,
          excerptGu: true,
          excerptHi: true,
          featuredImage: true,
          status: true,
          scheduledAt: true,
          authorId: true,
          categoryId: true,
          location: true,
          readingTime: true,
          priority: true,
          isTrending: true,
          isBreaking: true,
          isFeatured: true,
          views: true,
          createdAt: true,
          updatedAt: true,
          language: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          author: {
            select: {
              id: true,
              name: true,
            },
          },
          tags: true,
        },
        orderBy: [
          { createdAt: 'desc' },
          { articleNumber: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.post.count({ where }),
    ]);

    console.log(`Success! Total: ${total}, Fetched: ${articles.length}`);
    console.log('Sample item:', articles[0].titleGu, 'Cat:', articles[0].category?.name);
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();

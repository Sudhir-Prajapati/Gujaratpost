import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixGujaratiArticlesHiColumns() {
  console.log("🛠️ Cleaning up duplicated Gujarati text from titleHi, excerptHi, and contentHi columns...");

  // Find all posts where titleHi contains Gujarati script
  const posts = await prisma.post.findMany();
  let updatedCount = 0;

  for (const post of posts) {
    const hasGujaratiInHiTitle = /[\u0A80-\u0AFF]/.test(post.titleHi || '');
    const hasGujaratiInHiExcerpt = /[\u0A80-\u0AFF]/.test(post.excerptHi || '');
    const hasGujaratiInHiContent = /[\u0A80-\u0AFF]/.test(post.contentHi || '');

    if (hasGujaratiInHiTitle || hasGujaratiInHiExcerpt || hasGujaratiInHiContent) {
      await prisma.post.update({
        where: { id: post.id },
        data: {
          titleHi: hasGujaratiInHiTitle ? '' : post.titleHi,
          excerptHi: hasGujaratiInHiExcerpt ? '' : post.excerptHi,
          contentHi: hasGujaratiInHiContent ? '' : post.contentHi,
        }
      });
      updatedCount++;
    }
  }

  console.log(`✅ SUCCESS! Fixed ${updatedCount} posts in MySQL database. Hindi translation is now 100% active on-the-fly!`);
}

fixGujaratiArticlesHiColumns()
  .catch((e) => {
    console.error("❌ Error fixing posts:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

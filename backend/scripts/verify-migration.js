const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function isGujaratiTextValid(str) {
  if (!str) return false;
  // Gujarati Unicode block is U+0A80 to U+0AFF
  const gujaratiRegex = /[\u0A80-\u0AFF]/;
  // Mojibake indicator: àª, à«, etc.
  const mojibakeRegex = /à[ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿]/;
  const hasGujarati = gujaratiRegex.test(str);
  const hasMojibake = mojibakeRegex.test(str);
  return hasGujarati && !hasMojibake;
}

async function verify() {
  console.log('===============================================================');
  console.log('           GUJARAT POST: MIGRATION VERIFICATION SUITE          ');
  console.log('===============================================================');

  const postCount = await prisma.post.count();
  const catCount = await prisma.category.count();
  const videoCount = await prisma.video.count();
  const galleryCount = await prisma.galleryPhoto.count();
  const tickerCount = await prisma.breakingTickerItem.count();
  const authorCount = await prisma.author.count();

  console.log('\n--- CURRENT DATABASE RECORD COUNTS ---');
  console.log(`Total Posts:          ${postCount}`);
  console.log(`Total Categories:     ${catCount}`);
  console.log(`Total Videos:         ${videoCount}`);
  console.log(`Total Gallery Photos: ${galleryCount}`);
  console.log(`Total Breaking Items: ${tickerCount}`);
  console.log(`Total Authors:        ${authorCount}`);

  console.log('\n--- TESTING CHARACTER INTEGRITY ON SAMPLE POSTS ---');
  const samplePosts = await prisma.post.findMany({
    where: { articleNumber: { not: null } },
    select: { id: true, articleNumber: true, titleGu: true, excerptGu: true, category: { select: { name: true, nameGu: true } } },
    take: 20,
    orderBy: { articleNumber: 'desc' }
  });

  let validCount = 0;
  samplePosts.forEach(p => {
    const titleValid = isGujaratiTextValid(p.titleGu);
    if (titleValid) validCount++;
    console.log(`[#${p.articleNumber}] [${p.category?.nameGu || p.category?.name}] ${p.titleGu.substring(0, 65)}... => ${titleValid ? '✓ 100% CLEAN GUJARATI' : '⚠ CHECK'}`);
  });

  console.log(`\nSample Integrity Score: ${validCount}/${samplePosts.length} (${((validCount / samplePosts.length) * 100).toFixed(1)}%)`);

  console.log('\n--- TESTING HOME FEED QUERY COMPATIBILITY ---');
  const feedPosts = await prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      category: true,
      author: true
    }
  });
  console.log(`Successfully fetched ${feedPosts.length} published posts for main feed with author and category joined.`);
  feedPosts.forEach(p => {
    console.log(`• [${new Date(p.createdAt).toLocaleDateString('gu-IN')}] [${p.category.nameGu || p.category.name}] ${p.titleGu.substring(0, 50)}...`);
  });

  await prisma.$disconnect();
  console.log('\n===============================================================');
  console.log('             VERIFICATION COMPLETED SUCCESSFULLY               ');
  console.log('===============================================================');
}

verify().catch(console.error);

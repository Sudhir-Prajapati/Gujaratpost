const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

async function generatePrismaSql() {
  const articles = JSON.parse(fs.readFileSync('new_articles_diff.json', 'utf8'));

  const categories = await prisma.category.findMany();
  const catBySlug = new Map(categories.map(c => [c.slug.toLowerCase().trim(), c.id]));

  const oldIdToSlug = {
    1: 'news',
    2: 'gujarat',
    3: 'international',
    4: 'national',
    5: 'breaking-news',
    15: 'business',
    17: 'politics',
    18: 'entertainment',
    19: 'popular-stories',
    22: 'gandhinagar',
    23: 'ahmedabad',
    24: 'surat',
    25: 'vadodara',
    26: 'rajkot',
    27: 'others',
    28: 'lifestyle',
    29: 'entertainment',
    30: 'fact-check'
  };

  const defaultAuthor = await prisma.author.findFirst({
    where: { name: 'Admin' }
  }) || await prisma.author.findFirst();

  const defaultCatId = catBySlug.get('gujarat') || catBySlug.get('news') || categories[0].id;

  function resolveCategoryId(rawCategories) {
    if (!rawCategories) return defaultCatId;
    const ids = rawCategories.split(',').map(s => parseInt(s.trim(), 10)).filter(Boolean);
    if (ids.length === 0) return defaultCatId;

    // City priority
    const cityId = ids.find(id => [22, 23, 24, 25, 26].includes(id));
    if (cityId && oldIdToSlug[cityId] && catBySlug.has(oldIdToSlug[cityId])) {
      return catBySlug.get(oldIdToSlug[cityId]);
    }

    // Topic priority
    const topicId = ids.find(id => [17, 18, 15, 28, 29, 30].includes(id));
    if (topicId && oldIdToSlug[topicId] && catBySlug.has(oldIdToSlug[topicId])) {
      return catBySlug.get(oldIdToSlug[topicId]);
    }

    // Regional / National
    const regId = ids.find(id => [2, 4, 3, 11].includes(id));
    if (regId && oldIdToSlug[regId] && catBySlug.has(oldIdToSlug[regId])) {
      return catBySlug.get(oldIdToSlug[regId]);
    }

    for (const id of ids) {
      if (oldIdToSlug[id] && catBySlug.has(oldIdToSlug[id])) {
        return catBySlug.get(oldIdToSlug[id]);
      }
    }
    return defaultCatId;
  }

  function formatSlug(rawSlug, articleNumber) {
    if (!rawSlug || !rawSlug.trim()) {
      return `gujarat-post-news-${articleNumber}`;
    }
    let s = rawSlug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!s.endsWith(`-${articleNumber}`)) {
      s += `-${articleNumber}`;
    }
    return s;
  }

  function formatFeaturedImage(rawImage) {
    if (!rawImage || !rawImage.trim()) {
      return 'https://gujaratpost.in/images/logo.jpg';
    }
    const img = rawImage.trim();
    if (img.startsWith('http://') || img.startsWith('https://')) {
      return img;
    }
    return `https://gujaratpost.in/news/${img}`;
  }

  function escapeSqlStr(str) {
    if (str === null || str === undefined) return 'NULL';
    return "'" + String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r') + "'";
  }

  const postRows = [];
  const postObjects = [];

  for (const a of articles) {
    const id = crypto.randomUUID();
    const slug = formatSlug(a.newsSlug, a.newsId);
    const articleNumber = a.newsId;
    const title = a.newsTitle;
    const titleGu = a.newsTitle;
    const titleHi = a.newsTitle;
    const excerpt = a.newsSummary || '';
    const excerptGu = a.newsSummary || '';
    const excerptHi = a.newsSummary || '';
    const content = a.newsContent || '';
    const contentGu = a.newsContent || '';
    const contentHi = a.newsContent || '';
    const featuredImage = formatFeaturedImage(a.newsImage);
    const status = 'PUBLISHED';
    const authorId = defaultAuthor.id;
    const categoryId = resolveCategoryId(a.newsCategory);
    const readingTime = Math.max(1, Math.ceil((content.replace(/<[^>]+>/g, '').split(/\s+/).length) / 150));
    const seoTitle = a.newsSeoTitle || a.newsTitle;
    const seoDescription = a.newsSeoDescription || a.newsSummary || '';
    const seoKeywords = a.newsSeoKeywords || '';
    const createdAt = a.newsCreatedDate && a.newsCreatedDate !== '0000-00-00 00:00:00' ? a.newsCreatedDate : new Date().toISOString();
    const updatedAt = a.newsModifyDate && a.newsModifyDate !== '0000-00-00 00:00:00' ? a.newsModifyDate : createdAt;

    postObjects.push({
      id,
      slug,
      articleNumber,
      language: 'gu',
      title,
      titleGu,
      titleHi,
      excerpt,
      excerptGu,
      excerptHi,
      content,
      contentGu,
      contentHi,
      featuredImage,
      status,
      authorId,
      categoryId,
      readingTime,
      seoTitle,
      seoDescription,
      seoKeywords,
      createdAt,
      updatedAt
    });

    const values = [
      escapeSqlStr(id),
      escapeSqlStr(slug),
      articleNumber,
      escapeSqlStr('gu'),
      escapeSqlStr(title),
      escapeSqlStr(titleGu),
      escapeSqlStr(titleHi),
      escapeSqlStr(excerpt),
      escapeSqlStr(excerptGu),
      escapeSqlStr(excerptHi),
      escapeSqlStr(content),
      escapeSqlStr(contentGu),
      escapeSqlStr(contentHi),
      escapeSqlStr(featuredImage),
      escapeSqlStr(status),
      'NULL', // scheduledAt
      escapeSqlStr(authorId),
      escapeSqlStr(categoryId),
      'NULL', // location
      readingTime,
      0, // priority
      0, // isTrending
      0, // isBreaking
      0, // isFeatured
      0, // views
      escapeSqlStr(seoTitle),
      escapeSqlStr(seoDescription),
      escapeSqlStr(seoKeywords),
      'NULL', // canonicalUrl
      'NULL', // metaRobots
      escapeSqlStr(createdAt),
      escapeSqlStr(updatedAt)
    ];

    postRows.push(`(${values.join(', ')})`);
  }

  const columns = [
    '`id`', '`slug`', '`articleNumber`', '`language`', '`title`', '`titleGu`', '`titleHi`',
    '`excerpt`', '`excerptGu`', '`excerptHi`', '`content`', '`contentGu`', '`contentHi`',
    '`featuredImage`', '`status`', '`scheduledAt`', '`authorId`', '`categoryId`', '`location`',
    '`readingTime`', '`priority`', '`isTrending`', '`isBreaking`', '`isFeatured`', '`views`',
    '`seoTitle`', '`seoDescription`', '`seoKeywords`', '`canonicalUrl`', '`metaRobots`',
    '`createdAt`', '`updatedAt`'
  ];

  let sql = '-- New records for current Prisma posts table\n';
  sql += `-- Generated from dump gujaratpost_newsgujrati_23OCT2026.sql.gz\n`;
  sql += `-- Articles: 33999 to 34005 (Total 7)\n\n`;
  sql += `INSERT INTO \`posts\` (${columns.join(', ')}) VALUES\n`;
  sql += postRows.join(',\n') + ';\n';

  fs.writeFileSync('new_data_current_posts.sql', sql, 'utf8');
  fs.writeFileSync('new_posts_to_insert.json', JSON.stringify(postObjects, null, 2), 'utf8');

  // Copy both SQL files to project root so user can easily find them
  fs.writeFileSync('c:\\Users\\Admin\\OneDrive\\Desktop\\Gujarat-Post\\new_data_current_posts.sql', sql, 'utf8');
  fs.copyFileSync('new_data_legacy_news.sql', 'c:\\Users\\Admin\\OneDrive\\Desktop\\Gujarat-Post\\new_data_legacy_news.sql');
  fs.copyFileSync('new_articles_diff.json', 'c:\\Users\\Admin\\OneDrive\\Desktop\\Gujarat-Post\\new_articles_diff.json');

  console.log('Successfully generated new_data_current_posts.sql and copied to project root!');
  console.log('Exported files:');
  console.log('1. c:\\Users\\Admin\\OneDrive\\Desktop\\Gujarat-Post\\new_data_current_posts.sql');
  console.log('2. c:\\Users\\Admin\\OneDrive\\Desktop\\Gujarat-Post\\new_data_legacy_news.sql');
  console.log('3. c:\\Users\\Admin\\OneDrive\\Desktop\\Gujarat-Post\\new_articles_diff.json');

  await prisma.$disconnect();
}

generatePrismaSql().catch(console.error);

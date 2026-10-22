const fs = require('fs');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BACKUP_PATH = 'C:\\Users\\Admin\\OneDrive\\Desktop\\Gujarat-Post\\gujaratpost_newsgujrati_22OCT2026.sql.gz';

function buildCategoryMap(dbCategories) {
  const catBySlug = new Map();
  for (const c of dbCategories) {
    catBySlug.set(c.slug.toLowerCase().trim(), c.id);
  }

  const oldIdToSlug = {
    1: 'news',
    2: 'gujarat',
    3: 'international',
    4: 'national',
    5: 'breaking-news',
    6: 'gujarat-election-2017',
    7: 'inflation',
    8: 'polls',
    9: 'jasadan-by-election',
    10: 'poll',
    11: 'india',
    12: 'testcategorues',
    13: 'election-five-states-results',
    14: 'election-2019-modi-loss-five-states',
    15: 'business',
    16: '2019-election-bjp-ram-mandir',
    17: 'politics',
    18: 'entertainment',
    19: 'popular-stories',
    20: 'gujarat-election-2022',
    21: 'loksabha-election',
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

  return { catBySlug, oldIdToSlug };
}

function resolveCategoryId(rawCategories, catBySlug, oldIdToSlug, defaultCatId) {
  if (!rawCategories) return defaultCatId;
  const ids = rawCategories.split(',').map(s => parseInt(s.trim(), 10)).filter(Boolean);
  if (ids.length === 0) return defaultCatId;

  // 1. City categories
  const cityId = ids.find(id => [22, 23, 24, 25, 26].includes(id));
  if (cityId && oldIdToSlug[cityId]) {
    const slug = oldIdToSlug[cityId];
    if (catBySlug.has(slug)) return catBySlug.get(slug);
  }

  // 2. Specific topic categories
  const topicId = ids.find(id => [17, 18, 15, 28, 29, 30, 20, 21, 6, 7, 13, 14, 16].includes(id));
  if (topicId && oldIdToSlug[topicId]) {
    const slug = oldIdToSlug[topicId];
    if (catBySlug.has(slug)) return catBySlug.get(slug);
  }

  // 3. Regional / National categories
  const regId = ids.find(id => [2, 4, 3, 11].includes(id));
  if (regId && oldIdToSlug[regId]) {
    const slug = oldIdToSlug[regId];
    if (catBySlug.has(slug)) return catBySlug.get(slug);
  }

  // 4. Any other mapped category
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

async function runImport() {
  console.log('=== STARTING SAFE BACKUP IMPORT (NO DUPLICATES) ===');

  const dbPosts = await prisma.post.findMany({
    select: { id: true, articleNumber: true, slug: true, titleGu: true }
  });

  const dbSlugs = new Set(dbPosts.map(p => (p.slug || '').toLowerCase().trim()));
  const dbTitles = new Set(dbPosts.map(p => (p.titleGu || '').toLowerCase().trim()));
  const dbArticleNumbers = new Set(dbPosts.map(p => p.articleNumber).filter(Boolean));

  console.log(`Current DB contains ${dbPosts.length} posts.`);

  // 1. Align local Drugs post articleNumber to 33999 if it is currently 33994
  const drugsPost = dbPosts.find(p => p.titleGu && p.titleGu.includes('ડ્રગ્સને લઇને મોટું ઓપરેશન'));
  if (drugsPost && drugsPost.articleNumber === 33994) {
    console.log(`Updating local Drugs post ID ${drugsPost.id} articleNumber: 33994 -> 33999...`);
    await prisma.post.update({
      where: { id: drugsPost.id },
      data: { articleNumber: 33999 }
    });
    dbArticleNumbers.delete(33994);
    dbArticleNumbers.add(33999);
    console.log('Successfully aligned Drugs post to articleNumber 33999.');
  }

  const dbCategories = await prisma.category.findMany();
  const { catBySlug, oldIdToSlug } = buildCategoryMap(dbCategories);
  const defaultCatId = catBySlug.get('news') || catBySlug.get('gujarat') || dbCategories[0]?.id;

  const defaultAuthor = await prisma.author.findFirst({
    where: { name: 'Admin' }
  }) || await prisma.author.findFirst();

  // 2. Read and parse SQL backup
  const rl = readline.createInterface({
    input: fs.createReadStream(BACKUP_PATH)
  });

  let currentBuffer = '';
  let inNewsInsert = false;
  const allRows = [];

  rl.on('line', (line) => {
    if (line.startsWith('INSERT INTO `news` VALUES ')) {
      inNewsInsert = true;
      currentBuffer = line.slice('INSERT INTO `news` VALUES '.length);
    } else if (inNewsInsert) {
      currentBuffer += '\n' + line;
    }

    if (inNewsInsert && line.endsWith(';')) {
      inNewsInsert = false;
      parseTuples(currentBuffer, allRows);
      currentBuffer = '';
    }
  });

  rl.on('close', async () => {
    console.log(`Total backup news parsed: ${allRows.length}`);

    const toInsert = [];

    for (const row of allRows) {
      const newsId = row.NEWS_ID;
      const title = (row.NEWS_TITLE || '').trim();
      const rawSlug = (row.NEWS_SLUG || '').trim();
      const slugCandidate = formatSlug(rawSlug, newsId).toLowerCase();

      // Check duplicates:
      if (title && dbTitles.has(title.toLowerCase())) {
        continue;
      }
      if (slugCandidate && dbSlugs.has(slugCandidate)) {
        continue;
      }
      if (dbArticleNumbers.has(newsId)) {
        continue;
      }

      if (!title && !row.NEWS_CONTENT) {
        continue;
      }

      const catId = resolveCategoryId(row.NEWS_CATEGORY, catBySlug, oldIdToSlug, defaultCatId);
      const featuredImage = formatFeaturedImage(row.NEWS_IMAGE);
      const content = row.NEWS_CONTENT || '';
      const summary = row.NEWS_SUMMARY || '';
      const wordCount = content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
      const readingTime = Math.max(1, Math.ceil(wordCount / 180));

      const createdDate = row.NEWS_CREATED_DATE && row.NEWS_CREATED_DATE !== '0000-00-00 00:00:00'
        ? new Date(row.NEWS_CREATED_DATE)
        : new Date();
      const modifyDate = row.NEWS_MODIFY_DATE && row.NEWS_MODIFY_DATE !== '0000-00-00 00:00:00'
        ? new Date(row.NEWS_MODIFY_DATE)
        : createdDate;

      toInsert.push({
        articleNumber: newsId,
        slug: slugCandidate,
        title: title || `Gujarat Post News ${newsId}`,
        titleGu: title || `ગુજરાત પોસ્ટ સમાચાર ${newsId}`,
        titleHi: title || `गुजरात पोस्ट समाचार ${newsId}`,
        excerpt: summary,
        excerptGu: summary,
        excerptHi: summary,
        content: content,
        contentGu: content,
        contentHi: content,
        featuredImage: featuredImage,
        status: 'PUBLISHED',
        authorId: defaultAuthor.id,
        categoryId: catId,
        readingTime: readingTime,
        priority: row.NEWS_PRIO || 0,
        isTrending: row.NEWS_TOP === 1 || row.NEWS_FEATURE === 1,
        isFeatured: row.NEWS_FEATURE === 1,
        isBreaking: false,
        views: row.NEWS_VISIT || 0,
        seoTitle: row.NEWS_SEO_TITLE || title,
        seoDescription: row.NEWS_SEO_DESCRIPTION || summary || '',
        seoKeywords: row.NEWS_SEO_KEYWORDS || '',
        createdAt: createdDate,
        updatedAt: modifyDate,
      });
    }

    console.log(`\nInserting ${toInsert.length} new non-duplicate articles...`);

    let insertedCount = 0;
    for (const postData of toInsert) {
      try {
        const created = await prisma.post.create({
          data: postData
        });
        insertedCount++;
        console.log(`✅ [${insertedCount}/${toInsert.length}] Inserted Article #${created.articleNumber}: "${created.titleGu}" (Slug: ${created.slug})`);
      } catch (err) {
        console.error(`❌ Failed to insert article #${postData.articleNumber}:`, err.message);
      }
    }

    // Verification
    const finalTotal = await prisma.post.count();
    const maxArticleNum = await prisma.post.aggregate({ _max: { articleNumber: true } });
    console.log('\n=== VERIFICATION ===');
    console.log(`Total posts in DB after import: ${finalTotal}`);
    console.log(`Highest articleNumber in DB: ${maxArticleNum._max.articleNumber}`);

    const latestPosts = await prisma.post.findMany({
      orderBy: { articleNumber: 'desc' },
      take: 8,
      select: { articleNumber: true, titleGu: true, slug: true, createdAt: true, status: true }
    });
    console.log('Latest 8 articles in DB:');
    console.table(latestPosts);

    await prisma.$disconnect();
  });
}

function parseTuples(sql, results) {
  let i = 0;
  const n = sql.length;

  while (i < n) {
    while (i < n && sql[i] !== '(') i++;
    if (i >= n) break;
    i++;

    const values = [];
    let currentVal = '';
    let inQuotes = false;
    let quoteChar = '';
    let isEscaped = false;

    while (i < n) {
      const c = sql[i];
      if (isEscaped) {
        currentVal += c;
        isEscaped = false;
        i++;
        continue;
      }
      if (c === '\\') {
        isEscaped = true;
        currentVal += c;
        i++;
        continue;
      }
      if (inQuotes) {
        if (c === quoteChar) {
          if (sql[i + 1] === quoteChar) {
            currentVal += quoteChar;
            i += 2;
            continue;
          } else {
            inQuotes = false;
          }
        } else {
          currentVal += c;
        }
        i++;
        continue;
      }

      if (c === "'" || c === '"') {
        inQuotes = true;
        quoteChar = c;
        i++;
        continue;
      }

      if (c === ',') {
        values.push(cleanVal(currentVal));
        currentVal = '';
        i++;
        continue;
      }

      if (c === ')') {
        values.push(cleanVal(currentVal));
        i++;
        break;
      }

      currentVal += c;
      i++;
    }

    if (values.length >= 35) {
      results.push({
        NEWS_ID: parseInt(values[0], 10),
        NEWS_ORD: parseInt(values[1], 10) || 0,
        NEWS_NAME: values[3],
        NEWS_TITLE: values[4],
        NEWS_SLUG: values[5],
        NEWS_VIDEO: values[6],
        NEWS_VIDEO_YOUTUBE: values[7],
        NEWS_IMAGE: values[8],
        NEWS_IMAGE1: values[9],
        NEWS_IMAGE2: values[10],
        NEWS_CATEGORY: values[11],
        NEWS_SUMMARY: values[15],
        NEWS_CONTENT: values[16],
        NEWS_CONTENT1: values[17],
        NEWS_CONTENT2: values[18],
        NEWS_IMAGE_NEW_NEW: values[20],
        G_IMAGES: values[21],
        NEWS_VIDEOS_URL: values[22],
        NEWS_TWT: values[23],
        PUBLISH_BY: values[24],
        NEWS_FEATURE: parseInt(values[25], 10) || 0,
        NEWS_TOP: parseInt(values[26], 10) || 0,
        NEWS_PRIO: parseInt(values[27], 10) || 0,
        NEWS_POSTED_BY: parseInt(values[29], 10) || 0,
        NEWS_SEO_TITLE: values[30],
        NEWS_SEO_DESCRIPTION: values[31],
        NEWS_SEO_KEYWORDS: values[32],
        NEWS_CREATED_DATE: values[33],
        NEWS_MODIFY_DATE: values[34],
        NEWS_STATUS: parseInt(values[35], 10) || 0,
        NEWS_VISIT: parseInt(values[36], 10) || 0,
      });
    }
  }
}

function cleanVal(str) {
  const trimmed = str.trim();
  if (trimmed === 'NULL') return null;
  let s = trimmed;
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
    s = s.slice(1, -1);
  }
  return s
    .replace(/\\r/g, '\r')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

runImport().catch(console.error);

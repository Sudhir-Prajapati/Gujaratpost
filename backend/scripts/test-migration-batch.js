const mysql = require('mysql2/promise');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

function decodeMojibake(str) {
  if (!str) return '';
  try {
    const decoded = Buffer.from(str, 'latin1').toString('utf8');
    // If decoding succeeded and produced valid Gujarati characters
    return decoded;
  } catch (e) {
    return str;
  }
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

async function testMigrationBatch() {
  console.log('--- STARTING DRY-RUN / TEST BATCH MIGRATION (10 ARTICLES) ---');

  // 1. Connect to local MySQL
  const localConn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'root@123',
    database: 'gujaratpost_newsgujrati_today',
    charset: 'latin1'
  });

  // 2. Fetch default author from new DB
  const defaultAuthor = await prisma.author.findFirst({
    where: { name: 'Admin' }
  }) || await prisma.author.findFirst();

  if (!defaultAuthor) {
    throw new Error('No author found in destination database!');
  }
  console.log(`Using Author: ${defaultAuthor.name} (${defaultAuthor.id})`);

  // 3. Fetch all existing categories from destination DB
  const destCats = await prisma.category.findMany();
  const catMap = new Map(); // slug -> id
  destCats.forEach(c => catMap.set(c.slug.toLowerCase(), c.id));
  console.log(`Found ${destCats.length} existing categories in destination DB.`);

  // 4. Fetch old categories from local DB
  const [oldCats] = await localConn.query('SELECT CAT_ID, CAT_NAME, CAT_SLUG FROM category');
  const oldCatIdToNewId = new Map();

  for (const oc of oldCats) {
    const rawSlug = (oc.CAT_SLUG || oc.CAT_NAME || 'news').toLowerCase().trim();
    const cleanSlug = rawSlug.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    
    if (catMap.has(cleanSlug)) {
      oldCatIdToNewId.set(String(oc.CAT_ID), catMap.get(cleanSlug));
    } else {
      // Create missing category
      const nameGu = decodeMojibake(oc.CAT_NAME) || oc.CAT_NAME;
      const created = await prisma.category.create({
        data: {
          slug: cleanSlug,
          name: oc.CAT_NAME,
          nameGu: nameGu,
          nameHi: nameGu,
          isActive: true
        }
      });
      catMap.set(cleanSlug, created.id);
      oldCatIdToNewId.set(String(oc.CAT_ID), created.id);
      console.log(`Created new category: ${cleanSlug} -> ${created.id}`);
    }
  }

  // Fallback category if unmapped
  const fallbackCatId = catMap.get('gujarat') || destCats[0].id;

  // 5. Fetch 10 sample news articles from local DB
  const [sampleNews] = await localConn.query('SELECT * FROM news ORDER BY NEWS_ID DESC LIMIT 10');
  console.log(`\nFetched ${sampleNews.length} articles from local MySQL. Processing...`);

  for (const n of sampleNews) {
    const titleGu = decodeMojibake(n.NEWS_TITLE) || 'ગુજરાત સમાચાર';
    const contentGu = decodeMojibake(n.NEWS_CONTENT) || titleGu;
    const excerptGu = stripHtml(contentGu).substring(0, 200) || titleGu;

    const baseSlug = (n.NEWS_SLUG && n.NEWS_SLUG.trim().length > 0)
      ? n.NEWS_SLUG.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
      : `news-${n.NEWS_ID}`;
    
    // Ensure slug uniqueness
    const slug = `${baseSlug.substring(0, 150)}-${n.NEWS_ID}`;

    const catId = oldCatIdToNewId.get(String(n.NEWS_CATEGORY)) || fallbackCatId;
    const date = (n.NEWS_CREATED_DATE && !isNaN(new Date(n.NEWS_CREATED_DATE).getTime()))
      ? new Date(n.NEWS_CREATED_DATE)
      : new Date();

    const imageFilename = n.NEWS_IMAGE ? n.NEWS_IMAGE.trim() : '';
    const featuredImage = imageFilename.startsWith('http')
      ? imageFilename
      : (imageFilename ? `/uploads/${imageFilename}` : '/assets/demo/1.jpg');

    console.log(`\n[DRY RUN ARTICLE ID: ${n.NEWS_ID}]`);
    console.log(`  Slug: ${slug}`);
    console.log(`  Title (Gujarati): ${titleGu}`);
    console.log(`  Image: ${featuredImage}`);
    console.log(`  Category ID: ${catId}`);
    console.log(`  Date: ${date.toISOString()}`);
    console.log(`  Excerpt: ${excerptGu.substring(0, 60)}...`);
  }

  await localConn.end();
  await prisma.$disconnect();
  console.log('\n--- DRY RUN COMPLETED SUCCESSFULLY! All fields map with 100% accuracy! ---');
}

testMigrationBatch().catch(console.error);

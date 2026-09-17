const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function fixAndPopulateAllCategories() {
  console.log('========================================================================');
  console.log('   REPAIR & SYNC: POPULATING ALL CATEGORIES WITH ARTICLE DATA           ');
  console.log('========================================================================\n');

  const startTime = Date.now();

  // 1. Connect to Aiven and Local
  console.log('[1/5] Connecting to databases...');
  const aiven = await mysql.createConnection({
    uri: process.env.AIVEN_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    charset: 'UTF8MB4',
    connectTimeout: 60000
  });
  const local = await mysql.createConnection({
    host: '127.0.0.1', port: 3306,
    user: 'gujaratpost', password: 'gujaratpost2005',
    database: 'gujaratpost', charset: 'utf8mb4'
  });
  const oldSrc = await mysql.createConnection({
    host: '127.0.0.1', port: 3306,
    user: 'root', password: 'root@123',
    database: 'gujaratpost_newsgujrati_today', charset: 'utf8mb4'
  });
  console.log('✓ Connected to all 3 databases.\n');

  // Disable foreign key checks for bulk import
  await local.query('SET FOREIGN_KEY_CHECKS = 0;');

  // 2. Import Aiven Users & Authors
  console.log('[2/5] Importing authors and users from Aiven...');
  const [aivenUsers] = await aiven.query('SELECT * FROM users');
  for (const u of aivenUsers) {
    await local.query(`
      INSERT INTO users (id, email, passwordHash, role, status, isFirstLogin, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE email = VALUES(email)
    `, [u.id, u.email, u.passwordHash, u.role, u.status, u.isFirstLogin, u.createdAt, u.updatedAt]);
  }

  const [aivenAuthors] = await aiven.query('SELECT * FROM authors');
  for (const a of aivenAuthors) {
    await local.query(`
      INSERT INTO authors (id, userId, name, nameGu, nameHi, image, designation, designationGu, designationHi, bio, bioGu, bioHi, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name), image = VALUES(image)
    `, [
      a.id, a.userId, a.name, a.nameGu, a.nameHi, a.image,
      a.designation, a.designationGu, a.designationHi,
      a.bio, a.bioGu, a.bioHi, a.createdAt, a.updatedAt
    ]);
  }
  console.log(`✓ Synced ${aivenUsers.length} users and ${aivenAuthors.length} authors.\n`);

  // 3. Import the 435 modern posts from Aiven that do not exist in local DB
  console.log('[3/5] Importing modern category posts (Crime, Tech, Sports, Health, etc.) from Aiven...');
  const [localPosts] = await local.query('SELECT id, slug FROM posts');
  const localIdSet = new Set(localPosts.map(p => p.id));
  const localSlugSet = new Set(localPosts.map(p => p.slug));

  const [allAivenPosts] = await aiven.query('SELECT * FROM posts');
  let importedCount = 0;

  for (const p of allAivenPosts) {
    if (localIdSet.has(p.id) || localSlugSet.has(p.slug)) continue;

    // Insert new modern post
    await local.query(`
      INSERT INTO posts (
        id, slug, articleNumber, language, title, titleGu, titleHi,
        excerpt, excerptGu, excerptHi, content, contentGu, contentHi,
        featuredImage, status, authorId, categoryId, readingTime, priority,
        isTrending, isBreaking, isFeatured, views, seoTitle, seoDescription, seoKeywords,
        location, canonicalUrl, metaRobots, createdAt, updatedAt
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      )
      ON DUPLICATE KEY UPDATE categoryId = VALUES(categoryId)
    `, [
      p.id, p.slug, p.articleNumber, p.language || 'gu', p.title, p.titleGu, p.titleHi,
      p.excerpt, p.excerptGu, p.excerptHi, p.content, p.contentGu, p.contentHi,
      p.featuredImage, p.status, p.authorId, p.categoryId, p.readingTime || 3, p.priority || 0,
      p.isTrending || 0, p.isBreaking || 0, p.isFeatured || 0, p.views || 0,
      p.seoTitle, p.seoDescription, p.seoKeywords,
      p.location, p.canonicalUrl, p.metaRobots, p.createdAt, p.updatedAt
    ]);
    importedCount++;
  }
  console.log(`✓ Imported ${importedCount} modern articles from Aiven into local DB.\n`);

  // 4. Sync category mappings from Aiven for all matched posts
  console.log('[4/5] Syncing Aiven category assignments to existing local articles...');
  let updatedFromAiven = 0;
  for (const p of allAivenPosts) {
    if (p.articleNumber) {
      const [res] = await local.query(
        'UPDATE posts SET categoryId = ? WHERE articleNumber = ? AND categoryId != ?',
        [p.categoryId, p.articleNumber, p.categoryId]
      );
      if (res.affectedRows > 0) updatedFromAiven += res.affectedRows;
    } else if (p.slug) {
      const [res] = await local.query(
        'UPDATE posts SET categoryId = ? WHERE slug = ? AND categoryId != ?',
        [p.categoryId, p.slug, p.categoryId]
      );
      if (res.affectedRows > 0) updatedFromAiven += res.affectedRows;
    }
  }
  console.log(`✓ Updated category assignments for ${updatedFromAiven} articles from Aiven.\n`);

  // 5. Parse remaining comma-separated NEWS_CATEGORY for old DB articles
  console.log('[5/5] Re-mapping old database articles with comma-separated categories (Ahmedabad, Surat, Vadodara, Rajkot, etc.)...');
  
  // Build mapping from old category ID to Aiven Category UUID
  const [categories] = await local.query('SELECT id, slug FROM categories');
  const slugToId = new Map(categories.map(c => [c.slug, c.id]));

  // Old ID priority map (most specific subcategory first)
  const subcatRules = [
    { oldId: '23', slug: 'ahmedabad' },
    { oldId: '24', slug: 'surat' },
    { oldId: '25', slug: 'vadodara' },
    { oldId: '26', slug: 'rajkot' },
    { oldId: '22', slug: 'gandhinagar' },
    { oldId: '30', slug: 'fact-check' },
    { oldId: '21', slug: 'loksabha-election' },
    { oldId: '20', slug: 'gujarat-election-2022' },
    { oldId: '16', slug: '2019-election-bjp-ram-mandir' },
    { oldId: '14', slug: 'election-2019-modi-loss-five-states' },
    { oldId: '13', slug: 'election-five-states-results' },
    { oldId: '9',  slug: 'jasadan-by-election' },
    { oldId: '6',  slug: 'gujarat-election-2017' },
    { oldId: '7',  slug: 'inflation' },
    { oldId: '10', slug: 'poll' },
    { oldId: '8',  slug: 'polls' },
    { oldId: '17', slug: 'politics' },
    { oldId: '15', slug: 'business' },
    { oldId: '29', slug: 'entertainment' },
    { oldId: '18', slug: 'entertainment-life-style' },
    { oldId: '28', slug: 'lifestyle' },
    { oldId: '19', slug: 'popular-stories' },
    { oldId: '27', slug: 'others' },
    { oldId: '3',  slug: 'international' },
    { oldId: '4',  slug: 'national' },
    { oldId: '11', slug: 'india' },
    { oldId: '5',  slug: 'breaking-news' },
    { oldId: '2',  slug: 'gujarat' },
    { oldId: '1',  slug: 'news' }
  ];

  // Fetch all old news with categories
  const [oldNews] = await oldSrc.query('SELECT NEWS_ID, NEWS_CATEGORY FROM news');
  console.log(`Analyzing ${oldNews.length} old articles for specific subcategories...`);

  let refinedCount = 0;
  const BATCH = 500;
  for (let i = 0; i < oldNews.length; i += BATCH) {
    const chunk = oldNews.slice(i, i + BATCH);
    for (const n of chunk) {
      if (!n.NEWS_CATEGORY) continue;
      const ids = String(n.NEWS_CATEGORY).split(',').map(s => s.trim());

      // Pick the most specific category rule that matches
      let targetSlug = null;
      for (const rule of subcatRules) {
        if (ids.includes(rule.oldId)) {
          targetSlug = rule.slug;
          break;
        }
      }

      if (targetSlug && targetSlug !== 'news') {
        const catUuid = slugToId.get(targetSlug);
        if (catUuid) {
          const [res] = await local.query(
            'UPDATE posts SET categoryId = ? WHERE articleNumber = ? AND categoryId = ?',
            [catUuid, n.NEWS_ID, slugToId.get('news')]
          );
          if (res.affectedRows > 0) refinedCount += res.affectedRows;
        }
      }
    }
  }
  console.log(`✓ Refined ${refinedCount} articles from generic "news" into specific categories.\n`);

  // Print final distribution
  const [finalDist] = await local.query(`
    SELECT c.slug, c.name, c.nameGu, count(p.id) as cnt
    FROM categories c
    LEFT JOIN posts p ON p.categoryId = c.id
    GROUP BY c.id
    ORDER BY cnt DESC
  `);
  console.log('========================================================================');
  console.log('               FINAL CATEGORY DISTRIBUTION IN LOCAL DATABASE            ');
  console.log('========================================================================');
  console.table(finalDist);

  const [totalPosts] = await local.query('SELECT count(*) as cnt FROM posts');
  console.log(`\nTotal posts in local database: ${totalPosts[0].cnt}`);
  console.log(`Duration: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

  await local.query('SET FOREIGN_KEY_CHECKS = 1;');
  await aiven.end();
  await local.end();
  await oldSrc.end();
}

fixAndPopulateAllCategories().catch(console.error);

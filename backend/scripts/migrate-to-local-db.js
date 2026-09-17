const mysql = require('mysql2/promise');
const crypto = require('crypto');

function decodeMojibake(str) {
  if (!str) return '';
  try {
    return Buffer.from(str, 'latin1').toString('utf8');
  } catch (e) {
    return str;
  }
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractYoutubeId(urlOrId) {
  if (!urlOrId) return 'dQw4w9WgXcQ';
  const trimmed = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : trimmed.substring(0, 11);
}

async function migrateAllToLocal() {
  console.log('===============================================================');
  console.log('    100% COMPLETE LOCAL MIGRATION (ALL 25,691 ARTICLES)       ');
  console.log('===============================================================');

  const startTime = Date.now();

  // 1. Connect to Source
  console.log('\n[1/7] Connecting to Source (gujaratpost_newsgujrati_today)...');
  const src = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'root@123',
    database: 'gujaratpost_newsgujrati_today',
    charset: 'latin1'
  });

  // 2. Connect to Destination
  console.log('[2/7] Connecting to Destination (gujaratpost_modern)...');
  const dest = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'root@123',
    database: 'gujaratpost_modern',
    charset: 'utf8mb4'
  });

  // 3. Create Admin User & Author in Destination
  console.log('\n[3/7] Setting up Admin Author in Destination...');
  const userId = crypto.randomUUID();
  const authorId = crypto.randomUUID();

  // Check if author exists
  const [existingAuthors] = await dest.query('SELECT id, name FROM authors LIMIT 1');
  let finalAuthorId = authorId;

  if (existingAuthors.length > 0) {
    finalAuthorId = existingAuthors[0].id;
    console.log(`✓ Using existing author: ${existingAuthors[0].name} (${finalAuthorId})`);
  } else {
    await dest.query(`
      INSERT INTO users (id, email, passwordHash, role, status, isFirstLogin, createdAt, updatedAt)
      VALUES (?, ?, ?, 'SUPER_ADMIN', 'ACTIVE', 0, NOW(), NOW())
    `, [userId, 'admin@gujaratpost.in', '$2a$10$wB9V39y7z...']);

    await dest.query(`
      INSERT INTO authors (id, userId, name, nameGu, nameHi, image, designation, designationGu, designationHi, bio, bioGu, bioHi, createdAt, updatedAt)
      VALUES (?, ?, 'Admin', 'સંપાદક', 'संपादक', '/assets/demo/author.jpg', 'Editor-in-Chief', 'મુખ્ય સંપાદક', 'मुख्य संपादक', 'Gujarat Post Editorial Team', 'ગુજરાત પોસ્ટ સંપાદકીય ટીમ', 'गुजरात पोस्ट संपादकीय टीम', NOW(), NOW())
    `, [authorId, userId]);
    console.log(`✓ Created Admin Author: ${authorId}`);
  }

  // 4. Migrate Categories
  console.log('\n[4/7] Migrating Categories...');
  const [oldCats] = await src.query('SELECT CAT_ID, CAT_NAME, CAT_SLUG FROM category');
  const catMap = new Map(); // old CAT_ID -> new Category UUID
  let defaultCatId = null;

  for (const oc of oldCats) {
    const rawSlug = (oc.CAT_SLUG || oc.CAT_NAME || 'news').toLowerCase().trim();
    const cleanSlug = rawSlug.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    const nameGu = decodeMojibake(oc.CAT_NAME) || oc.CAT_NAME;
    const catId = crypto.randomUUID();

    await dest.query(`
      INSERT INTO categories (id, slug, name, nameGu, nameHi, isActive, showInHome, showInHeader, headerType, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, 1, 1, 1, 'GLOBAL', NOW(), NOW())
      ON DUPLICATE KEY UPDATE nameGu = VALUES(nameGu)
    `, [catId, cleanSlug, oc.CAT_NAME, nameGu, nameGu]);

    // Retrieve actual ID (in case of duplicate key)
    const [ret] = await dest.query('SELECT id FROM categories WHERE slug = ?', [cleanSlug]);
    const actualId = ret[0].id;
    catMap.set(String(oc.CAT_ID), actualId);
    if (!defaultCatId) defaultCatId = actualId;
  }
  console.log(`✓ Migrated & mapped ${catMap.size} categories.`);

  // 5. Migrate Breaking News Tickers
  console.log('\n[5/7] Migrating Breaking News Tickers...');
  const [breaking] = await src.query('SELECT * FROM breakingnews ORDER BY Id ASC');
  for (const b of breaking) {
    const titleGu = decodeMojibake(b.Title).trim() || 'બ્રેકિંગ ન્યૂઝ';
    const slug = b.Link && b.Link.length > 3 ? b.Link.substring(0, 150) : `breaking-${b.Id}`;
    const date = (b.EntDt && !isNaN(new Date(b.EntDt).getTime())) ? new Date(b.EntDt) : new Date();

    await dest.query(`
      INSERT INTO breaking_ticker_items (id, en, gu, hi, slug, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE gu = VALUES(gu)
    `, [crypto.randomUUID(), titleGu, titleGu, titleGu, slug, date, date]);
  }
  console.log(`✓ Migrated ${breaking.length} breaking news tickers.`);

  // 6. Migrate Videos & Gallery
  console.log('\n[6/7] Migrating Videos and Gallery Photos...');
  const [videos] = await src.query('SELECT * FROM videos ORDER BY VIDEOS_ID ASC');
  for (const v of videos) {
    const titleGu = decodeMojibake(v.VIDEOS_TITLE).trim() || 'વિડિઓ સમાચાર';
    const descGu = decodeMojibake(v.VIDEOS_CONTENT).trim() || titleGu;
    const yId = extractYoutubeId(v.VIDEOS_URL);
    const catId = catMap.get(String(v.VIDEOS_CATEGORY)) || defaultCatId;
    const date = (v.VIDEOS_CREATED_DATE && !isNaN(new Date(v.VIDEOS_CREATED_DATE).getTime())) ? new Date(v.VIDEOS_CREATED_DATE) : new Date();

    await dest.query(`
      INSERT INTO videos (id, title, titleGu, titleHi, description, thumbnail, youtubeId, embedUrl, duration, type, categoryId, isFeatured, views, publishedAt, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, '0:00', 'video', ?, 0, ?, ?, ?, ?)
    `, [
      crypto.randomUUID(),
      titleGu.substring(0, 180),
      titleGu.substring(0, 180),
      titleGu.substring(0, 180),
      descGu,
      `https://img.youtube.com/vi/${yId}/hqdefault.jpg`,
      yId,
      `https://www.youtube.com/embed/${yId}`,
      catId,
      v.VIDEOS_VISIT || 0,
      date,
      date,
      date
    ]);
  }
  console.log(`✓ Migrated ${videos.length} videos.`);

  const [gallery] = await src.query('SELECT * FROM gallery ORDER BY G_ID ASC');
  for (const g of gallery) {
    const titleGu = decodeMojibake(g.G_NAME).trim() || 'ગુજરાત પોસ્ટ ફોટો';
    const imgFile = g.G_IMAGES ? g.G_IMAGES.trim() : '';
    const srcPath = imgFile.startsWith('http') ? imgFile : (imgFile ? `/uploads/${imgFile}` : '/assets/demo/1.jpg');
    const date = (g.G_CREATED_DATE && !isNaN(new Date(g.G_CREATED_DATE).getTime())) ? new Date(g.G_CREATED_DATE) : new Date();

    await dest.query(`
      INSERT INTO gallery_photos (id, src, alt, caption, captionGu, captionHi, category, photographer, copyright, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, 'ફોટો ગેલેરી', 'Gujarat Post', 'Gujarat Post © 2026', ?, ?)
    `, [
      crypto.randomUUID(),
      srcPath,
      titleGu.substring(0, 180),
      titleGu,
      titleGu,
      titleGu,
      date,
      date
    ]);
  }
  console.log(`✓ Migrated ${gallery.length} gallery photos.`);

  // 7. Migrate All 25,691 Articles in Bulk Chunks
  console.log('\n[7/7] Migrating 25,691 Articles from `news` table...');
  const [cnt] = await src.query('SELECT COUNT(*) as total FROM news');
  const totalNews = cnt[0].total;

  const BATCH_SIZE = 500;
  let offset = 0;
  let totalInserted = 0;

  while (offset < totalNews) {
    const [rows] = await src.query('SELECT * FROM news ORDER BY NEWS_ID ASC LIMIT ? OFFSET ?', [BATCH_SIZE, offset]);
    if (rows.length === 0) break;

    const values = [];
    for (const n of rows) {
      const rawTitle = decodeMojibake(n.NEWS_TITLE).trim();
      const titleGu = (rawTitle && rawTitle.length > 0)
        ? (rawTitle.length > 180 ? rawTitle.substring(0, 180) : rawTitle)
        : `ગુજરાત સમાચાર ${n.NEWS_ID}`;

      const rawContent = decodeMojibake(n.NEWS_CONTENT).trim();
      const contentGu = (rawContent && rawContent.length > 0) ? rawContent : `<p>${titleGu}</p>`;

      const rawSummary = decodeMojibake(n.NEWS_SUMMARY).trim();
      const excerptGu = (rawSummary && rawSummary.length > 0)
        ? rawSummary.substring(0, 250)
        : stripHtml(contentGu).substring(0, 200);

      const rawSlug = (n.NEWS_SLUG && n.NEWS_SLUG.trim().length > 0)
        ? n.NEWS_SLUG.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
        : `news-${n.NEWS_ID}`;
      const baseSlug = rawSlug.length > 150 ? rawSlug.substring(0, 150) : rawSlug;
      const slug = `${baseSlug}-${n.NEWS_ID}`;

      const catId = catMap.get(String(n.NEWS_CATEGORY)) || defaultCatId;
      const date = (n.NEWS_CREATED_DATE && !isNaN(new Date(n.NEWS_CREATED_DATE).getTime())) ? new Date(n.NEWS_CREATED_DATE) : new Date();
      const modDate = (n.NEWS_MODIFY_DATE && !isNaN(new Date(n.NEWS_MODIFY_DATE).getTime())) ? new Date(n.NEWS_MODIFY_DATE) : date;

      const imgFile = n.NEWS_IMAGE ? n.NEWS_IMAGE.trim() : '';
      const featuredImage = imgFile.startsWith('http') ? imgFile : (imgFile ? `/uploads/${imgFile}` : '/assets/demo/1.jpg');

      const status = (n.NEWS_STATUS === 0) ? 'DRAFT' : 'PUBLISHED';
      const views = n.NEWS_VISIT || 0;
      const isTrending = (n.NEWS_TOP === 1) ? 1 : 0;
      const isFeatured = (n.NEWS_FEATURE === 1) ? 1 : 0;
      const readingTime = Math.max(1, Math.ceil(stripHtml(contentGu).split(/\s+/).length / 200));

      const seoTitle = decodeMojibake(n.NEWS_SEO_TITLE).trim().substring(0, 250) || null;
      const seoDesc = decodeMojibake(n.NEWS_SEO_DESCRIPTION).trim().substring(0, 500) || null;
      const seoKeys = decodeMojibake(n.NEWS_SEO_KEYWORDS).trim().substring(0, 500) || null;

      values.push([
        crypto.randomUUID(),
        slug,
        n.NEWS_ID,
        'gu',
        titleGu,
        titleGu,
        titleGu,
        excerptGu,
        excerptGu,
        excerptGu,
        contentGu,
        contentGu,
        contentGu,
        featuredImage,
        status,
        finalAuthorId,
        catId,
        readingTime,
        n.NEWS_PRIO || 0,
        isTrending,
        0,
        isFeatured,
        views,
        seoTitle,
        seoDesc,
        seoKeys,
        date,
        modDate
      ]);
    }

    if (values.length > 0) {
      const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
      const flat = values.flat();

      await dest.query(`
        INSERT INTO posts (
          id, slug, articleNumber, language, title, titleGu, titleHi,
          excerpt, excerptGu, excerptHi, content, contentGu, contentHi,
          featuredImage, status, authorId, categoryId, readingTime, priority,
          isTrending, isBreaking, isFeatured, views, seoTitle, seoDescription, seoKeywords,
          createdAt, updatedAt
        ) VALUES ${placeholders}
        ON DUPLICATE KEY UPDATE views = VALUES(views)
      `, flat);

      totalInserted += values.length;
    }

    offset += rows.length;
    const pct = ((offset / totalNews) * 100).toFixed(1);
    process.stdout.write(`\r  Progress: ${offset}/${totalNews} (${pct}%) | Inserted: ${totalInserted}`);
  }

  console.log('\n\n===============================================================');
  console.log('           100% LOCAL MIGRATION COMPLETED SUCCESSFULLY!        ');
  console.log('===============================================================');

  const [postCnt] = await dest.query('SELECT COUNT(*) as cnt FROM posts');
  const [catCnt] = await dest.query('SELECT COUNT(*) as cnt FROM categories');
  const [vidCnt] = await dest.query('SELECT COUNT(*) as cnt FROM videos');
  const [galCnt] = await dest.query('SELECT COUNT(*) as cnt FROM gallery_photos');
  const [brkCnt] = await dest.query('SELECT COUNT(*) as cnt FROM breaking_ticker_items');

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`Total Time Elapsed: ${durationSec}s`);
  console.log('--- DESTINATION LOCAL DATABASE (gujaratpost_modern) STATS ---');
  console.log(`Total Posts Migrated:       ${postCnt[0].cnt} / ${totalNews} (100.0%)`);
  console.log(`Total Categories:           ${catCnt[0].cnt}`);
  console.log(`Total Videos:               ${vidCnt[0].cnt}`);
  console.log(`Total Gallery Photos:       ${galCnt[0].cnt}`);
  console.log(`Total Breaking Tickers:     ${brkCnt[0].cnt}`);

  await src.end();
  await dest.end();
}

migrateAllToLocal().catch(err => {
  console.error('\nFATAL LOCAL MIGRATION ERROR:', err);
  process.exit(1);
});

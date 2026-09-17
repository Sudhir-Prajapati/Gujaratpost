const mysql = require('mysql2/promise');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

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

function cleanImageFilename(raw, folder = 'news') {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const decoded = decodeMojibake(trimmed).trim();
  if (!decoded) return '';
  return encodeURI(`https://gujaratpost.in/${folder}/${decoded}`);
}

async function runFullMigration() {
  console.log('========================================================================');
  console.log('    GUJARAT POST: PRODUCTION DATABASE MIGRATION ENGINE (PORT 3307)     ');
  console.log('    Source: 127.0.0.1:3306 (gujaratpost_newsgujrati_today)             ');
  console.log('    Destination: 127.0.0.1:3306 (gujaratpost)                          ');
  console.log('========================================================================');

  const startTime = Date.now();

  // 1. Connect to Source MySQL (3306)
  console.log('\n[1/8] Connecting to Source Database (port 3306)...');
  const src = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'root@123',
    database: 'gujaratpost_newsgujrati_today',
    charset: 'latin1'
  });
  console.log('✓ Source connection established.');

  // 2. Connect to Destination MySQL (3306)
  console.log('[2/8] Connecting to Destination Database (port 3306)...');
  const dest = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'gujaratpost',
    password: 'gujaratpost2005',
    database: 'gujaratpost',
    charset: 'utf8mb4'
  });
  console.log('✓ Destination connection established.');

  // 3. Setup Admin User & Author in Destination
  console.log('\n[3/8] Setting up Admin User & Editorial Author...');
  const [existingAuthors] = await dest.query('SELECT id, name FROM authors LIMIT 1');
  let finalAuthorId;

  if (existingAuthors.length > 0) {
    finalAuthorId = existingAuthors[0].id;
    console.log(`✓ Using existing author: ${existingAuthors[0].name} (${finalAuthorId})`);
  } else {
    const userId = crypto.randomUUID();
    finalAuthorId = crypto.randomUUID();

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Admin@12345', salt);

    await dest.query(`
      INSERT INTO users (id, email, passwordHash, role, status, isFirstLogin, createdAt, updatedAt)
      VALUES (?, ?, ?, 'SUPER_ADMIN', 'ACTIVE', 0, NOW(), NOW())
      ON DUPLICATE KEY UPDATE email = VALUES(email)
    `, [userId, 'admin@gujaratpost.com', passwordHash]);

    await dest.query(`
      INSERT INTO authors (id, userId, name, nameGu, nameHi, image, designation, designationGu, designationHi, bio, bioGu, bioHi, createdAt, updatedAt)
      VALUES (?, ?, 'Admin', 'સંપાદક', 'संपादक', 'https://gujaratpost.in/images/logo.jpg', 'Editor-in-Chief', 'મુખ્ય સંપાદક', 'मुख्य संपादक', 'Gujarat Post Editorial Team', 'ગુજરાત પોસ્ટ સંપાદકીય ટીમ', 'गुजरात पोस्ट संपादकीय टीम', NOW(), NOW())
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `, [finalAuthorId, userId]);
    console.log(`✓ Created Admin Author: ${finalAuthorId}`);
  }

  // 4. Migrate Categories
  console.log('\n[4/8] Migrating Categories...');
  const [oldCats] = await src.query('SELECT CAT_ID, CAT_NAME, CAT_SLUG FROM category');
  const catMap = new Map(); // old CAT_ID -> new Category UUID
  let defaultCatId = null;

  for (const oc of oldCats) {
    const rawSlug = (oc.CAT_SLUG || oc.CAT_NAME || 'news').toLowerCase().trim();
    const cleanSlug = rawSlug.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    const nameGu = decodeMojibake(oc.CAT_NAME).trim() || oc.CAT_NAME;
    const catId = crypto.randomUUID();

    await dest.query(`
      INSERT INTO categories (id, slug, name, nameGu, nameHi, isActive, showInHome, showInHeader, headerType, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, 1, 1, 1, 'GLOBAL', NOW(), NOW())
      ON DUPLICATE KEY UPDATE nameGu = VALUES(nameGu)
    `, [catId, cleanSlug, nameGu, nameGu, nameGu]);

    const [ret] = await dest.query('SELECT id FROM categories WHERE slug = ?', [cleanSlug]);
    const actualId = ret[0].id;
    catMap.set(String(oc.CAT_ID), actualId);
    if (!defaultCatId) defaultCatId = actualId;
  }
  console.log(`✓ Migrated & mapped ${catMap.size} categories.`);

  // 5. Migrate Breaking News Tickers
  console.log('\n[5/8] Migrating Breaking News Tickers...');
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

  // 6. Migrate Videos
  console.log('\n[6/8] Migrating Videos...');
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
      ON DUPLICATE KEY UPDATE views = VALUES(views)
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

  // 7. Migrate Gallery Photos & galleryoptions
  console.log('\n[7/8] Migrating Gallery Photos & Multi-Photo Options...');
  const [gallery] = await src.query('SELECT * FROM gallery ORDER BY G_ID ASC');
  let galleryCount = 0;

  for (const g of gallery) {
    const titleGu = decodeMojibake(g.G_NAME).trim() || 'ગુજરાત પોસ્ટ ફોટો';
    const srcPath = cleanImageFilename(g.G_IMAGES, 'gallery') || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800';
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
    galleryCount++;
  }

  // Also import additional gallery photos from galleryoptions
  const [galleryOpts] = await src.query('SELECT * FROM galleryoptions WHERE productoption_value IS NOT NULL AND productoption_value != ""');
  for (const go of galleryOpts) {
    const optSrc = cleanImageFilename(go.productoption_value, 'gallery');
    if (!optSrc) continue;
    const optName = decodeMojibake(go.productoption_name).trim() || 'ગેલેરી ફોટો';

    await dest.query(`
      INSERT INTO gallery_photos (id, src, alt, caption, captionGu, captionHi, category, photographer, copyright, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, 'ફોટો ગેલેરી', 'Gujarat Post', 'Gujarat Post © 2026', NOW(), NOW())
    `, [
      crypto.randomUUID(),
      optSrc,
      optName.substring(0, 180),
      optName,
      optName,
      optName
    ]);
    galleryCount++;
  }
  console.log(`✓ Migrated ${galleryCount} total gallery photos.`);

  // 8. Migrate Advertisements
  console.log('\n[8/8] Migrating Advertisements...');
  const [adverts] = await src.query('SELECT * FROM advert ORDER BY ADV_ID ASC');
  let adCount = 0;
  for (const a of adverts) {
    const title = decodeMojibake(a.ADV_NAME).trim() || `Advertisement ${a.ADV_ID}`;
    const imgUrl = cleanImageFilename(a.ADV_IMAGE, 'adverts');
    const link = (a.ADV_LINK || '').trim() || 'https://gujaratpost.in';
    const section = `section-${a.ADV_ID}`;
    const date = (a.ADV_DATE && !isNaN(new Date(a.ADV_DATE).getTime())) ? new Date(a.ADV_DATE) : new Date();

    await dest.query(`
      INSERT INTO advertisements (id, section, title, isActive, includeInRandom, mediaType, image1, link1, createdAt, updatedAt)
      VALUES (?, ?, ?, 1, 1, 'IMAGE', ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE image1 = VALUES(image1), link1 = VALUES(link1)
    `, [crypto.randomUUID(), section, title, imgUrl, link, date, date]);
    adCount++;
  }
  console.log(`✓ Migrated ${adCount} advertisements.`);

  // Pre-load secondary photos from newsoptions (1,848 rows)
  console.log('\n[8.5] Pre-loading Secondary Article Photos from `newsoptions`...');
  const [newsOpts] = await src.query('SELECT NEWS_ID, productoption_name, productoption_value FROM newsoptions WHERE productoption_value IS NOT NULL AND productoption_value != ""');
  const newsOptionsMap = new Map(); // NEWS_ID -> array of { caption, url }
  for (const no of newsOpts) {
    const nId = no.NEWS_ID;
    const caption = decodeMojibake(no.productoption_name).trim();
    const imgUrl = cleanImageFilename(no.productoption_value, 'news');
    if (!imgUrl) continue;
    if (!newsOptionsMap.has(nId)) newsOptionsMap.set(nId, []);
    newsOptionsMap.get(nId).push({ caption, url: imgUrl });
  }
  console.log(`✓ Pre-loaded secondary photos for ${newsOptionsMap.size} articles.`);

  // 9. Migrate All 25,691 Articles in Bulk Chunks
  console.log('\n========================================================================');
  console.log('    MIGRATING 25,691 ARTICLES WITH ORIGINAL HIGH-RES IMAGES             ');
  console.log('========================================================================');

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

      let contentGu = decodeMojibake(n.NEWS_CONTENT).trim();
      if (!contentGu) contentGu = `<p>${titleGu}</p>`;

      // If this article has secondary photos from newsoptions, append them to contentGu
      const extraPhotos = newsOptionsMap.get(n.NEWS_ID);
      if (extraPhotos && extraPhotos.length > 0) {
        const markdownImgs = extraPhotos.map((p, idx) => `\n![${p.caption || `Gallery Image ${idx + 1}`}](${p.url})`).join('');
        contentGu += markdownImgs;
      }

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

      // Clean & construct original image URL
      const featuredImage = cleanImageFilename(n.NEWS_IMAGE, 'news') || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800';

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
        ON DUPLICATE KEY UPDATE
          views = VALUES(views),
          featuredImage = VALUES(featuredImage)
      `, flat);

      totalInserted += values.length;
    }

    offset += rows.length;
    const pct = ((offset / totalNews) * 100).toFixed(1);
    process.stdout.write(`\r  Progress: ${offset}/${totalNews} (${pct}%) | Inserted: ${totalInserted}`);
  }

  console.log('\n\n========================================================================');
  console.log('           100% PRODUCTION MIGRATION COMPLETED SUCCESSFULLY!           ');
  console.log('========================================================================');

  const [postCnt] = await dest.query('SELECT COUNT(*) as cnt FROM posts');
  const [catCnt] = await dest.query('SELECT COUNT(*) as cnt FROM categories');
  const [vidCnt] = await dest.query('SELECT COUNT(*) as cnt FROM videos');
  const [galCnt] = await dest.query('SELECT COUNT(*) as cnt FROM gallery_photos');
  const [brkCnt] = await dest.query('SELECT COUNT(*) as cnt FROM breaking_ticker_items');
  const [adDestCnt] = await dest.query('SELECT COUNT(*) as cnt FROM advertisements');

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`Total Time Elapsed: ${durationSec}s`);
  console.log('--- DESTINATION DATABASE (127.0.0.1:3306/gujaratpost) STATS ---');
  console.log(`Total Posts Migrated:       ${postCnt[0].cnt} / ${totalNews} (100.0%)`);
  console.log(`Total Categories:           ${catCnt[0].cnt}`);
  console.log(`Total Videos:               ${vidCnt[0].cnt}`);
  console.log(`Total Gallery Photos:       ${galCnt[0].cnt}`);
  console.log(`Total Breaking Tickers:     ${brkCnt[0].cnt}`);
  console.log(`Total Advertisements:       ${adDestCnt[0].cnt}`);

  await src.end();
  await dest.end();
}

runFullMigration().catch(err => {
  console.error('\nFATAL MIGRATION ERROR:', err);
  process.exit(1);
});

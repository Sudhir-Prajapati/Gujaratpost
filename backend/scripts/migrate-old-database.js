const mysql = require('mysql2/promise');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

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

async function runFullMigration() {
  console.log('===============================================================');
  console.log('    GUJARAT POST: 100% DATABASE MIGRATION ENGINE              ');
  console.log('===============================================================');

  const startTime = Date.now();

  // 1. Connect to local MySQL database
  console.log('\n[1/6] Connecting to Local MySQL (Source: gujaratpost_newsgujrati_today)...');
  const localConn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'root@123',
    database: 'gujaratpost_newsgujrati_today',
    charset: 'latin1'
  });
  console.log('✓ Successfully connected to local source database.');

  // 2. Fetch default author
  console.log('\n[2/6] Resolving Author for Migrated Articles...');
  let defaultAuthor = await prisma.author.findFirst({ where: { name: 'Admin' } });
  if (!defaultAuthor) {
    defaultAuthor = await prisma.author.findFirst();
  }
  if (!defaultAuthor) {
    throw new Error('No author found in destination database!');
  }
  console.log(`✓ Using Author: ${defaultAuthor.name} (ID: ${defaultAuthor.id})`);

  // 3. Migrate and Map Categories
  console.log('\n[3/6] Mapping & Synchronizing Categories...');
  const destCats = await prisma.category.findMany();
  const catMap = new Map(); // slug -> id
  destCats.forEach(c => catMap.set(c.slug.toLowerCase(), c.id));

  const [oldCats] = await localConn.query('SELECT CAT_ID, CAT_NAME, CAT_SLUG FROM category');
  const oldCatIdToNewId = new Map();

  for (const oc of oldCats) {
    const rawSlug = (oc.CAT_SLUG || oc.CAT_NAME || 'news').toLowerCase().trim();
    const cleanSlug = rawSlug.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    
    if (catMap.has(cleanSlug)) {
      oldCatIdToNewId.set(String(oc.CAT_ID), catMap.get(cleanSlug));
    } else {
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
      console.log(`  + Created missing category: ${cleanSlug} (${nameGu})`);
    }
  }

  const fallbackCatId = catMap.get('gujarat') || destCats[0].id;
  console.log(`✓ Categories mapped: ${oldCatIdToNewId.size} old categories linked to destination categories.`);

  // 4. Migrate Breaking News Tickers
  console.log('\n[4/6] Migrating Breaking News Tickers...');
  const [breakingRows] = await localConn.query('SELECT * FROM breakingnews ORDER BY Id ASC');
  const existingTickerCount = await prisma.breakingTickerItem.count();
  if (existingTickerCount < 10) {
    const tickerBatch = breakingRows.map(b => {
      const titleGu = decodeMojibake(b.Title).trim() || 'બ્રેકિંગ ન્યૂઝ';
      return {
        id: crypto.randomUUID(),
        en: titleGu,
        gu: titleGu,
        hi: titleGu,
        slug: b.Link && b.Link.length > 3 ? b.Link.substring(0, 150) : `breaking-${b.Id}`,
        createdAt: (b.EntDt && !isNaN(new Date(b.EntDt).getTime())) ? new Date(b.EntDt) : new Date(),
        updatedAt: (b.EntDt && !isNaN(new Date(b.EntDt).getTime())) ? new Date(b.EntDt) : new Date()
      };
    });
    await prisma.breakingTickerItem.createMany({ data: tickerBatch, skipDuplicates: true });
    console.log(`✓ Migrated ${tickerBatch.length} breaking news ticker items.`);
  } else {
    console.log(`✓ Skipping breaking news (destination already has ${existingTickerCount} items).`);
  }

  // 5. Migrate Videos
  console.log('\n[5/6] Migrating Videos...');
  const [videoRows] = await localConn.query('SELECT * FROM videos ORDER BY VIDEOS_ID ASC');
  const existingVideoCount = await prisma.video.count();
  if (existingVideoCount < 40) {
    const videoBatch = videoRows.map(v => {
      const titleGu = decodeMojibake(v.VIDEOS_TITLE).trim() || 'વિડિઓ સમાચાર';
      const descGu = decodeMojibake(v.VIDEOS_CONTENT).trim() || titleGu;
      const yId = extractYoutubeId(v.VIDEOS_URL);
      const catId = oldCatIdToNewId.get(String(v.VIDEOS_CATEGORY)) || fallbackCatId;

      return {
        id: crypto.randomUUID(),
        title: titleGu.substring(0, 180),
        titleGu: titleGu.substring(0, 180),
        titleHi: titleGu.substring(0, 180),
        description: descGu,
        thumbnail: `https://img.youtube.com/vi/${yId}/hqdefault.jpg`,
        youtubeId: yId,
        embedUrl: `https://www.youtube.com/embed/${yId}`,
        duration: '0:00',
        type: 'video',
        categoryId: catId,
        isFeatured: false,
        views: v.VIDEOS_VISIT || 0,
        publishedAt: (v.VIDEOS_CREATED_DATE && !isNaN(new Date(v.VIDEOS_CREATED_DATE).getTime())) ? new Date(v.VIDEOS_CREATED_DATE) : new Date(),
        createdAt: (v.VIDEOS_CREATED_DATE && !isNaN(new Date(v.VIDEOS_CREATED_DATE).getTime())) ? new Date(v.VIDEOS_CREATED_DATE) : new Date(),
        updatedAt: (v.VIDEOS_MODIFY_DATE && !isNaN(new Date(v.VIDEOS_MODIFY_DATE).getTime())) ? new Date(v.VIDEOS_MODIFY_DATE) : new Date()
      };
    });
    await prisma.video.createMany({ data: videoBatch, skipDuplicates: true });
    console.log(`✓ Migrated ${videoBatch.length} videos.`);
  } else {
    console.log(`✓ Destination already contains ${existingVideoCount} videos.`);
  }

  // 6. Migrate Gallery Photos
  console.log('\n[6/7] Migrating Gallery Photos...');
  const [galleryRows] = await localConn.query('SELECT * FROM gallery ORDER BY G_ID ASC');
  const existingGalleryCount = await prisma.galleryPhoto.count();
  if (existingGalleryCount < 50) {
    const galleryBatch = galleryRows.map(g => {
      const titleGu = decodeMojibake(g.G_NAME).trim() || 'ગુજરાત પોસ્ટ ફોટો';
      const descGu = decodeMojibake(g.G_DESC).trim() || titleGu;
      const imgFile = g.G_IMAGES ? g.G_IMAGES.trim() : '';
      const src = imgFile.startsWith('http') ? imgFile : (imgFile ? `/uploads/${imgFile}` : '/assets/demo/1.jpg');

      return {
        id: crypto.randomUUID(),
        src: src,
        alt: titleGu.substring(0, 180),
        caption: titleGu,
        captionGu: titleGu,
        captionHi: titleGu,
        category: 'ફોટો ગેલેરી',
        photographer: 'Gujarat Post',
        copyright: 'Gujarat Post © 2026',
        createdAt: (g.G_CREATED_DATE && !isNaN(new Date(g.G_CREATED_DATE).getTime())) ? new Date(g.G_CREATED_DATE) : new Date(),
        updatedAt: (g.G_MODIFIED_DATE && !isNaN(new Date(g.G_MODIFIED_DATE).getTime())) ? new Date(g.G_MODIFIED_DATE) : new Date()
      };
    });
    // Insert in batches of 200
    for (let i = 0; i < galleryBatch.length; i += 200) {
      const chunk = galleryBatch.slice(i, i + 200);
      await prisma.galleryPhoto.createMany({ data: chunk, skipDuplicates: true });
    }
    console.log(`✓ Migrated ${galleryBatch.length} gallery photos.`);
  } else {
    console.log(`✓ Destination already contains ${existingGalleryCount} gallery photos.`);
  }

  // 7. Migrate Articles (25,691 rows)
  console.log('\n[7/7] Migrating 25,691 Articles from `news` table...');
  
  // Pre-load all existing articleNumbers from destination to skip existing
  const existingPosts = await prisma.post.findMany({
    where: { articleNumber: { not: null } },
    select: { articleNumber: true }
  });
  const existingArtNumSet = new Set(existingPosts.map(p => p.articleNumber));
  console.log(`  Existing posts in destination with articleNumber: ${existingArtNumSet.size}`);

  const [countRes] = await localConn.query('SELECT COUNT(*) as total FROM news');
  const totalNews = countRes[0].total;
  console.log(`  Total articles to process from local source: ${totalNews}`);

  const BATCH_SIZE = 200;
  let offset = 0;
  let totalInserted = 0;
  let totalSkipped = 0;

  while (offset < totalNews) {
    const [newsRows] = await localConn.query(
      'SELECT * FROM news ORDER BY NEWS_ID ASC LIMIT ? OFFSET ?',
      [BATCH_SIZE, offset]
    );

    if (newsRows.length === 0) break;

    const postsToInsert = [];

    for (const n of newsRows) {
      if (existingArtNumSet.has(n.NEWS_ID)) {
        totalSkipped++;
        continue;
      }

      const rawTitle = decodeMojibake(n.NEWS_TITLE).trim();
      const titleGu = (rawTitle && rawTitle.length > 0)
        ? (rawTitle.length > 180 ? rawTitle.substring(0, 180) : rawTitle)
        : `ગુજરાત સમાચાર ${n.NEWS_ID}`;

      const rawContent = decodeMojibake(n.NEWS_CONTENT).trim();
      const contentGu = (rawContent && rawContent.length > 0)
        ? rawContent
        : `<p>${titleGu}</p>`;

      const rawSummary = decodeMojibake(n.NEWS_SUMMARY).trim();
      const excerptGu = (rawSummary && rawSummary.length > 0)
        ? rawSummary.substring(0, 250)
        : stripHtml(contentGu).substring(0, 200);

      const rawSlug = (n.NEWS_SLUG && n.NEWS_SLUG.trim().length > 0)
        ? n.NEWS_SLUG.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
        : `news-${n.NEWS_ID}`;
      
      const baseSlug = rawSlug.length > 150 ? rawSlug.substring(0, 150) : rawSlug;
      const slug = `${baseSlug}-${n.NEWS_ID}`;

      const catId = oldCatIdToNewId.get(String(n.NEWS_CATEGORY)) || fallbackCatId;

      const date = (n.NEWS_CREATED_DATE && !isNaN(new Date(n.NEWS_CREATED_DATE).getTime()))
        ? new Date(n.NEWS_CREATED_DATE)
        : new Date();

      const modDate = (n.NEWS_MODIFY_DATE && !isNaN(new Date(n.NEWS_MODIFY_DATE).getTime()))
        ? new Date(n.NEWS_MODIFY_DATE)
        : date;

      const imageFilename = n.NEWS_IMAGE ? n.NEWS_IMAGE.trim() : '';
      const featuredImage = imageFilename.startsWith('http')
        ? imageFilename
        : (imageFilename ? `/uploads/${imageFilename}` : '/assets/demo/1.jpg');

      const status = (n.NEWS_STATUS === 0) ? 'DRAFT' : 'PUBLISHED';
      const views = n.NEWS_VISIT || 0;
      const isTrending = (n.NEWS_TOP === 1);
      const isFeatured = (n.NEWS_FEATURE === 1);
      const wordCount = stripHtml(contentGu).split(/\s+/).length;
      const readingTime = Math.max(1, Math.ceil(wordCount / 200));

      const seoTitle = decodeMojibake(n.NEWS_SEO_TITLE).trim() || null;
      const seoDesc = decodeMojibake(n.NEWS_SEO_DESCRIPTION).trim() || null;
      const seoKeys = decodeMojibake(n.NEWS_SEO_KEYWORDS).trim() || null;

      postsToInsert.push({
        id: crypto.randomUUID(),
        slug: slug,
        articleNumber: n.NEWS_ID,
        language: 'gu',
        title: titleGu,
        titleGu: titleGu,
        titleHi: titleGu,
        excerpt: excerptGu,
        excerptGu: excerptGu,
        excerptHi: excerptGu,
        content: contentGu,
        contentGu: contentGu,
        contentHi: contentGu,
        featuredImage: featuredImage,
        status: status,
        authorId: defaultAuthor.id,
        categoryId: catId,
        readingTime: readingTime,
        priority: n.NEWS_PRIO || 0,
        isTrending: isTrending,
        isBreaking: false,
        isFeatured: isFeatured,
        views: views,
        seoTitle: seoTitle ? seoTitle.substring(0, 250) : null,
        seoDescription: seoDesc ? seoDesc.substring(0, 500) : null,
        seoKeywords: seoKeys ? seoKeys.substring(0, 500) : null,
        createdAt: date,
        updatedAt: modDate
      });
    }

    if (postsToInsert.length > 0) {
      try {
        const result = await prisma.post.createMany({
          data: postsToInsert,
          skipDuplicates: true
        });
        totalInserted += result.count;
      } catch (err) {
        console.error(`  [Batch Error at offset ${offset}]: ${err.message}`);
        // Fallback: insert one by one in this batch to isolate and capture any specific failing row
        for (const p of postsToInsert) {
          try {
            await prisma.post.create({ data: p });
            totalInserted++;
          } catch (singleErr) {
            console.error(`    -> Single item error ID ${p.articleNumber}: ${singleErr.message}`);
          }
        }
      }
    }

    offset += newsRows.length;
    const pct = ((offset / totalNews) * 100).toFixed(1);
    process.stdout.write(`\r  Progress: ${offset}/${totalNews} (${pct}%) | Inserted: ${totalInserted} | Skipped: ${totalSkipped}`);
  }

  console.log('\n\n===============================================================');
  console.log('                 MIGRATION EXECUTION COMPLETED                 ');
  console.log('===============================================================');

  // Verification Counts
  const finalPostCount = await prisma.post.count();
  const finalCatCount = await prisma.category.count();
  const finalVideoCount = await prisma.video.count();
  const finalGalleryCount = await prisma.galleryPhoto.count();
  const finalTickerCount = await prisma.breakingTickerItem.count();

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`Total Time Elapsed: ${durationSec}s`);
  console.log('--- DESTINATION CLOUD DATABASE FINAL COUNTS ---');
  console.log(`Posts:                ${finalPostCount} (Inserted: ${totalInserted})`);
  console.log(`Categories:           ${finalCatCount}`);
  console.log(`Videos:               ${finalVideoCount}`);
  console.log(`Gallery Photos:       ${finalGalleryCount}`);
  console.log(`Breaking Tickers:     ${finalTickerCount}`);

  await localConn.end();
  await prisma.$disconnect();
}

runFullMigration().catch(err => {
  console.error('\nFATAL MIGRATION ERROR:', err);
  process.exit(1);
});

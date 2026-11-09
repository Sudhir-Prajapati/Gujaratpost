const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CATEGORIES = [
  'home-updates-home',
  'gujarat-updates-gujarat',
  'politics-updates-politics',
  'national-updates-national',
  'international-updates-international',
  'photo-gallery-updates-photo-gallery',
  'entertainment-lifestyle-updates-entertainment-lifestyle',
  'gandhinagar-updates-gandhinagar',
  'ahmedabad-updates-ahmedabad',
  'surat-updates-surat',
  'vadodara-updates-vadodara',
  'rajkot-updates-rajkot',
  'crime-updates-crime',
  'health-updates-health',
  'technology-updates-technology',
  'fact-check-updates-fact-check'
];

function findItems(obj) {
  if (!obj || typeof obj !== 'object') return [];
  let list = [];
  if (obj.title && (obj.contentImage || obj.thumbnailUrls || obj.pics)) {
    list.push(obj);
  }
  for (const k of Object.keys(obj)) {
    if (Array.isArray(obj[k])) {
      for (const i of obj[k]) list = list.concat(findItems(i));
    } else if (typeof obj[k] === 'object') {
      list = list.concat(findItems(obj[k]));
    }
  }
  return list;
}

function cleanSlug(url) {
  if (!url) return null;
  try {
    const parts = url.replace(/\/+$/, '').split('/');
    let last = parts[parts.length - 1];
    // if last part contains ? query, strip it
    last = last.split('?')[0];
    return decodeURIComponent(last).trim().toLowerCase();
  } catch (e) {
    return null;
  }
}

function normalizeTitle(t) {
  if (!t) return '';
  return t
    .replace(/[:\-–—,\.\|\(\)\?\'\"\s\t\n]+/g, '')
    .trim()
    .toLowerCase();
}

async function main() {
  console.log('--- 1. Fetching all Gujarat Post stories from Dailyhunt ---');
  const storiesMap = new Map();

  for (const cat of CATEGORIES) {
    const url = `https://m.dailyhunt.in/news/india/gujarati/gujarat+post-epaper-gujpost/${cat}`;
    try {
      const r = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      if (!r.ok) continue;
      const html = await r.text();
      const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      if (!match) continue;
      const data = JSON.parse(match[1]);
      const items = findItems(data.props?.pageProps?.initialData);
      for (const it of items) {
        if (!storiesMap.has(it.id)) {
          storiesMap.set(it.id, it);
        }
      }
    } catch (e) {
      console.error(`Failed ${cat}: ${e.message}`);
    }
  }

  const stories = Array.from(storiesMap.values());
  console.log(`Total unique stories retrieved from Dailyhunt: ${stories.length}`);

  const uploadsNewsDir = path.join(__dirname, '..', 'uploads', 'news');
  const dhUploadsDir = path.join(__dirname, '..', 'uploads', 'dailyhunt_news');
  if (!fs.existsSync(uploadsNewsDir)) fs.mkdirSync(uploadsNewsDir, { recursive: true });
  if (!fs.existsSync(dhUploadsDir)) fs.mkdirSync(dhUploadsDir, { recursive: true });

  const sqlStatements = [];
  let downloadedCount = 0;
  let skippedCount = 0;
  let matchedCount = 0;

  console.log('\n--- 2. Downloading images and matching with database ---');

  for (let i = 0; i < stories.length; i++) {
    const s = stories[i];
    const rawImgUrl = s.contentImage;
    if (!rawImgUrl) continue;

    // Convert resize placeholder to high-resolution 800x600_80 or original
    const fullImgUrl = rawImgUrl.replace(/#DH_EMB_IMG_REP#__DHQ_\//, '800x600_80/');

    const sourceUrl = s.sourceProvidedContentUrl || s.publisherStoryUrl || '';
    const slug = cleanSlug(sourceUrl);
    const title = s.title.trim();
    const titleNorm = normalizeTitle(title);

    // Filename to save as
    // e.g. dh_leopard-terror-on-diwali-night.webp or dh_s_<id>.webp
    const safeSlug = slug ? slug.replace(/[^a-z0-9\-]/gi, '_').slice(0, 80) : `dh_story_${s.id}`;
    const filename = `dh_${safeSlug}.webp`;
    const localNewsPath = path.join(uploadsNewsDir, filename);
    const localDhPath = path.join(dhUploadsDir, filename);

    // Download file if not already downloaded
    if (!fs.existsSync(localNewsPath) || fs.statSync(localNewsPath).size < 1000) {
      try {
        const res = await fetch(fullImgUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          fs.writeFileSync(localNewsPath, buf);
          fs.writeFileSync(localDhPath, buf);
          downloadedCount++;
        } else {
          console.error(`Failed to download ${fullImgUrl}: ${res.status}`);
          continue;
        }
      } catch (err) {
        console.error(`Error downloading ${fullImgUrl}: ${err.message}`);
        continue;
      }
    } else {
      // copy to dhUploadsDir as well
      if (!fs.existsSync(localDhPath)) {
        fs.copyFileSync(localNewsPath, localDhPath);
      }
      skippedCount++;
    }

    const relativeUrl = `/uploads/news/${filename}`;

    // Create SQL statement
    // Match by slug first, or by title
    const escapedRelUrl = relativeUrl.replace(/'/g, "''");
    const escapedTitle = title.replace(/'/g, "''");

    if (slug) {
      const escapedSlug = slug.replace(/'/g, "''");
      sqlStatements.push(
        `UPDATE \`posts\` SET \`featuredImage\` = '${escapedRelUrl}' WHERE \`slug\` = '${escapedSlug}';`
      );
    } else {
      sqlStatements.push(
        `UPDATE \`posts\` SET \`featuredImage\` = '${escapedRelUrl}' WHERE \`titleGu\` = '${escapedTitle}' OR \`title\` = '${escapedTitle}';`
      );
    }
    matchedCount++;
  }

  console.log(`\nResults:`);
  console.log(`- Images downloaded: ${downloadedCount}`);
  console.log(`- Images already cached: ${skippedCount}`);
  console.log(`- SQL statements generated: ${sqlStatements.length}`);

  // Write SQL file
  const sqlContent = [
    '-- Gujarat Post: Update recent article images from Dailyhunt CDN',
    'SET NAMES utf8mb4;',
    'START TRANSACTION;',
    '',
    ...sqlStatements,
    '',
    'COMMIT;',
    ''
  ].join('\n');

  const outSqlPath = path.join(__dirname, '..', 'update_dailyhunt_images.sql');
  fs.writeFileSync(outSqlPath, sqlContent, 'utf8');
  console.log(`\nGenerated SQL file at: ${outSqlPath} (${(fs.statSync(outSqlPath).size / 1024).toFixed(1)} KB)`);
  console.log(`Images saved in: ${dhUploadsDir}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());


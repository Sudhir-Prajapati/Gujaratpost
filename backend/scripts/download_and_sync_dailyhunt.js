const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEEPLINKS = [
  'https://m.dailyhunt.in/news/india/gujarati/gujarat+post-epaper-gujpost/home-updates-home',
  'https://m.dailyhunt.in/news/india/gujarati/gujarat+post-epaper-gujpost/gujarat-updates-gujarat',
  'https://m.dailyhunt.in/news/india/gujarati/gujarat+post-epaper-gujpost/politics-updates-politics',
  'https://m.dailyhunt.in/news/india/gujarati/gujarat+post-epaper-gujpost/national-updates-national',
  'https://m.dailyhunt.in/news/india/gujarati/gujarat+post-epaper-gujpost/international-updates-international',
  'https://m.dailyhunt.in/news/india/gujarati/gujarat+post-epaper-gujpost/gallery-updates-gallery',
  'https://m.dailyhunt.in/news/india/gujarati/gujarat+post-epaper-gujpost/entertainmentlifestyle-updates-entertainmentlifestyle',
  'https://m.dailyhunt.in/news/india/gujarati/gujarat+post-epaper-gujpost/gandhinagar-updates-gandhinagar',
  'https://m.dailyhunt.in/news/india/gujarati/gujarat+post-epaper-gujpost/ahmedabad-updates-ahmedabad',
  'https://m.dailyhunt.in/news/india/gujarati/gujarat+post-epaper-gujpost/surat-updates-surat',
  'https://m.dailyhunt.in/news/india/gujarati/gujarat+post-epaper-gujpost/vadodara-updates-vadodara',
  'https://m.dailyhunt.in/news/india/gujarati/gujarat+post-epaper-gujpost/rajkot-updates-rajkot',
  'https://m.dailyhunt.in/news/india/gujarati/gujarat+post-epaper-gujpost/popularstories-updates-popularstories',
  'https://m.dailyhunt.in/news/india/gujarati/gujarat+post-epaper-gujpost/others-updates-others',
  'https://m.dailyhunt.in/news/india/gujarati/gujarat+post-epaper-gujpost/video-updates-video',
  'https://m.dailyhunt.in/news/india/gujarati/gujarat+post-epaper-gujpost/crime-updates-crime',
  'https://m.dailyhunt.in/news/india/gujarati/gujarat+post-epaper-gujpost/heath-updates-heath',
  'https://m.dailyhunt.in/news/india/gujarati/gujarat+post-epaper-gujpost/technology-updates-technology',
  'https://m.dailyhunt.in/news/india/gujarati/gujarat+post-epaper-gujpost/shorts-updates-shorts',
  'https://m.dailyhunt.in/news/india/gujarati/gujarat+post-epaper-gujpost/factcheck-updates-factcheck'
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
    last = last.split('?')[0];
    return decodeURIComponent(last).trim().toLowerCase();
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log('--- 1. Fetching all 20 categories from Dailyhunt ---');
  const storiesMap = new Map();

  for (const url of DEEPLINKS) {
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
      console.error(url, e.message);
    }
  }

  const stories = Array.from(storiesMap.values());
  console.log(`Total unique stories retrieved: ${stories.length}`);

  const uploadsNewsDir = path.join(__dirname, '..', 'uploads', 'news');
  const dhUploadsDir = path.join(__dirname, '..', 'uploads', 'dailyhunt_news');
  if (!fs.existsSync(uploadsNewsDir)) fs.mkdirSync(uploadsNewsDir, { recursive: true });
  if (!fs.existsSync(dhUploadsDir)) fs.mkdirSync(dhUploadsDir, { recursive: true });

  const sqlStatements = [];
  let downloaded = 0;
  let cached = 0;

  for (const s of stories) {
    const rawImgUrl = s.contentImage;
    if (!rawImgUrl) continue;

    const fullImgUrl = rawImgUrl.replace(/#DH_EMB_IMG_REP#__DHQ_\//, '800x600_80/');
    const sourceUrl = s.sourceProvidedContentUrl || s.publisherStoryUrl || '';
    const slug = cleanSlug(sourceUrl);
    const title = s.title.trim();

    const safeSlug = slug ? slug.replace(/[^a-z0-9\-]/gi, '_').slice(0, 80) : `dh_story_${s.id}`;
    const filename = `dh_${safeSlug}.webp`;
    const localNewsPath = path.join(uploadsNewsDir, filename);
    const localDhPath = path.join(dhUploadsDir, filename);

    if (!fs.existsSync(localNewsPath) || fs.statSync(localNewsPath).size < 1000) {
      try {
        const res = await fetch(fullImgUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          fs.writeFileSync(localNewsPath, buf);
          fs.writeFileSync(localDhPath, buf);
          downloaded++;
        }
      } catch (e) {
        console.error(`Failed ${fullImgUrl}:`, e.message);
      }
    } else {
      if (!fs.existsSync(localDhPath)) {
        fs.copyFileSync(localNewsPath, localDhPath);
      }
      cached++;
    }

    const relativeUrl = `/uploads/news/${filename}`;
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
  }

  console.log(`Downloaded: ${downloaded}, Cached: ${cached}, Total SQL: ${sqlStatements.length}`);

  const sqlContent = [
    '-- Gujarat Post: Update article images from Dailyhunt CDN',
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
  console.log(`Generated: ${outSqlPath}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

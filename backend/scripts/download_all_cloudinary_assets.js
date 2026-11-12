const fs = require('fs');
const path = require('path');

// Target directory can be passed via command line argument, or defaults to D:\GujaratPost_Cloudinary_Backup
// On Linux server: node download_all_cloudinary_assets.js /var/app/Gujarat-Post-Website/backend/uploads
const customTarget = process.argv[2];
const BASE_DIR = customTarget 
  ? path.resolve(customTarget)
  : (process.platform === 'win32' && fs.existsSync('D:\\') ? 'D:\\GujaratPost_Cloudinary_Backup\\uploads' : path.join(__dirname, '..', 'uploads'));

const NEWS_DIR = path.join(BASE_DIR, 'news');
const GALLERY_DIR = path.join(BASE_DIR, 'gallery');

fs.mkdirSync(NEWS_DIR, { recursive: true });
fs.mkdirSync(GALLERY_DIR, { recursive: true });

// Read catalog
const catalogPath = path.existsSync && path.existsSync('D:\\GujaratPost_Cloudinary_Catalog.json')
  ? 'D:\\GujaratPost_Cloudinary_Catalog.json'
  : (fs.existsSync(path.join(__dirname, 'cloudinary_catalog.json')) ? path.join(__dirname, 'cloudinary_catalog.json') : 'D:\\GujaratPost_Cloudinary_Catalog.json');

if (!fs.existsSync(catalogPath)) {
  console.error(`Catalog file not found at: ${catalogPath}`);
  process.exit(1);
}

console.log(`Loading catalog from: ${catalogPath}`);
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
console.log(`Total cataloged assets to recover: ${catalog.length}`);
console.log(`Destination News directory: ${NEWS_DIR}`);
console.log(`Destination Gallery directory: ${GALLERY_DIR}`);

const CONCURRENCY = 16;
let downloaded = 0;
let skipped = 0;
let failed = 0;
let totalBytesDownloaded = 0;
const failedItems = [];
const startTime = Date.now();

async function downloadFile(item) {
  const filename = `${path.basename(item.public_id)}.${item.format}`;
  const isGallery = item.public_id.includes('gallery');
  const targetDir = isGallery ? GALLERY_DIR : NEWS_DIR;
  const destPath = path.join(targetDir, filename);

  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 100) {
    skipped++;
    return;
  }

  let retries = 3;
  while (retries > 0) {
    try {
      const res = await fetch(item.secure_url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(20000)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(destPath, buf);
      downloaded++;
      totalBytesDownloaded += buf.length;
      return;
    } catch (err) {
      retries--;
      if (retries === 0) {
        failed++;
        failedItems.push({ item, error: err.message });
      } else {
        await new Promise(r => setTimeout(r, 500));
      }
    }
  }
}

async function worker(queue) {
  while (queue.length > 0) {
    const item = queue.pop();
    if (!item) break;
    await downloadFile(item);
  }
}

async function main() {
  console.log(`\n--- Starting parallel download with ${CONCURRENCY} workers ---`);

  // Progress logger timer
  const timer = setInterval(() => {
    const totalProcessed = downloaded + skipped + failed;
    const pct = ((totalProcessed / catalog.length) * 100).toFixed(1);
    const elapsedSec = (Date.now() - startTime) / 1000;
    const speedMBps = ((totalBytesDownloaded / 1024 / 1024) / elapsedSec).toFixed(2);
    const mbDownloaded = (totalBytesDownloaded / 1024 / 1024).toFixed(1);
    console.log(`[${pct}%] ${totalProcessed}/${catalog.length} | DL: ${downloaded} (${mbDownloaded} MB @ ${speedMBps} MB/s) | Skip: ${skipped} | Fail: ${failed}`);
  }, 5000);

  const queue = [...catalog];
  const workers = Array.from({ length: CONCURRENCY }, () => worker(queue));
  await Promise.all(workers);
  clearInterval(timer);

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n========================================`);
  console.log(`DOWNLOAD COMPLETE in ${totalTime}s`);
  console.log(`Total Downloaded: ${downloaded} files (${(totalBytesDownloaded / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`Total Skipped (already existed): ${skipped}`);
  console.log(`Total Failed: ${failed}`);
  console.log(`========================================\n`);

  if (failedItems.length > 0) {
    const failedLogPath = path.join(__dirname, 'failed_downloads.json');
    fs.writeFileSync(failedLogPath, JSON.stringify(failedItems, null, 2), 'utf8');
    console.log(`Failed items logged to: ${failedLogPath}`);
  }

  // Generate SQL update file
  console.log('Generating update_recovered_images.sql...');
  const sqlLines = [
    '-- Gujarat Post: Update recovered Cloudinary images to local paths',
    'SET NAMES utf8mb4;',
    'START TRANSACTION;',
    ''
  ];

  for (const item of catalog) {
    const filename = `${path.basename(item.public_id)}.${item.format}`;
    const isGallery = item.public_id.includes('gallery');
    const escapedFile = filename.replace(/'/g, "\\'");

    if (isGallery) {
      sqlLines.push(`UPDATE \`gallery_photos\` SET \`src\` = '/uploads/gallery/${escapedFile}' WHERE \`src\` LIKE '%${escapedFile}%';`);
    } else {
      sqlLines.push(`UPDATE \`posts\` SET \`featuredImage\` = '/uploads/news/${escapedFile}' WHERE \`featuredImage\` LIKE '%${escapedFile}%';`);
    }
  }

  sqlLines.push('');
  sqlLines.push('COMMIT;');

  const sqlOutPath = path.join(__dirname, '..', 'update_recovered_images.sql');
  fs.writeFileSync(sqlOutPath, sqlLines.join('\n'), 'utf8');
  console.log(`Saved SQL update script to: ${sqlOutPath} (${(fs.statSync(sqlOutPath).size / 1024 / 1024).toFixed(2)} MB)`);
}

main().catch(console.error);


const fs = require('fs');
const path = require('path');

const backupPath = path.join(__dirname, 'pre_migration_image_backup.json');
const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
const uploadsDir = path.resolve(__dirname, '..', 'uploads');

console.log('Generating update_images.sql...');

let sqlLines = [];
sqlLines.push('START TRANSACTION;');

let postCount = 0;
for (const p of backup.posts) {
  if (!p.featuredImage) continue;
  try {
    const cleanUrl = p.featuredImage.split(',')[0].trim();
    const pathname = decodeURIComponent(new URL(cleanUrl).pathname.replace(/^\/+/, ''));
    const fullPath = path.join(uploadsDir, pathname);
    if (fs.existsSync(fullPath)) {
      const newUrl = '/uploads/' + pathname.replace(/\\/g, '/');
      const escapedUrl = newUrl.replace(/'/g, "\\'");
      const escapedId = p.id.replace(/'/g, "\\'");
      sqlLines.push(`UPDATE \`Post\` SET \`featuredImage\` = '${escapedUrl}' WHERE \`id\` = '${escapedId}';`);
      postCount++;
    }
  } catch {}
}

let galleryCount = 0;
for (const g of backup.gallery) {
  if (!g.src) continue;
  try {
    const cleanUrl = g.src.split(',')[0].trim();
    const pathname = decodeURIComponent(new URL(cleanUrl).pathname.replace(/^\/+/, ''));
    const fullPath = path.join(uploadsDir, pathname);
    if (fs.existsSync(fullPath)) {
      const newUrl = '/uploads/' + pathname.replace(/\\/g, '/');
      const escapedUrl = newUrl.replace(/'/g, "\\'");
      const escapedId = g.id.replace(/'/g, "\\'");
      sqlLines.push(`UPDATE \`GalleryPhoto\` SET \`src\` = '${escapedUrl}' WHERE \`id\` = '${escapedId}';`);
      galleryCount++;
    }
  } catch {}
}

sqlLines.push('COMMIT;');

const outPath = path.resolve(__dirname, '..', 'update_images.sql');
fs.writeFileSync(outPath, sqlLines.join('\n'), 'utf8');

console.log(`✅ Generated update_images.sql with ${postCount} post updates and ${galleryCount} gallery updates.`);
console.log('File size:', (fs.statSync(outPath).size / (1024 * 1024)).toFixed(2), 'MB');


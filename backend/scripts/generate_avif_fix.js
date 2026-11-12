const fs = require('fs');
const path = require('path');

const baseDir = process.platform === 'win32' && fs.existsSync('D:\\GujaratPost_Cloudinary_Backup\\uploads')
  ? 'D:\\GujaratPost_Cloudinary_Backup\\uploads'
  : path.join(__dirname, '..', 'uploads');

const newsDir = path.join(baseDir, 'news');
const galleryDir = path.join(baseDir, 'gallery');

const map = new Map();

for (const dir of [newsDir, galleryDir]) {
  if (!fs.existsSync(dir)) continue;
  const subfolder = dir.includes('gallery') ? 'gallery' : 'news';
  for (const f of fs.readdirSync(dir)) {
    const ext = path.extname(f);
    const stem = path.basename(f, ext);
    map.set(stem, { filename: f, subfolder, ext });
  }
}

console.log('Indexed disk files:', map.size);

const catalogPath = path.join(__dirname, 'cloudinary_catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

const sqlLines = [
  '-- Gujarat Post: Fix .avif extensions to actual file extensions on disk',
  'START TRANSACTION;',
  ''
];

// Instead of 28,000 slow LIKE '%...%' queries, in MySQL we can do fast REGEXP / REPLACE:
// 1. For .avif where a .webp or .jpg actually exists:
// In MySQL:
// We can do an instant single-pass update for common patterns or list specific ones.
// Better: update any featuredImage ending in .avif!
// Let's also create exact update statements for all catalog items where format != 'avif'.
let count = 0;
for (const item of catalog) {
  const stem = path.basename(item.public_id);
  const diskItem = map.get(stem);
  if (!diskItem) continue;

  const actualExt = diskItem.ext.toLowerCase();
  if (actualExt !== '.avif') {
    const escapedStem = stem.replace(/'/g, "\\'");
    sqlLines.push(`UPDATE posts SET featuredImage = '/uploads/${diskItem.subfolder}/${diskItem.filename}' WHERE featuredImage LIKE '%${escapedStem}.avif%';`);
    count++;
  }
}

sqlLines.push('');
sqlLines.push('COMMIT;');

const outPath = path.join(__dirname, '..', 'fix_avif_extensions.sql');
fs.writeFileSync(outPath, sqlLines.join('\n'), 'utf8');
console.log(`Generated ${count} statements in ${outPath}`);


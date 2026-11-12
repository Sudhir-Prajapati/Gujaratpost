const fs = require('fs');
const path = require('path');

const baseDir = process.platform === 'win32' && fs.existsSync('D:\\GujaratPost_Cloudinary_Backup\\uploads')
  ? 'D:\\GujaratPost_Cloudinary_Backup\\uploads'
  : path.join(__dirname, '..', 'uploads');

const newsDir = path.join(baseDir, 'news');
const galleryDir = path.join(baseDir, 'gallery');

const diskFiles = new Map();
for (const dir of [newsDir, galleryDir]) {
  if (!fs.existsSync(dir)) continue;
  const subfolder = dir.includes('gallery') ? 'gallery' : 'news';
  for (const f of fs.readdirSync(dir)) {
    const ext = path.extname(f);
    const stem = path.basename(f, ext);
    diskFiles.set(stem, { filename: f, subfolder, ext });
  }
}

console.log('Total indexed files on disk:', diskFiles.size);

async function run() {
  const sql = [
    '-- Exact primary-key fix for all .avif articles to real disk files',
    'START TRANSACTION;',
    ''
  ];
  let matched = 0;
  let missing = 0;

  for (let p = 1; p <= 70; p++) {
    try {
      const res = await fetch(`https://gujaratpost.in/api/public/articles?page=${p}&limit=50`).then(r => r.json());
      const arts = res.data && res.data.articles ? res.data.articles : [];
      if (!arts.length) break;

      for (const a of arts) {
        if (a.featuredImage && a.featuredImage.endsWith('.avif')) {
          const raw = a.featuredImage;
          const filename = path.basename(raw);
          const stem = path.basename(filename, '.avif');
          const match = diskFiles.get(stem);

          if (match) {
            matched++;
            sql.push(`UPDATE posts SET featuredImage = '/uploads/${match.subfolder}/${match.filename}' WHERE id = '${a.id}';`);
          } else {
            missing++;
            console.log('NOT FOUND ON DISK:', a.id, filename, (a.titleGu || '').slice(0, 35));
          }
        }
      }
    } catch (err) {
      console.error(`Page ${p} fetch error:`, err.message);
    }
  }

  sql.push('');
  sql.push('COMMIT;');

  const outPath = path.join(__dirname, '..', 'fix_85_images.sql');
  fs.writeFileSync(outPath, sql.join('\n'), 'utf8');
  console.log(`\n========================================`);
  console.log(`FINISHED: Matched: ${matched} | Missing: ${missing}`);
  console.log(`Saved SQL to: ${outPath}`);
  console.log(`========================================`);
}

run();


const mysql = require('mysql2/promise');
const https = require('https');

function checkUrl(url) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const req = https.request(url, { method: 'HEAD', timeout: 3000 }, (res) => {
        resolve(res.statusCode === 200);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
      req.end();
    } catch (e) {
      resolve(false);
    }
  });
}

async function main() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'gujaratpost',
    password: 'gujaratpost2005',
    database: 'gujaratpost',
  });

  const [rows] = await conn.query("SELECT id, src, captionGu, caption FROM gallery_photos WHERE caption != 'ગેલેરી ફોટો'");
  console.log(`Checking all ${rows.length} real gallery rows...`);

  const validIds = [];
  const invalidIds = [];

  // Batch of 25 concurrent requests
  for (let i = 0; i < rows.length; i += 25) {
    const chunk = rows.slice(i, i + 25);
    const results = await Promise.all(chunk.map(async (r) => {
      const ok = await checkUrl(r.src);
      return { id: r.id, ok, src: r.src, caption: r.captionGu };
    }));

    for (const res of results) {
      if (res.ok) validIds.push(res);
      else invalidIds.push(res);
    }

    if ((i + 25) % 100 === 0 || i + 25 >= rows.length) {
      console.log(`Progress: ${Math.min(i + 25, rows.length)}/${rows.length} | Valid: ${validIds.length} | Invalid: ${invalidIds.length}`);
    }
  }

  console.log('\n=======================================');
  console.log(`TOTAL VALID REAL GALLERY IMAGES: ${validIds.length}`);
  console.log(`TOTAL INVALID (404) GALLERY IMAGES: ${invalidIds.length}`);
  console.log('=======================================\n');

  console.log('First 5 valid:');
  console.log(validIds.slice(0, 5));

  await conn.end();
}

main().catch(console.error);

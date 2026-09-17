const mysql = require('mysql2/promise');
const https = require('https');

function check(url) {
  return new Promise(res => {
    try {
      const req = https.request(url, { method: 'HEAD', timeout: 1500 }, r => {
        res(r.statusCode);
      });
      req.on('error', () => res(500));
      req.on('timeout', () => { req.destroy(); res(408); });
      req.end();
    } catch {
      res(500);
    }
  });
}

async function run() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'gujaratpost',
    password: 'gujaratpost2005',
    database: 'gujaratpost',
  });

  const [rows] = await conn.query("SELECT id, src, captionGu FROM gallery_photos WHERE caption != 'ગેલેરી ફોટો'");
  console.log(`Checking all ${rows.length} gallery rows...`);

  const failIds = [];
  const okIds = [];

  for (let i = 0; i < rows.length; i += 50) {
    const chunk = rows.slice(i, i + 50);
    const results = await Promise.all(chunk.map(async r => ({ id: r.id, src: r.src, caption: r.captionGu, status: await check(r.src) })));
    for (const r of results) {
      if (r.status === 200) okIds.push(r);
      else failIds.push(r);
    }
    console.log(`Checked ${Math.min(i + 50, rows.length)}/${rows.length} | OK: ${okIds.length} | FAIL: ${failIds.length}`);
  }

  console.log('\n--- SUMMARY ---');
  console.log('Total OK (200):', okIds.length);
  console.log('Total FAIL (404/broken):', failIds.length);

  // Save the failIds and okIds to JSON so we can clean or update them
  const fs = require('fs');
  fs.writeFileSync('./scripts/gallery-audit.json', JSON.stringify({ okCount: okIds.length, failCount: failIds.length, failIds: failIds.map(f => f.id) }, null, 2));
  console.log('Wrote audit results to gallery-audit.json');

  await conn.end();
}

run().catch(console.error);

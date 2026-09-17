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

  const [rows] = await conn.query("SELECT id, src, captionGu FROM gallery_photos WHERE createdAt >= '2026-09-17'");
  console.log('Total rows with createdAt >= 2026-09-17:', rows.length);
  
  // Check in chunks of 20
  const failList = [];
  const okList = [];

  for (let i = 0; i < rows.length; i += 20) {
    const chunk = rows.slice(i, i + 20);
    const results = await Promise.all(chunk.map(async r => ({ ...r, status: await check(r.src) })));
    for (const r of results) {
      if (r.status === 200) okList.push(r);
      else failList.push(r);
    }
  }

  console.log(`Summary: OK (200): ${okList.length} | FAIL (404/etc): ${failList.length}`);
  console.log('FAIL IDs count:', failList.length);
  if (failList.length > 0) {
    console.log('Sample FAIL (first 5):', failList.slice(0, 5));
  }
  if (okList.length > 0) {
    console.log('Sample OK (first 5):', okList.slice(0, 5));
  }

  await conn.end();
}

run().catch(console.error);

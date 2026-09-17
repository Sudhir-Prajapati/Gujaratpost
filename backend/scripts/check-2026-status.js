const mysql = require('mysql2/promise');
const https = require('https');

function check(url) {
  return new Promise(res => {
    https.get(url, r => res(r.statusCode)).on('error', () => res(500));
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
  
  let ok = 0;
  let fail = 0;
  const failList = [];
  const okList = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const st = await check(r.src);
    if (st === 200) {
      ok++;
      okList.push(r);
    } else {
      fail++;
      failList.push(r);
    }
  }

  console.log(`Results: OK (200): ${ok} | Fail (404): ${fail}`);
  console.log('Sample OK:');
  console.log(okList.slice(0, 5));
  console.log('Sample Fail:');
  console.log(failList.slice(0, 5));

  await conn.end();
}

run().catch(console.error);

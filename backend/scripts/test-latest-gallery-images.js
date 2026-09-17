const mysql = require('mysql2/promise');
const https = require('https');

async function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ url, status: res.statusCode });
      res.resume();
    }).on('error', (e) => resolve({ url, error: e.message }));
  });
}

async function main() {
  const src = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'root@123',
    database: 'gujaratpost_newsgujrati_today',
  });

  const [rows] = await src.query('SELECT G_ID, G_NAME, G_IMAGES, G_CREATED_DATE FROM gallery ORDER BY G_ID DESC LIMIT 20');
  console.log(`Checking ${rows.length} latest gallery items...`);

  for (const r of rows) {
    const rawImg = (r.G_IMAGES || '').trim();
    if (!rawImg) continue;
    const url = `https://gujaratpost.in/gallery/${encodeURIComponent(rawImg)}`;
    const res = await checkUrl(url);
    const decodedName = Buffer.from(r.G_NAME, 'latin1').toString('utf8');
    console.log(`[G_ID ${r.G_ID}] [${res.status}] ${rawImg} -> ${decodedName.substring(0, 30)}`);
  }

  await src.end();
}
main().catch(console.error);

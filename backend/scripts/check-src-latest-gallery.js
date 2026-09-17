const mysql = require('mysql2/promise');
const https = require('https');

function checkUrl(url) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const req = https.request(url, { method: 'GET', timeout: 3000 }, (res) => {
        resolve(res.statusCode === 200);
        res.resume();
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
  const src = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'root@123',
    database: 'gujaratpost_newsgujrati_today',
  });

  // Get the 30 latest gallery rows
  const [rows] = await src.query('SELECT G_ID, G_NAME, G_IMAGES, G_G_IMG, G_CREATED_DATE FROM gallery ORDER BY G_ID DESC LIMIT 30');
  
  console.log(`Checking 30 latest gallery rows in source DB...`);
  for (const r of rows) {
    const rawImg = (r.G_IMAGES || '').trim();
    const url = `https://gujaratpost.in/gallery/${encodeURIComponent(rawImg)}`;
    const ok = await checkUrl(url);
    const title = Buffer.from(r.G_NAME, 'latin1').toString('utf8').trim();
    console.log(`[G_ID ${r.G_ID}] [${ok ? '200' : '404'}] ${rawImg} | ${title.substring(0, 40)}`);
  }

  await src.end();
}
main().catch(console.error);

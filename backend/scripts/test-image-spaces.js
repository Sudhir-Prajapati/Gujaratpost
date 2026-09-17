const mysql = require('mysql2/promise');
const https = require('https');

function checkUrl(url) {
  return new Promise(resolve => {
    https.request(url, { method: 'HEAD' }, res => {
      resolve({ url, status: res.statusCode, length: res.headers['content-length'] });
    }).on('error', e => resolve({ url, error: e.message })).end();
  });
}

function decodeMojibake(str) {
  if (!str) return '';
  try {
    return Buffer.from(str, 'latin1').toString('utf8');
  } catch (e) {
    return str;
  }
}

async function run() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'root@123',
    database: 'gujaratpost_newsgujrati_today',
    charset: 'latin1'
  });

  const [rows] = await conn.query('SELECT NEWS_ID, NEWS_IMAGE FROM news WHERE NEWS_IMAGE LIKE "% %" LIMIT 5');
  console.log('Sample images with spaces in name:');
  for (const r of rows) {
    const raw = decodeMojibake(r.NEWS_IMAGE).trim();
    const encoded = encodeURI(`https://gujaratpost.in/news/${raw}`);
    const res = await checkUrl(encoded);
    console.log(`ID ${r.NEWS_ID}: raw="${raw}" -> ${res.status} (${res.length} bytes)`);
  }

  await conn.end();
}

run().catch(console.error);

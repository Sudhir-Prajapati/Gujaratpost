const mysql = require('mysql2/promise');
const https = require('https');

function decodeMojibake(str) {
  if (!str) return '';
  try {
    return Buffer.from(str, 'latin1').toString('utf8');
  } catch (e) {
    return str;
  }
}

function checkUrl(url) {
  return new Promise(resolve => {
    const req = https.request(url, { method: 'HEAD' }, res => {
      resolve({ status: res.statusCode, length: res.headers['content-length'] });
    });
    req.on('error', e => resolve({ status: 'ERROR', error: e.message }));
    req.setTimeout(5000, () => { req.destroy(); resolve({ status: 'TIMEOUT' }); });
    req.end();
  });
}

async function testUnicodeImages() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'root@123',
    database: 'gujaratpost_newsgujrati_today',
    charset: 'latin1'
  });

  const [rows] = await conn.query('SELECT NEWS_ID, NEWS_IMAGE FROM news WHERE NEWS_IMAGE LIKE "%à%" LIMIT 10');
  console.log(`Testing ${rows.length} Gujarati image filenames:`);

  for (const r of rows) {
    const raw = (r.NEWS_IMAGE || '').trim();
    const decoded = decodeMojibake(raw).trim();
    const url = encodeURI(`https://gujaratpost.in/news/${decoded}`);
    const res = await checkUrl(url);
    console.log(`ID ${r.NEWS_ID} | Decoded: "${decoded}" | Status: ${res.status} | Bytes: ${res.length}`);
  }

  await conn.end();
}

testUnicodeImages().catch(console.error);

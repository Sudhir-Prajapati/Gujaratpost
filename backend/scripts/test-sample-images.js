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
    https.request(url, { method: 'HEAD' }, res => {
      resolve({ url, status: res.statusCode });
    }).on('error', e => resolve({ url, status: 'ERROR', error: e.message })).end();
  });
}

async function testSample() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'root@123',
    database: 'gujaratpost_newsgujrati_today',
    charset: 'latin1'
  });

  const [rows] = await conn.query(
    'SELECT NEWS_ID, NEWS_IMAGE FROM news WHERE NEWS_IMAGE IS NOT NULL AND NEWS_IMAGE != "" ORDER BY RAND() LIMIT 50'
  );

  let success = 0;
  let notFound = 0;
  let errors = 0;

  for (const r of rows) {
    const rawName = decodeMojibake(r.NEWS_IMAGE).trim();
    const encodedUrl = encodeURI(`https://gujaratpost.in/news/${rawName}`);
    const res = await checkUrl(encodedUrl);
    if (res.status === 200) {
      success++;
    } else if (res.status === 404) {
      notFound++;
      console.log(`404: NEWS_ID ${r.NEWS_ID} -> ${rawName}`);
    } else {
      errors++;
      console.log(`Other status ${res.status}: NEWS_ID ${r.NEWS_ID}`);
    }
  }

  console.log(`\nSample Test 50 random images:`);
  console.log(`200 OK:   ${success} / 50 (${(success / 50 * 100).toFixed(1)}%)`);
  console.log(`404:      ${notFound} / 50`);
  console.log(`Errors:   ${errors} / 50`);

  await conn.end();
}

testSample().catch(console.error);

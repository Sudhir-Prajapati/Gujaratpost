const mysql = require('mysql2/promise');

function decodeMojibake(str) {
  if (!str) return '';
  try {
    return Buffer.from(str, 'latin1').toString('utf8');
  } catch (e) {
    return str;
  }
}

async function checkContentImages() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'root@123',
    database: 'gujaratpost_newsgujrati_today',
    charset: 'latin1'
  });

  const [rows] = await conn.query('SELECT NEWS_ID, NEWS_CONTENT FROM news WHERE NEWS_CONTENT LIKE "%<img%" LIMIT 50');
  console.log(`Found ${rows.length} sample posts with <img in content.`);

  const sampleSrcs = new Set();
  for (const r of rows) {
    const content = decodeMojibake(r.NEWS_CONTENT);
    const matches = content.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
    for (const m of matches) {
      sampleSrcs.add(m[1]);
    }
  }

  console.log('Sample content img src attributes:');
  console.log([...sampleSrcs].slice(0, 30));

  const [totalWithImg] = await conn.query('SELECT COUNT(*) as count FROM news WHERE NEWS_CONTENT LIKE "%<img%"');
  console.log('Total articles with <img in content:', totalWithImg[0].count);

  await conn.end();
}

checkContentImages().catch(console.error);

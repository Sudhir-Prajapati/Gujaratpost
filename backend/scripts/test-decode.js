const mysql = require('mysql2/promise');

async function check() {
  // Let's connect with charset latin1 vs utf8mb4 vs binary!
  console.log('Testing charsets on local MySQL...');

  // 1. When connecting as latin1 or binary:
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'root@123',
    database: 'gujaratpost_newsgujrati_today',
    charset: 'latin1'
  });

  const [rows] = await conn.query('SELECT NEWS_ID, NEWS_TITLE, NEWS_SLUG FROM news WHERE NEWS_ID = 33824');
  console.log('\nRaw title (latin1 connection):', rows[0].NEWS_TITLE);
  
  const rawBuf = Buffer.from(rows[0].NEWS_TITLE, 'latin1');
  console.log('Decoded as UTF-8:', rawBuf.toString('utf8'));

  // Test row 33823 (Trump crude oil)
  const [rows2] = await conn.query('SELECT NEWS_ID, NEWS_TITLE, NEWS_SLUG FROM news WHERE NEWS_ID = 33823');
  console.log('\nRow 33823 decoded as UTF-8:');
  console.log(Buffer.from(rows2[0].NEWS_TITLE, 'latin1').toString('utf8'));

  // Test row 33822 (Sushant Singh Rajput)
  const [rows3] = await conn.query('SELECT NEWS_ID, NEWS_TITLE, NEWS_SLUG FROM news WHERE NEWS_ID = 33822');
  console.log('\nRow 33822 decoded as UTF-8:');
  console.log(Buffer.from(rows3[0].NEWS_TITLE, 'latin1').toString('utf8'));

  // Test row 33820 (Fact check PM Modi selfie)
  const [rows4] = await conn.query('SELECT NEWS_ID, NEWS_TITLE, NEWS_SLUG FROM news WHERE NEWS_ID = 33820');
  console.log('\nRow 33820 decoded as UTF-8:');
  console.log(Buffer.from(rows4[0].NEWS_TITLE, 'latin1').toString('utf8'));

  // Also test an older article e.g. ID 8000 or 15000!
  const [rows5] = await conn.query('SELECT NEWS_ID, NEWS_TITLE, NEWS_SLUG FROM news WHERE NEWS_ID = 8004');
  console.log('\nRow 8004 (kumar-vishvas) decoded as UTF-8:');
  console.log(Buffer.from(rows5[0].NEWS_TITLE, 'latin1').toString('utf8'));

  await conn.end();
}

check().catch(console.error);

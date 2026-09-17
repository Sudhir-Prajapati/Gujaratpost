const mysql = require('mysql2/promise');

async function testContent() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'root@123',
    database: 'gujaratpost_newsgujrati_today',
    charset: 'latin1'
  });

  const [rows] = await conn.query('SELECT NEWS_ID, NEWS_TITLE, NEWS_CONTENT FROM news WHERE NEWS_ID = 33824');
  const title = Buffer.from(rows[0].NEWS_TITLE, 'latin1').toString('utf8');
  const content = Buffer.from(rows[0].NEWS_CONTENT, 'latin1').toString('utf8');

  console.log('=== NEWS_ID 33824 ===');
  console.log('Title:', title);
  console.log('\nContent (first 400 chars):');
  console.log(content.substring(0, 400));

  // Check comments table too!
  const [cmts] = await conn.query('SELECT id, newsTitle, comment FROM comments LIMIT 5');
  console.log('\n=== COMMENTS SAMPLE ===');
  for (const c of cmts) {
    const t = Buffer.from(c.newsTitle || '', 'latin1').toString('utf8');
    const msg = Buffer.from(c.comment || '', 'latin1').toString('utf8');
    console.log(`- Comment #${c.id}: "${msg}" on "${t}"`);
  }

  // Check category names
  const [cats] = await conn.query('SELECT CAT_ID, CAT_NAME, CAT_SLUG FROM category LIMIT 5');
  console.log('\n=== CATEGORIES SAMPLE ===');
  for (const c of cats) {
    const name = Buffer.from(c.CAT_NAME || '', 'latin1').toString('utf8');
    console.log(`- Cat #${c.CAT_ID}: "${name}" (${c.CAT_SLUG})`);
  }

  await conn.end();
}

testContent().catch(console.error);

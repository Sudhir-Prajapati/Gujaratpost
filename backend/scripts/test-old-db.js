const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('Connecting to local MySQL database: gujaratpost_newsgujrati_today...');
  
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'root@123',
    database: 'gujaratpost_newsgujrati_today',
    charset: 'utf8mb4'
  });

  console.log('Connected successfully!');

  // Check row counts across all tables
  const [tables] = await conn.query('SHOW TABLES');
  console.log('\n--- TABLES & ROW COUNTS ---');
  for (const row of tables) {
    const tableName = Object.values(row)[0];
    const [cnt] = await conn.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
    console.log(`- ${tableName}: ${cnt[0].count} rows`);
  }

  // Check sample news articles to check Gujarati encoding
  console.log('\n--- SAMPLE NEWS ARTICLES (checking text encoding) ---');
  const [news] = await conn.query('SELECT NEWS_ID, NEWS_TITLE, NEWS_SLUG, NEWS_CATEGORY, NEWS_IMAGE, NEWS_CREATED_DATE FROM news ORDER BY NEWS_ID DESC LIMIT 5');
  for (const n of news) {
    console.log(`\nID: ${n.NEWS_ID}`);
    console.log(`Slug: ${n.NEWS_SLUG}`);
    console.log(`Title: ${n.NEWS_TITLE}`);
    console.log(`Category: ${n.NEWS_CATEGORY}`);
    console.log(`Image: ${n.NEWS_IMAGE}`);
    console.log(`Date: ${n.NEWS_CREATED_DATE}`);
  }

  // Check categories
  console.log('\n--- CATEGORIES ---');
  const [cats] = await conn.query('SELECT CAT_ID, CAT_NAME, CAT_SLUG FROM category ORDER BY CAT_ID ASC LIMIT 10');
  for (const c of cats) {
    console.log(`ID: ${c.CAT_ID} | Name: ${c.CAT_NAME} | Slug: ${c.CAT_SLUG}`);
  }

  await conn.end();
}

testConnection().catch(err => {
  console.error('Connection error:', err.message);
});

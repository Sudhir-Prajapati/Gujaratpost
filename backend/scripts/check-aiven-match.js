const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function test() {
  const aiven = await mysql.createConnection({
    uri: process.env.AIVEN_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    charset: 'UTF8MB4',
    connectTimeout: 60000
  });
  const local = await mysql.createConnection({
    host: '127.0.0.1', port: 3306,
    user: 'gujaratpost', password: 'gujaratpost2005',
    database: 'gujaratpost', charset: 'utf8mb4'
  });

  const [aivenSample] = await aiven.query('SELECT id, slug, articleNumber, categoryId, title FROM posts LIMIT 5');
  console.log('Aiven sample posts:');
  console.table(aivenSample);

  // Check matching by articleNumber
  const [matchCount] = await local.query(`
    SELECT count(*) as cnt 
    FROM posts p 
    WHERE p.articleNumber IN (SELECT articleNumber FROM posts)
  `);
  console.log('Local posts count with articleNumber:', matchCount[0].cnt);

  // Check how many match Aiven by articleNumber
  const [aivenArticleNumbers] = await aiven.query('SELECT articleNumber, categoryId FROM posts WHERE articleNumber IS NOT NULL');
  console.log('Aiven posts with articleNumber count:', aivenArticleNumbers.length);

  await aiven.end();
  await local.end();
}

test().catch(console.error);

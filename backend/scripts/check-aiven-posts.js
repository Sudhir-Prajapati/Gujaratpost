const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function test() {
  const aiven = await mysql.createConnection({
    uri: process.env.AIVEN_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    charset: 'UTF8MB4',
    connectTimeout: 60000
  });

  const [postCnt] = await aiven.query('SELECT count(*) as cnt FROM posts');
  console.log('Total posts in Aiven:', postCnt[0].cnt);

  const [dist] = await aiven.query(`
    SELECT c.slug, c.name, c.nameGu, count(p.id) as cnt
    FROM categories c
    LEFT JOIN posts p ON p.categoryId = c.id
    GROUP BY c.id
    ORDER BY cnt DESC
    LIMIT 20
  `);
  console.log('Aiven posts distribution (Top 20):');
  console.table(dist);

  await aiven.end();
}

test().catch(console.error);

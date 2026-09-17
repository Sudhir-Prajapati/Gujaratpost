const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function test() {
  const aiven = await mysql.createConnection({
    uri: process.env.AIVEN_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    charset: 'UTF8MB4',
    connectTimeout: 60000
  });

  const [p] = await aiven.query(`
    SELECT p.* 
    FROM posts p 
    JOIN categories c ON p.categoryId = c.id
    WHERE c.slug = 'crime'
    LIMIT 1
  `);
  console.log('Sample crime post in Aiven:');
  console.log(p[0]);

  await aiven.end();
}

test().catch(console.error);

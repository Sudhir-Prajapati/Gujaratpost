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

  const [special] = await aiven.query(`
    SELECT p.id, p.title, p.slug, p.articleNumber, c.slug as catSlug, c.name as catName
    FROM posts p
    JOIN categories c ON p.categoryId = c.id
    WHERE c.slug IN ('crime', 'sports', 'technology', 'health', 'weather', 'education', 'gold-silver', 'webstory', 'instagram')
    LIMIT 20
  `);
  console.log('Sample special category posts in Aiven:');
  special.forEach(p => {
    console.log(`[${p.catSlug.padEnd(14)}] articleNum=${p.articleNumber} slug=${p.slug?.substring(0, 40)} title=${p.title?.substring(0, 40)}`);
  });

  // Check if these articles exist in local DB
  let foundInLocal = 0;
  for (const p of special) {
    let loc = [];
    if (p.articleNumber) {
      [loc] = await local.query('SELECT id, categoryId, title FROM posts WHERE articleNumber = ?', [p.articleNumber]);
    }
    if (loc.length === 0 && p.slug) {
      [loc] = await local.query('SELECT id, categoryId, title FROM posts WHERE slug = ?', [p.slug]);
    }
    if (loc.length > 0) {
      foundInLocal++;
    }
  }
  console.log(`\nFound in local DB: ${foundInLocal} / ${special.length}`);

  await aiven.end();
  await local.end();
}

test().catch(console.error);

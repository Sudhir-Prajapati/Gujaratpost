const mysql = require('mysql2/promise');

async function test() {
  const local = await mysql.createConnection({
    host: '127.0.0.1', port: 3306,
    user: 'gujaratpost', password: 'gujaratpost2005',
    database: 'gujaratpost', charset: 'utf8mb4'
  });

  const [onrender] = await local.query("SELECT count(*) as cnt FROM posts WHERE featuredImage LIKE '%onrender.com%'");
  console.log('Posts with onrender.com:', onrender[0].cnt);

  const [sample] = await local.query("SELECT id, articleNumber, titleGu, featuredImage FROM posts WHERE featuredImage LIKE '%onrender.com%' LIMIT 10");
  console.table(sample);

  // Check all image hostnames in DB
  const [hosts] = await local.query(`
    SELECT 
      CASE 
        WHEN featuredImage LIKE 'http%' THEN SUBSTRING_INDEX(SUBSTRING_INDEX(featuredImage, '/', 3), '/', -1)
        ELSE 'relative/other'
      END as host,
      count(*) as cnt
    FROM posts
    GROUP BY host
    ORDER BY cnt DESC
  `);
  console.log('\nAll image hosts in database:');
  console.table(hosts);

  await local.end();
}

test().catch(console.error);

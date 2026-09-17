const mysql = require('mysql2/promise');

async function inspectDuplicates() {
  const local = await mysql.createConnection({
    host: '127.0.0.1', port: 3306,
    user: 'gujaratpost', password: 'gujaratpost2005',
    database: 'gujaratpost', charset: 'utf8mb4'
  });

  const [dupTitles] = await local.query(`
    SELECT titleGu, count(*) as cnt
    FROM posts
    WHERE titleGu IS NOT NULL AND TRIM(titleGu) != ''
    GROUP BY titleGu
    HAVING cnt > 1
    ORDER BY cnt DESC
  `);

  console.log(`Analyzing ${dupTitles.length} duplicate title groups:\n`);

  for (const dt of dupTitles.slice(0, 15)) {
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`Title: "${dt.titleGu}" (${dt.cnt} copies)`);
    const [rows] = await local.query(`
      SELECT p.id, p.slug, p.articleNumber, c.slug as catSlug, p.views, p.createdAt, LENGTH(p.contentGu) as contentLen
      FROM posts p
      LEFT JOIN categories c ON p.categoryId = c.id
      WHERE p.titleGu = ?
      ORDER BY p.createdAt DESC
    `, [dt.titleGu]);
    console.table(rows);
  }

  await local.end();
}

inspectDuplicates().catch(console.error);

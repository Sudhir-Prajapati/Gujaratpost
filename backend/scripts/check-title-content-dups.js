const mysql = require('mysql2/promise');

async function checkTitleAndContentDuplicates() {
  const local = await mysql.createConnection({
    host: '127.0.0.1', port: 3306,
    user: 'gujaratpost', password: 'gujaratpost2005',
    database: 'gujaratpost', charset: 'utf8mb4'
  });

  // Group by titleGu and check
  const [dupTitles] = await local.query(`
    SELECT titleGu, count(*) as cnt
    FROM posts
    WHERE titleGu IS NOT NULL AND TRIM(titleGu) != ''
    GROUP BY titleGu
    HAVING cnt > 1
    ORDER BY cnt DESC
  `);

  console.log(`Found ${dupTitles.length} distinct titles that appear more than once.`);

  let totalDuplicateRows = 0;
  for (const dt of dupTitles) {
    totalDuplicateRows += (dt.cnt - 1);
  }
  console.log(`Total duplicate rows that would be deleted (keeping 1 per title): ${totalDuplicateRows}`);

  // Check how many of these also have identical/similar content
  let exactMatchCount = 0;
  for (const dt of dupTitles) {
    const [rows] = await local.query(`
      SELECT id, LEFT(contentGu, 100) as cPrefix, views, createdAt
      FROM posts
      WHERE titleGu = ?
    `, [dt.titleGu]);
    const prefixes = new Set(rows.map(r => r.cPrefix));
    if (prefixes.size === 1) {
      exactMatchCount++;
    }
  }
  console.log(`Out of ${dupTitles.length} duplicate title groups, ${exactMatchCount} have 100% identical content prefix!`);

  // Print all 78 titles and counts
  console.log('\nAll duplicate title groups:');
  dupTitles.forEach((d, i) => {
    console.log(`  ${String(i + 1).padStart(2)}. [${d.cnt}x] "${d.titleGu.substring(0, 60)}"`);
  });

  await local.end();
}

checkTitleAndContentDuplicates().catch(console.error);

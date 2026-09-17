const mysql = require('mysql2/promise');

async function checkDuplicates() {
  const local = await mysql.createConnection({
    host: '127.0.0.1', port: 3306,
    user: 'gujaratpost', password: 'gujaratpost2005',
    database: 'gujaratpost', charset: 'utf8mb4'
  });

  console.log('=== DUPLICATE ANALYSIS IN `posts` TABLE ===\n');

  const [total] = await local.query('SELECT count(*) as cnt FROM posts');
  console.log('Total posts in database:', total[0].cnt);

  // 1. Check duplicate articleNumber (non-null)
  const [dupArtNum] = await local.query(`
    SELECT articleNumber, count(*) as cnt
    FROM posts
    WHERE articleNumber IS NOT NULL
    GROUP BY articleNumber
    HAVING cnt > 1
    ORDER BY cnt DESC
  `);
  console.log(`\n1. Duplicate articleNumber: ${dupArtNum.length} distinct articleNumbers have duplicates.`);
  let dupArtNumTotalRows = 0;
  dupArtNum.forEach(d => dupArtNumTotalRows += (d.cnt - 1));
  console.log(`   Total duplicate rows by articleNumber: ${dupArtNumTotalRows}`);
  if (dupArtNum.length > 0) {
    console.log('   Sample duplicate articleNumbers:');
    console.table(dupArtNum.slice(0, 10));
  }

  // 2. Check duplicate titleGu
  const [dupTitleGu] = await local.query(`
    SELECT titleGu, count(*) as cnt
    FROM posts
    WHERE titleGu IS NOT NULL AND TRIM(titleGu) != ''
    GROUP BY titleGu
    HAVING cnt > 1
    ORDER BY cnt DESC
  `);
  console.log(`\n2. Duplicate titleGu: ${dupTitleGu.length} distinct Gujarati titles have duplicates.`);
  let dupTitleGuTotalRows = 0;
  dupTitleGu.forEach(d => dupTitleGuTotalRows += (d.cnt - 1));
  console.log(`   Total duplicate rows by titleGu: ${dupTitleGuTotalRows}`);
  if (dupTitleGu.length > 0) {
    console.log('   Sample duplicate titleGu:');
    dupTitleGu.slice(0, 10).forEach(d => console.log(`   [${d.cnt}x] "${d.titleGu.substring(0, 70)}"`));
  }

  // 3. Check duplicate slug
  const [dupSlug] = await local.query(`
    SELECT slug, count(*) as cnt
    FROM posts
    GROUP BY slug
    HAVING cnt > 1
  `);
  console.log(`\n3. Duplicate slugs: ${dupSlug.length}`);

  // 4. Sample check: For the duplicate articleNumbers, what are their IDs, titles, slugs, createdAt, categoryId?
  if (dupArtNum.length > 0) {
    const sampleArtNum = dupArtNum[0].articleNumber;
    const [sampleRows] = await local.query('SELECT id, slug, articleNumber, titleGu, categoryId, createdAt, views FROM posts WHERE articleNumber = ?', [sampleArtNum]);
    console.log(`\nSample rows for duplicate articleNumber = ${sampleArtNum}:`);
    console.table(sampleRows);
  }

  await local.end();
}

checkDuplicates().catch(console.error);

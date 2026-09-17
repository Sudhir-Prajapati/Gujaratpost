const mysql = require('mysql2/promise');

async function analyzeCategories() {
  const local = await mysql.createConnection({
    host: '127.0.0.1', port: 3306,
    user: 'gujaratpost', password: 'gujaratpost2005',
    database: 'gujaratpost', charset: 'utf8mb4'
  });

  console.log('=== CATEGORY vs ARTICLE COUNT ANALYSIS ===\n');

  // Get all categories with article counts
  const [rows] = await local.query(`
    SELECT 
      c.slug,
      c.name,
      c.nameGu,
      c.id as categoryId,
      COUNT(p.id) as articleCount
    FROM categories c
    LEFT JOIN posts p ON p.categoryId = c.id
    GROUP BY c.id
    ORDER BY articleCount DESC, c.displayOrder
  `);

  const withArticles = rows.filter(r => r.articleCount > 0);
  const noArticles = rows.filter(r => r.articleCount === 0);

  console.log(`Categories WITH articles (${withArticles.length}):`);
  withArticles.forEach(r => {
    console.log(`  ✓ [${String(r.articleCount).padStart(5)}] ${r.slug.padEnd(38)} ${r.nameGu}`);
  });

  console.log(`\nCategories WITH ZERO articles (${noArticles.length}) ← PROBLEM:`);
  noArticles.forEach(r => {
    console.log(`  ✗ [    0] ${r.slug.padEnd(38)} ${r.nameGu}  [id: ${r.categoryId}]`);
  });

  // Now check if posts exist with unmatched categoryIds (orphaned articles)
  const [orphans] = await local.query(`
    SELECT 
      p.categoryId,
      COUNT(*) as cnt
    FROM posts p
    WHERE p.categoryId NOT IN (SELECT id FROM categories)
    GROUP BY p.categoryId
    ORDER BY cnt DESC
  `);

  console.log(`\n=== ORPHANED POSTS (categoryId not in categories table): ${orphans.length} orphaned categoryIds ===`);
  if (orphans.length > 0) {
    orphans.forEach(r => {
      console.log(`  categoryId: ${r.categoryId}  →  ${r.cnt} articles (orphaned)`);
    });
  } else {
    console.log('  None — all posts have valid categoryIds');
  }

  // Total posts count
  const [total] = await local.query('SELECT COUNT(*) as cnt FROM posts');
  const [linked] = await local.query('SELECT COUNT(*) as cnt FROM posts WHERE categoryId IN (SELECT id FROM categories)');
  console.log(`\nTotal posts: ${total[0].cnt}`);
  console.log(`Posts with valid category: ${linked[0].cnt}`);
  console.log(`Posts with INVALID/orphaned category: ${total[0].cnt - linked[0].cnt}`);

  await local.end();
}

analyzeCategories().catch(console.error);

const mysql = require('mysql2/promise');

async function deepAnalysis() {
  const src = await mysql.createConnection({
    host: '127.0.0.1', port: 3306,
    user: 'root', password: 'root@123',
    database: 'gujaratpost_newsgujrati_today', charset: 'utf8mb4'
  });
  const local = await mysql.createConnection({
    host: '127.0.0.1', port: 3306,
    user: 'gujaratpost', password: 'gujaratpost2005',
    database: 'gujaratpost', charset: 'utf8mb4'
  });

  console.log('=== OLD DB: All categories in `category` table ===\n');
  const [oldCats] = await src.query(`
    SELECT c.id, c.catname, COUNT(n.id) as articleCount
    FROM category c
    LEFT JOIN news n ON n.catid = c.id
    GROUP BY c.id
    ORDER BY articleCount DESC
  `);
  oldCats.forEach(r => console.log(`  oldId=${String(r.id).padStart(3)}  [${String(r.articleCount).padStart(6)}] catname="${r.catname}"`));

  console.log('\n=== OLD DB: What category names contain key topics? ===\n');
  const keywords = ['crime', 'health', 'technology', 'gujarat', 'ahmedabad', 'vadodara', 'surat', 'india', 'world', 'entertainment', 'politics', 'sport', 'education', 'manoranjan', 'desh', 'videsh'];
  for (const kw of keywords) {
    const matched = oldCats.filter(c => (c.catname||'').toLowerCase().includes(kw));
    if (matched.length > 0) {
      matched.forEach(r => console.log(`  keyword="${kw.padEnd(15)}" → catname="${r.catname}"  count=${r.articleCount}`));
    } else {
      console.log(`  keyword="${kw.padEnd(15)}" → NO MATCH`);
    }
  }

  console.log('\n=== LOCAL DB: Category UUIDs articles are stored under ===\n');
  const [localDist] = await local.query(`
    SELECT c.slug, c.name, c.id, COUNT(p.id) as cnt
    FROM categories c
    LEFT JOIN posts p ON p.categoryId = c.id
    GROUP BY c.id
    ORDER BY cnt DESC
    LIMIT 20
  `);
  localDist.forEach(r => console.log(`  [${String(r.cnt).padStart(6)}] slug="${r.slug.padEnd(35)}" id=${r.id}`));

  console.log('\n=== MIGRATION SCRIPT: check how old catid was mapped to new category slugs ===');
  console.log('The migration script mapped old `catid` → new category by name matching.');
  console.log('Let us see what catids map to what in old DB:\n');
  const [newsDistribution] = await src.query(`
    SELECT n.catid, c.catname, COUNT(n.id) as cnt
    FROM news n
    LEFT JOIN category c ON c.id = n.catid
    GROUP BY n.catid
    ORDER BY cnt DESC
  `);
  newsDistribution.forEach(r => console.log(`  catid=${String(r.catid).padStart(3)}  catname="${(r.catname||'null').padEnd(35)}"  articles=${r.cnt}`));

  await src.end();
  await local.end();
}

deepAnalysis().catch(console.error);

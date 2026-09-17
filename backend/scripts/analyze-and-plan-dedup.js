const mysql = require('mysql2/promise');

async function getDuplicateArticles() {
  const local = await mysql.createConnection({
    host: '127.0.0.1', port: 3306,
    user: 'gujaratpost', password: 'gujaratpost2005',
    database: 'gujaratpost', charset: 'utf8mb4'
  });

  const startTime = Date.now();

  const [dups] = await local.query(`
    SELECT p.id, p.titleGu, p.slug, p.articleNumber, p.views, p.createdAt
    FROM posts p
    INNER JOIN (
      SELECT titleGu
      FROM posts
      WHERE titleGu IS NOT NULL AND TRIM(titleGu) != ''
      GROUP BY titleGu
      HAVING count(*) > 1
    ) d ON p.titleGu = d.titleGu
    ORDER BY p.titleGu, p.views DESC, p.createdAt DESC
  `);

  console.log(`Found ${dups.length} total rows belonging to duplicate title groups (took ${Date.now() - startTime}ms)`);

  // Group by titleGu
  const groups = new Map();
  for (const d of dups) {
    if (!groups.has(d.titleGu)) groups.set(d.titleGu, []);
    groups.get(d.titleGu).push(d);
  }

  console.log(`Number of duplicate title groups: ${groups.size}`);

  const toKeep = [];
  const toDelete = [];

  for (const [title, rows] of groups.entries()) {
    // Selection strategy for which one to KEEP:
    // 1. Prefer the one with highest views
    // 2. If views are equal, prefer the one with a non-null articleNumber (original from client's archive)
    // 3. If still equal, prefer the earliest createdAt
    rows.sort((a, b) => {
      if (b.views !== a.views) return b.views - a.views;
      if (a.articleNumber && !b.articleNumber) return -1;
      if (!a.articleNumber && b.articleNumber) return 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    const keep = rows[0];
    const remove = rows.slice(1);

    toKeep.push(keep);
    toDelete.push(...remove);
  }

  console.log(`Unique articles to KEEP: ${toKeep.length}`);
  console.log(`Duplicate articles to DELETE: ${toDelete.length}`);

  console.log('\nSample 10 keep vs delete:');
  for (let i = 0; i < Math.min(10, groups.size); i++) {
    const title = Array.from(groups.keys())[i];
    const rows = groups.get(title);
    const keep = rows[0];
    const remove = rows.slice(1);
    console.log(`\nTitle: "${title.substring(0, 60)}"`);
    console.log(`  KEEP   -> id: ${keep.id.substring(0, 8)} | views: ${keep.views} | artNum: ${keep.articleNumber} | slug: ${keep.slug.substring(0, 45)}`);
    remove.forEach(r => {
      console.log(`  DELETE -> id: ${r.id.substring(0, 8)} | views: ${r.views} | artNum: ${r.articleNumber} | slug: ${r.slug.substring(0, 45)}`);
    });
  }

  await local.end();
}

getDuplicateArticles().catch(console.error);

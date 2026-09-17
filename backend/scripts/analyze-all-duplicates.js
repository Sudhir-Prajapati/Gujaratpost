const mysql = require('mysql2/promise');

async function analyzeAllDuplicates() {
  const local = await mysql.createConnection({
    host: '127.0.0.1', port: 3306,
    user: 'gujaratpost', password: 'gujaratpost2005',
    database: 'gujaratpost', charset: 'utf8mb4'
  });

  const [total] = await local.query('SELECT count(*) as cnt FROM posts');
  console.log('Total posts before deduplication:', total[0].cnt);

  // 1. Fetch all rows that share titleGu with another row
  const [guRows] = await local.query(`
    SELECT p.id, p.titleGu, p.title, p.slug, p.articleNumber, p.views, p.createdAt
    FROM posts p
    INNER JOIN (
      SELECT titleGu
      FROM posts
      WHERE titleGu IS NOT NULL AND TRIM(titleGu) != ''
      GROUP BY titleGu
      HAVING count(*) > 1
    ) d ON p.titleGu = d.titleGu
  `);

  // 2. Fetch all rows that share title (English) with another row
  const [enRows] = await local.query(`
    SELECT p.id, p.titleGu, p.title, p.slug, p.articleNumber, p.views, p.createdAt
    FROM posts p
    INNER JOIN (
      SELECT title
      FROM posts
      WHERE title IS NOT NULL AND TRIM(title) != ''
      GROUP BY title
      HAVING count(*) > 1
    ) d ON p.title = d.title
  `);

  // Union by ID
  const allRowsMap = new Map();
  guRows.forEach(r => allRowsMap.set(r.id, r));
  enRows.forEach(r => allRowsMap.set(r.id, r));

  console.log(`\nTotal rows involved in duplicates (by titleGu OR title): ${allRowsMap.size}`);

  // Disjoint set / clustering by shared titleGu OR shared title
  const idToGroup = new Map();
  const groups = [];

  for (const row of allRowsMap.values()) {
    let matchedGroup = null;

    // Check if this row's titleGu or title matches an existing group
    for (const group of groups) {
      const hasMatch = group.some(item => 
        (item.titleGu && row.titleGu && item.titleGu.trim() === row.titleGu.trim()) ||
        (item.title && row.title && item.title.trim().toLowerCase() === row.title.trim().toLowerCase())
      );
      if (hasMatch) {
        matchedGroup = group;
        break;
      }
    }

    if (matchedGroup) {
      matchedGroup.push(row);
    } else {
      groups.push([row]);
    }
  }

  console.log(`Disjoint duplicate clusters: ${groups.length}`);

  let totalToKeep = 0;
  let totalToDelete = 0;
  const toDeleteIds = [];

  for (const group of groups) {
    // Sort to determine which one to keep
    group.sort((a, b) => {
      // 1. Higher views first
      if (b.views !== a.views) return b.views - a.views;
      // 2. Original archive articleNumber preferred
      if (a.articleNumber && !b.articleNumber) return -1;
      if (!a.articleNumber && b.articleNumber) return 1;
      // 3. Earliest createdAt
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    const keep = group[0];
    const remove = group.slice(1);

    totalToKeep++;
    totalToDelete += remove.length;
    remove.forEach(r => toDeleteIds.push(r.id));
  }

  console.log(`\nArticles to KEEP: ${totalToKeep}`);
  console.log(`Duplicate articles to DELETE: ${totalToDelete}`);
  console.log(`Expected total posts after cleanup: ${total[0].cnt - totalToDelete}`);

  await local.end();
}

analyzeAllDuplicates().catch(console.error);

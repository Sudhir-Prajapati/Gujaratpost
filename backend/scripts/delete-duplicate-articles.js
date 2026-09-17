const mysql = require('mysql2/promise');

async function deleteDuplicates() {
  console.log('========================================================================');
  console.log('              DUPLICATE ARTICLES CLEANUP & DEDUPLICATION                ');
  console.log('========================================================================\n');

  const local = await mysql.createConnection({
    host: '127.0.0.1', port: 3306,
    user: 'gujaratpost', password: 'gujaratpost2005',
    database: 'gujaratpost', charset: 'utf8mb4'
  });

  const startTime = Date.now();

  const [totalBefore] = await local.query('SELECT count(*) as cnt FROM posts');
  console.log(`[1/4] Total articles before cleanup: ${totalBefore[0].cnt}`);

  // Fetch all rows belonging to duplicate titleGu groups
  console.log('[2/4] Identifying duplicate article clusters...');
  const [guRows] = await local.query(`
    SELECT p.id, p.titleGu, p.title, p.slug, p.articleNumber, p.views, p.createdAt, p.categoryId
    FROM posts p
    INNER JOIN (
      SELECT titleGu
      FROM posts
      WHERE titleGu IS NOT NULL AND TRIM(titleGu) != ''
      GROUP BY titleGu
      HAVING count(*) > 1
    ) d ON p.titleGu = d.titleGu
  `);

  // Fetch all rows belonging to duplicate title (English) groups
  const [enRows] = await local.query(`
    SELECT p.id, p.titleGu, p.title, p.slug, p.articleNumber, p.views, p.createdAt, p.categoryId
    FROM posts p
    INNER JOIN (
      SELECT title
      FROM posts
      WHERE title IS NOT NULL AND TRIM(title) != ''
      GROUP BY title
      HAVING count(*) > 1
    ) d ON p.title = d.title
  `);

  // Merge unique by id
  const allRowsMap = new Map();
  guRows.forEach(r => allRowsMap.set(r.id, r));
  enRows.forEach(r => allRowsMap.set(r.id, r));

  console.log(`✓ Found ${allRowsMap.size} rows involved in duplicate clusters.`);

  // Cluster by matching titleGu or title
  const groups = [];
  for (const row of allRowsMap.values()) {
    let matchedGroup = null;
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

  console.log(`✓ Grouped into ${groups.length} distinct duplicate clusters.`);

  const toKeep = [];
  const toDelete = [];

  for (const group of groups) {
    // Sort logic:
    // 1. Highest views first
    // 2. Original archive articleNumber preferred
    // 3. Earliest createdAt
    group.sort((a, b) => {
      if (b.views !== a.views) return b.views - a.views;
      if (a.articleNumber && !b.articleNumber) return -1;
      if (!a.articleNumber && b.articleNumber) return 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    const keep = group[0];
    const remove = group.slice(1);

    toKeep.push(keep);
    toDelete.push(...remove);
  }

  console.log(`  Articles to KEEP   : ${toKeep.length}`);
  console.log(`  Articles to DELETE : ${toDelete.length}\n`);

  if (toDelete.length === 0) {
    console.log('No duplicates found to delete. Exiting.');
    await local.end();
    return;
  }

  // 3. Delete duplicates
  console.log('[3/4] Deleting duplicate articles from `posts`...');
  const deleteIds = toDelete.map(d => d.id);

  // Delete in batches of 50
  const BATCH_SIZE = 50;
  let deletedCount = 0;

  for (let i = 0; i < deleteIds.length; i += BATCH_SIZE) {
    const chunk = deleteIds.slice(i, i + BATCH_SIZE);
    const placeholders = chunk.map(() => '?').join(', ');
    const [res] = await local.query(
      `DELETE FROM posts WHERE id IN (${placeholders})`,
      chunk
    );
    deletedCount += res.affectedRows;
  }

  console.log(`✓ Successfully deleted ${deletedCount} duplicate articles.\n`);

  // 4. Verification
  console.log('[4/4] Verifying database integrity after cleanup...');
  const [totalAfter] = await local.query('SELECT count(*) as cnt FROM posts');
  console.log(`✓ Total articles remaining: ${totalAfter[0].cnt} (was ${totalBefore[0].cnt})`);

  // Re-check for any remaining duplicates
  const [remainingDups] = await local.query(`
    SELECT titleGu, count(*) as cnt
    FROM posts
    WHERE titleGu IS NOT NULL AND TRIM(titleGu) != ''
    GROUP BY titleGu
    HAVING count(*) > 1
  `);
  console.log(`✓ Remaining duplicate titleGu groups: ${remainingDups.length}`);

  const [remainingEnDups] = await local.query(`
    SELECT title, count(*) as cnt
    FROM posts
    WHERE title IS NOT NULL AND TRIM(title) != ''
    GROUP BY title
    HAVING count(*) > 1
  `);
  console.log(`✓ Remaining duplicate English title groups: ${remainingEnDups.length}`);

  console.log(`\nCleanup finished in ${((Date.now() - startTime) / 1000).toFixed(1)}s.`);
  console.log('========================================================================');

  await local.end();
}

deleteDuplicates().catch(console.error);

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function executeCleanup() {
  console.log('========================================================================');
  console.log('       SAFE ARTICLE CLEANUP: REMOVING 351 NON-ARCHIVE POSTS             ');
  console.log('========================================================================\n');

  const local = await mysql.createConnection({
    host: '127.0.0.1', port: 3306, user: 'root', password: 'root@123', database: 'gujaratpost'
  });

  // 1. Fetch old news dump identifiers
  console.log('[1/6] Loading authentic news IDs and slugs from old dump...');
  const [oldNews] = await local.query('SELECT NEWS_ID, NEWS_SLUG FROM gujaratpost_newsgujrati_today.news');
  const oldNewsIdSet = new Set(oldNews.map(n => n.NEWS_ID));
  const oldNewsSlugSet = new Set(oldNews.filter(n => n.NEWS_SLUG).map(n => n.NEWS_SLUG.trim().toLowerCase()));
  console.log(`✓ Loaded ${oldNews.length} authentic news records from old dump.`);

  // 2. Classify local posts
  console.log('\n[2/6] Classifying current local posts...');
  const [currentPosts] = await local.query('SELECT id, articleNumber, slug, title, categoryId, createdAt FROM posts');
  console.log(`Current total posts in local DB: ${currentPosts.length}`);

  const toKeep = [];
  const toDelete = [];

  for (const p of currentPosts) {
    const matchesId = p.articleNumber && oldNewsIdSet.has(p.articleNumber);
    const matchesSlug = p.slug && oldNewsSlugSet.has(p.slug.trim().toLowerCase());

    if (matchesId || matchesSlug) {
      toKeep.push(p);
    } else {
      toDelete.push(p);
    }
  }

  console.log(`✓ Posts to KEEP (from old dump): ${toKeep.length}`);
  console.log(`✓ Posts to DELETE (Aiven-only / non-archive): ${toDelete.length}`);

  if (toDelete.length !== 351) {
    console.warn(`Note: Found ${toDelete.length} posts to delete (expected 351).`);
  }

  const deleteIds = toDelete.map(p => p.id);
  const deleteIdSet = new Set(deleteIds);

  // 3. Backup the posts to be deleted to a JSON file
  console.log('\n[3/6] Backing up posts before deletion...');
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Fetch full records of toDelete
  const [fullDeletedRecords] = await local.query('SELECT * FROM posts WHERE id IN (?)', [deleteIds]);
  const backupFile = path.join(backupDir, `deleted_posts_backup_${Date.now()}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(fullDeletedRecords, null, 2));
  console.log(`✓ Saved backup of ${fullDeletedRecords.length} records to ${backupFile}`);

  // 4. Update Hero Settings before deletion to prevent dangling references
  console.log('\n[4/6] Updating Hero Settings with top authentic news from dump...');
  const [topAuthentic] = await local.query(`
    SELECT id, articleNumber, title, featuredImage, createdAt
    FROM posts
    WHERE id NOT IN (?)
      AND featuredImage IS NOT NULL AND featuredImage != ''
      AND status = 'PUBLISHED'
    ORDER BY createdAt DESC, articleNumber DESC
    LIMIT 20
  `, [deleteIds]);

  console.log(`Found ${topAuthentic.length} top authentic articles to assign to hero section:`);
  topAuthentic.slice(0, 3).forEach((p, idx) => {
    console.log(`  Slot ${idx + 1}: [Art# ${p.articleNumber}] ${p.title?.substring(0, 60)}`);
  });

  const [heroSettings] = await local.query('SELECT * FROM hero_settings LIMIT 1');
  if (heroSettings.length > 0) {
    const hs = heroSettings[0];
    const newSlot1 = topAuthentic[0]?.id || hs.slot1Id;
    const newSlot2 = topAuthentic[1]?.id || hs.slot2Id;
    const newSlot3 = topAuthentic[2]?.id || hs.slot3Id;

    // Filter JSON arrays
    const cleanArray = (jsonStr) => {
      try {
        const arr = JSON.parse(jsonStr || '[]');
        return arr.filter(id => !deleteIdSet.has(id));
      } catch (e) {
        return [];
      }
    };

    let heroGrid = cleanArray(hs.heroGridIds);
    let trending = cleanArray(hs.trendingNewsIds);
    let popular = cleanArray(hs.popularNewsIds);

    // Ensure we have top IDs populated
    const topIds = topAuthentic.map(p => p.id);
    if (heroGrid.length < 5) heroGrid = [...new Set([...topIds.slice(0, 10), ...heroGrid])];
    if (trending.length < 5) trending = [...new Set([...topIds.slice(2, 12), ...trending])];
    if (popular.length < 5) popular = [...new Set([...topIds.slice(5, 15), ...popular])];

    await local.query(`
      UPDATE hero_settings
      SET slot1Id = ?,
          slot2Id = ?,
          slot3Id = ?,
          heroGridIds = ?,
          trendingNewsIds = ?,
          popularNewsIds = ?,
          updatedAt = NOW()
      WHERE id = ?
    `, [
      newSlot1,
      newSlot2,
      newSlot3,
      JSON.stringify(heroGrid),
      JSON.stringify(trending),
      JSON.stringify(popular),
      hs.id
    ]);
    console.log('✓ Hero Settings successfully updated with authentic articles.');
  }

  // 5. Delete post_tags and posts
  console.log('\n[5/6] Deleting 351 posts and related tags...');
  const [tagDelResult] = await local.query('DELETE FROM post_tags WHERE postId IN (?)', [deleteIds]);
  console.log(`✓ Deleted ${tagDelResult.affectedRows} post_tags associations.`);

  const [postDelResult] = await local.query('DELETE FROM posts WHERE id IN (?)', [deleteIds]);
  console.log(`✓ Deleted ${postDelResult.affectedRows} posts.`);

  // 6. Verify final database state
  console.log('\n[6/6] Verifying final database state...');
  const [[{ finalCount }]] = await local.query('SELECT COUNT(*) as finalCount FROM posts');
  console.log(`Final total posts in database: ${finalCount} (Expected: ${toKeep.length})`);

  const [remainingDeleted] = await local.query('SELECT COUNT(*) as cnt FROM posts WHERE id IN (?)', [deleteIds]);
  console.log(`Remaining posts in delete set: ${remainingDeleted[0].cnt} (Expected: 0)`);

  await local.end();

  console.log('\n========================================================================');
  console.log('                      CLEANUP COMPLETE                                  ');
  console.log('========================================================================\n');
}

executeCleanup().catch(console.error);

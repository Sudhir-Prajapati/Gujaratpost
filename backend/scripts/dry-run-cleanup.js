const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function dryRun() {
  console.log('=== DRY RUN: INSPECTING 351 POSTS TO BE REMOVED ===\n');

  const local = await mysql.createConnection({
    host: '127.0.0.1', port: 3306, user: 'root', password: 'root@123', database: 'gujaratpost'
  });

  // 1. Get all NEWS_ID from old dump
  const [oldNews] = await local.query('SELECT NEWS_ID, NEWS_SLUG FROM gujaratpost_newsgujrati_today.news');
  const oldNewsIdSet = new Set(oldNews.map(n => n.NEWS_ID));
  const oldNewsSlugSet = new Set(oldNews.filter(n => n.NEWS_SLUG).map(n => n.NEWS_SLUG.trim().toLowerCase()));

  console.log(`Old dump total news items: ${oldNews.length}`);

  // 2. Get all local posts
  const [localPosts] = await local.query('SELECT id, articleNumber, slug, title, categoryId, createdAt, featuredImage FROM posts');
  console.log(`Current local posts: ${localPosts.length}`);

  // 3. Separate posts that are in the old dump vs posts that are NOT in the old dump
  const postsFromOldDump = [];
  const postsNotFromOldDump = [];

  for (const p of localPosts) {
    const matchesId = p.articleNumber && oldNewsIdSet.has(p.articleNumber);
    const matchesSlug = p.slug && oldNewsSlugSet.has(p.slug.trim().toLowerCase());

    if (matchesId || matchesSlug) {
      postsFromOldDump.push(p);
    } else {
      postsNotFromOldDump.push(p);
    }
  }

  console.log(`\nPosts from Old Dump to KEEP: ${postsFromOldDump.length}`);
  console.log(`Posts NOT from Old Dump to DELETE: ${postsNotFromOldDump.length}`);

  console.log('\n--- Sample of Posts to be DELETED (First 10) ---');
  postsNotFromOldDump.slice(0, 10).forEach((p, idx) => {
    console.log(`${idx + 1}. [Art# ${p.articleNumber}] [${p.createdAt.toISOString?.() || p.createdAt}] ${p.title?.substring(0, 70)}`);
  });

  console.log('\n--- Sample of Posts to be KEPT (First 5) ---');
  postsFromOldDump.slice(0, 5).forEach((p, idx) => {
    console.log(`${idx + 1}. [Art# ${p.articleNumber}] [${p.createdAt.toISOString?.() || p.createdAt}] ${p.title?.substring(0, 70)}`);
  });

  // Check hero settings references
  const [heroSettings] = await local.query('SELECT * FROM hero_settings LIMIT 1');
  if (heroSettings.length > 0) {
    const hs = heroSettings[0];
    const deleteIdsSet = new Set(postsNotFromOldDump.map(p => p.id));
    console.log('\n--- Hero Settings Impact Check ---');
    console.log('Slot 1 ID in delete set?', deleteIdsSet.has(hs.slot1Id));
    console.log('Slot 2 ID in delete set?', deleteIdsSet.has(hs.slot2Id));
    console.log('Slot 3 ID in delete set?', deleteIdsSet.has(hs.slot3Id));
  }

  await local.end();
}

dryRun().catch(console.error);

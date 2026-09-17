const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function analyzeOverlap() {
  console.log('=== ANALYZING OVERLAP ACROSS 3 DATASETS ===\n');

  const local = await mysql.createConnection({
    host: '127.0.0.1', port: 3306, user: 'root', password: 'root@123', database: 'gujaratpost'
  });

  const aiven = await mysql.createConnection(process.env.AIVEN_DATABASE_URL);

  console.log('1. Fetching Local Posts...');
  const [localPosts] = await local.query('SELECT id, articleNumber, slug, title FROM posts');
  console.log(`Local posts: ${localPosts.length}`);

  console.log('2. Fetching Aiven Posts...');
  const [aivenPosts] = await aiven.query('SELECT id, articleNumber, slug, title FROM posts');
  console.log(`Aiven posts: ${aivenPosts.length}`);

  console.log('3. Fetching Old News Dump (gujaratpost_newsgujrati_today)...');
  const [oldNews] = await local.query('SELECT NEWS_ID, NEWS_TITLE, NEWS_SLUG FROM gujaratpost_newsgujrati_today.news');
  console.log(`Old news count: ${oldNews.length}`);

  // Maps for Local
  const localIdMap = new Map(localPosts.map(p => [p.id, p]));
  const localSlugMap = new Map(localPosts.map(p => [p.slug?.trim().toLowerCase(), p]));
  const localTitleMap = new Map(localPosts.map(p => [p.title?.trim().toLowerCase(), p]));
  const localArtNumMap = new Map(localPosts.filter(p => p.articleNumber).map(p => [p.articleNumber, p]));

  // Maps for Aiven
  const aivenIdMap = new Map(aivenPosts.map(p => [p.id, p]));
  const aivenSlugMap = new Map(aivenPosts.map(p => [p.slug?.trim().toLowerCase(), p]));
  const aivenTitleMap = new Map(aivenPosts.map(p => [p.title?.trim().toLowerCase(), p]));
  const aivenArtNumMap = new Map(aivenPosts.filter(p => p.articleNumber).map(p => [p.articleNumber, p]));

  // Maps for Old News Dump
  const oldNewsIdMap = new Map(oldNews.map(n => [n.NEWS_ID, n]));
  const oldNewsSlugMap = new Map(oldNews.map(n => [n.NEWS_SLUG?.trim().toLowerCase(), n]));
  const oldNewsTitleMap = new Map(oldNews.map(n => [n.NEWS_TITLE?.trim().toLowerCase(), n]));

  console.log('\n--- MATCH ANALYSIS ---');

  // How many local posts match Aiven?
  let localInAivenById = 0;
  let localInAivenBySlug = 0;
  let localInAivenByTitle = 0;
  let localInAivenByArtNum = 0;
  let localInAivenAny = 0;

  for (const lp of localPosts) {
    const mId = aivenIdMap.has(lp.id);
    const mSlug = lp.slug && aivenSlugMap.has(lp.slug.trim().toLowerCase());
    const mTitle = lp.title && aivenTitleMap.has(lp.title.trim().toLowerCase());
    const mArtNum = lp.articleNumber && aivenArtNumMap.has(lp.articleNumber);

    if (mId) localInAivenById++;
    if (mSlug) localInAivenBySlug++;
    if (mTitle) localInAivenByTitle++;
    if (mArtNum) localInAivenByArtNum++;
    if (mId || mSlug || mTitle) localInAivenAny++;
  }

  console.log(`Local posts matching Aiven by ID: ${localInAivenById}`);
  console.log(`Local posts matching Aiven by Slug: ${localInAivenBySlug}`);
  console.log(`Local posts matching Aiven by Title: ${localInAivenByTitle}`);
  console.log(`Local posts matching Aiven by ArticleNumber: ${localInAivenByArtNum}`);
  console.log(`Local posts matching Aiven by ANY (ID/Slug/Title): ${localInAivenAny}`);

  // How many local posts match Old News Dump?
  let localInOldBySlug = 0;
  let localInOldByTitle = 0;
  let localInOldByArtNum = 0;
  let localInOldAny = 0;

  for (const lp of localPosts) {
    const mSlug = lp.slug && oldNewsSlugMap.has(lp.slug.trim().toLowerCase());
    const mTitle = lp.title && oldNewsTitleMap.has(lp.title.trim().toLowerCase());
    const mArtNum = lp.articleNumber && oldNewsIdMap.has(lp.articleNumber);

    if (mSlug) localInOldBySlug++;
    if (mTitle) localInOldByTitle++;
    if (mArtNum) localInOldByArtNum++;
    if (mSlug || mTitle || mArtNum) localInOldAny++;
  }

  console.log(`\nLocal posts matching Old Dump by Slug: ${localInOldBySlug}`);
  console.log(`Local posts matching Old Dump by Title: ${localInOldByTitle}`);
  console.log(`Local posts matching Old Dump by ArticleNumber=NEWS_ID: ${localInOldByArtNum}`);
  console.log(`Local posts matching Old Dump by ANY: ${localInOldAny}`);

  // How many Aiven posts match Old News Dump?
  let aivenInOldBySlug = 0;
  let aivenInOldByTitle = 0;
  let aivenInOldByArtNum = 0;
  let aivenInOldAny = 0;

  for (const ap of aivenPosts) {
    const mSlug = ap.slug && oldNewsSlugMap.has(ap.slug.trim().toLowerCase());
    const mTitle = ap.title && oldNewsTitleMap.has(ap.title.trim().toLowerCase());
    const mArtNum = ap.articleNumber && oldNewsIdMap.has(ap.articleNumber);

    if (mSlug) aivenInOldBySlug++;
    if (mTitle) aivenInOldByTitle++;
    if (mArtNum) aivenInOldByArtNum++;
    if (mSlug || mTitle || mArtNum) aivenInOldAny++;
  }

  console.log(`\nAiven posts matching Old Dump by Slug: ${aivenInOldBySlug}`);
  console.log(`Aiven posts matching Old Dump by Title: ${aivenInOldByTitle}`);
  console.log(`Aiven posts matching Old Dump by ANY: ${aivenInOldAny}`);

  // Breakdown of Local Posts:
  // Set 1: In Local AND in Aiven AND in Old Dump
  // Set 2: In Local AND in Aiven AND NOT in Old Dump
  // Set 3: In Local AND NOT in Aiven AND in Old Dump
  // Set 4: In Local AND NOT in Aiven AND NOT in Old Dump

  let inBothAivenAndOld = 0;
  let inAivenNotOld = 0;
  let inOldNotAiven = 0;
  let inNeither = 0;

  for (const lp of localPosts) {
    const inAiven = aivenIdMap.has(lp.id) || (lp.slug && aivenSlugMap.has(lp.slug.trim().toLowerCase())) || (lp.title && aivenTitleMap.has(lp.title.trim().toLowerCase()));
    const inOld = (lp.slug && oldNewsSlugMap.has(lp.slug.trim().toLowerCase())) || (lp.title && oldNewsTitleMap.has(lp.title.trim().toLowerCase())) || (lp.articleNumber && oldNewsIdMap.has(lp.articleNumber));

    if (inAiven && inOld) inBothAivenAndOld++;
    else if (inAiven && !inOld) inAivenNotOld++;
    else if (!inAiven && !inOld) inNeither++;
    else if (!inAiven && inOld) inOldNotAiven++;
  }

  console.log('\n================================================================');
  console.log('              LOCAL POSTS CLASSIFICATION MATRIX                 ');
  console.log('================================================================');
  console.log(`Total Local Posts: ${localPosts.length}`);
  console.log(`1. In Local AND in Aiven AND in Old Dump:       ${inBothAivenAndOld}`);
  console.log(`2. In Local AND in Aiven BUT NOT in Old Dump:   ${inAivenNotOld}`);
  console.log(`3. In Local AND in Old Dump BUT NOT in Aiven:   ${inOldNotAiven}`);
  console.log(`4. In Local ONLY (Neither in Aiven nor Old):    ${inNeither}`);
  console.log('================================================================');

  await local.end();
  await aiven.end();
}

analyzeOverlap().catch(console.error);

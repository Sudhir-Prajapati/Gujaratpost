const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function test() {
  const aiven = await mysql.createConnection({
    uri: process.env.AIVEN_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    charset: 'UTF8MB4',
    connectTimeout: 60000
  });
  const local = await mysql.createConnection({
    host: '127.0.0.1', port: 3306,
    user: 'gujaratpost', password: 'gujaratpost2005',
    database: 'gujaratpost', charset: 'utf8mb4'
  });

  const [aivenPosts] = await aiven.query('SELECT id, slug, articleNumber, categoryId FROM posts');
  const [localPosts] = await local.query('SELECT id, slug, articleNumber FROM posts');
  const localIdSet = new Set(localPosts.map(p => p.id));
  const localSlugSet = new Set(localPosts.map(p => p.slug));

  let inLocalById = 0;
  let inLocalBySlug = 0;
  let missingFromLocal = [];

  for (const ap of aivenPosts) {
    if (localIdSet.has(ap.id)) {
      inLocalById++;
    } else if (localSlugSet.has(ap.slug)) {
      inLocalBySlug++;
    } else {
      missingFromLocal.push(ap);
    }
  }

  console.log('Total Aiven posts:', aivenPosts.length);
  console.log('Aiven posts matched in local DB by ID:', inLocalById);
  console.log('Aiven posts matched in local DB by Slug:', inLocalBySlug);
  console.log('Aiven posts MISSING from local DB completely:', missingFromLocal.length);

  // Check what categories those missing posts belong to
  const missingByCat = new Map();
  for (const m of missingFromLocal) {
    missingByCat.set(m.categoryId, (missingByCat.get(m.categoryId) || 0) + 1);
  }

  const [cats] = await aiven.query('SELECT id, slug, name, nameGu FROM categories');
  const catMap = new Map(cats.map(c => [c.id, c]));

  console.log('\nMissing Aiven posts breakdown by category:');
  for (const [catId, count] of missingByCat.entries()) {
    const c = catMap.get(catId);
    console.log(`  [${String(count).padStart(4)}] ${c?.slug?.padEnd(28)} ${c?.nameGu}`);
  }

  await aiven.end();
  await local.end();
}

test().catch(console.error);

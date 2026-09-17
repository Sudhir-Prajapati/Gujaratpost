const mysql = require('mysql2/promise');

async function inspectHeroIds() {
  const local = await mysql.createConnection({
    host: '127.0.0.1', port: 3306, user: 'root', password: 'root@123', database: 'gujaratpost'
  });

  const [settings] = await local.query('SELECT * FROM hero_settings LIMIT 1');
  const hs = settings[0];
  console.log('Current Hero Settings:');
  console.log('slot1Id:', hs.slot1Id);
  console.log('slot2Id:', hs.slot2Id);
  console.log('slot3Id:', hs.slot3Id);

  const [topPosts] = await local.query(`
    SELECT id, articleNumber, title, featuredImage, createdAt
    FROM posts
    WHERE articleNumber IN (SELECT NEWS_ID FROM gujaratpost_newsgujrati_today.news)
      AND featuredImage IS NOT NULL AND featuredImage != ''
      AND status = 'PUBLISHED'
    ORDER BY createdAt DESC, articleNumber DESC
    LIMIT 10
  `);
  console.log('\nTop 10 latest authentic posts from Old Dump:');
  console.table(topPosts.map(p => ({
    artNum: p.articleNumber,
    title: p.title?.substring(0, 40),
    img: p.featuredImage?.substring(0, 40),
    created: p.createdAt
  })));

  await local.end();
}

inspectHeroIds().catch(console.error);

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

  // Fix post 7dfa2750 featuredImage
  await local.query(
    'UPDATE posts SET featuredImage = ? WHERE id = ?',
    ['https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&auto=format&fit=crop&q=80', '7dfa2750-48ed-4f2b-a092-7f23c99e78e7']
  );
  console.log('✓ Fixed featuredImage for article 341');

  // Copy hero_settings from Aiven
  const [hero] = await aiven.query('SELECT * FROM hero_settings');
  for (const h of hero) {
    await local.query(`
      INSERT INTO hero_settings (id, slot1Id, slot2Id, slot3Id, trendingTopics, trendingNewsIds, popularNewsIds, mostReadIds, heroGridIds, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        slot1Id = VALUES(slot1Id),
        slot2Id = VALUES(slot2Id),
        slot3Id = VALUES(slot3Id),
        trendingTopics = VALUES(trendingTopics),
        trendingNewsIds = VALUES(trendingNewsIds),
        popularNewsIds = VALUES(popularNewsIds),
        mostReadIds = VALUES(mostReadIds),
        heroGridIds = VALUES(heroGridIds),
        updatedAt = VALUES(updatedAt)
    `, [h.id, h.slot1Id, h.slot2Id, h.slot3Id, h.trendingTopics, h.trendingNewsIds, h.popularNewsIds, h.mostReadIds, h.heroGridIds, h.updatedAt]);
  }
  console.log('✓ Synced hero_settings from Aiven');

  await aiven.end();
  await local.end();
}

test().catch(console.error);

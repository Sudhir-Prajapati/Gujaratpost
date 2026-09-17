const mysql = require('mysql2/promise');

async function checkForeignKeys() {
  const local = await mysql.createConnection({
    host: '127.0.0.1', port: 3306, user: 'root', password: 'root@123', database: 'gujaratpost'
  });

  const [fks] = await local.query(`
    SELECT 
      TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
    FROM 
      INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE 
      REFERENCED_TABLE_SCHEMA = 'gujaratpost' AND REFERENCED_TABLE_NAME = 'posts'
  `);
  console.log('Tables referencing posts:');
  console.table(fks);

  const [heroSettings] = await local.query('SELECT slot1Id, slot2Id, slot3Id, heroGridIds, trendingNewsIds, popularNewsIds, mostReadIds FROM hero_settings');
  console.log('\nHero Settings article references:');
  console.log(heroSettings);

  await local.end();
}

checkForeignKeys().catch(console.error);

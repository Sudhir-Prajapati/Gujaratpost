const mysql = require('mysql2/promise');

async function checkMostRead() {
  const local = await mysql.createConnection({
    host: '127.0.0.1', port: 3306, user: 'root', password: 'root@123', database: 'gujaratpost'
  });

  const [rows] = await local.query('SELECT id, articleNumber, views, title FROM posts WHERE status = "PUBLISHED" ORDER BY views DESC LIMIT 10');
  console.log('--- Top 10 Most Viewed Articles in DB ---');
  console.table(rows.map(r => ({ artNum: r.articleNumber, views: r.views, title: r.title?.substring(0, 45) })));

  const [hs] = await local.query('SELECT mostReadIds, popularNewsIds FROM hero_settings');
  console.log('\n--- Hero Settings mostReadIds & popularNewsIds ---');
  console.log('mostReadIds:', hs[0]?.mostReadIds);
  console.log('popularNewsIds:', hs[0]?.popularNewsIds);

  await local.end();
}

checkMostRead().catch(console.error);

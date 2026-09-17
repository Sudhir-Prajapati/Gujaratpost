const mysql = require('mysql2/promise');

async function inspectNewsColumns() {
  const local = await mysql.createConnection({
    host: '127.0.0.1', port: 3306, user: 'root', password: 'root@123', database: 'gujaratpost_newsgujrati_today'
  });
  const [cols] = await local.query('DESCRIBE news');
  console.log('Columns in gujaratpost_newsgujrati_today.news:');
  console.log(cols.map(c => `${c.Field} (${c.Type})`).join('\n'));
  
  const [rows] = await local.query('SELECT * FROM news LIMIT 1');
  console.log('\nSample row keys:', Object.keys(rows[0]));
  console.log('Sample row data:', {
    id: rows[0].id || rows[0].news_id || rows[0].ID,
    title: rows[0].title || rows[0].news_title || rows[0].heading,
    slug: rows[0].slug || rows[0].news_slug,
    created: rows[0].created_at || rows[0].date || rows[0].created
  });
  await local.end();
}

inspectNewsColumns().catch(console.error);

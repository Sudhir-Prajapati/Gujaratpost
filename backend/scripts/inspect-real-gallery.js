const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'gujaratpost',
    password: 'gujaratpost2005',
    database: 'gujaratpost'
  });

  const [rows] = await conn.query("SELECT id, src, captionGu, caption, createdAt FROM gallery_photos WHERE caption != 'ગેલેરી ફોટો' ORDER BY createdAt DESC LIMIT 15");
  console.log('Top 15 REAL gallery photos:');
  console.log(rows);

  await conn.end();
}
main().catch(console.error);

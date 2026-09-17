const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'gujaratpost',
    password: 'gujaratpost2005',
    database: 'gujaratpost'
  });

  const [countRes] = await conn.query("SELECT COUNT(1) as c FROM gallery_photos WHERE DATE(createdAt) = '2026-09-17'");
  console.log('Photos with createdAt on 2026-09-17:', countRes[0].c);

  const [top15] = await conn.query("SELECT id, src, captionGu, caption, createdAt FROM gallery_photos ORDER BY createdAt DESC LIMIT 15");
  console.log('Top 15 photos in DB right now:');
  console.log(top15);

  await conn.end();
}
main().catch(console.error);

const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'gujaratpost',
    password: 'gujaratpost2005',
    database: 'gujaratpost',
  });

  const [rows] = await conn.query("SELECT id, src, captionGu, createdAt FROM gallery_photos WHERE caption != 'ગેલેરી ફોટો' ORDER BY createdAt DESC LIMIT 15");
  console.log(JSON.stringify(rows, null, 2));

  await conn.end();
}

run().catch(console.error);

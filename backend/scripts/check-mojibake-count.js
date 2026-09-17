const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'gujaratpost',
    password: 'gujaratpost2005',
    database: 'gujaratpost'
  });

  const [c1] = await conn.query("SELECT COUNT(1) as c FROM gallery_photos WHERE src LIKE '%àª%'");
  const [c2] = await conn.query("SELECT COUNT(1) as c FROM gallery_photos WHERE src LIKE '%â%'");
  console.log('c1 (àª):', c1[0].c, 'c2 (â):', c2[0].c);

  const [dummy] = await conn.query("SELECT COUNT(1) as c FROM gallery_photos WHERE caption = 'ગેલેરી ફોટો'");
  console.log('Photos with dummy caption (ગેલેરી ફોટો):', dummy[0].c);

  await conn.end();
}
main().catch(console.error);

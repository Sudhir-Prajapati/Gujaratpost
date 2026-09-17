const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'gujaratpost',
    password: 'gujaratpost2005',
    database: 'gujaratpost',
  });

  const [total] = await conn.query('SELECT COUNT(id) as c FROM gallery_photos');
  const [nowRows] = await conn.query("SELECT COUNT(id) as c FROM gallery_photos WHERE caption = 'ગેલેરી ફોટો'");
  const [realRows] = await conn.query("SELECT COUNT(id) as c FROM gallery_photos WHERE caption != 'ગેલેરી ફોટો'");
  
  console.log('Total gallery_photos:', total[0].c);
  console.log('Dummy/option rows (caption = ગેલેરી ફોટો):', nowRows[0].c);
  console.log('Real gallery rows (caption != ગેલેરી ફોટો):', realRows[0].c);

  const [samples] = await conn.query("SELECT id, src, captionGu, createdAt FROM gallery_photos WHERE caption != 'ગેલેરી ફોટો' ORDER BY createdAt DESC LIMIT 8");
  console.log('Sample real photos:', JSON.stringify(samples, null, 2));

  await conn.end();
}
main().catch(console.error);

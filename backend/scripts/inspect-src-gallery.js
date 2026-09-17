const mysql = require('mysql2/promise');

async function main() {
  const src = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'root@123',
    database: 'gujaratpost_newsgujrati_today',
  });

  const [galleryCols] = await src.query('DESCRIBE gallery');
  console.log('--- gallery columns ---');
  console.log(galleryCols.map(c => c.Field));

  const [optCols] = await src.query('DESCRIBE galleryoptions');
  console.log('--- galleryoptions columns ---');
  console.log(optCols.map(c => c.Field));

  const [gallerySample] = await src.query('SELECT * FROM gallery ORDER BY G_ID DESC LIMIT 3');
  console.log('--- gallery sample ---');
  console.log(gallerySample);

  const [optSample] = await src.query('SELECT * FROM galleryoptions ORDER BY productoption_id DESC LIMIT 3');
  console.log('--- galleryoptions sample ---');
  console.log(optSample);

  await src.end();
}
main().catch(console.error);

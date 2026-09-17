const mysql = require('mysql2/promise');

async function checkImages() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'root@123',
    database: 'gujaratpost_newsgujrati_today'
  });

  const [newsImages] = await conn.query('SELECT NEWS_ID, NEWS_IMAGE, NEWS_CONTENT FROM news WHERE NEWS_IMAGE IS NOT NULL AND NEWS_IMAGE != "" ORDER BY NEWS_ID DESC LIMIT 20');
  console.log('--- 20 Latest NEWS_IMAGE values ---');
  for (const row of newsImages) {
    console.log(`ID: ${row.NEWS_ID} | Image: ${row.NEWS_IMAGE}`);
    const content = row.NEWS_CONTENT || '';
    const imgMatches = content.match(/<img[^>]+src=["']([^"']+)["']/gi);
    if (imgMatches) {
      console.log('   Content imgs:', imgMatches.slice(0, 2));
    }
  }

  const [galleryImages] = await conn.query('SELECT G_ID, G_IMAGES, G_NAME FROM gallery ORDER BY G_ID DESC LIMIT 10');
  console.log('\n--- 10 Latest Gallery Images ---');
  for (const row of galleryImages) {
    console.log(`ID: ${row.G_ID} | G_IMAGES: ${row.G_IMAGES}`);
  }

  const [advertImages] = await conn.query('SELECT * FROM advert LIMIT 5');
  console.log('\n--- Advert Images ---');
  for (const row of advertImages) {
    console.log(row);
  }

  await conn.end();
}

checkImages().catch(console.error);

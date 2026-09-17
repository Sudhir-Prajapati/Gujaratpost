const mysql = require('mysql2/promise');

async function verify() {
  console.log('--- VERIFYING DESTINATION DATABASE (3307/gujaratpost) ---');
  const conn = await mysql.createConnection('mysql://gujaratpost:gujaratpost2005@127.0.0.1:3307/gujaratpost');

  const [tables] = await conn.query('SHOW TABLES');
  for (const t of tables) {
    const tableName = Object.values(t)[0];
    const [c] = await conn.query('SELECT count(*) as cnt FROM ' + tableName);
    if (c[0].cnt > 0) {
      console.log(`Table ${tableName.padEnd(25)}: ${c[0].cnt} rows`);
    }
  }

  console.log('\n--- 5 SAMPLE POSTS (LATEST) ---');
  const [samplePosts] = await conn.query(`
    SELECT articleNumber, titleGu, featuredImage, readingTime, isFeatured, isTrending, views, createdAt
    FROM posts
    ORDER BY articleNumber DESC
    LIMIT 5
  `);
  for (const p of samplePosts) {
    console.log(`[ID ${p.articleNumber}] ${p.titleGu}`);
    console.log(`  Image: ${p.featuredImage}`);
    console.log(`  Date: ${p.createdAt} | Views: ${p.views} | ReadTime: ${p.readingTime}m | Feat: ${p.isFeatured} | Trend: ${p.isTrending}\n`);
  }

  console.log('--- 3 SAMPLE GALLERY PHOTOS ---');
  const [sampleGallery] = await conn.query(`SELECT id, alt, src FROM gallery_photos LIMIT 3`);
  for (const g of sampleGallery) {
    console.log(`[${g.alt}] -> ${g.src}`);
  }

  console.log('\n--- 3 SAMPLE VIDEOS ---');
  const [sampleVideos] = await conn.query(`SELECT id, titleGu, youtubeId, thumbnail FROM videos LIMIT 3`);
  for (const v of sampleVideos) {
    console.log(`[${v.titleGu}] YT: ${v.youtubeId} -> ${v.thumbnail}`);
  }

  await conn.end();
}

verify().catch(console.error);

const mysql = require('mysql2/promise');

async function test() {
  const local = await mysql.createConnection({
    host: '127.0.0.1', port: 3306,
    user: 'gujaratpost', password: 'gujaratpost2005',
    database: 'gujaratpost', charset: 'utf8mb4'
  });

  const [inPosts] = await local.query(
    "SELECT id, articleNumber, titleGu FROM posts WHERE contentGu LIKE '%onrender.com%' OR featuredImage LIKE '%onrender.com%'"
  );
  console.log('Posts containing onrender.com:', inPosts);

  if (inPosts.length > 0) {
    // Replace any onrender.com URLs in contentGu with empty or placeholder
    await local.query(
      "UPDATE posts SET contentGu = REPLACE(contentGu, 'https://gujaratpost.onrender.com', 'https://gujaratpost.in') WHERE contentGu LIKE '%onrender.com%'"
    );
    await local.query(
      "UPDATE posts SET featuredImage = REPLACE(featuredImage, 'https://gujaratpost.onrender.com', 'https://gujaratpost.in') WHERE featuredImage LIKE '%onrender.com%'"
    );
    console.log('✓ Cleaned onrender.com from posts');
  }

  await local.end();
}

test().catch(console.error);

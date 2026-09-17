const mysql = require('mysql2/promise');

async function test() {
  const local = await mysql.createConnection({
    host: '127.0.0.1', port: 3306,
    user: 'gujaratpost', password: 'gujaratpost2005',
    database: 'gujaratpost', charset: 'utf8mb4'
  });
  const [row] = await local.query('SELECT id, articleNumber, featuredImage FROM posts WHERE id = ?', ['7dfa2750-48ed-4f2b-a092-7f23c99e78e7']);
  console.log('Post 7dfa2750 featuredImage:', row);
  await local.end();
}

test().catch(console.error);

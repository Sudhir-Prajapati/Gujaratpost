const mysql = require('mysql2/promise');

async function check() {
  const conn = await mysql.createConnection('mysql://root:root@123@127.0.0.1:3306/');
  const [port] = await conn.query("SHOW VARIABLES LIKE 'port'");
  console.log('MySQL port variable:', port);
  const [dbs] = await conn.query('SHOW DATABASES');
  console.log('Databases on 3306:', dbs.map(d => Object.values(d)[0]));
  
  // Check if gujaratpost user/database exists on 3306
  try {
    const conn2 = await mysql.createConnection('mysql://gujaratpost:gujaratpost2005@127.0.0.1:3306/gujaratpost');
    const [cnt] = await conn2.query('SELECT COUNT(*) as cnt FROM posts');
    console.log('\ngujaratpost DB on 3306 - posts:', cnt[0].cnt);
    await conn2.end();
  } catch(e) {
    console.log('\ngujaratpost DB on 3306 error:', e.message);
  }

  await conn.end();
}

check().catch(console.error);

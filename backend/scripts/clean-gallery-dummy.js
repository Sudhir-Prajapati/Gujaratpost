const mysql = require('mysql2/promise');

async function main() {
  const src = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'root@123',
    database: 'gujaratpost_newsgujrati_today',
  });

  const dest = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'gujaratpost',
    password: 'gujaratpost2005',
    database: 'gujaratpost',
  });

  // 1. Check count of dummy rows in dest
  const [dummy] = await dest.query("SELECT COUNT(1) as c FROM gallery_photos WHERE caption = 'ગેલેરી ફોટો'");
  console.log('Dummy rows to delete:', dummy[0].c);

  // 2. Delete dummy rows
  if (dummy[0].c > 0) {
    const [delRes] = await dest.query("DELETE FROM gallery_photos WHERE caption = 'ગેલેરી ફોટો'");
    console.log('Deleted dummy rows:', delRes.affectedRows);
  }

  // 3. Count remaining
  const [rem] = await dest.query("SELECT COUNT(1) as c FROM gallery_photos");
  console.log('Remaining genuine gallery photos:', rem[0].c);

  await src.end();
  await dest.end();
}

main().catch(console.error);

const mysql = require('mysql2/promise');

async function test() {
  const local = await mysql.createConnection({
    host: '127.0.0.1', port: 3306,
    user: 'gujaratpost', password: 'gujaratpost2005',
    database: 'gujaratpost', charset: 'utf8mb4'
  });

  const [r1] = await local.query("SELECT id, titleGu FROM posts WHERE titleGu LIKE '%ઇન્ટેલિજન્સ%' OR titleGu LIKE '%સેમિકન્ડક્ટર%'");
  console.log('AI/Semiconductor matches:', r1);

  const [r2] = await local.query("SELECT id, titleGu FROM posts WHERE titleGu LIKE '%ટીમ ઇન્ડિયા%' OR titleGu LIKE '%મુકાબલા%'");
  console.log('Team India matches:', r2);

  const [r3] = await local.query("SELECT id, titleGu FROM posts WHERE titleGu LIKE '%ક્લાઇમેટ%' OR titleGu LIKE '%હાઇડ્રોજન%'");
  console.log('Climate/Hydrogen matches:', r3);

  await local.end();
}

test().catch(console.error);

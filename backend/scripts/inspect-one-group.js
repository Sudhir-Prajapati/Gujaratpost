const mysql = require('mysql2/promise');

async function inspectOneGroup() {
  const local = await mysql.createConnection({
    host: '127.0.0.1', port: 3306,
    user: 'gujaratpost', password: 'gujaratpost2005',
    database: 'gujaratpost', charset: 'utf8mb4'
  });

  const [rows] = await local.query(
    'SELECT id, slug, articleNumber, categoryId, views, status, createdAt FROM posts WHERE titleGu LIKE ?',
    ['%ગિફ્ટ સિટી ગાંધીનગરે ફિનટેક%']
  );
  console.log('Duplicate rows for "ગિફ્ટ સિટી":');
  console.table(rows);

  const [rows2] = await local.query(
    'SELECT id, slug, articleNumber, categoryId, views, status, createdAt FROM posts WHERE titleGu LIKE ?',
    ['%રામમંદિરને લઇ વિહીપ-સંઘ ઉગ્ર%']
  );
  console.log('Duplicate rows for "રામમંદિરને લઇ":');
  console.table(rows2);

  await local.end();
}

inspectOneGroup().catch(console.error);

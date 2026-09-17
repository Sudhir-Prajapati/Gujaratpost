const mysql = require('mysql2/promise');

async function test() {
  const local = await mysql.createConnection({
    host: '127.0.0.1', port: 3306,
    user: 'gujaratpost', password: 'gujaratpost2005',
    database: 'gujaratpost', charset: 'utf8mb4'
  });

  const [dupTitle] = await local.query(`
    SELECT title, count(*) as cnt
    FROM posts
    WHERE title IS NOT NULL AND TRIM(title) != ''
    GROUP BY title
    HAVING cnt > 1
    ORDER BY cnt DESC
  `);
  console.log('Duplicate English title groups:', dupTitle.length);

  const [dupTitleGu] = await local.query(`
    SELECT titleGu, count(*) as cnt
    FROM posts
    WHERE titleGu IS NOT NULL AND TRIM(titleGu) != ''
    GROUP BY titleGu
    HAVING cnt > 1
    ORDER BY cnt DESC
  `);
  console.log('Duplicate Gujarati title groups:', dupTitleGu.length);

  // Check if any duplicate English titles are not in duplicate Gujarati titles
  const guSet = new Set(dupTitleGu.map(d => d.titleGu));
  const enOnly = dupTitle.filter(d => !guSet.has(d.title));
  console.log('Duplicate in English but not Gujarati:', enOnly.length);
  if (enOnly.length > 0) {
    console.table(enOnly.slice(0, 10));
  }

  await local.end();
}

test().catch(console.error);

const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function fetchAivenCategories() {
  console.log('Connecting to Aiven cloud database...');
  const aiven = await mysql.createConnection({
    uri: process.env.AIVEN_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    charset: 'UTF8MB4',
    connectTimeout: 60000
  });
  console.log('✓ Connected to Aiven!');

  const [cats] = await aiven.query('SELECT * FROM categories ORDER BY displayOrder, id');
  console.log(`\nFound ${cats.length} categories in Aiven:\n`);
  cats.forEach(c => {
    console.log(`  [${c.id}] slug="${c.slug}" name="${c.name}" nameGu="${c.nameGu}" order=${c.displayOrder} headerOrder=${c.headerOrder} homeOrder=${c.homeOrder} isActive=${c.isActive}`);
  });

  await aiven.end();
  return cats;
}

fetchAivenCategories().catch(console.error);

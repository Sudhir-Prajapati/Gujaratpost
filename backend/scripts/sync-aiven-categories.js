const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function syncCategories() {
  console.log('====================================================');
  console.log('  SYNC: Aiven Categories → Local gujaratpost DB    ');
  console.log('====================================================\n');

  // 1. Connect to Aiven source
  console.log('[1/4] Connecting to Aiven cloud database...');
  const aiven = await mysql.createConnection({
    uri: process.env.AIVEN_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    charset: 'UTF8MB4',
    connectTimeout: 60000
  });
  console.log('✓ Aiven connected.');

  // 2. Connect to local destination
  console.log('[2/4] Connecting to local gujaratpost database (port 3306)...');
  const local = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'gujaratpost',
    password: 'gujaratpost2005',
    database: 'gujaratpost',
    charset: 'utf8mb4'
  });
  console.log('✓ Local DB connected.\n');

  // 3. Pull ALL categories from Aiven
  console.log('[3/4] Fetching categories from Aiven...');
  const [aivenCats] = await aiven.query('SELECT * FROM categories ORDER BY displayOrder, id');
  console.log(`✓ Found ${aivenCats.length} categories in Aiven.\n`);

  // 4. Check current state of local DB
  const [localCats] = await local.query('SELECT id, slug FROM categories');
  const localSlugs = new Map(localCats.map(c => [c.slug, c.id]));
  const localIds = new Set(localCats.map(c => c.id));
  console.log(`  Local DB currently has ${localCats.length} categories.`);

  // 5. Upsert all Aiven categories into local DB
  console.log('[4/4] Syncing categories into local DB...\n');

  let inserted = 0, updated = 0, slugUpdated = 0;

  for (const cat of aivenCats) {
    const idExists = localIds.has(cat.id);
    const slugExists = localSlugs.has(cat.slug);

    if (idExists) {
      // Update the existing record with Aiven's data (matched by UUID)
      await local.query(`
        UPDATE categories SET
          slug          = ?,
          name          = ?,
          nameGu        = ?,
          description   = ?,
          displayOrder  = ?,
          headerOrder   = ?,
          homeOrder     = ?,
          isActive      = ?,
          updatedAt     = NOW()
        WHERE id = ?
      `, [
        cat.slug, cat.name, cat.nameGu, cat.description || null,
        cat.displayOrder || 0, cat.headerOrder || 0, cat.homeOrder || 0,
        cat.isActive ?? 1,
        cat.id
      ]);
      updated++;
      console.log(`  ↻ UPDATED  [${cat.slug.padEnd(35)}] ${cat.nameGu}`);
    } else if (slugExists) {
      // Slug already exists with different UUID — update that row with Aiven's UUID & data
      const oldId = localSlugs.get(cat.slug);
      await local.query(`
        UPDATE categories SET
          id            = ?,
          name          = ?,
          nameGu        = ?,
          description   = ?,
          displayOrder  = ?,
          headerOrder   = ?,
          homeOrder     = ?,
          isActive      = ?,
          updatedAt     = NOW()
        WHERE id = ?
      `, [
        cat.id, cat.name, cat.nameGu, cat.description || null,
        cat.displayOrder || 0, cat.headerOrder || 0, cat.homeOrder || 0,
        cat.isActive ?? 1,
        oldId
      ]);
      slugUpdated++;
      console.log(`  ≈ SLUG-UPD [${cat.slug.padEnd(35)}] ${cat.nameGu} (UUID: ${oldId?.substring(0,8)}→${cat.id.substring(0,8)})`);
    } else {
      // Brand new — insert with Aiven's UUID
      await local.query(`
        INSERT INTO categories
          (id, slug, name, nameGu, nameHi, description, descriptionGu, descriptionHi, icon, color, headerType, displayOrder, headerOrder, homeOrder, isActive, showInHome, showInHeader, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, '', ?, '', '', '', '', '', ?, ?, ?, ?, 1, 1, NOW(), NOW())
      `, [
        cat.id, cat.slug, cat.name, cat.nameGu, cat.description || null,
        cat.displayOrder || 0, cat.headerOrder || 0, cat.homeOrder || 0,
        cat.isActive ?? 1
      ]);
      inserted++;
      console.log(`  + INSERTED [${cat.slug.padEnd(35)}] ${cat.nameGu}`);
    }
  }

  // Verify
  const [finalCats] = await local.query('SELECT COUNT(*) as cnt FROM categories');
  console.log(`\n====================================================`);
  console.log(`  ✓ DONE!`);
  console.log(`    Inserted : ${inserted} new categories`);
  console.log(`    Updated  : ${updated} existing categories`);
  console.log(`    Total in local DB now: ${finalCats[0].cnt}`);
  console.log(`====================================================\n`);

  await aiven.end();
  await local.end();
}

syncCategories().catch(console.error);

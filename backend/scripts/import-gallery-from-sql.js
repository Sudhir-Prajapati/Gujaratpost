/**
 * Import gallery photos from gujaratpost_newsgujrati_today.sql.gz
 * URL pattern: https://gujaratpost.in/gallery/[G_IMAGES filename]
 * 
 * gallery_photos schema:
 *   id, src, alt, caption, captionGu, captionHi, category, photographer, copyright, createdAt, updatedAt
 */

const fs = require('fs');
const zlib = require('zlib');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BASE_URL = 'https://gujaratpost.in/gallery/';
const SQL_FILE = 'C:\\Users\\Admin\\OneDrive\\Desktop\\Gujarat-Post\\gujaratpost_newsgujrati_today.sql.gz';

async function parseSQLDump() {
  return new Promise((resolve, reject) => {
    const gunzip = zlib.createGunzip();
    const input = fs.createReadStream(SQL_FILE);
    let data = '';

    input.pipe(gunzip);
    gunzip.on('data', chunk => { data += chunk.toString('utf8'); });
    gunzip.on('end', () => {
      // Extract gallery section
      const galleryStart = data.indexOf('LOCK TABLES `gallery` WRITE;');
      const galleryEnd = data.indexOf('UNLOCK TABLES;', galleryStart);
      const gallerySection = data.substring(galleryStart, galleryEnd + 20);

      // Find the INSERT block
      const allInserts = gallerySection.match(/INSERT INTO `gallery` VALUES [^;]+;/gs) || [];
      if (allInserts.length === 0) { reject(new Error('No INSERT found')); return; }

      const rawBlock = allInserts[0];
      const rowMatches = [];

      // Parse rows character by character
      let inStr = false;
      let escNext = false;
      let depth = 0;
      let currentRow = '';

      for (let i = 0; i < rawBlock.length; i++) {
        const c = rawBlock[i];
        if (escNext) { escNext = false; currentRow += c; continue; }
        if (c === '\\') { escNext = true; currentRow += c; continue; }
        if (c === "'") { inStr = !inStr; currentRow += c; continue; }
        if (inStr) { currentRow += c; continue; }

        if (c === '(') {
          depth++;
          if (depth === 1) { currentRow = '('; }
          else currentRow += c;
        } else if (c === ')') {
          depth--;
          if (depth === 0) {
            rowMatches.push(currentRow + ')');
            currentRow = '';
          } else currentRow += c;
        } else {
          currentRow += c;
        }
      }

      // Parse fields from each row
      const results = [];
      for (const row of rowMatches) {
        const fields = [];
        let inS = false;
        let esc = false;
        let field = '';
        const inner = row.substring(1, row.length - 1);

        for (let i = 0; i < inner.length; i++) {
          const c = inner[i];
          if (esc) { esc = false; field += c; continue; }
          if (c === '\\') { esc = true; field += c; continue; }
          if (c === "'") { inS = !inS; field += c; continue; }
          if (inS) { field += c; continue; }
          if (c === ',') { fields.push(field.trim()); field = ''; continue; }
          field += c;
        }
        fields.push(field.trim());

        const stripQuotes = s => s ? s.replace(/^'|'$/g, '') : '';
        
        const gId     = fields[0];
        const gName   = stripQuotes(fields[1]);
        const gDesc   = stripQuotes(fields[3]);
        const gImages = stripQuotes(fields[4]); // cover image filename
        const gGImg   = stripQuotes(fields[5]); // extra images (comma-separated)
        const gCreatedRaw = stripQuotes(fields[6]);
        const gStatus = fields[fields.length - 1]; // 1=active, 2=?, 3=inactive

        results.push({ gId, gName, gDesc, gImages, gGImg, gCreatedRaw, gStatus });
      }
      resolve(results);
    });
    gunzip.on('error', reject);
  });
}

function cleanDescription(s) {
  if (!s) return '';
  return s.replace(/\\r\\n/g, ' ').replace(/\\n/g, ' ').replace(/\\/g, '').trim().substring(0, 500);
}

function parseDate(raw) {
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime()) || raw === '0000-00-00 00:00:00') return new Date();
    return d;
  } catch { return new Date(); }
}

async function main() {
  console.log('📖 Reading SQL dump...');
  const rows = await parseSQLDump();
  console.log(`✅ Parsed ${rows.length} gallery entries from SQL dump`);

  // Only import rows with a valid image filename
  const validRows = rows.filter(r => r.gImages && r.gImages.length > 0 && r.gImages !== 'NULL');
  console.log(`🖼️  Valid rows with images: ${validRows.length}`);
  
  // Status breakdown
  const byStatus = {};
  rows.forEach(r => { byStatus[r.gStatus] = (byStatus[r.gStatus] || 0) + 1; });
  console.log('Status breakdown:', byStatus);

  // Clear existing gallery_photos
  const existing = await prisma.galleryPhoto.count();
  console.log(`\n🗑️  Clearing ${existing} existing gallery_photos records...`);
  await prisma.galleryPhoto.deleteMany({});
  console.log('✅ Cleared.');

  // Prepare insert data
  const toInsert = [];
  for (const row of validRows) {
    const imgUrl = BASE_URL + row.gImages;
    const name = row.gName || 'ગુજરાત પોસ્ટ ફોટો';
    const desc = cleanDescription(row.gDesc) || name;
    const createdAt = parseDate(row.gCreatedRaw);

    toInsert.push({
      src: imgUrl,
      alt: name,
      caption: desc,
      captionGu: name,
      captionHi: name,
      category: 'સમાચાર',
      photographer: 'Gujarat Post',
      copyright: '© Gujarat Post',
      createdAt,
      updatedAt: createdAt,
    });
  }

  console.log(`\n📤 Inserting ${toInsert.length} gallery photos...`);

  // Insert in batches of 100
  const BATCH = 100;
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const batch = toInsert.slice(i, i + BATCH);
    await prisma.galleryPhoto.createMany({ data: batch });
    inserted += batch.length;
    process.stdout.write(`\r   Progress: ${inserted}/${toInsert.length}`);
  }

  console.log(`\n\n✅ Done! Inserted ${inserted} gallery photos.`);
  
  // Verify
  const count = await prisma.galleryPhoto.count();
  console.log(`📊 Total in gallery_photos table: ${count}`);
  
  // Show first 3
  const sample = await prisma.galleryPhoto.findMany({ take: 3, orderBy: { createdAt: 'desc' } });
  console.log('\nSample entries:');
  sample.forEach(s => console.log(`  - ${s.alt.substring(0,50)} → ${s.src}`));
  
  await prisma.$disconnect();
}

main().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });

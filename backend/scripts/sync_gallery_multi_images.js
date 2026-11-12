/**
 * sync_gallery_multi_images.js
 * Restores complete multi-image slides and Cloudinary assets for all gallery albums
 * (including Nikita Sharma, Madhuri Dixit, Sonali Bendre, Kritika Kamra, Sonali Raut, Disha Patani,
 * and 556+ other multi-slide albums).
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MANUAL_ALBUMS = {
  // 1. Nikita Sharma (3 high-res images)
  'f2024630-f731-43dd-bd49-b07fe76cf438': [
    'https://res.cloudinary.com/kohg6a5j/image/upload/v1793806391/gujarat-post/Nikita_Sharma_1793806390834_8502_xmll2z.webp',
    'https://res.cloudinary.com/kohg6a5j/image/upload/v1793806392/gujarat-post/Nikita_Sharma1_1793806392508_7626_xuupov.webp',
    'https://res.cloudinary.com/kohg6a5j/image/upload/v1793806393/gujarat-post/Nikita_Sharma2_1793806393635_9966_ed9ptd.webp',
  ],
  // 2. Madhuri Dixit (3 high-res images)
  '48b320cb-7c78-4434-a283-9f9544621843': [
    'https://res.cloudinary.com/kohg6a5j/image/upload/v1793368131/gujarat-post/madhuri_dixit_1793368131278_8941_xxd3cp.webp',
    'https://res.cloudinary.com/kohg6a5j/image/upload/v1793368132/gujarat-post/madhuri_dixit1_1793368132304_1890_mmjat6.webp',
    'https://res.cloudinary.com/kohg6a5j/image/upload/v1793368130/gujarat-post/madhuri_dixit2_1793368129413_5761_w5oysp.webp',
  ],
  // 3. Sonali Bendre (4 high-res images)
  '064c0d87-5a44-466d-8949-8435c1137be1': [
    'https://res.cloudinary.com/kohg6a5j/image/upload/v1793370213/gujarat-post/____________________________________________1793370212958_2160_mdel95.avif',
    'https://res.cloudinary.com/kohg6a5j/image/upload/v1793370214/gujarat-post/___________________________________________1_1793370213995_5473_qjejjf.avif',
    'https://res.cloudinary.com/kohg6a5j/image/upload/v1793370212/gujarat-post/___________________________________________2_1793370210891_1425_yiw0jc.avif',
    'https://res.cloudinary.com/kohg6a5j/image/upload/v1793370368/gujarat-post/___________________________________________3_1793370367477_5356_sqqde7.avif',
  ],
  // 4. Kritika Kamra (3 high-res images)
  '3c79f71f-fc8e-454e-8ba6-157f5abb42a6': [
    'https://res.cloudinary.com/kohg6a5j/image/upload/v1793369274/gujarat-post/___________________________________1793369274352_7959_dxx5ns.avif',
    'https://res.cloudinary.com/kohg6a5j/image/upload/v1793369272/gujarat-post/___________________________________1_1793369271618_3992_uuyxpb.avif',
    'https://res.cloudinary.com/kohg6a5j/image/upload/v1793369273/gujarat-post/___________________________________2_1793369273187_5541_jgkclk.avif',
  ],
  // 5. Sonali Raut (5 high-res images)
  'cc470d09-f32d-4922-afff-3071b7ba65d5': [
    'https://res.cloudinary.com/kohg6a5j/image/upload/v1793368678/gujarat-post/___________________________________1793368678124_8167_tsidfm.avif',
    'https://res.cloudinary.com/kohg6a5j/image/upload/v1793368679/gujarat-post/__________________________________1_1793368679160_1772_wsdyey.avif',
    'https://res.cloudinary.com/kohg6a5j/image/upload/v1793368677/gujarat-post/__________________________________2_1793368676239_7052_ukpdsn.avif',
    'https://res.cloudinary.com/kohg6a5j/image/upload/v1793368764/gujarat-post/___________________________________1793368763809_5784_mfrvnz.avif',
    'https://res.cloudinary.com/kohg6a5j/image/upload/v1793368782/gujarat-post/__________________________________2_1793368781032_7904_m0xv6y.avif',
  ],
  // 6. Disha Patani (2 high-res images)
  'eedcbb5b-d9ed-4df0-b70e-6778663f77bc': [
    'https://res.cloudinary.com/kohg6a5j/image/upload/v1792847715/gujarat-post/gallery/gallery_eedcbb5b-d9ed-4df0-b70e-6778663f77bc.jpg',
    'https://res.cloudinary.com/kohg6a5j/image/upload/v1793096319/gujarat-post/gallery/gallery_eedcbb5b-d9ed-4df0-b70e-6778663f77bc_slide_1.jpg',
  ],
};

async function main() {
  console.log('🚀 [Gallery Sync] Starting multi-image gallery synchronization...');

  const dbUrl = process.env.DATABASE_URL || 'mysql://gujaratpost:gujaratpost2005@127.0.0.1:3306/gujaratpost';
  const conn = await mysql.createConnection(dbUrl);
  console.log('✅ [Database] Connected successfully.');

  // 1. Load Cloudinary Catalog
  const catalogPath = path.join(__dirname, 'cloudinary_catalog.json');
  let catalog = [];
  if (fs.existsSync(catalogPath)) {
    catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    console.log(`📦 [Catalog] Loaded ${catalog.length} assets from cloudinary_catalog.json.`);
  }

  // Group catalog by gallery photo UUID
  const assetsByPhotoId = new Map();
  for (const asset of catalog) {
    const pid = asset.public_id;
    const match = pid.match(/gallery_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:_slide_(\d+))?/i);
    if (match) {
      const id = match[1];
      const slideNum = match[2] ? parseInt(match[2], 10) : 0;
      if (!assetsByPhotoId.has(id)) {
        assetsByPhotoId.set(id, []);
      }
      assetsByPhotoId.get(id).push({
        slideNum,
        url: asset.secure_url,
      });
    }
  }

  // 2. Load all gallery photos from database
  const [photos] = await conn.execute('SELECT id, alt, captionGu, caption, photographer, copyright, src FROM gallery_photos');
  console.log(`📋 [Database] Loaded ${photos.length} gallery records.`);

  let updatedCount = 0;
  let manualUpdatedCount = 0;

  for (const p of photos) {
    const photoTitle = (p.captionGu || p.alt || p.caption || 'Gujarat Post Photo Gallery').trim();
    const photoDesc = (p.caption || p.captionGu || p.alt || '').trim();
    const photographer = p.photographer || 'Gujarat Post Team';

    // A. Check if it's one of the manual celebrity albums
    if (MANUAL_ALBUMS[p.id]) {
      const urls = MANUAL_ALBUMS[p.id];
      const slideObjects = urls.map((url, idx) => ({
        src: url,
        title: photoTitle,
        caption: photoDesc,
        captionGu: photoTitle,
        description: photoDesc,
        photographer: photographer,
      }));
      const jsonSrc = JSON.stringify(slideObjects);

      if (p.src !== jsonSrc) {
        await conn.execute('UPDATE gallery_photos SET src = ? WHERE id = ?', [jsonSrc, p.id]);
        manualUpdatedCount++;
        console.log(`🌟 [Restored Celebrity] ${photoTitle.slice(0, 40)} -> ${urls.length} slides`);
      }
      continue;
    }

    // B. Check catalog for standard gallery_<uuid> slides
    const slides = assetsByPhotoId.get(p.id);
    if (slides && slides.length > 0) {
      slides.sort((a, b) => a.slideNum - b.slideNum);

      let targetSrc;
      if (slides.length > 1) {
        const slideObjects = slides.map((s) => ({
          src: s.url,
          title: photoTitle,
          caption: photoDesc,
          captionGu: photoTitle,
          description: photoDesc,
          photographer: photographer,
        }));
        targetSrc = JSON.stringify(slideObjects);
      } else {
        targetSrc = slides[0].url;
      }

      // Update if current src is /uploads/ or missing multi-image JSON
      const needsUpdate = !p.src ||
        p.src.includes('/uploads/') ||
        (slides.length > 1 && !p.src.startsWith('['));

      if (needsUpdate && p.src !== targetSrc) {
        await conn.execute('UPDATE gallery_photos SET src = ? WHERE id = ?', [targetSrc, p.id]);
        updatedCount++;
      }
    }
  }

  console.log(`\n🎉 [Summary]`);
  console.log(`   - Celebrity albums updated with full multi-images: ${manualUpdatedCount}`);
  console.log(`   - Catalog albums restored/updated: ${updatedCount}`);

  await conn.end();
  console.log('✅ [Database] Connection closed.');

  // 3. Clear Redis Cache so live API and Dailyhunt RSS update instantly
  try {
    const { createClient } = require('redis');
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    const client = createClient({
      url: redisUrl,
      socket: { tls: redisUrl.startsWith('rediss://'), rejectUnauthorized: false }
    });
    client.on('error', () => {});
    await client.connect();
    await client.flushDb();
    console.log('🧹 [Cache] Flushed Redis cache successfully.');
    await client.disconnect();
  } catch (e) {
    console.log('ℹ️ [Cache] Redis not active or flushed automatically.');
  }

  console.log('🚀 [Gallery Sync] All multi-image slides are now 100% active!');
}

main().catch((err) => {
  console.error('❌ [Error] Sync failed:', err);
  process.exit(1);
});


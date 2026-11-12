const fs = require('fs');
const mysql = require('mysql2/promise');

async function main() {
  console.log('Loading cloudinary catalog...');
  const cat = require('./cloudinary_catalog.json');

  const assetsByPhotoId = new Map();
  for (const asset of cat) {
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
        public_id: pid
      });
    }
  }

  console.log('Connecting to local MySQL...');
  const conn = await mysql.createConnection('mysql://gujaratpost:gujaratpost2005@127.0.0.1:3306/gujaratpost');
  const [photos] = await conn.execute('SELECT id, alt, captionGu, caption, photographer, copyright, src FROM gallery_photos');
  console.log(`Loaded ${photos.length} photos from database.`);

  const sqlStatements = [];
  sqlStatements.push('-- Complete Photo Gallery Restoration: 786+ Albums & Multi-Image Slides from Cloudinary');
  sqlStatements.push('SET NAMES utf8mb4;');
  sqlStatements.push('SET CHARACTER SET utf8mb4;');
  sqlStatements.push('START TRANSACTION;');

  let multiAlbumCount = 0;
  let singleAlbumCount = 0;
  let preservedCount = 0;
  let totalSlidesRestored = 0;

  const manualAlbums = new Set([
    '064c0d87-5a44-466d-8949-8435c1137be1',
    '3c79f71f-fc8e-454e-8ba6-157f5abb42a6',
    '48b320cb-7c78-4434-a283-9f9544621843',
    'cc470d09-f32d-4922-afff-3071b7ba65d5',
    'f2024630-f731-43dd-bd49-b07fe76cf438',
  ]);

  for (const p of photos) {
    if (manualAlbums.has(p.id)) {
      preservedCount++;
      continue;
    }

    const slides = assetsByPhotoId.get(p.id);
    if (!slides || slides.length === 0) {
      console.warn(`No Cloudinary assets found for photo: ${p.id} (${p.captionGu})`);
      continue;
    }

    // Sort slides: slide 0 first, then slide 1, 2, 3...
    slides.sort((a, b) => a.slideNum - b.slideNum);

    const title = p.captionGu || p.alt || p.caption || 'Gallery Photo';
    const desc = p.caption || p.captionGu || '';
    const photog = p.photographer || 'Gujarat Post Team';

    let finalSrcValue;

    if (slides.length > 1) {
      // Build Multi-Image Album JSON
      const imagesArray = slides.map((s, idx) => ({
        src: s.url,
        title: title,
        caption: desc,
        captionGu: title,
        description: desc,
        photographer: photog
      }));

      finalSrcValue = JSON.stringify(imagesArray);
      multiAlbumCount++;
      totalSlidesRestored += imagesArray.length;
    } else {
      // Single Image Album
      finalSrcValue = slides[0].url;
      singleAlbumCount++;
      totalSlidesRestored += 1;
    }

    // Escape for MySQL SQL statement
    // Using hex or standard string escaping
    const escapedSrc = finalSrcValue.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
      switch (char) {
        case "\0": return "\\0";
        case "\x08": return "\\b";
        case "\x09": return "\\t";
        case "\x1a": return "\\z";
        case "\n": return "\\n";
        case "\r": return "\\r";
        case "\"": case "'": case "\\": case "%":
          return "\\" + char;
      }
      return char;
    });

    sqlStatements.push(`UPDATE gallery_photos SET src = '${escapedSrc}', updatedAt = NOW() WHERE id = '${p.id}';`);

    // Also update local DB directly
    await conn.execute('UPDATE gallery_photos SET src = ?, updatedAt = NOW() WHERE id = ?', [finalSrcValue, p.id]);
  }

  sqlStatements.push('COMMIT;');

  const sqlFilePath = 'c:/Users/Admin/OneDrive/Desktop/Gujarat-Post/Gujaratpost/backend/restore_all_gallery_multi_images.sql';
  fs.writeFileSync(sqlFilePath, sqlStatements.join('\n'), 'utf8');

  console.log('\n============================================================');
  console.log('🎉 RESTORATION COMPLETED!');
  console.log(`- Total Galleries in DB:      ${photos.length}`);
  console.log(`- Multi-Image Albums restored:${multiAlbumCount}`);
  console.log(`- Single Albums restored:     ${singleAlbumCount}`);
  console.log(`- Preserved Existing Albums:  ${preservedCount}`);
  console.log(`- Total Slides Restored:      ${totalSlidesRestored}`);
  console.log(`- SQL File Generated:         ${sqlFilePath} (${(fs.statSync(sqlFilePath).size / 1024).toFixed(1)} KB)`);
  console.log('============================================================\n');

  await conn.end();
}

main().catch(console.error);

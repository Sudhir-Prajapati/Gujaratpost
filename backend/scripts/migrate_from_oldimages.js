/**
 * migrate_from_oldimages.js
 * ==========================================
 * Finds the ~220 remaining posts whose featuredImage still points to gujaratpost.in
 * Looks for the matching file in the local oldImages folder (news, news1, news2, images, etc.)
 * If found locally → uploads to Cloudinary and updates the DB
 * If not found locally → skips (leaves as-is for now)
 *
 * Safe: ONLY updates featuredImage. Nothing else is touched.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const prisma = new PrismaClient();

// All subdirectories to search in oldImages
const OLD_IMAGES_ROOT = path.resolve('C:\\Users\\Admin\\OneDrive\\Desktop\\Gujarat-Post\\oldImages');
const SEARCH_DIRS = ['news', 'news1', 'news2', 'images', 'images1', 'images2', 'gallery', 'gallery1', 'page', 'poster', 'services'];

/** Build an index of all files in oldImages: lowercase filename -> full path */
function buildFileIndex() {
  console.log('📂 Building file index from oldImages...');
  const index = new Map();
  for (const dir of SEARCH_DIRS) {
    const fullDir = path.join(OLD_IMAGES_ROOT, dir);
    if (!fs.existsSync(fullDir)) continue;
    const files = fs.readdirSync(fullDir);
    for (const file of files) {
      const lower = file.toLowerCase();
      if (!index.has(lower)) {
        index.set(lower, path.join(fullDir, file));
      }
    }
  }
  console.log(`✅ Indexed ${index.size} files from oldImages.`);
  return index;
}

async function uploadLocalFile(filePath, folder, publicId) {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: `gujarat-post/${folder}`,
    public_id: publicId,
    overwrite: true,
    resource_type: 'image',
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  });
  return result.secure_url;
}

async function main() {
  console.log('=== Gujarat Post: Upload Missing Images from oldImages ===\n');

  // Verify Cloudinary
  const ping = await cloudinary.api.ping();
  console.log('✅ Cloudinary ready:', ping.status, '\n');

  // Build oldImages file index
  const fileIndex = buildFileIndex();

  // Get all remaining posts with gujaratpost.in images
  const remaining = await prisma.post.findMany({
    where: { featuredImage: { contains: 'gujaratpost.in' } },
    select: { id: true, articleNumber: true, featuredImage: true },
    orderBy: { articleNumber: 'asc' },
  });

  console.log(`Found ${remaining.length} posts still pointing to gujaratpost.in\n`);

  let found = 0, uploaded = 0, notFound = 0, failed = 0;

  for (const post of remaining) {
    // Extract and clean filename from URL
    let rawFilename = post.featuredImage.split('/news/').pop() || '';
    rawFilename = rawFilename.split(',')[0].trim(); // handle comma-separated

    // Decode URL encoding for filename lookup
    let decodedFilename = '';
    try {
      decodedFilename = decodeURIComponent(rawFilename).toLowerCase();
    } catch {
      decodedFilename = rawFilename.toLowerCase();
    }

    // Also try the raw lowercase (non-decoded) version
    const rawLower = rawFilename.toLowerCase();

    const localPath = fileIndex.get(decodedFilename) || fileIndex.get(rawLower);

    if (!localPath) {
      notFound++;
      console.log(`❌ NOT FOUND [#${post.articleNumber}]: ${rawFilename}`);
      continue;
    }

    found++;

    // Build safe Cloudinary public_id
    const baseName = path.basename(localPath).replace(/\.[^/.]+$/, '');
    const safeId = baseName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60);
    const publicId = `post_${post.articleNumber}_${safeId}`;

    try {
      console.log(`⬆️  Uploading [#${post.articleNumber}]: ${path.basename(localPath)}`);
      const cdnUrl = await uploadLocalFile(localPath, 'news', publicId);

      await prisma.post.update({
        where: { id: post.id },
        data: { featuredImage: cdnUrl },
      });

      uploaded++;
      console.log(`   ✅ Done -> ${cdnUrl.slice(0, 80)}...`);
    } catch (err) {
      failed++;
      console.error(`   ❌ Upload error [#${post.articleNumber}]: ${err.message || err}`);
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Total remaining:  ${remaining.length}`);
  console.log(`Found locally:    ${found}`);
  console.log(`Uploaded:         ${uploaded}`);
  console.log(`Not found:        ${notFound}`);
  console.log(`Failed uploads:   ${failed}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Fatal:', e);
  await prisma.$disconnect();
  process.exit(1);
});

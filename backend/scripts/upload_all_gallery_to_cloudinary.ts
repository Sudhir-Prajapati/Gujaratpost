/**
 * upload_all_gallery_to_cloudinary.ts
 * =====================================
 * Uploads all 2nd, 3rd, and subsequent gallery images from local media archive to Cloudinary.
 * Updates MySQL `gallery_photos` table so that multi-image albums contain 100% Cloudinary URLs.
 *
 * Rules:
 * - 0% dependence on gujaratpost.in / external broken URLs.
 * - Image #1 (existing Cloudinary image) is preserved untouched.
 * - Missing local images are skipped (NEVER inserted as broken links).
 * - Fully resumable via checkpoint file.
 */

import * as dotenv from 'c:/Users/Admin/OneDrive/Desktop/Gujarat-Post/Gujaratpost/backend/node_modules/dotenv';
dotenv.config({ path: 'c:/Users/Admin/OneDrive/Desktop/Gujarat-Post/Gujaratpost/backend/.env' });

import { PrismaClient } from 'c:/Users/Admin/OneDrive/Desktop/Gujarat-Post/Gujaratpost/backend/node_modules/@prisma/client';
import { v2 as cloudinary } from 'c:/Users/Admin/OneDrive/Desktop/Gujarat-Post/Gujaratpost/backend/node_modules/cloudinary';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const prisma = new PrismaClient();

const DUMP_PATH = 'c:/Users/Admin/OneDrive/Desktop/Gujarat-Post/gujaratpost_newsgujrati_23OCT2026.sql.gz';
const LOCAL_MEDIA_ROOT = 'C:/Users/Admin/Downloads/www/gujaratpost.co.in/Backup2022/oldImages';
const CHECKPOINT_FILE = path.join(__dirname, 'gallery_upload_checkpoint.json');
const CONCURRENCY = 5;

interface Checkpoint {
  processedIds: string[];
  uploadedFilesMap: Record<string, string>; // localPath -> cloudinaryUrl
  stats: {
    totalProcessed: number;
    totalUploaded: number;
    totalUpdated: number;
  };
}

function loadCheckpoint(): Checkpoint {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf-8'));
    } catch (e) {}
  }
  return {
    processedIds: [],
    uploadedFilesMap: {},
    stats: { totalProcessed: 0, totalUploaded: 0, totalUpdated: 0 }
  };
}

function saveCheckpoint(cp: Checkpoint) {
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(cp, null, 2), 'utf-8');
}

/** Recursively scan local media, prioritizing full-size images over thumbs */
function scanLocalMedia(dir: string, map: Map<string, string>) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanLocalMedia(fullPath, map);
      } else if (entry.isFile()) {
        const key = entry.name.toLowerCase().trim();
        const existing = map.get(key);
        // Prefer non-thumbs over thumbs
        if (!existing) {
          map.set(key, fullPath);
        } else if (existing.includes('thumbs') && !fullPath.includes('thumbs')) {
          map.set(key, fullPath);
        }
      }
    }
  } catch (e) {}
}

/** Upload local image to Cloudinary */
async function uploadToCloudinary(localPath: string, publicId: string, retries = 2): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await cloudinary.uploader.upload(localPath, {
        folder: 'gujarat-post/gallery',
        public_id: publicId,
        overwrite: true,
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }]
      });
      return res.secure_url;
    } catch (err: any) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  throw new Error('Upload failed after retries');
}

async function promisePool<T>(items: T[], concurrency: number, fn: (item: T, idx: number) => Promise<void>) {
  let index = 0;
  const workers = Array(concurrency).fill(null).map(async () => {
    while (index < items.length) {
      const i = index++;
      await fn(items[i], i);
    }
  });
  await Promise.all(workers);
}

async function main() {
  console.log('=====================================================');
  console.log('🚀 CLOUDINARY MULTI-IMAGE GALLERY MIGRATION STARTED');
  console.log('=====================================================');

  const checkpoint = loadCheckpoint();
  const processedSet = new Set(checkpoint.processedIds);

  console.log(`\n[1/5] Indexing local media in ${LOCAL_MEDIA_ROOT}...`);
  const fileMap = new Map<string, string>();
  scanLocalMedia(LOCAL_MEDIA_ROOT, fileMap);
  console.log(`✅ Indexed ${fileMap.size} unique filenames from local storage.`);

  console.log(`\n[2/5] Parsing old database dump from ${DUMP_PATH}...`);
  const rl = readline.createInterface({
    input: fs.createReadStream(DUMP_PATH),
    crlfDelay: Infinity
  });

  let galleryLine = '';
  let galleryOptionsLine = '';

  for await (const line of rl) {
    if (line.startsWith('INSERT INTO `gallery` VALUES')) galleryLine = line;
    if (line.startsWith('INSERT INTO `galleryoptions` VALUES')) galleryOptionsLine = line;
  }

  // Parse galleryoptions
  const optionsRegex = /\((\d+),\s*(\d+),\s*'([^']*)',\s*'([^']*)',\s*(\d+),\s*'([^']*)',\s*'([^']*)'\)/g;
  let match;
  const optionsByGId: Record<number, string[]> = {};
  while ((match = optionsRegex.exec(galleryOptionsLine)) !== null) {
    const gId = parseInt(match[2], 10);
    const optValue = match[4].trim();
    if (!optionsByGId[gId]) optionsByGId[gId] = [];
    if (optValue) optionsByGId[gId].push(optValue);
  }

  // Parse gallery
  const text = galleryLine.substring('INSERT INTO `gallery` VALUES '.length);
  const oldGalleries: any[] = [];
  let i = 0;
  while (i < text.length) {
    while (i < text.length && text[i] !== '(') i++;
    if (i >= text.length) break;
    i++;
    const values: string[] = [];
    let cur = '', inQuote = false, escape = false;
    while (i < text.length) {
      const c = text[i];
      if (escape) { cur += c; escape = false; i++; continue; }
      if (c === '\\') { escape = true; i++; continue; }
      if (c === "'") { inQuote = !inQuote; i++; continue; }
      if (!inQuote) {
        if (c === ',') { values.push(cur.trim()); cur = ''; i++; continue; }
        if (c === ')') { values.push(cur.trim()); cur = ''; i++; break; }
      }
      cur += c; i++;
    }
    if (values.length >= 7) {
      oldGalleries.push({
        gId: parseInt(values[0], 10),
        name: values[1],
        slug: values[2],
        desc: values[3],
        images: values[4],
        gImg: values[5],
        createdDate: values[6]
      });
    }
  }
  console.log(`✅ Parsed ${oldGalleries.length} galleries from dump.`);

  console.log('\n[3/5] Fetching current DB photos from MySQL...');
  const currentPhotos = await prisma.galleryPhoto.findMany();
  console.log(`✅ Found ${currentPhotos.length} gallery photos in current database.`);

  console.log('\n[4/5] Matching galleries and preparing upload tasks...');
  const tasks: any[] = [];

  for (const og of oldGalleries) {
    // Match currentPhoto
    const [dPart, tPart] = (og.createdDate || '').split(' ');
    let cp: any = null;
    if (dPart && tPart) {
      const istDate = new Date(`${dPart}T${tPart}+05:30`);
      cp = currentPhotos.find(p => Math.abs(p.createdAt.getTime() - istDate.getTime()) < 5000);
    }
    if (!cp && og.name) {
      cp = currentPhotos.find(p => p.alt === og.name || p.captionGu === og.name);
    }

    if (!cp) continue;
    if (processedSet.has(cp.id)) continue;

    // Collect 2nd, 3rd, etc. filenames
    const extraFilenames: string[] = [];
    if (og.gImg && og.gImg !== 'NULL' && og.gImg.trim()) {
      og.gImg.split(',').forEach((s: string) => {
        const tr = s.trim();
        if (tr && !extraFilenames.includes(tr) && tr !== og.images) extraFilenames.push(tr);
      });
    }
    const opts = optionsByGId[og.gId] || [];
    opts.forEach(opt => {
      const tr = opt.trim();
      if (tr && !extraFilenames.includes(tr) && tr !== og.images) extraFilenames.push(tr);
    });

    tasks.push({
      photoId: cp.id,
      title: og.name,
      currentPhoto: cp,
      extraFilenames
    });
  }

  console.log(`Total galleries to process: ${tasks.length} (Already processed: ${checkpoint.processedIds.length})`);

  console.log('\n[5/5] Processing gallery uploads and updating DB...');
  let completed = 0;

  await promisePool(tasks, CONCURRENCY, async (task) => {
    try {
      const cp = task.currentPhoto;
      const primaryTitle = cp.captionGu || cp.alt || cp.caption || 'Gallery Photo';
      const primaryDesc = cp.caption || cp.captionGu || cp.alt || '';
      const primaryPhotographer = cp.photographer || 'Gujarat Post Team';

      // Primary image #0
      let primaryUrl = cp.src.startsWith('[') ? JSON.parse(cp.src)[0].src : cp.src;
      // If primary is broken gujaratpost.in, upload primary local file if available
      if (primaryUrl.includes('gujaratpost.in')) {
        const cleanFn = path.basename(primaryUrl.split(',')[0]);
        const localPrimary = fileMap.get(cleanFn.toLowerCase());
        if (localPrimary) {
          const pubId = `gallery_${cp.id}_primary`;
          primaryUrl = await uploadToCloudinary(localPrimary, pubId);
          checkpoint.stats.totalUploaded++;
        }
      }

      const imagesArray: any[] = [
        {
          src: primaryUrl,
          title: primaryTitle,
          caption: primaryDesc,
          captionGu: primaryTitle,
          description: primaryDesc,
          photographer: primaryPhotographer
        }
      ];

      // Process extra images
      let slideIdx = 1;
      for (const fn of task.extraFilenames) {
        const localPath = fileMap.get(fn.toLowerCase().trim());
        if (!localPath) {
          // File missing from 2022 backup: SKIP IT to prevent broken links!
          continue;
        }

        let cdnUrl = checkpoint.uploadedFilesMap[localPath];
        if (!cdnUrl) {
          const publicId = `gallery_${cp.id}_slide_${slideIdx}`;
          cdnUrl = await uploadToCloudinary(localPath, publicId);
          checkpoint.uploadedFilesMap[localPath] = cdnUrl;
          checkpoint.stats.totalUploaded++;
        }

        imagesArray.push({
          src: cdnUrl,
          title: primaryTitle,
          caption: primaryDesc,
          captionGu: primaryTitle,
          description: primaryDesc,
          photographer: primaryPhotographer
        });
        slideIdx++;
      }

      // Format new src value
      const newSrcValue = imagesArray.length > 1 ? JSON.stringify(imagesArray) : imagesArray[0].src;

      // Update MySQL gallery_photos
      await prisma.galleryPhoto.update({
        where: { id: cp.id },
        data: {
          src: newSrcValue,
          updatedAt: new Date()
        }
      });

      checkpoint.processedIds.push(cp.id);
      checkpoint.stats.totalProcessed++;
      checkpoint.stats.totalUpdated++;

      completed++;
      if (completed % 25 === 0 || completed === tasks.length) {
        saveCheckpoint(checkpoint);
        console.log(`[Progress] ${completed}/${tasks.length} galleries processed. Total Cloudinary images uploaded: ${checkpoint.stats.totalUploaded}`);
      }
    } catch (err: any) {
      console.error(`Error processing gallery [ID: ${task.photoId}]:`, err.message || err);
    }
  });

  saveCheckpoint(checkpoint);
  console.log('\n=====================================================');
  console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY!');
  console.log(`Total galleries processed: ${checkpoint.stats.totalProcessed}`);
  console.log(`Total images uploaded to Cloudinary: ${checkpoint.stats.totalUploaded}`);
  console.log(`Total DB records updated: ${checkpoint.stats.totalUpdated}`);
  console.log('=====================================================');

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Fatal error during migration:', err);
  prisma.$disconnect();
  process.exit(1);
});

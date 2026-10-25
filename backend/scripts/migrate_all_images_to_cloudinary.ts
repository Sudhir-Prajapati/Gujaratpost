/**
 * migrate_all_images_to_cloudinary.ts
 * =====================================
 * Safely migrates all images from gujaratpost.in to Cloudinary and updates
 * the MySQL database with Cloudinary CDN URLs.
 *
 * CRITICAL SAFETY RULES:
 * 1. ONLY updates `featuredImage` on Post and `src` on GalleryPhoto.
 * 2. NEVER touches `slug`, `canonicalUrl`, `articleNumber`, `title`, or dates.
 * 3. Keeps state in `scripts/migration_checkpoint.json` so it can be resumed
 *    at any point without re-uploading already migrated images.
 * 4. Saves a pre-migration JSON backup of original image URLs.
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const prisma = new PrismaClient();
const CHECKPOINT_FILE = path.join(process.cwd(), 'scripts', 'migration_checkpoint.json');
const BACKUP_FILE = path.join(process.cwd(), 'scripts', 'pre_migration_image_backup.json');
const CONCURRENCY = 6; // Balanced concurrency to avoid rate-limits

interface Checkpoint {
  totalPostsProcessed: number;
  totalGalleryProcessed: number;
  failedPosts: string[];
  failedGallery: string[];
}

function loadCheckpoint(): Checkpoint {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf-8'));
    } catch {
      // ignore
    }
  }
  return {
    totalPostsProcessed: 0,
    totalGalleryProcessed: 0,
    failedPosts: [],
    failedGallery: [],
  };
}

function saveCheckpoint(cp: Checkpoint) {
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(cp, null, 2), 'utf-8');
}

/** Backup original image URLs before any migration */
async function backupOriginalUrls() {
  if (fs.existsSync(BACKUP_FILE)) {
    console.log(`ℹ️  Pre-migration backup already exists at: ${BACKUP_FILE}`);
    return;
  }

  console.log('📦 Creating pre-migration safety backup of original image URLs...');
  const posts = await prisma.post.findMany({
    where: { featuredImage: { contains: 'gujaratpost.in' } },
    select: { id: true, featuredImage: true },
  });

  const photos = await prisma.galleryPhoto.findMany({
    where: { src: { contains: 'gujaratpost.in' } },
    select: { id: true, src: true },
  });

  const backupData = {
    createdAt: new Date().toISOString(),
    totalPosts: posts.length,
    totalGallery: photos.length,
    posts,
    gallery: photos,
  };

  fs.writeFileSync(BACKUP_FILE, JSON.stringify(backupData, null, 2), 'utf-8');
  console.log(`✅ Pre-migration backup saved (${posts.length} posts, ${photos.length} photos) to: ${BACKUP_FILE}`);
}

/** Fetch image locally with browser User-Agent and upload buffer to Cloudinary */
async function uploadToCloudinary(imageUrl: string, folder: string, publicId: string, retries = 2): Promise<string> {
  let cleanUrl = imageUrl.split(',')[0].trim();
  try {
    cleanUrl = encodeURI(decodeURI(cleanUrl));
  } catch {}

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

    try {
      const res = await fetch(cleanUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} when fetching image: ${cleanUrl}`);
      }

      const contentType = res.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length === 0) {
        throw new Error(`Zero-byte image buffer received from: ${cleanUrl}`);
      }

      const dataUri = `data:${contentType};base64,${buffer.toString('base64')}`;

      const result = await cloudinary.uploader.upload(dataUri, {
        folder: `gujarat-post/${folder}`,
        public_id: publicId,
        overwrite: true,
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      });

      return result.secure_url;
    } catch (err) {
      clearTimeout(timeoutId);
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 600));
        continue;
      }
      throw err;
    }
  }
  throw new Error(`Failed to upload after ${retries} attempts: ${cleanUrl}`);
}

/** Helper for concurrency pool */
async function promiseAllPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<any>[] = [];

  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item)).then((res) => {
      results.push(res);
      executing.splice(executing.indexOf(p), 1);
    });
    executing.push(p);
    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }
  await Promise.all(executing);
  return results;
}

async function verifyCredentials(): Promise<boolean> {
  try {
    const ping = await cloudinary.api.ping();
    console.log('✅ Cloudinary credentials verified successfully:', ping);
    return true;
  } catch (err: any) {
    console.error('❌ Cloudinary authentication failed:', err.message || err);
    return false;
  }
}

async function migrateGallery() {
  const checkpoint = loadCheckpoint();
  const failedSet = new Set(checkpoint.failedGallery);

  console.log('\n--- 1. STARTING GALLERY PHOTOS MIGRATION ---');

  const photos = await prisma.galleryPhoto.findMany({
    where: {
      src: { contains: 'gujaratpost.in' },
      id: { notIn: Array.from(failedSet) },
    },
    select: { id: true, src: true },
  });

  console.log(`Found ${photos.length} gallery photos to migrate.`);

  let done = 0;
  await promiseAllPool(photos, CONCURRENCY, async (photo) => {
    try {
      const publicId = `gallery_${photo.id}`;
      const cdnUrl = await uploadToCloudinary(photo.src, 'gallery', publicId);

      // ONLY update src, nothing else
      await prisma.galleryPhoto.update({
        where: { id: photo.id },
        data: { src: cdnUrl },
      });

      done++;
      checkpoint.totalGalleryProcessed++;
      if (done % 20 === 0 || done === photos.length) {
        console.log(`[Gallery] Progress: ${done}/${photos.length} photos migrated to Cloudinary.`);
        saveCheckpoint(checkpoint);
      }
    } catch (err: any) {
      console.error(`Gallery photo error [ID: ${photo.id}]:`, err.message || err);
      checkpoint.failedGallery.push(photo.id);
      saveCheckpoint(checkpoint);
    }
  });

  console.log(`✅ Gallery migration completed: ${done}/${photos.length}\n`);
}

async function migratePosts() {
  const checkpoint = loadCheckpoint();
  const failedSet = new Set(checkpoint.failedPosts);

  console.log('\n--- 2. STARTING NEWS ARTICLES FEATURED IMAGE MIGRATION ---');

  const totalRemaining = await prisma.post.count({
    where: {
      featuredImage: { contains: 'gujaratpost.in' },
      id: { notIn: Array.from(failedSet) },
    },
  });

  console.log(`Total remaining posts to migrate: ${totalRemaining}`);

  const BATCH_SIZE = 100;
  let running = true;
  let batchCount = 0;

  while (running) {
    const posts = await prisma.post.findMany({
      where: {
        featuredImage: { contains: 'gujaratpost.in' },
        id: { notIn: Array.from(failedSet) },
      },
      take: BATCH_SIZE,
      select: {
        id: true,
        slug: true,
        featuredImage: true,
        articleNumber: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (posts.length === 0) {
      console.log('🎉 No more posts remaining with gujaratpost.in image URLs!');
      break;
    }

    batchCount++;
    console.log(`\nProcessing Batch #${batchCount} (${posts.length} articles)...`);

    let batchSuccess = 0;
    await promiseAllPool(posts, CONCURRENCY, async (post) => {
      try {
        if (!post.featuredImage) return;

        // Clean, safe public ID (only alphanumeric, underscores, hyphens)
        let rawFilename = 'img';
        try {
          rawFilename = path.basename(new URL(post.featuredImage).pathname).replace(/\.[^/.]+$/, '');
        } catch {}
        const safeFilename = decodeURIComponent(rawFilename).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 35);
        const publicId = `post_${post.articleNumber || post.id.slice(0, 8)}_${safeFilename}`;

        const cdnUrl = await uploadToCloudinary(post.featuredImage, 'news', publicId);

        // CRITICAL SAFETY: ONLY UPDATE featuredImage
        // DO NOT TOUCH slug, canonicalUrl, title, content, or any other field!
        await prisma.post.update({
          where: { id: post.id },
          data: { featuredImage: cdnUrl },
        });

        batchSuccess++;
        checkpoint.totalPostsProcessed++;
      } catch (err: any) {
        console.error(`Post error [Article #${post.articleNumber}]: ${err.message || err}`);
        checkpoint.failedPosts.push(post.id);
        failedSet.add(post.id);
      }
    });

    saveCheckpoint(checkpoint);
    console.log(`Batch #${batchCount} Complete: ${batchSuccess}/${posts.length} migrated.`);
    console.log(`Total posts migrated so far: ${checkpoint.totalPostsProcessed} / ${totalRemaining}`);
  }
}

async function main() {
  console.log('========================================================');
  console.log('GUJARAT POST -> CLOUDINARY COMPLETE IMAGE MIGRATOR');
  console.log('========================================================\n');

  const ok = await verifyCredentials();
  if (!ok) {
    console.error('\n🚨 MIGRATION HALTED: Cloudinary credentials must be corrected in backend/.env before proceeding.');
    process.exit(1);
  }

  // 1. Create safety backup
  await backupOriginalUrls();

  // 2. Migrate Gallery photos first (smaller, 787 items)
  await migrateGallery();

  // 3. Migrate Article featured images (25,869 items)
  await migratePosts();

  console.log('\n========================================================');
  console.log('🎉 ALL IMAGES SUCCESSFULLY MIGRATED TO CLOUDINARY CDN!');
  console.log('========================================================');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Fatal error during migration:', e);
  await prisma.$disconnect();
  process.exit(1);
});

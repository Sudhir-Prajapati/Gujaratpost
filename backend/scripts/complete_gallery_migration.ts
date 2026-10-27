import * as dotenv from 'dotenv';
dotenv.config({ path: 'c:/Users/Admin/OneDrive/Desktop/Gujarat-Post/Gujaratpost/backend/.env' });

import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import mysql from 'mysql2/promise';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const DUMP_PATH = 'c:/Users/Admin/OneDrive/Desktop/Gujarat-Post/gujaratpost_newsgujrati_23OCT2026.sql.gz';
const LOCAL_MEDIA_ROOT = 'C:/Users/Admin/Downloads/www/gujaratpost.co.in/Backup2022/oldImages';
const CONCURRENCY = 6;

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
        if (!existing || (existing.includes('thumbs') && !fullPath.includes('thumbs'))) {
          map.set(key, fullPath);
        }
      }
    }
  } catch (e) {}
}

async function uploadBufferToCloudinary(buffer: Buffer, publicId: string, retries = 2): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await new Promise<string>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'gujarat-post/gallery',
            public_id: publicId,
            overwrite: true,
            resource_type: 'image',
            transformation: [{ quality: 'auto', fetch_format: 'auto' }]
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result!.secure_url);
          }
        );
        uploadStream.end(buffer);
      });
    } catch (err: any) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  throw new Error('Upload failed after retries');
}

async function uploadFileToCloudinary(filePath: string, publicId: string, retries = 2): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await cloudinary.uploader.upload(filePath, {
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

async function fetchRemoteImageBuffer(filename: string): Promise<Buffer | null> {
  const enc = encodeURIComponent(filename);
  const possibleUrls = [
    `https://gujaratpost.in/uploads/gallery/${enc}`,
    `https://gujaratpost.in/oldImages/gallery/${enc}`,
    `https://gujaratpost.in/oldImages/${enc}`,
    `https://gujaratpost.in/uploads/${enc}`
  ];

  for (const url of possibleUrls) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        const buf = Buffer.from(arrayBuf);
        if (buf.length > 500) {
          return buf;
        }
      }
    } catch {}
  }
  return null;
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
  console.log('================================================================');
  console.log('🚀 COMPLETE GALLERY MIGRATION: UPLOADING ALL REMAINING IMAGES');
  console.log('================================================================');

  const fileMap = new Map<string, string>();
  console.log('\n[1/5] Scanning local media folder...');
  scanLocalMedia(LOCAL_MEDIA_ROOT, fileMap);
  console.log(`✅ Indexed ${fileMap.size} local files.`);

  console.log('\n[2/5] Parsing SQL dump for gallery and galleryoptions...');
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

  const cleanVal = (s: string) => {
    if (!s) return '';
    let t = s.trim();
    if (t.startsWith("'") && t.endsWith("'")) t = t.slice(1, -1);
    return t.replace(/\\'/g, "'").replace(/\\\\/g, "\\").trim();
  };

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
        if (c === ',') { values.push(cleanVal(cur)); cur = ''; i++; continue; }
        if (c === ')') { values.push(cleanVal(cur)); cur = ''; i++; break; }
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

  console.log('\n[3/5] Connecting to database...');
  const conn = await mysql.createConnection('mysql://gujaratpost:gujaratpost2005@127.0.0.1:3306/gujaratpost');
  const [currentPhotos]: [any[], any] = await conn.execute('SELECT id, alt, captionGu, caption, photographer, src, createdAt FROM gallery_photos');
  console.log(`✅ Loaded ${currentPhotos.length} gallery photos from DB.`);

  console.log('\n[4/5] Preparing migration tasks for single photos with multiple images...');
  const tasks: any[] = [];

  for (const cp of currentPhotos) {
    const isAlreadyMulti = cp.src && cp.src.startsWith('[');
    const cleanTitle = (cp.captionGu || cp.alt || '').trim();

    // Match with old dump
    const og = oldGalleries.find(g => {
      const gName = (g.name || '').trim();
      return gName === cleanTitle || (gName && cleanTitle && (cleanTitle.includes(gName) || gName.includes(cleanTitle)));
    });

    if (!og) continue;

    // Collect extras
    const extras: string[] = [];
    if (og.gImg && og.gImg !== 'NULL' && og.gImg.trim()) {
      og.gImg.split(',').forEach((s: string) => {
        const t = s.trim();
        if (t && t !== og.images && !extras.includes(t)) extras.push(t);
      });
    }
    const opts = optionsByGId[og.gId] || [];
    opts.forEach(opt => {
      const t = opt.trim();
      if (t && t !== og.images && !extras.includes(t)) extras.push(t);
    });

    // If album only has 1 image currently, but dump has extras
    if (!isAlreadyMulti && extras.length > 0) {
      tasks.push({
        photo: cp,
        title: cleanTitle,
        primaryFilename: og.images,
        extraFilenames: extras
      });
    }
  }

  console.log(`✅ Found ${tasks.length} single photos ready to be upgraded to multi-image albums!`);

  console.log('\n[5/5] Processing uploads and updating MySQL rows...');
  let updatedCount = 0;
  let totalUploaded = 0;
  let skippedNoMedia = 0;

  await promisePool(tasks, CONCURRENCY, async (task, idx) => {
    try {
      const cp = task.photo;
      const primaryTitle = cp.captionGu || cp.alt || cp.caption || 'Gallery Photo';
      const primaryDesc = cp.caption || cp.captionGu || cp.alt || '';
      const primaryPhotographer = cp.photographer || 'Gujarat Post Team';

      // 1. Primary image #0
      const primaryUrl = cp.src.startsWith('[') ? JSON.parse(cp.src)[0].src : cp.src;

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

      // 2. Extra images
      let slideIdx = 1;
      for (const fn of task.extraFilenames) {
        const cleanFn = path.basename(fn).trim();
        if (!cleanFn) continue;

        let cloudinaryUrl: string | null = null;
        const pubId = `gallery_${cp.id}_slide_${slideIdx}`;

        // A. Check local file
        const localPath = fileMap.get(cleanFn.toLowerCase());
        if (localPath) {
          cloudinaryUrl = await uploadFileToCloudinary(localPath, pubId);
          totalUploaded++;
        } else {
          // B. Fetch from live server
          const buf = await fetchRemoteImageBuffer(cleanFn);
          if (buf) {
            cloudinaryUrl = await uploadBufferToCloudinary(buf, pubId);
            totalUploaded++;
          }
        }

        if (cloudinaryUrl) {
          imagesArray.push({
            src: cloudinaryUrl,
            title: primaryTitle,
            caption: primaryDesc,
            captionGu: primaryTitle,
            description: primaryDesc,
            photographer: primaryPhotographer
          });
          slideIdx++;
        }
      }

      // If at least one extra image was successfully uploaded
      if (imagesArray.length > 1) {
        const jsonSrc = JSON.stringify(imagesArray);
        await conn.execute('UPDATE gallery_photos SET src = ?, updatedAt = NOW() WHERE id = ?', [jsonSrc, cp.id]);
        updatedCount++;
        console.log(`[${idx + 1}/${tasks.length}] ✅ Upgraded "${primaryTitle.substring(0, 30)}..." -> ${imagesArray.length} photos`);
      } else {
        skippedNoMedia++;
      }
    } catch (err: any) {
      console.error(`❌ Error on photo ${task.photo.id}:`, err.message);
    }
  });

  await conn.end();

  console.log('\n================================================================');
  console.log(`🎉 COMPLETED!`);
  console.log(`- Upgraded to Multi-Image: ${updatedCount} albums`);
  console.log(`- New Cloudinary Uploads:  ${totalUploaded} images`);
  console.log(`- Skipped (media not found): ${skippedNoMedia}`);
  console.log('================================================================');
}

main().catch(console.error);

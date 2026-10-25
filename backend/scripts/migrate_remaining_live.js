require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { v2: cloudinary } = require('cloudinary');
const https = require('https');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const prisma = new PrismaClient();

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(url);
      const req = https.get(
        {
          hostname: u.hostname,
          path: u.pathname + u.search,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Referer: 'https://gujaratpost.in/',
          },
          timeout: 5000,
        },
        (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return downloadImage(res.headers.location).then(resolve).catch(reject);
          }
          if (res.statusCode !== 200) {
            return reject(new Error(`HTTP ${res.statusCode}`));
          }
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => {
            const buffer = Buffer.concat(chunks);
            const contentType = res.headers['content-type'] || 'image/jpeg';
            resolve({ buffer, contentType });
          });
        }
      );
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
      req.on('error', (err) => reject(new Error(err.message)));
    } catch (e) {
      reject(e);
    }
  });
}

function uploadBufferToCloudinary(buffer, contentType, folder, publicId) {
  return new Promise((resolve, reject) => {
    const dataUri = `data:${contentType};base64,${buffer.toString('base64')}`;
    cloudinary.uploader.upload(
      dataUri,
      {
        folder: `gujarat-post/${folder}`,
        public_id: publicId,
        overwrite: true,
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url);
      }
    );
  });
}

async function run() {
  console.log('=== Gujarat Post: Concurrent Live Image Migration ===\n');

  const ping = await cloudinary.api.ping();
  console.log('✅ Cloudinary ping:', ping.status, '\n');

  const remainingPosts = await prisma.post.findMany({
    where: { featuredImage: { contains: 'gujaratpost.in' } },
    select: { id: true, articleNumber: true, featuredImage: true },
    orderBy: { articleNumber: 'asc' },
  });

  console.log(`Total remaining posts to evaluate: ${remainingPosts.length}\n`);

  let successCount = 0;
  let failCount = 0;
  let finishedCount = 0;
  const CONCURRENCY = 5;

  let index = 0;
  async function worker() {
    while (index < remainingPosts.length) {
      const post = remainingPosts[index++];
      let imgUrl = post.featuredImage.split(',')[0].trim();
      if (!imgUrl.startsWith('http')) {
        imgUrl = `https://gujaratpost.in/news/${imgUrl.replace(/^\/+/, '')}`;
      }

      try {
        const { buffer, contentType } = await downloadImage(imgUrl);
        const publicId = `post_${post.articleNumber || post.id}`;
        const cdnUrl = await uploadBufferToCloudinary(buffer, contentType, 'news', publicId);

        await prisma.post.update({
          where: { id: post.id },
          data: { featuredImage: cdnUrl },
        });

        successCount++;
        finishedCount++;
        console.log(`[${finishedCount}/${remainingPosts.length}] ✅ #${post.articleNumber}: Uploaded -> ${cdnUrl.slice(0, 70)}...`);
      } catch (err) {
        failCount++;
        finishedCount++;
        console.log(`[${finishedCount}/${remainingPosts.length}] ❌ #${post.articleNumber}: ${err.message}`);
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  console.log('\n=== MIGRATION COMPLETE ===');
  console.log(`Successfully migrated to Cloudinary: ${successCount}`);
  console.log(`Failed / Inaccessible on live server: ${failCount}`);

  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error('Fatal error:', e);
  await prisma.$disconnect();
  process.exit(1);
});

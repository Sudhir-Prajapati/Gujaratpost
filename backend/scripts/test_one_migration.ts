import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const prisma = new PrismaClient();

async function testOne() {
  console.log('Testing 1 Post & 1 Gallery item end-to-end...\n');

  // 1. Test 1 gallery item
  const photo = await prisma.galleryPhoto.findFirst({
    where: { src: { contains: 'gujaratpost.in' } }
  });

  if (photo) {
    console.log(`Original Photo [ID: ${photo.id}]: ${photo.src}`);
    const res = await fetch(photo.src, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://gujaratpost.in/'
      }
    });
    const buf = Buffer.from(await res.arrayBuffer());
    const dataUri = `data:${res.headers.get('content-type') || 'image/jpeg'};base64,${buf.toString('base64')}`;
    const up = await cloudinary.uploader.upload(dataUri, {
      folder: 'gujarat-post/gallery',
      public_id: `test_gallery_${photo.id}`
    });
    console.log(`Cloudinary Uploaded: ${up.secure_url}`);

    await prisma.galleryPhoto.update({
      where: { id: photo.id },
      data: { src: up.secure_url }
    });

    const checkPhoto = await prisma.galleryPhoto.findUnique({ where: { id: photo.id } });
    console.log(`✅ Database Updated Photo Src: ${checkPhoto?.src}\n`);
  }

  // 2. Test 1 Post item
  const post = await prisma.post.findFirst({
    where: { featuredImage: { contains: 'gujaratpost.in' } },
    select: { id: true, slug: true, articleNumber: true, featuredImage: true, canonicalUrl: true, titleGu: true }
  });

  if (post && post.featuredImage) {
    console.log(`Original Post [Article #${post.articleNumber} - ${post.slug}]:`);
    console.log(`  featuredImage: ${post.featuredImage}`);
    console.log(`  slug: ${post.slug}`);

    const res = await fetch(post.featuredImage, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://gujaratpost.in/'
      }
    });
    const buf = Buffer.from(await res.arrayBuffer());
    const dataUri = `data:${res.headers.get('content-type') || 'image/jpeg'};base64,${buf.toString('base64')}`;
    const up = await cloudinary.uploader.upload(dataUri, {
      folder: 'gujarat-post/news',
      public_id: `test_post_${post.articleNumber || post.id}`
    });
    console.log(`Cloudinary Uploaded: ${up.secure_url}`);

    // Update ONLY featuredImage
    await prisma.post.update({
      where: { id: post.id },
      data: { featuredImage: up.secure_url }
    });

    const checkPost = await prisma.post.findUnique({
      where: { id: post.id },
      select: { id: true, slug: true, articleNumber: true, featuredImage: true, canonicalUrl: true, titleGu: true }
    });

    console.log(`✅ Database Updated Post:`);
    console.log(`  featuredImage: ${checkPost?.featuredImage}`);
    console.log(`  slug (MUST BE UNCHANGED): ${checkPost?.slug}`);
    console.log(`  Slug match check: ${checkPost?.slug === post.slug ? 'PERFECT MATCH ✅' : 'MISMATCH ❌'}`);
  }

  await prisma.$disconnect();
}

testOne().catch(console.error);

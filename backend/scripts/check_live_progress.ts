import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const galleryCloudinary = await prisma.galleryPhoto.count({
    where: { src: { contains: 'cloudinary.com' } }
  });
  const galleryRemaining = await prisma.galleryPhoto.count({
    where: { src: { contains: 'gujaratpost.in' } }
  });
  const totalGallery = await prisma.galleryPhoto.count();

  const postsCloudinary = await prisma.post.count({
    where: { featuredImage: { contains: 'cloudinary.com' } }
  });
  const postsRemaining = await prisma.post.count({
    where: { featuredImage: { contains: 'gujaratpost.in' } }
  });
  const totalPosts = await prisma.post.count();

  console.log(JSON.stringify({
    gallery: {
      total: totalGallery,
      migratedToCloudinary: galleryCloudinary,
      remaining: galleryRemaining,
      percentage: ((galleryCloudinary / totalGallery) * 100).toFixed(1) + '%'
    },
    posts: {
      total: totalPosts,
      migratedToCloudinary: postsCloudinary,
      remaining: postsRemaining,
      percentage: ((postsCloudinary / totalPosts) * 100).toFixed(2) + '%'
    }
  }, null, 2));

  await prisma.$disconnect();
}

check().catch(console.error);

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runAnalysis() {
  console.log('Starting comprehensive database image & article analysis...\n');

  const totalPosts = await prisma.post.count();
  const gujaratPostImages = await prisma.post.count({
    where: { featuredImage: { contains: 'gujaratpost.in' } }
  });
  const unsplashImages = await prisma.post.count({
    where: { featuredImage: { contains: 'unsplash' } }
  });
  const emptyImages = await prisma.post.count({
    where: { featuredImage: '' }
  });

  console.log('=== 1. POSTS TABLE (featuredImage) ===');
  console.log(`Total posts: ${totalPosts}`);
  console.log(`Posts with gujaratpost.in image: ${gujaratPostImages}`);
  console.log(`Posts with unsplash image: ${unsplashImages}`);
  console.log(`Posts with empty image: ${emptyImages}`);

  const totalGallery = await prisma.galleryPhoto.count();
  const gujaratPostGallery = await prisma.galleryPhoto.count({
    where: { src: { contains: 'gujaratpost.in' } }
  });
  console.log('\n=== 2. GALLERY TABLE (src) ===');
  console.log(`Total gallery photos: ${totalGallery}`);
  console.log(`Gallery photos with gujaratpost.in: ${gujaratPostGallery}`);

  // Check if content / contentGu / contentHi contains gujaratpost.in
  const contentImages = await prisma.post.count({
    where: { content: { contains: 'gujaratpost.in' } }
  });
  const contentGuImages = await prisma.post.count({
    where: { contentGu: { contains: 'gujaratpost.in' } }
  });
  const contentHiImages = await prisma.post.count({
    where: { contentHi: { contains: 'gujaratpost.in' } }
  });
  console.log('\n=== 3. ARTICLE CONTENT FIELDS (HTML body) ===');
  console.log(`Posts with gujaratpost.in in content: ${contentImages}`);
  console.log(`Posts with gujaratpost.in in contentGu: ${contentGuImages}`);
  console.log(`Posts with gujaratpost.in in contentHi: ${contentHiImages}`);

    // Check author image
  const authorsWithGp = await prisma.author.count({
    where: { image: { contains: 'gujaratpost.in' } }
  });
  console.log('\n=== 4. OTHER TABLES ===');
  console.log(`Authors with gujaratpost.in image: ${authorsWithGp}`);

  // Inspect the 656 posts where content contains gujaratpost.in
  const contentPosts = await prisma.post.findMany({
    where: { content: { contains: 'gujaratpost.in' } },
    take: 10,
    select: { id: true, slug: true, content: true }
  });

  console.log('\n=== 5. INSPECTING gujaratpost.in OCCURRENCES IN ARTICLE CONTENT ===');
  for (const cp of contentPosts) {
    const matches = cp.content.match(/https?:\/\/[^\s"'<>]+/g) || [];
    const gpMatches = matches.filter(m => m.includes('gujaratpost.in'));
    console.log(`Post [${cp.slug}]:`);
    for (const m of gpMatches) {
      console.log(`   -> ${m}`);
    }
  }

  // Check sample posts
  const samples = await prisma.post.findMany({
    where: { featuredImage: { contains: 'gujaratpost.in' } },
    take: 3,
    select: {
      id: true,
      slug: true,
      articleNumber: true,
      canonicalUrl: true,
      featuredImage: true,
      titleGu: true
    }
  });

  console.log('\n=== 6. SAMPLE POSTS (featuredImage) ===');
  console.log(JSON.stringify(samples, null, 2));

  // Check URL path prefixes for featuredImage
  const urlPatterns: Record<string, number> = {};
  const batch = await prisma.post.findMany({
    where: { featuredImage: { contains: 'gujaratpost.in' } },
    take: 1000,
    select: { featuredImage: true }
  });

  for (const p of batch) {
    if (!p.featuredImage) continue;
    try {
      const u = new URL(p.featuredImage);
      const prefix = u.pathname.split('/').slice(0, 2).join('/');
      urlPatterns[prefix] = (urlPatterns[prefix] || 0) + 1;
    } catch {
      urlPatterns['invalid'] = (urlPatterns['invalid'] || 0) + 1;
    }
  }

  console.log('\n=== 7. SAMPLE URL PATH PREFIXES (first 1000 posts) ===');
  console.log(JSON.stringify(urlPatterns, null, 2));

  await prisma.$disconnect();
}

runAnalysis().catch(console.error);

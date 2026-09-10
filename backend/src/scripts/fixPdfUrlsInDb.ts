import { prisma } from '../config/prisma.js';

async function testUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-100' },
    });
    return res.status >= 200 && res.status < 300;
  } catch (e) {
    return false;
  }
}

async function fixPdfUrls() {
  console.log('🚀 Checking and fixing Cloudinary PDF URLs in DB with GET requests...');

  const posts: any[] = (await prisma.$queryRawUnsafe(
    `SELECT id, content, contentGu, contentHi FROM posts WHERE content LIKE '%res.cloudinary.com%' OR contentGu LIKE '%res.cloudinary.com%' OR contentHi LIKE '%res.cloudinary.com%'`
  )) as any[];

  console.log(`Found ${posts.length} posts with Cloudinary links.`);

  let updatedCount = 0;

  for (const p of posts) {
    let content = p.content || '';
    let contentGu = p.contentGu || '';
    let contentHi = p.contentHi || '';
    let modified = false;

    // Find all PDF URLs in content
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '[^\\/]+';
    const pdfRegex = new RegExp(`(https:\\/\\/res\\.cloudinary\\.com\\/${cloudName}\\/(?:image|raw)\\/upload\\/[^\\s"'<>]+?\\.pdf)`, 'gi');
    
    const allMatches = [
      ...content.matchAll(pdfRegex),
      ...contentGu.matchAll(pdfRegex),
      ...contentHi.matchAll(pdfRegex),
    ];

    const uniquePdfUrls = Array.from(new Set(allMatches.map((m) => m[1])));

    for (const pdfUrl of uniquePdfUrls) {
      console.log(`\nTesting PDF URL: ${pdfUrl}`);

      const rawUrl = pdfUrl.replace('/image/upload/', '/raw/upload/').replace('/fl_attachment/', '/');
      const imageUrl = pdfUrl.replace('/raw/upload/', '/image/upload/').replace('/fl_attachment/', '/');
      const imageFlUrl = pdfUrl.replace('/raw/upload/', '/image/upload/fl_attachment/').replace('/image/upload/', '/image/upload/fl_attachment/');

      let validWorkingUrl = '';

      if (await testUrl(imageUrl)) {
        validWorkingUrl = imageUrl;
        console.log(`  ✅ /image/upload/ IS VALID (200 OK)`);
      } else if (await testUrl(imageFlUrl)) {
        validWorkingUrl = imageFlUrl;
        console.log(`  ✅ /image/upload/fl_attachment/ IS VALID (200 OK)`);
      } else if (await testUrl(rawUrl)) {
        validWorkingUrl = rawUrl;
        console.log(`  ✅ /raw/upload/ IS VALID (200 OK)`);
      }

      if (validWorkingUrl) {
        if (content.includes(pdfUrl) && pdfUrl !== validWorkingUrl) {
          content = content.replaceAll(pdfUrl, validWorkingUrl);
          modified = true;
        }
        if (contentGu.includes(pdfUrl) && pdfUrl !== validWorkingUrl) {
          contentGu = contentGu.replaceAll(pdfUrl, validWorkingUrl);
          modified = true;
        }
        if (contentHi.includes(pdfUrl) && pdfUrl !== validWorkingUrl) {
          contentHi = contentHi.replaceAll(pdfUrl, validWorkingUrl);
          modified = true;
        }
      } else {
        console.warn(`  ❌ None of the Cloudinary URL formats responded OK for: ${pdfUrl}`);
      }
    }

    if (modified) {
      await prisma.$executeRawUnsafe(
        `UPDATE posts SET content=?, contentGu=?, contentHi=? WHERE id=?`,
        content, contentGu, contentHi, p.id
      );
      console.log(`✅ Updated Post ID: ${p.id}`);
      updatedCount++;
    }
  }

  console.log(`\n🎉 Finished fixing PDF URLs! Updated ${updatedCount} posts.`);
  process.exit(0);
}

fixPdfUrls().catch((err) => {
  console.error('Error fixing PDF URLs:', err);
  process.exit(1);
});

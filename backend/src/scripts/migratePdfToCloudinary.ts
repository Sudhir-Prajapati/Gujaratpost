import fs from 'fs';
import path from 'path';
import { cloudinary } from '../config/cloudinary.js';
import { prisma } from '../config/prisma.js';

async function migratePdfFiles() {
  console.log('🚀 Starting PDF Cloudinary Migration...');
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    console.log('No uploads directory found.');
    process.exit(0);
  }

  const files = fs.readdirSync(uploadsDir);
  const pdfFiles = files.filter((f) => f.toLowerCase().endsWith('.pdf'));

  console.log(`Found ${pdfFiles.length} PDF file(s) in local backend/uploads.`);

  for (const filename of pdfFiles) {
    const localFilePath = path.join(uploadsDir, filename);
    const localUrlPattern = `/uploads/${filename}`;

    try {
      console.log(`📤 Uploading to Cloudinary: ${filename}...`);
      const result = await cloudinary.uploader.upload(localFilePath, {
        folder: 'gujarat-post',
        resource_type: 'raw',
        use_filename: true,
        unique_filename: true,
      });

      let cdnUrl = result.secure_url || result.url;
      if (cdnUrl.includes('res.cloudinary.com')) {
        cdnUrl = cdnUrl.replace('/image/upload/', '/raw/upload/').replace('/fl_attachment/', '/');
      }

      console.log(`✅ Uploaded -> ${cdnUrl}`);

      // 1. Update Post content in MySQL DB if references exist
      const posts: any[] = await prisma.$queryRawUnsafe(
        `SELECT id, content, contentGu, contentHi FROM posts WHERE content LIKE ? OR contentGu LIKE ? OR contentHi LIKE ?`,
        `%${filename}%`, `%${filename}%`, `%${filename}%`
      );

      for (const p of posts) {
        const newContent = (p.content || '').replaceAll(localUrlPattern, cdnUrl).replaceAll(`http://localhost:5000/uploads/${filename}`, cdnUrl);
        const newContentGu = (p.contentGu || '').replaceAll(localUrlPattern, cdnUrl).replaceAll(`http://localhost:5000/uploads/${filename}`, cdnUrl);
        const newContentHi = (p.contentHi || '').replaceAll(localUrlPattern, cdnUrl).replaceAll(`http://localhost:5000/uploads/${filename}`, cdnUrl);

        await prisma.$executeRawUnsafe(
          `UPDATE posts SET content=?, contentGu=?, contentHi=? WHERE id=?`,
          newContent, newContentGu, newContentHi, p.id
        );
        console.log(`  Updated post ID: ${p.id}`);
      }

      // 2. Update ePaper editions in MySQL DB if references exist
      await prisma.$executeRawUnsafe(
        `UPDATE epaper_editions SET fileUrl=? WHERE fileUrl LIKE ? OR fileUrl LIKE ?`,
        cdnUrl, `%${filename}%`, `%${localUrlPattern}%`
      ).catch(() => null);

      // 3. Delete local PDF file
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
        console.log(`  Deleted local file: ${filename}`);
      }
    } catch (err) {
      console.error(`❌ Error migrating ${filename}:`, err);
    }
  }

  // Clean up all posts DB content: PDF links get /raw/upload/ and Image links get /image/upload/
  console.log('🧹 Cleaning up DB posts Cloudinary URL strings...');
  const posts: any[] = (await prisma.$queryRawUnsafe(`SELECT id, content, contentGu, contentHi FROM posts WHERE content LIKE '%res.cloudinary.com%' OR contentGu LIKE '%res.cloudinary.com%' OR contentHi LIKE '%res.cloudinary.com%'`)) as any[];
  
  const fixUrls = (text?: string | null) => {
    if (!text) return text || '';
    // Fix PDFs to use /raw/upload/
    let result = text.replace(/(https:\/\/res\.cloudinary\.com\/[^\s"'<>]+?\.pdf)/gi, (pdfUrl) => {
      return pdfUrl.replace('/image/upload/fl_attachment/', '/raw/upload/').replace('/image/upload/', '/raw/upload/').replace('/fl_attachment/', '/');
    });
    // Fix Images (.jpg, .jpeg, .png, .webp, .gif, .svg) to use /image/upload/
    result = result.replace(/(https:\/\/res\.cloudinary\.com\/[^\s"'<>]+?\.(?:jpg|jpeg|png|webp|gif|svg))/gi, (imgUrl) => {
      return imgUrl.replace('/raw/upload/', '/image/upload/');
    });
    return result;
  };

  for (const p of posts) {
    const newContent = fixUrls(p.content);
    const newContentGu = fixUrls(p.contentGu);
    const newContentHi = fixUrls(p.contentHi);

    if (newContent !== p.content || newContentGu !== p.contentGu || newContentHi !== p.contentHi) {
      await prisma.$executeRawUnsafe(`UPDATE posts SET content=?, contentGu=?, contentHi=? WHERE id=?`, newContent, newContentGu, newContentHi, p.id);
      console.log(`  Cleaned post ID: ${p.id}`);
    }
  }

  console.log('🎉 PDF Cloudinary Migration & DB Cleanup Complete!');
  process.exit(0);
}

migratePdfFiles().catch((err) => {
  console.error(err);
  process.exit(1);
});

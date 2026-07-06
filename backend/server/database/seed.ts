/**
 * Database Seeder — populates the database with initial admin and content data from static collections.
 * Run with:  npx tsx server/database/seed.ts
 */

import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { AUTHORS, CATEGORY_META, ARTICLES, VIDEOS, PHOTOS } from "../../data/index";
import { AUTH_CONFIG } from "../config/auth";

const prisma = new PrismaClient();

const slugify = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function main() {
  console.log("🌱  Starting database seeding...");

  // 1. Clean existing tables using TRUNCATE with disabled foreign keys for safety and speed
  console.log("🧹  Truncating existing tables...");
  await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 0;");
  await prisma.$executeRawUnsafe("TRUNCATE TABLE `Article`;");
  await prisma.$executeRawUnsafe("TRUNCATE TABLE `Category`;");
  await prisma.$executeRawUnsafe("TRUNCATE TABLE `Author`;");
  await prisma.$executeRawUnsafe("TRUNCATE TABLE `Tag`;");
  await prisma.$executeRawUnsafe("TRUNCATE TABLE `Video`;");
  await prisma.$executeRawUnsafe("TRUNCATE TABLE `Photo`;");
  await prisma.$executeRawUnsafe("TRUNCATE TABLE `_ArticleToTag`;");
  // Keep users and sessions intact unless explicitly empty to avoid locking admins out
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    console.log("👤  No users found, table will be seeded with default Admin.");
    await prisma.$executeRawUnsafe("TRUNCATE TABLE `User`;");
  }
  await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1;");

  // 2. Perform transactional database seeding
  await prisma.$transaction(async (tx) => {
    // ─── ADMIN USER ───
    let adminId: string;
    const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@gujaratpost.com";
    const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin@123456";

    const existingAdmin = await tx.user.findUnique({ where: { email: adminEmail } });
    if (existingAdmin) {
      adminId = existingAdmin.id;
      console.log(`ℹ️  Admin user already exists: ${adminEmail}`);
    } else {
      const passwordHash = await bcrypt.hash(adminPassword, AUTH_CONFIG.BCRYPT_ROUNDS);
      const admin = await tx.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          role: "SUPER_ADMIN",
          status: "ACTIVE",
        },
      });
      adminId = admin.id;
      console.log(`👤  Admin user created: ${admin.email}`);
    }

    // ─── CATEGORIES ───
    console.log("📂  Seeding categories...");
    const categoryIdMap = new Map<string, string>(); // slug -> database uuid
    
    for (const [slug, meta] of Object.entries(CATEGORY_META)) {
      const cat = await tx.category.create({
        data: {
          slug,
          name: meta.name,
          nameGu: meta.gu,
          nameHi: meta.hi,
          isActive: true,
          displayOrder: 0,
        },
      });
      categoryIdMap.set(slug, cat.id);
    }
    console.log(`✅  Seeded ${categoryIdMap.size} categories.`);

    // ─── AUTHORS ───
    console.log("✍️  Seeding authors...");
    const authorIds = new Set<string>();

    for (const author of AUTHORS) {
      const email = `${author.name.toLowerCase().replace(/[^a-z0-9]+/g, ".")}@gujaratpost.com`;
      await tx.author.create({
        data: {
          id: author.id, // preserve the existing id mapping (a1, a2, etc.)
          name: author.name,
          nameGu: author.nameGu,
          nameHi: author.nameHi,
          image: author.image,
          designation: author.designation,
          designationGu: author.designationGu,
          designationHi: author.designationHi,
          bio: author.bio,
          bioGu: author.bioGu,
          bioHi: author.bioHi,
          email,
          isActive: true,
        },
      });
      authorIds.add(author.id);
    }
    console.log(`✅  Seeded ${authorIds.size} authors.`);

    // ─── TAGS ───
    console.log("🏷️  Collecting and seeding tags...");
    const tagMap = new Map<string, { slug: string; name: string; nameGu: string; nameHi: string }>();
    
    for (const article of ARTICLES) {
      for (let j = 0; j < article.tags.length; j++) {
        const enTag = article.tags[j];
        const guTag = article.tagsGu[j] || enTag;
        const hiTag = article.tagsHi[j] || enTag;
        const slug = slugify(enTag);
        
        if (!tagMap.has(slug)) {
          tagMap.set(slug, {
            slug,
            name: enTag,
            nameGu: guTag,
            nameHi: hiTag,
          });
        }
      }
    }

    const tagRecords = Array.from(tagMap.values());
    for (const tag of tagRecords) {
      await tx.tag.create({ data: tag });
    }
    console.log(`✅  Seeded ${tagRecords.length} unique tags.`);

    // ─── ARTICLES ───
    console.log("📰  Seeding articles...");
    let articleCount = 0;

    for (const article of ARTICLES) {
      // Find matching category slug by name mapping
      const catEntry = Object.entries(CATEGORY_META).find(
        ([_, m]) => m.name.toLowerCase() === article.category.toLowerCase()
      );
      const catSlug = catEntry ? catEntry[0] : "gujarat";
      const dbCategoryId = categoryIdMap.get(catSlug);

      if (!dbCategoryId) {
        throw new Error(`Category matching slug "${catSlug}" not found in DB`);
      }

      await tx.article.create({
        data: {
          id: article.id,
          slug: article.slug,
          title: article.title,
          titleGu: article.titleGu,
          titleHi: article.titleHi,
          excerpt: article.excerpt,
          excerptGu: article.excerptGu,
          excerptHi: article.excerptHi,
          content: article.content,
          contentGu: article.contentGu,
          contentHi: article.contentHi,
          featuredImage: article.image,
          thumbnail: article.image,
          categoryId: dbCategoryId,
          authorId: article.author.id,
          publishedAt: new Date(article.publishedAt),
          updatedAt: new Date(article.updatedAt),
          readingTime: article.readingTime,
          isTrending: article.isTrending,
          isBreaking: article.isBreaking,
          isFeatured: article.isFeatured,
          isPublished: true,
          views: article.views,
          status: "PUBLISHED",
          createdByUserId: adminId,
          publishedByUserId: adminId,
          tags: {
            connect: article.tags.map((t) => ({ slug: slugify(t) })),
          },
        },
      });
      articleCount++;
    }
    console.log(`✅  Seeded ${articleCount} articles.`);

    // ─── VIDEOS ───
    console.log("🎥  Seeding videos...");
    let videoCount = 0;

    for (const video of VIDEOS) {
      await tx.video.create({
        data: {
          id: video.id,
          title: video.title,
          titleGu: video.titleGu,
          titleHi: video.titleHi,
          description: `Seeded description for video "${video.title}"`,
          thumbnail: video.thumbnail,
          youtubeId: `${video.youtubeId}_${video.id}`,
          embedUrl: `https://www.youtube.com/embed/${video.youtubeId}`,
          channel: "Gujarat Post",
          duration: video.duration,
          type: video.type,
          isFeatured: video.type === "video" && videoCount % 3 === 0,
          views: video.views,
          publishedAt: new Date(video.publishedAt),
        },
      });
      videoCount++;
    }
    console.log(`✅  Seeded ${videoCount} videos.`);

    // ─── PHOTOS ───
    console.log("🖼️  Seeding photos...");
    let photoCount = 0;

    for (const photo of PHOTOS) {
      await tx.photo.create({
        data: {
          id: photo.id,
          src: photo.src,
          alt: photo.alt,
          caption: photo.caption,
          captionGu: photo.captionGu,
          captionHi: photo.captionHi,
          category: "General",
          photographer: "Gujarat Post Staff",
          copyright: "© Gujarat Post",
          displayOrder: photoCount,
        },
      });
      photoCount++;
    }
    console.log(`✅  Seeded ${photoCount} photo slides.`);
  });

  console.log("🏁  Database seeding successfully completed!");
}

main()
  .catch((err) => {
    console.error("❌  Database seeding failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

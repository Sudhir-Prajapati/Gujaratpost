const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Ensuring about_settings table exists...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS about_settings (
      id VARCHAR(191) NOT NULL PRIMARY KEY DEFAULT 'default',
      titleGu TEXT NULL,
      titleEn TEXT NULL,
      titleHi TEXT NULL,
      subtitleGu TEXT NULL,
      subtitleEn TEXT NULL,
      subtitleHi TEXT NULL,
      descriptionGu LONGTEXT NULL,
      descriptionEn LONGTEXT NULL,
      descriptionHi LONGTEXT NULL,
      bannerImage TEXT NULL,
      missionGu TEXT NULL,
      missionEn TEXT NULL,
      missionHi TEXT NULL,
      visionGu TEXT NULL,
      visionEn TEXT NULL,
      visionHi TEXT NULL,
      valuesJson LONGTEXT NULL,
      statsJson LONGTEXT NULL,
      teamJson LONGTEXT NULL,
      contactEmail VARCHAR(191) NULL,
      contactPhone VARCHAR(191) NULL,
      contactAddress TEXT NULL,
      whatsappNumber VARCHAR(191) NULL,
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);
  console.log('Table about_settings is ready.');
}

main()
  .catch((e) => {
    console.error('Error in init_about.js:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

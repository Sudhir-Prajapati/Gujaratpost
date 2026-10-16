const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_DESCRIPTION =
  'Gujarat Post is one of the premier digital media networks in Gujarat, delivering sharp, authentic, and credible journalism catering to millions of Gujarati readers across the globe. Started with a mission to bring truth and unbiased news, Gujarat Post has made a special place in the hearts of Gujarati-speaking readers. We are committed to empowering citizens by providing verified news, investigative reporting, analytical editorials, and hyperlocal updates across all 33 districts of Gujarat. We have established a commanding digital presence across Web, E-Paper, Video, and Social Platforms.';

const DEFAULT_SOCIALS = {
  whatsapp: 'https://api.whatsapp.com/send/?phone=919909907237&text&type=phone_number&app_absent=0',
  facebook: 'https://www.facebook.com/Gujarat-Post-165183530766504',
  twitter: 'https://x.com/maheshrpat59606',
  instagram: 'https://instagram.com/gujaratpost',
  telegram: 'https://t.me/gujaratpost',
  youtube: 'https://youtube.com/@gujaratpost',
};

const DEFAULT_APP_LINKS = {
  playStore: 'https://play.google.com/store/apps/details?id=com.gujaratpost.app',
  appStore: 'https://apps.apple.com/app/gujarat-post/id123456789',
};

async function main() {
  console.log('Migrating advertise_settings table to Sandesh-style clean layout...');

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS advertise_settings (
      id VARCHAR(191) NOT NULL PRIMARY KEY DEFAULT 'default',
      pageTitle VARCHAR(255) NULL DEFAULT 'Advertise With Us',
      description LONGTEXT NULL,
      officeAddress TEXT NULL,
      locationUrl TEXT NULL,
      contactPhone VARCHAR(100) NULL DEFAULT '+91 99099 07237',
      onlineAdsEmail VARCHAR(191) NULL DEFAULT 'digital.advertising@gujaratpost.in',
      printAdsEmail VARCHAR(191) NULL DEFAULT 'advt@gujaratpost.in',
      websiteUrl VARCHAR(255) NULL DEFAULT 'https://gujaratpost.in/',
      socialLinksJson LONGTEXT NULL,
      appLinksJson LONGTEXT NULL,
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);

  // Add columns if they were created with old schema
  const columnsToAdd = [
    { name: 'description', type: 'LONGTEXT NULL' },
    { name: 'locationUrl', type: 'TEXT NULL' },
    { name: 'onlineAdsEmail', type: 'VARCHAR(191) NULL DEFAULT "digital.advertising@gujaratpost.in"' },
    { name: 'printAdsEmail', type: 'VARCHAR(191) NULL DEFAULT "advt@gujaratpost.in"' },
    { name: 'websiteUrl', type: 'VARCHAR(255) NULL DEFAULT "https://gujaratpost.in/"' },
    { name: 'socialLinksJson', type: 'LONGTEXT NULL' },
    { name: 'appLinksJson', type: 'LONGTEXT NULL' },
  ];

  for (const col of columnsToAdd) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE advertise_settings ADD COLUMN ${col.name} ${col.type}`);
      console.log(`Added column ${col.name}`);
    } catch (e) {
      // Column might already exist, ignore duplicate column error
    }
  }

  // Update or insert the default row
  await prisma.$executeRawUnsafe(
    `INSERT INTO advertise_settings (
      id, pageTitle, description, officeAddress, locationUrl,
      contactPhone, onlineAdsEmail, printAdsEmail, websiteUrl,
      socialLinksJson, appLinksJson, updatedAt
    ) VALUES (
      'default', ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, NOW(3)
    ) ON DUPLICATE KEY UPDATE
      pageTitle = VALUES(pageTitle),
      description = VALUES(description),
      officeAddress = VALUES(officeAddress),
      locationUrl = VALUES(locationUrl),
      contactPhone = VALUES(contactPhone),
      onlineAdsEmail = VALUES(onlineAdsEmail),
      printAdsEmail = VALUES(printAdsEmail),
      websiteUrl = VALUES(websiteUrl),
      socialLinksJson = VALUES(socialLinksJson),
      appLinksJson = VALUES(appLinksJson),
      updatedAt = NOW(3)`,
    'Advertise With Us',
    DEFAULT_DESCRIPTION,
    'Gujarat Post Bhavan, S.G. Highway, Prahlad Nagar, Vastrapur, Ahmedabad, Gujarat 380015',
    'https://maps.google.com/?q=Gujarat+Post+Bhavan+Ahmedabad',
    '079 4000 4000 / +91 99099 07237',
    'digital.advertising@gujaratpost.in',
    'advt@gujaratpost.in & epaper@gujaratpost.in',
    'https://gujaratpost.in/',
    JSON.stringify(DEFAULT_SOCIALS),
    JSON.stringify(DEFAULT_APP_LINKS)
  );

  console.log('advertise_settings initialized successfully with clean media group info.');
}

main()
  .catch((e) => {
    console.error('Error migrating advertise_settings:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

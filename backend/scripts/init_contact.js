const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Ensuring contact_settings and contact_messages tables exist...');

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS contact_settings (
      id VARCHAR(191) NOT NULL PRIMARY KEY DEFAULT 'default',
      pageTitle VARCHAR(255) NULL DEFAULT 'સંપર્ક કરો (Contact Us)',
      pageSubtitle TEXT NULL,
      headOfficeAddress TEXT NULL,
      primaryPhone VARCHAR(100) NULL DEFAULT '+91 99099 07237',
      whatsappNumber VARCHAR(100) NULL DEFAULT '+91 99099 07237',
      primaryEmail VARCHAR(191) NULL DEFAULT 'contact@gujaratpost.in',
      workingHours VARCHAR(255) NULL DEFAULT 'સોમવાર - શનિવાર: 9:00 AM - 9:00 PM | રવિવાર: 24x7 ન્યૂઝ ડેસ્ક',
      mapEmbedUrl TEXT NULL,
      editorialEmail VARCHAR(191) NULL DEFAULT 'editorial@gujaratpost.in',
      editorialPhone VARCHAR(100) NULL DEFAULT '+91 99099 07237',
      adsEmail VARCHAR(191) NULL DEFAULT 'ads@gujaratpost.in',
      adsPhone VARCHAR(100) NULL DEFAULT '+91 99099 07237',
      grievanceName VARCHAR(191) NULL DEFAULT 'મહેશ પટેલ (Mahesh Patel)',
      grievanceDesignation VARCHAR(191) NULL DEFAULT 'તકરાર નિવારણ અધિકારી (Grievance Redressal Officer)',
      grievanceEmail VARCHAR(191) NULL DEFAULT 'grievance@gujaratpost.in',
      grievanceAddress TEXT NULL,
      bureauOfficesJson LONGTEXT NULL,
      socialLinksJson TEXT NULL,
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      name VARCHAR(191) NOT NULL,
      email VARCHAR(191) NOT NULL,
      phone VARCHAR(100) NULL,
      department VARCHAR(100) NULL DEFAULT 'General',
      subject VARCHAR(255) NOT NULL,
      message LONGTEXT NOT NULL,
      isRead BOOLEAN NOT NULL DEFAULT FALSE,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);

  console.log('contact_settings and contact_messages tables created/verified successfully.');
}

main()
  .catch((e) => {
    console.error('Error in init_contact.js:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

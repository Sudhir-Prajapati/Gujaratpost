const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Ensuring feedback_complaints table exists...');

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS feedback_complaints (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      type VARCHAR(50) NOT NULL DEFAULT 'FEEDBACK',
      name VARCHAR(191) NOT NULL,
      email VARCHAR(191) NOT NULL,
      phone VARCHAR(100) NULL,
      category VARCHAR(100) NOT NULL DEFAULT 'General',
      subject VARCHAR(255) NOT NULL,
      message LONGTEXT NOT NULL,
      articleUrl TEXT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
      adminNotes TEXT NULL,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      INDEX idx_fc_type_status (type, status),
      INDEX idx_fc_created (createdAt)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);

  console.log('feedback_complaints table created/verified successfully.');
}

main()
  .catch((e) => {
    console.error('Error in init_feedback.js:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

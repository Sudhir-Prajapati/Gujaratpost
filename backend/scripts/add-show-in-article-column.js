import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking if showInArticle column exists in categories table...');
  const cols = await prisma.$queryRawUnsafe('DESCRIBE categories');
  const exists = cols.some((col) => col.Field === 'showInArticle');

  if (!exists) {
    console.log('Adding showInArticle column to categories table...');
    await prisma.$queryRawUnsafe(
      'ALTER TABLE categories ADD COLUMN showInArticle TINYINT(1) NOT NULL DEFAULT 1 AFTER showInHome'
    );
    console.log('Successfully added showInArticle column!');
  } else {
    console.log('showInArticle column already exists.');
  }

  const updatedCols = await prisma.$queryRawUnsafe('DESCRIBE categories');
  console.table(updatedCols);
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


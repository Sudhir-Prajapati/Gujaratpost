const fs = require('fs');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DUMP_PATH = 'c:\\Users\\Admin\\OneDrive\\Desktop\\Gujarat-Post\\gujaratpost_newsgujrati_23OCT2026.sql.gz';

async function checkAllTables() {
  console.log('Inspecting all tables in dump...');
  const fileStream = fs.createReadStream(DUMP_PATH, { encoding: 'utf8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const tableInsertCounts = {};
  let currentTable = null;

  for await (const line of rl) {
    if (line.startsWith('INSERT INTO `')) {
      const match = line.match(/^INSERT INTO `([^`]+)`/);
      if (match) {
        const table = match[1];
        tableInsertCounts[table] = (tableInsertCounts[table] || 0) + 1;
      }
    }
  }

  console.log('Table INSERT statements summary:', tableInsertCounts);

  // Check categories in current DB
  const categories = await prisma.category.findMany({ select: { id: true, name: true, slug: true } });
  console.log(`Current DB categories: ${categories.length}`);

  // Check videos in current DB
  const videosCount = await prisma.video.count();
  console.log(`Current DB videos count: ${videosCount}`);

  await prisma.$disconnect();
}

checkAllTables().catch(console.error);

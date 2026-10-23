const fs = require('fs');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DUMP_PATH = 'c:\\Users\\Admin\\OneDrive\\Desktop\\Gujarat-Post\\gujaratpost_newsgujrati_23OCT2026.sql.gz';

async function checkDumpNewsIds() {
  const rl = readline.createInterface({
    input: fs.createReadStream(DUMP_PATH, { encoding: 'utf8' }),
    crlfDelay: Infinity
  });

  const dumpNewsIds = new Set();

  for await (const line of rl) {
    if (line.startsWith('INSERT INTO `news` VALUES')) {
      // Find all (ID,
      const regex = /\((\d+),/g;
      let m;
      while ((m = regex.exec(line)) !== null) {
        dumpNewsIds.add(parseInt(m[1], 10));
      }
    }
  }

  console.log(`Total unique news IDs in dump: ${dumpNewsIds.size}`);

  const currentPosts = await prisma.post.findMany({
    select: { id: true, articleNumber: true, title: true, createdAt: true }
  });

  const inCurrentNotInDump = currentPosts.filter(p => p.articleNumber && !dumpNewsIds.has(p.articleNumber));
  console.log(`Posts in current DB that are NOT in dump: ${inCurrentNotInDump.length}`);
  if (inCurrentNotInDump.length > 0) {
    console.log('Sample posts in current DB not in dump:', inCurrentNotInDump.slice(0, 5));
  }

  await prisma.$disconnect();
}

checkDumpNewsIds().catch(console.error);

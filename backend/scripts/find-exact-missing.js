const fs = require('fs');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DUMP_PATH = 'c:\\Users\\Admin\\OneDrive\\Desktop\\Gujarat-Post\\gujaratpost_newsgujrati_23OCT2026.sql.gz';

async function findExactMissing() {
  const currentPosts = await prisma.post.findMany({
    select: { articleNumber: true }
  });
  const currentSet = new Set(currentPosts.map(p => p.articleNumber).filter(Boolean));
  console.log(`Current DB has ${currentSet.size} unique article numbers.`);

  const rl = readline.createInterface({
    input: fs.createReadStream(DUMP_PATH, { encoding: 'utf8' }),
    crlfDelay: Infinity
  });

  const dumpIds = new Set();
  const missingFromCurrent = [];

  for await (const line of rl) {
    if (line.startsWith('INSERT INTO `news` VALUES')) {
      // Use regex to get all (ID,
      let match;
      const regex = /\((\d+),/g;
      while ((match = regex.exec(line)) !== null) {
        const id = parseInt(match[1], 10);
        dumpIds.add(id);
        if (!currentSet.has(id)) {
          missingFromCurrent.push(id);
        }
      }
    }
  }

  console.log(`Total unique news IDs in dump: ${dumpIds.size}`);
  console.log(`Missing from current DB count: ${missingFromCurrent.length}`);
  console.log(`Missing IDs list:`, missingFromCurrent.sort((a,b) => a - b));

  await prisma.$disconnect();
}

findExactMissing().catch(console.error);

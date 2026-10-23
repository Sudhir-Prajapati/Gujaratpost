const fs = require('fs');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DUMP_PATH = 'c:\\Users\\Admin\\OneDrive\\Desktop\\Gujarat-Post\\gujaratpost_newsgujrati_23OCT2026.sql.gz';

async function main() {
  const currentPosts = await prisma.post.findMany({
    select: { articleNumber: true }
  });
  const currentArticleNumbers = new Set(currentPosts.map(p => p.articleNumber).filter(Boolean));
  console.log(`Current DB has ${currentArticleNumbers.size} unique article numbers.`);

  const rl = readline.createInterface({
    input: fs.createReadStream(DUMP_PATH, { encoding: 'utf8' }),
    crlfDelay: Infinity
  });

  let totalParsed = 0;
  const missingNewsInCurrent = [];
  const allDumpIds = [];

  for await (const line of rl) {
    if (line.startsWith('INSERT INTO `news` VALUES')) {
      extractNewsTuples(line, currentArticleNumbers, missingNewsInCurrent, allDumpIds);
    }
  }

  console.log(`Total news rows parsed from dump: ${allDumpIds.length}`);
  console.log(`Dump IDs range: min=${Math.min(...allDumpIds)}, max=${Math.max(...allDumpIds)}`);
  console.log(`Missing from current DB count: ${missingNewsInCurrent.length}`);
  console.log('Missing IDs:', missingNewsInCurrent.map(m => m.id));

  await prisma.$disconnect();
}

function extractNewsTuples(line, currentArticleNumbers, missingNewsInCurrent, allDumpIds) {
  let i = line.indexOf('VALUES ') + 7;
  const len = line.length;

  while (i < len) {
    if (line[i] === '(') {
      const tupleStart = i;
      i++;
      let inString = false;
      let quoteChar = '';
      let escape = false;

      while (i < len) {
        const c = line[i];
        if (escape) {
          escape = false;
        } else if (c === '\\') {
          escape = true;
        } else if (inString) {
          if (c === quoteChar) {
            inString = false;
          }
        } else {
          if (c === "'" || c === '"') {
            inString = true;
            quoteChar = c;
          } else if (c === ')') {
            const tupleStr = line.substring(tupleStart + 1, i);
            parseTuple(tupleStr, currentArticleNumbers, missingNewsInCurrent, allDumpIds);
            i++;
            break;
          }
        }
        i++;
      }
    } else {
      i++;
    }
  }
}

function parseTuple(tupleStr, currentArticleNumbers, missingNewsInCurrent, allDumpIds) {
  // First field before first unquoted comma is NEWS_ID
  let idStr = '';
  for (let j = 0; j < tupleStr.length; j++) {
    if (tupleStr[j] === ',') {
      idStr = tupleStr.substring(0, j).trim();
      break;
    }
  }
  const newsId = parseInt(idStr, 10);
  if (!isNaN(newsId)) {
    allDumpIds.push(newsId);
    if (!currentArticleNumbers.has(newsId)) {
      missingNewsInCurrent.push({ id: newsId });
    }
  }
}

main().catch(console.error);

const fs = require('fs');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DUMP_PATH = 'c:\\Users\\Admin\\OneDrive\\Desktop\\Gujarat-Post\\gujaratpost_newsgujrati_23OCT2026.sql.gz';

async function checkOtherTables() {
  const rl = readline.createInterface({
    input: fs.createReadStream(DUMP_PATH, { encoding: 'utf8' }),
    crlfDelay: Infinity
  });

  let breakingNewsLine = null;
  let videosLine = null;
  let categoryLine = null;

  for await (const line of rl) {
    if (line.startsWith('INSERT INTO `breakingnews`')) {
      breakingNewsLine = line;
    } else if (line.startsWith('INSERT INTO `videos`')) {
      videosLine = line;
    } else if (line.startsWith('INSERT INTO `category`')) {
      categoryLine = line;
    }
  }

  console.log('--- BREAKING NEWS ---');
  if (breakingNewsLine) {
    console.log('Length:', breakingNewsLine.length);
    console.log('Snippet:', breakingNewsLine.substring(0, 500));
  } else {
    console.log('No breaking news insert found');
  }

  console.log('--- VIDEOS ---');
  if (videosLine) {
    console.log('Length:', videosLine.length);
    console.log('Snippet:', videosLine.substring(0, 500));
  } else {
    console.log('No videos insert found');
  }

  console.log('--- CATEGORY ---');
  if (categoryLine) {
    console.log('Length:', categoryLine.length);
    console.log('Snippet:', categoryLine.substring(0, 500));
  } else {
    console.log('No category insert found');
  }

  await prisma.$disconnect();
}

checkOtherTables().catch(console.error);

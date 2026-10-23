const fs = require('fs');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DUMP_PATH = 'c:\\Users\\Admin\\OneDrive\\Desktop\\Gujarat-Post\\gujaratpost_newsgujrati_23OCT2026.sql.gz';

async function main() {
  console.log('Loading existing article numbers from current DB...');
  const currentPosts = await prisma.post.findMany({
    select: { articleNumber: true, slug: true }
  });
  const currentArticleNumbers = new Set(currentPosts.map(p => p.articleNumber).filter(Boolean));
  const currentSlugs = new Set(currentPosts.map(p => p.slug).filter(Boolean));
  console.log(`Current DB has ${currentArticleNumbers.size} unique article numbers, ${currentSlugs.size} unique slugs.`);

  const currentVideos = await prisma.video.findMany({
    select: { youtubeId: true, title: true, embedUrl: true }
  });
  console.log(`Current DB has ${currentVideos.length} videos.`);

  console.log('Scanning dump file:', DUMP_PATH);
  const fileStream = fs.createReadStream(DUMP_PATH, { encoding: 'utf8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let inNewsInsert = false;
  let inVideosInsert = false;
  let missingNewsInCurrent = [];
  let totalNewsInDump = 0;
  let dumpVideos = [];

  for await (const line of rl) {
    if (line.startsWith('INSERT INTO `news` VALUES')) {
      // Parse insert statements
      // A single INSERT statement can contain multiple tuples: (id, ...), (id, ...)
      // Let's extract tuples or match tuples
      extractNewsTuples(line, currentArticleNumbers, currentSlugs, missingNewsInCurrent);
    } else if (line.startsWith('INSERT INTO `videos` VALUES')) {
      extractVideoTuples(line, dumpVideos);
    }
  }

  console.log(`\n=== Comparison Results ===`);
  console.log(`Missing news articles from dump (not in current DB): ${missingNewsInCurrent.length}`);
  if (missingNewsInCurrent.length > 0) {
    console.log('Sample missing news:');
    missingNewsInCurrent.slice(0, 10).forEach(n => {
      console.log(`- ID: ${n.id}, Date: ${n.date}, Title: ${n.title.substring(0, 60)}..., Slug: ${n.slug}`);
    });
  }

  // Also check if any exist in DB that are not in dump
  console.log(`Dump has ${dumpVideos.length} videos.`);

  // Write full summary to JSON for inspection
  fs.writeFileSync('missing_news.json', JSON.stringify(missingNewsInCurrent, null, 2));
  console.log('Saved missing_news.json');

  await prisma.$disconnect();
}

function extractNewsTuples(line, currentArticleNumbers, currentSlugs, missingNewsInCurrent) {
  // Line format: INSERT INTO `news` VALUES (8000,...),(8001,...);
  // We can use a regex to match (NEWS_ID, ...)
  // NEWS_ID is the first integer after '('
  // Be careful: tuples can contain commas and parentheses in strings.
  // We need a robust parser for SQL tuples in MySQL dump.
  
  let i = line.indexOf('VALUES ') + 7;
  const len = line.length;

  while (i < len) {
    if (line[i] === '(') {
      // Find where this tuple starts
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
            // End of tuple!
            const tupleStr = line.substring(tupleStart + 1, i);
            parseNewsTuple(tupleStr, currentArticleNumbers, currentSlugs, missingNewsInCurrent);
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

function parseNewsTuple(tupleStr, currentArticleNumbers, currentSlugs, missingNewsInCurrent) {
  // Extract values from CSV tuple string respecting quotes
  // Columns:
  // 0: NEWS_ID
  // 1: NEWS_ORD
  // 2: NEWS_PARENT_ID
  // 3: NEWS_NAME
  // 4: NEWS_TITLE
  // 5: NEWS_SLUG
  // 6: NEWS_VIDEO
  // 7: NEWS_VIDEO_YOUTUBE
  // 8: NEWS_IMAGE
  // 9: NEWS_IMAGE1
  // 10: NEWS_IMAGE2
  // 11: NEWS_CATEGORY
  // ...
  // 33: NEWS_CREATED_DATE
  // 34: NEWS_MODIFY_DATE
  // 35: NEWS_STATUS

  // Let's extract first few fields
  const fields = [];
  let curr = '';
  let inString = false;
  let quoteChar = '';
  let escape = false;

  for (let j = 0; j < tupleStr.length; j++) {
    const c = tupleStr[j];
    if (escape) {
      curr += c;
      escape = false;
    } else if (c === '\\') {
      escape = true;
    } else if (inString) {
      if (c === quoteChar) {
        inString = false;
      } else {
        curr += c;
      }
    } else {
      if (c === "'" || c === '"') {
        inString = true;
        quoteChar = c;
      } else if (c === ',') {
        fields.push(curr.trim());
        curr = '';
      } else {
        curr += c;
      }
    }
  }
  fields.push(curr.trim());

  const newsId = parseInt(fields[0], 10);
  const title = fields[4] || '';
  const slug = fields[5] || '';
  const image = fields[8] || '';
  const cat = fields[11] || '';
  const summary = fields[15] || '';
  const content = fields[16] || '';
  const createdDate = fields[33] || '';
  const status = fields[35] || '0';

  if (!isNaN(newsId)) {
    if (!currentArticleNumbers.has(newsId)) {
      missingNewsInCurrent.push({
        id: newsId,
        title,
        slug,
        image,
        category: cat,
        summary,
        contentLength: content.length,
        date: createdDate,
        status,
        rawTuple: tupleStr
      });
    }
  }
}

function extractVideoTuples(line, dumpVideos) {
  // similar extraction for videos
  dumpVideos.push(line.substring(0, 100));
}

main().catch(console.error);

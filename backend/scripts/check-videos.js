const fs = require('fs');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DUMP_PATH = 'c:\\Users\\Admin\\OneDrive\\Desktop\\Gujarat-Post\\gujaratpost_newsgujrati_23OCT2026.sql.gz';

async function checkVideosAndCategories() {
  const currentVideos = await prisma.video.findMany({ select: { youtubeId: true, title: true } });
  const currentYtIds = new Set(currentVideos.map(v => v.youtubeId).filter(Boolean));
  console.log(`Current DB has ${currentVideos.length} videos.`);

  const rl = readline.createInterface({
    input: fs.createReadStream(DUMP_PATH, { encoding: 'utf8' }),
    crlfDelay: Infinity
  });

  let dumpVideoRows = [];
  for await (const line of rl) {
    if (line.startsWith('INSERT INTO `videos` VALUES')) {
      // parse tuples
      // (1548,0,'watch-ms-dhonis-humourous-answer-on-retirement ','રાહુલ ગાંધીના પ્રાયમરી પ્રોજેક્ટ પર કોંગ્રેસને ભરોસા નથી !!','I9ghOnJsjao',0,...)
      // youtubeId is column 5 (index 4)
      const regex = /\((\d+),\s*(\d+),\s*'([^']*)',\s*'([^']*)',\s*'([^']*)'/g;
      let m;
      while ((m = regex.exec(line)) !== null) {
        const vidId = m[1];
        const slug = m[3];
        const title = m[4];
        const ytId = m[5];
        dumpVideoRows.push({ vidId, slug, title, ytId });
      }
    }
  }

  console.log(`Dump has ${dumpVideoRows.length} videos.`);
  const missingVideos = dumpVideoRows.filter(v => !currentYtIds.has(v.ytId));
  console.log(`Missing videos in current DB: ${missingVideos.length}`);
  if (missingVideos.length > 0) {
    console.log('Sample missing videos:', missingVideos.slice(0, 5));
  }

  await prisma.$disconnect();
}

checkVideosAndCategories().catch(console.error);

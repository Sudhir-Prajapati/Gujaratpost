const fs = require('fs');
const readline = require('readline');

async function parseDumpCategories() {
  const rl = readline.createInterface({
    input: fs.createReadStream('c:/Users/Admin/OneDrive/Desktop/Gujarat-Post/gujaratpost_newsgujrati_23OCT2026.sql.gz', { encoding: 'utf8' }),
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.startsWith('INSERT INTO `category` VALUES')) {
      // Extract tuples
      // (1,0,'News ','news',...)
      const regex = /\((\d+),\s*(\d+),\s*'([^']*)',\s*'([^']*)'/g;
      let m;
      const cats = [];
      while ((m = regex.exec(line)) !== null) {
        cats.push({ id: m[1], name: m[3], slug: m[4] });
      }
      console.log('Old Dump Categories:', cats);
      break;
    }
  }
}

parseDumpCategories().catch(console.error);

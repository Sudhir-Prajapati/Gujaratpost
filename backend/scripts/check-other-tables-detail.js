const fs = require('fs');
const readline = require('readline');
const DUMP_PATH = 'c:\\Users\\Admin\\OneDrive\\Desktop\\Gujarat-Post\\gujaratpost_newsgujrati_23OCT2026.sql.gz';

async function checkOtherTablesDetail() {
  const rl = readline.createInterface({
    input: fs.createReadStream(DUMP_PATH, { encoding: 'utf8' }),
    crlfDelay: Infinity
  });

  const tableRows = {};

  for await (const line of rl) {
    if (line.startsWith('INSERT INTO `')) {
      const match = line.match(/^INSERT INTO `([^`]+)`/);
      if (match) {
        const table = match[1];
        if (table !== 'news') {
          tableRows[table] = line.length;
          // count number of tuples roughly
          const tupleMatches = (line.match(/\(/g) || []).length;
          console.log(`Table: ${table}, line length: ${line.length}, '(' count: ${tupleMatches}`);
          console.log(`  Sample: ${line.substring(0, 200)}...`);
        }
      }
    }
  }
}

checkOtherTablesDetail().catch(console.error);

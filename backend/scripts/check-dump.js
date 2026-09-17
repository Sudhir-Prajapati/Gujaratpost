const fs = require('fs');
const zlib = require('zlib');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('c:/Users/Admin/OneDrive/Desktop/Gujarat-Post/gujaratpost_newsgujrati_today.sql.gz').pipe(zlib.createGunzip()),
  crlfDelay: Infinity
});

let lastNewsLine = '';
let newsLineCount = 0;

rl.on('line', (line) => {
  if (line.includes('INSERT INTO `news` VALUES')) {
    lastNewsLine = line;
    newsLineCount++;
  }
});

rl.on('close', () => {
  console.log('News insert statements count:', newsLineCount);
  console.log('Last line head:', lastNewsLine.substring(0, 150));
  console.log('Last line tail:', lastNewsLine.substring(lastNewsLine.length - 150));
});

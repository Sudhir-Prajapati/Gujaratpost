const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('c:/Users/Admin/OneDrive/Desktop/Gujarat-Post/gujaratpost_newsgujrati_23OCT2026.sql.gz'),
  crlfDelay: Infinity
});

let inNewsCreate = false;
let newsCreateSql = '';
let newsFirstInsert = '';

rl.on('line', line => {
  if (line.includes('CREATE TABLE `news`')) {
    inNewsCreate = true;
  }
  if (inNewsCreate) {
    newsCreateSql += line + '\n';
    if (line.includes('ENGINE=')) {
      inNewsCreate = false;
    }
  }
  if (line.startsWith('INSERT INTO `news`') && !newsFirstInsert) {
    newsFirstInsert = line.substring(0, 300);
  }
});

rl.on('close', () => {
  console.log('News table schema:');
  console.log(newsCreateSql);
  console.log('First insert prefix:');
  console.log(newsFirstInsert);
});

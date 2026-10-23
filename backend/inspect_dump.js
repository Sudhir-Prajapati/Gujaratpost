const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('c:/Users/Admin/OneDrive/Desktop/Gujarat-Post/gujaratpost_newsgujrati_23OCT2026.sql.gz'),
  crlfDelay: Infinity
});

const tables = [];
rl.on('line', line => {
  if (line.startsWith('CREATE TABLE')) {
    const parts = line.split('`');
    if (parts.length >= 2) tables.push(parts[1]);
  }
});

rl.on('close', () => {
  console.log('Tables found in dump (' + tables.length + '):', tables);
});

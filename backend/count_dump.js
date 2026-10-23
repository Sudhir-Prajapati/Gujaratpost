const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('c:/Users/Admin/OneDrive/Desktop/Gujarat-Post/gujaratpost_newsgujrati_23OCT2026.sql.gz'),
  crlfDelay: Infinity
});

let currentTable = '';
const tableCounts = {};

rl.on('line', line => {
  if (line.startsWith('INSERT INTO `')) {
    const parts = line.split('`');
    const table = parts[1];
    currentTable = table;
    tableCounts[table] = (tableCounts[table] || 0) + 1;
  }
});

rl.on('close', () => {
  console.log('INSERT counts by table:', tableCounts);
});

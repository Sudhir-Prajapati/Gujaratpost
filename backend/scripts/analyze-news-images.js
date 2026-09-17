const mysql = require('mysql2/promise');

function decodeMojibake(str) {
  if (!str) return '';
  try {
    return Buffer.from(str, 'latin1').toString('utf8');
  } catch (e) {
    return str;
  }
}

async function analyzeNewsImages() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'root@123',
    database: 'gujaratpost_newsgujrati_today',
    charset: 'latin1'
  });

  const [rows] = await conn.query('SELECT NEWS_ID, NEWS_IMAGE FROM news');
  let empty = 0;
  let httpCount = 0;
  let normal = 0;
  let unicodeCount = 0;
  const extensions = {};

  for (const r of rows) {
    const raw = (r.NEWS_IMAGE || '').trim();
    if (!raw) {
      empty++;
      continue;
    }
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      httpCount++;
      continue;
    }
    const decoded = decodeMojibake(raw).trim();
    if (/[^\x00-\x7F]/.test(decoded)) {
      unicodeCount++;
    }
    const ext = decoded.includes('.') ? decoded.split('.').pop().toLowerCase() : 'none';
    extensions[ext] = (extensions[ext] || 0) + 1;
    normal++;
  }

  console.log(`Total news rows: ${rows.length}`);
  console.log(`Empty / null: ${empty}`);
  console.log(`Already HTTP(S): ${httpCount}`);
  console.log(`Relative filenames: ${normal}`);
  console.log(`Filenames with Unicode / Gujarati: ${unicodeCount}`);
  console.log(`Extensions breakdown:`, extensions);

  await conn.end();
}

analyzeNewsImages().catch(console.error);

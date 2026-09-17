const mysql = require('mysql2/promise');
const https = require('https');

function checkUrl(url) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const req = https.get(url, { timeout: 3000 }, (res) => {
        resolve(res.statusCode === 200);
        res.resume();
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
    } catch (e) {
      resolve(false);
    }
  });
}

async function main() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'gujaratpost',
    password: 'gujaratpost2005',
    database: 'gujaratpost',
  });

  // Fetch all rows that came from the real gallery table (caption != 'ગેલેરી ફોટો')
  const [rows] = await conn.query("SELECT id, src, captionGu, createdAt FROM gallery_photos WHERE caption != 'ગેલેરી ફોટો' ORDER BY createdAt DESC LIMIT 100");
  console.log(`Checking ${rows.length} real gallery rows...`);

  let valid = 0;
  let invalid = 0;
  const sampleValid = [];
  const sampleInvalid = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const ok = await checkUrl(r.src);
    if (ok) {
      valid++;
      if (sampleValid.length < 5) sampleValid.push(r);
    } else {
      invalid++;
      if (sampleInvalid.length < 5) sampleInvalid.push(r);
    }
    if ((i + 1) % 20 === 0) console.log(`Checked ${i + 1}/${rows.length}... Valid: ${valid}, Invalid: ${invalid}`);
  }

  console.log('\n--- RESULTS ---');
  console.log(`Valid: ${valid} (${((valid / rows.length) * 100).toFixed(1)}%)`);
  console.log(`Invalid: ${invalid} (${((invalid / rows.length) * 100).toFixed(1)}%)`);
  console.log('\nSample Valid:', sampleValid);
  console.log('\nSample Invalid:', sampleInvalid);

  await conn.end();
}

main().catch(console.error);

/**
 * refresh_recent_dates.js
 * Automatically shifts the recent news articles from Nov 4 forward to Today (Nov 12, 2026)
 * so that the latest news, recommendations ("તમારા માટે ભલામણ"), and infinite stream
 * reflect fresh, active news from the last 5-6 days (Nov 7 - Nov 12, 2026).
 * Also generates refresh_recent_dates.sql for running directly on remote server.
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  const dbUrl = process.env.DATABASE_URL || 'mysql://gujaratpost:gujaratpost2005@127.0.0.1:3306/gujaratpost';
  const conn = await mysql.createConnection(dbUrl);
  console.log('✅ Connected to MySQL database.');

  // Check current latest post date
  const [latestRow] = await conn.execute('SELECT id, titleGu, createdAt FROM posts WHERE status = "PUBLISHED" ORDER BY createdAt DESC LIMIT 1');
  if (latestRow.length === 0) {
    console.log('No published posts found.');
    await conn.end();
    return;
  }

  const latestDbDate = new Date(latestRow[0].createdAt);
  const currentDate = new Date('2026-11-12T19:30:00.000Z');
  const diffMs = currentDate.getTime() - latestDbDate.getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));

  console.log(`📅 Latest post in DB date: ${latestDbDate.toISOString()}`);
  console.log(`📅 Target current date:   ${currentDate.toISOString()}`);
  console.log(`⏱️ Shifting offset:       +${diffDays} days (+${diffDays * 24} hours)`);

  if (diffDays <= 0) {
    console.log('Database dates are already up to date!');
    await conn.end();
    return;
  }

  // Find all posts from the recent wave (createdAt >= 2026-10-25)
  const [postsToShift] = await conn.execute(
    'SELECT id, articleNumber, titleGu, title, createdAt FROM posts WHERE status = "PUBLISHED" AND createdAt >= "2026-10-25 00:00:00" ORDER BY createdAt DESC'
  );

  console.log(`📋 Found ${postsToShift.length} recent posts to shift forward by ${diffDays} days.`);

  const sqlStatements = [
    `-- Refresh recent news dates forward by ${diffDays} days to keep site fresh within 5-6 days`,
    'SET NAMES utf8mb4;',
    'START TRANSACTION;',
  ];

  let updatedCount = 0;
  for (const post of postsToShift) {
    const oldTime = new Date(post.createdAt).getTime();
    const newTime = new Date(oldTime + diffDays * 24 * 60 * 60 * 1000);
    const newDateStr = newTime.toISOString().slice(0, 19).replace('T', ' ');

    await conn.execute('UPDATE posts SET createdAt = ? WHERE id = ?', [newDateStr, post.id]);
    sqlStatements.push(`UPDATE \`posts\` SET \`createdAt\` = '${newDateStr}' WHERE \`id\` = '${post.id}';`);
    updatedCount++;
  }

  sqlStatements.push('COMMIT;');

  const sqlFile = path.join(__dirname, 'refresh_recent_dates.sql');
  fs.writeFileSync(sqlFile, sqlStatements.join('\n'), 'utf8');
  console.log(`💾 Generated ${sqlFile} with ${sqlStatements.length} lines.`);

  console.log(`🎉 Successfully updated ${updatedCount} articles to fresh 5-6 day window (Nov 7 - Nov 12, 2026).`);

  // Verify top 10 latest articles
  const [verifyRows] = await conn.execute(
    'SELECT articleNumber, titleGu, createdAt FROM posts WHERE status = "PUBLISHED" ORDER BY createdAt DESC LIMIT 10'
  );
  console.log('\n🔍 Top 10 Latest Articles after date refresh:');
  verifyRows.forEach((r, i) => {
    const d = new Date(r.createdAt).toISOString();
    console.log(`${i + 1}. [${d.slice(0, 10)} ${d.slice(11, 16)}] ${(r.titleGu || '').slice(0, 45)}`);
  });

  await conn.end();
}

main().catch(console.error);


/**
 * fix_gallery_categories.js
 * Automatically corrects gallery photo categories in MySQL database.
 * Sets entertainment/actresses/celebrities to 'મનોરંજન' (fixing wrong 'ધર્મ' on Nikita Sharma and 'સમાચાર' on Sunny Leone).
 * Sets sports/cricket to 'સ્પોર્ટ્સ'.
 * Sets political events to 'રાજનીતિ'.
 * Generates fix_gallery_categories.sql for deployment on remote server.
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function categorizePhoto(p) {
  const text = `${p.captionGu || ''} ${p.caption || ''} ${p.alt || ''}`.toLowerCase();

  // 1. Entertainment / Bollywood / Actress / Model / Photoshoot
  const isEntertainment =
    /એક્ટ્રેસ|અભિનેત્રી|બોલિવૂડ|હોટ|બોલ્ડ|બિકિની|બિકીની|મોડલ|ગ્લેમરસ|સાડી|ડ્રેસ|શર્મા|કપૂર|ખાન|સિંહ|દિશા|મલાઇકા|સની|તસ્વીરો|તસવીરો|સેક્સી|હીરોઇન|શૂટ|ફોટોશૂટ|ગાઉન|લહેંગા|કાતિલ|અવતાર|જલવા|સ્વરૂપ|લુક|લૂક|નિકિતા|દીક્ષિત|બેન્દ્રે|કામરા|રાઉત|પટાની|પટની|અદા|લિયોની|અભિનેતા|સ્ટાર|star|actress|actor|bollywood|model|bikini|glamour|photoshoot|નાગિન|બબીતાજી|બિગ બોસ|કાર્દશિયન|સુહાની|અનુષ્કા|કિયારા|તારા સુતરિયા|કાજલ અગ્રવાલ|ભૂમિ|કેટરિના|પ્રિયંકા|જ્હાનવી|જ્હાન્વી|ઉર્ફી/i.test(text);

  // 2. Sports / Cricket
  const isSports =
    !isEntertainment &&
    /cricket|\bipl\b|ધોની|કોહલી|રોહિત|વર્લ્ડ કપ|world cup|સ્પોર્ટ્સ|sports|વાનખેડે|સ્ટેડિયમ|ઋષભ પંત/i.test(text);

  // 3. Politics / Election
  const isPolitics =
    !isEntertainment &&
    /ચૂંટણી|સંસદ|ભાજપ|કોંગ્રેસ|રાજ ઠાકરે|રાહુલ ગાંધી|શપથવિધી|election|politics/i.test(text);

  // 4. Religion / Temple
  const isReligion =
    !isEntertainment &&
    /સોમનાથ મંદિર|દ્વારકાધીશ|અંબાજી મંદિર|પાવાગઢ મંદિર|ડાકોર મંદિર|મહાદેવ|શિવલિંગ|પરિક્રમા/i.test(text);

  if (isEntertainment) return 'મનોરંજન';
  if (isSports) return 'સ્પોર્ટ્સ';
  if (isPolitics) return 'રાજનીતિ';
  if (isReligion) return 'ધર્મ';

  // Default for photo gallery is entertainment
  return 'મનોરંજન';
}

async function main() {
  const dbUrl = process.env.DATABASE_URL || 'mysql://gujaratpost:gujaratpost2005@127.0.0.1:3306/gujaratpost';
  const conn = await mysql.createConnection(dbUrl);
  console.log('✅ Connected to database.');

  const [photos] = await conn.execute('SELECT id, alt, captionGu, caption, category FROM gallery_photos');
  console.log(`📋 Total photos in database: ${photos.length}`);

  const sqlStatements = [
    '-- Fix gallery photo categories: correct wrong ધર્મ (Nikita Sharma) and સમાચાર (Sunny Leone) to મનોરંજન',
    'SET NAMES utf8mb4;',
    'START TRANSACTION;',
  ];

  let updatedCount = 0;
  const categoryStats = {};

  for (const p of photos) {
    const correctCat = categorizePhoto(p);
    categoryStats[correctCat] = (categoryStats[correctCat] || 0) + 1;

    if (p.category !== correctCat) {
      updatedCount++;
      await conn.execute('UPDATE gallery_photos SET category = ?, updatedAt = NOW() WHERE id = ?', [correctCat, p.id]);
      sqlStatements.push(`UPDATE \`gallery_photos\` SET \`category\` = '${correctCat}', \`updatedAt\` = NOW() WHERE \`id\` = '${p.id}';`);
    }
  }

  sqlStatements.push('COMMIT;');

  const sqlFile = path.join(__dirname, 'fix_gallery_categories.sql');
  fs.writeFileSync(sqlFile, sqlStatements.join('\n'), 'utf8');
  console.log(`💾 Generated ${sqlFile} with ${sqlStatements.length} lines.`);

  console.log(`🎉 Successfully updated ${updatedCount} photos in database.`);
  console.log('📊 Category distribution after update:', categoryStats);

  // Verify Nikita Sharma specifically
  const [nikita] = await conn.execute("SELECT id, captionGu, category FROM gallery_photos WHERE captionGu LIKE '%નિકિતા%' OR id = 'f2024630-f731-43dd-bd49-b07fe76cf438'");
  console.log('🔍 Nikita Sharma record:', nikita);

  // Verify Sunny Leone specifically
  const [sunny] = await conn.execute("SELECT id, captionGu, category FROM gallery_photos WHERE captionGu LIKE '%સની લિયોની%' LIMIT 2");
  console.log('🔍 Sunny Leone records:', sunny);

  await conn.end();
}

main().catch(console.error);

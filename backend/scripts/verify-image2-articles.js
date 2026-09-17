const mysql = require('mysql2/promise');

async function test() {
  const local = await mysql.createConnection({
    host: '127.0.0.1', port: 3306,
    user: 'gujaratpost', password: 'gujaratpost2005',
    database: 'gujaratpost', charset: 'utf8mb4'
  });

  const titles = [
    'ગુજરાતની શાળાઓમાં ડિજિટલ લર્નિંગને પ્રોત્સાહન',
    'તસવીરી ઝલક: ગુજરાતના રમણીય લેન્ડસ્કેપ્સ',
    'તંત્રીલેખ: સુશાસન, પારદર્શિતા અને લોકશાહીમાં',
    'ગુજરાત સરકાર દ્વારા વિવિધ સરકારી વિભાગોમાં',
    'ગુજરાત શિક્ષણ બોર્ડ દ્વારા શાળાઓ અને કોલેજોમાં',
    'સ્વસ્થ દીર્ઘાયુષ્ય માટે આયુર્વેદ, યોગ અને સાત્વિક',
    'ગુજરાતી સિનેમામાં નવો સુવર્ણ યુગ',
    'આર્ટિફિશિયલ ઇન્ટેલિજન્સ અને સેમિકન્ડક્ટરમાં ભારતની',
    'અંતિમ ઓવરના રોમાંચક મુકાબલામાં ટીમ ઇન્ડિયાનો',
    'શેરબજારમાં વિક્રમી તેજી: સેન્સેક્સ',
    'ગ્લોબલ ક્લાઇમેટ સમિટમાં સ્વચ્છ ઊર્જા',
    'ભારતનો જીડીપી વૃદ્ધિદર ૭.૮%',
    'સૌની યોજનાથી સૌરાષ્ટ્રના ૧૧૫ જળાશયો',
    'ગુજરાતને મોટી ભેટ! નવી સેમિકન્ડક્ટર પોલિસી',
    'સોના-ચાંદીના ભાવમાં ઉતાર-ચઢાવ: ગુજરાતમાં આજના ભાવ',
    'ચોમાસું અપડેટ: ગુજરાતમાં આગામી સપ્તાહનું હવામાન',
    'ઓર્ગેનિકના દાવાઓ વચ્ચે હવે સવાલ Proof નો'
  ];

  console.log('Checking presence of Image 2 titles in local database:\n');
  for (const t of titles) {
    const [rows] = await local.query('SELECT id, articleNumber, titleGu, views, status, isFeatured FROM posts WHERE titleGu LIKE ? LIMIT 1', [`%${t}%`]);
    if (rows.length > 0) {
      const r = rows[0];
      console.log(`  ✓ FOUND [art# ${String(r.articleNumber).padStart(5)}] isFeatured=${r.isFeatured} views=${String(r.views).padStart(6)} status=${r.status} | "${r.titleGu.substring(0, 45)}"`);
    } else {
      console.log(`  ✗ NOT FOUND: "${t}"`);
    }
  }

  await local.end();
}

test().catch(console.error);

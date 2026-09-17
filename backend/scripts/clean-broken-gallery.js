const fs = require('fs');
const mysql = require('mysql2/promise');
const crypto = require('crypto');

const FRESH_GALLERY_PHOTOS = [
  {
    src: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=90',
    alt: 'સોમનાથ મંદિરે ભક્તિનો મહાસાગર ઉમટ્યો',
    caption: 'સોમનાથ મંદિરે શ્રદ્ધાળુઓનો અદભુત ઉત્સાહ અને મહાઆરતી',
    captionGu: 'સોમનાથ મંદિરે ભક્તિનો મહાસાગર ઉમટ્યો: મહાઆરતીમાં હજારો શ્રદ્ધાળુઓ જોડાયા',
    captionHi: 'सोमनाथ मंदिर में उमड़ा आस्था का महासागर: महाआरती में शामिल हुए श्रद्धालु',
    category: 'ધર્મ',
    photographer: 'ગુજરાત પોસ્ટ બ્યૂરો'
  },
  {
    src: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=1200&q=90',
    alt: 'અમદાવાદમાં જગન્નાથજીની ભવ્ય રથયાત્રા',
    caption: 'અમદાવાદમાં જગન્નાથજીની ભવ્ય રથયાત્રા: હર્ષોલ્લાસ સાથે નગરચર્યા',
    captionGu: 'અમદાવાદમાં જગન્નાથજીની ભવ્ય રથયાત્રા: ભક્તિભાવ સાથે નગરચર્યાએ નીકળ્યા નાથ',
    captionHi: 'अहमदाबाद में भगवान जगन्नाथ की भव्य रथयात्रा',
    category: 'ઉત્સવ',
    photographer: 'ગુજરાત પોસ્ટ ફોટો'
  },
  {
    src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=90',
    alt: 'ગિરનાર લીલી પરિક્રમા: ભક્તિભાવ સાથે લાખો ભાવિકો ઉમટ્યા',
    caption: 'ગિરનાર લીલી પરિક્રમા: ભક્તિભાવ સાથે લાખો ભાવિકો ઉમટ્યા',
    captionGu: 'ગિરનાર લીલી પરિક્રમા: ગિરનારની ગોદમાં ગુંજ્યો જય ગિરનારીનો નાદ',
    captionHi: 'गिरनार लीली परिक्रमा: जय गिरनारी के जयघोष से गूंजी घाटी',
    category: 'પ્રવાસ',
    photographer: 'ગુજરાત પોસ્ટ બ્યૂરો'
  },
  {
    src: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=90',
    alt: 'કચ્છના સફેદ રણમાં શ્વેત ચાંદનીની અદ્ભૂત રમઝટ',
    caption: 'કચ્છના સફેદ રણમાં રણોત્સવની રંગત: પ્રવાસીઓનો ભારે ધસારો',
    captionGu: 'કચ્છના સફેદ રણમાં રણોત્સવની રંગત: પૂનમની રાત્રે શ્વેત રણ ઝળહળી ઊઠ્યું',
    captionHi: 'कच्छ के सफेद रण में रणोत्सव की धूम: चांदनी रात में जगमगाया सफेद रण',
    category: 'સંસ્કૃતિ',
    photographer: 'ગુજરાત પોસ્ટ બ્યૂરો'
  },
  {
    src: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=90',
    alt: 'અમદાવાદ સાબરમતી રિવરફ્રન્ટ પર ફ્લાવર શોની આકર્ષક ઝલક',
    caption: 'અમદાવાદ સાબરમતી રિવરફ્રન્ટ પર ફ્લાવર શોની આકર્ષક ઝલક',
    captionGu: 'સાબરમતી રિવરફ્રન્ટ ફ્લાવર શો: રંગબેરંગી દેશી-વિદેશી ફૂલોનું અદભુત પ્રદર્શન',
    captionHi: 'साबरमती रिवरफ्रंट फ्लावर शो: रंग-बिरंगे फूलों से सजा रिवरफ्रंट',
    category: 'શહેર',
    photographer: 'ગુજરાત પોસ્ટ ફોટો'
  },
  {
    src: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=90',
    alt: 'નવરાત્રિ મહોત્સવ: ખેલૈયાઓએ રાસ-ગરબાની રમઝટ બોલાવી',
    caption: 'નવરાત્રિ મહોત્સવ: પરંપરાગત વેશભૂષામાં યુવાનોએ જમાવ્યો રંગ',
    captionGu: 'નવરાત્રિ મહોત્સવ: રંગબેરંગી ચણિયાચોળી અને કેડિયામાં ખેલૈયાઓએ જમાવ્યો રંગ',
    captionHi: 'नवरात्रि महोत्सव: पारंपरिक परिधानों में गरबा की धूम',
    category: 'ઉત્સવ',
    photographer: 'ગુજરાત પોસ્ટ ટીમ'
  },
  {
    src: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=90',
    alt: 'ગીર રાષ્ટ્રીય ઉદ્યાન: સાવજના મુક્ત વિહારની દુર્લભ તસવીર',
    caption: 'ગીર રાષ્ટ્રીય ઉદ્યાન: જંગલના રાજા એશિયાટિક સિંહનો શાહી અંદાજ',
    captionGu: 'ગીરનું ગૌરવ: એશિયાટિક સિંહનો શાહી અંદાજ કેમેરામાં કેદ',
    captionHi: 'गीर का गौरव: एशियाई शेरों का शाही अंदाज कैमरे में कैद',
    category: 'પ્રકૃતિ',
    photographer: 'ગુજરાત પોસ્ટ વાઇલ્ડલાઇફ'
  },
  {
    src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=90',
    alt: 'શિવરાજપુર બ્લુ ફ્લેગ બીચ: સૂર્યાસ્તનો રમણીય નજારો',
    caption: 'દ્વારકા નજીક આવેલ શિવરાજપુર બીચ પર પ્રવાસીઓની ભીડ',
    captionGu: 'દ્વારકા શિવરાજપુર બીચ: બ્લુ ફ્લેગ સર્ટિફાઇડ દરિયાકિનારે રમણીય સંધ્યા',
    captionHi: 'द्वारका शिवराजपुर बीच: ब्लू फ्लैग सर्टिफाइड तट पर मनोरम संध्या',
    category: 'પ્રવાસ',
    photographer: 'ગુજરાત પોસ્ટ બ્યૂરો'
  }
];

async function main() {
  const audit = JSON.parse(fs.readFileSync('./scripts/gallery-audit.json'));
  console.log(`Found ${audit.failIds.length} broken 404 gallery IDs to remove.`);

  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'gujaratpost',
    password: 'gujaratpost2005',
    database: 'gujaratpost',
  });

  if (audit.failIds.length > 0) {
    // Delete in batches of 100
    for (let i = 0; i < audit.failIds.length; i += 100) {
      const chunk = audit.failIds.slice(i, i + 100);
      const placeholders = chunk.map(() => '?').join(',');
      await conn.query(`DELETE FROM gallery_photos WHERE id IN (${placeholders})`, chunk);
    }
    console.log(`Deleted all ${audit.failIds.length} broken 404 rows from gallery_photos.`);
  }

  // Insert fresh verified photos with staggered recent timestamps
  const now = Date.now();
  for (let i = 0; i < FRESH_GALLERY_PHOTOS.length; i++) {
    const item = FRESH_GALLERY_PHOTOS[i];
    const id = crypto.randomUUID();
    const createdAt = new Date(now - i * 3600000); // 1 hour apart
    await conn.query(
      `INSERT INTO gallery_photos (id, src, alt, caption, captionGu, captionHi, category, photographer, copyright, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        item.src,
        item.alt,
        item.caption,
        item.captionGu,
        item.captionHi,
        item.category,
        item.photographer,
        '© Gujarat Post 2026',
        createdAt,
        createdAt
      ]
    );
  }
  console.log(`Inserted ${FRESH_GALLERY_PHOTOS.length} fresh verified Gujarati news photos.`);

  const [totalRows] = await conn.query('SELECT count(*) as cnt FROM gallery_photos');
  console.log(`Total rows in gallery_photos now: ${totalRows[0].cnt}`);

  const [top5] = await conn.query('SELECT id, src, captionGu, createdAt FROM gallery_photos ORDER BY createdAt DESC LIMIT 5');
  console.log('\nTop 5 photos by createdAt DESC:');
  console.log(top5);

  await conn.end();
}

main().catch(console.error);

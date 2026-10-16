const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUpdate() {
  try {
    const rulesTitle = 'અમારા અડગ નિયમો';
    const rulesStr = JSON.stringify(['૧૦૦% તથ્ય ચકાસણી', 'કોઈપણ ફેક ન્યૂઝ સામે શૂન્ય સહિષ્ણુતા', 'ગ્રાઉન્ડ રિયાલિટી રિપોર્ટિંગ', 'વાચકોની પ્રાઈવસીનું સંપૂર્ણ સન્માન']);
    const valuesStr = JSON.stringify([]);
    const statsStr = JSON.stringify([]);
    const teamStr = JSON.stringify([]);

    await prisma.$executeRawUnsafe(
      `UPDATE about_settings SET
        titleGu = ?,
        titleEn = ?,
        titleHi = ?,
        subtitleGu = ?,
        subtitleEn = ?,
        subtitleHi = ?,
        descriptionGu = ?,
        descriptionEn = ?,
        descriptionHi = ?,
        bannerImage = ?,
        missionGu = ?,
        missionEn = ?,
        missionHi = ?,
        visionGu = ?,
        visionEn = ?,
        visionHi = ?,
        rulesTitle = ?,
        rulesJson = ?,
        valuesJson = ?,
        statsJson = ?,
        teamJson = ?,
        contactEmail = ?,
        contactPhone = ?,
        contactAddress = ?,
        whatsappNumber = ?,
        updatedAt = NOW(3)
      WHERE id = 'default'`,
      'ગુજરાત પોસ્ટ વિશે',
      'About Gujarat Post',
      'गुजरात पोस्ट के बारे में',
      'સત્ય, સચોટતા અને વિશ્વસનીય પત્રકારત્વનું અગ્રણી ડિજિટલ માધ્યમ',
      'Leading Digital Media for Truth, Accuracy & Reliable Journalism',
      'सत्य, सटीकता और विश्वसनीय पत्रकारिता का प्रमुख डिजिटल माध्यम',
      'ગુજરાત પોસ્ટ એ ગુજરાત અને દેશ-વિદેશના તાજા, મહત્વપૂર્ણ અને ગ્રાઉન્ડ લેવલના સમાચારો...',
      'Gujarat Post description...',
      'गुजरात पोस्ट वर्णन...',
      'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1200',
      'અમારો સંકલ્પ છે...',
      'Mission English...',
      'Mission Hindi...',
      'અમારો દ્રષ્ટિકોણ...',
      'Vision English...',
      'Vision Hindi...',
      rulesTitle,
      rulesStr,
      valuesStr,
      statsStr,
      teamStr,
      'contact@gujaratpost.in',
      '+91 99099 07237',
      'ગુજરાત પોસ્ટ મીડિયા, અમદાવાદ',
      '+91 99099 07237'
    );
    console.log('UPDATE query executed successfully!');
  } catch (err) {
    console.error('UPDATE query ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testUpdate();

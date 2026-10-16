const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_BUREAUS = [
  {
    id: 'bureau-1',
    city: 'અમદાવાદ (મુખ્ય કાર્યાલય)',
    address: 'ગુજરાત પોસ્ટ ભવન, એસ.જી. હાઈવે, પ્રહલાદ નગર, અમદાવાદ - 380015',
    phone: '+91 99099 07237',
    email: 'ahmedabad@gujaratpost.in',
    head: 'બ્યુરો ચીફ (સેન્ટ્રલ ડેસ્ક)'
  },
  {
    id: 'bureau-2',
    city: 'સુરત (દક્ષિણ ગુજરાત)',
    address: 'રીંગ રોડ, મજુરા ગેટ, સુરત - 395002',
    phone: '+91 99099 07237',
    email: 'surat@gujaratpost.in',
    head: 'બ્યુરો ચીફ (સુરત)'
  },
  {
    id: 'bureau-3',
    city: 'રાજકોટ (સૌરાષ્ટ્ર)',
    address: 'યાજ્ઞિક રોડ, રાજકોટ - 360001',
    phone: '+91 99099 07237',
    email: 'rajkot@gujaratpost.in',
    head: 'બ્યુરો ચીફ (રાજકોટ)'
  },
  {
    id: 'bureau-4',
    city: 'વડોદરા (મધ્ય ગુજરાત)',
    address: 'અલકાપુરી, વડોદરા - 390007',
    phone: '+91 99099 07237',
    email: 'vadodara@gujaratpost.in',
    head: 'બ્યુરો ચીફ (વડોદરા)'
  },
  {
    id: 'bureau-5',
    city: 'ગાંધીનગર (સચિવાલય બ્યુરો)',
    address: 'સેક્ટર 11, ગાંધીનગર - 382011',
    phone: '+91 99099 07237',
    email: 'gandhinagar@gujaratpost.in',
    head: 'સચિવાલય પ્રતિનિધિ (ગાંધીનગર)'
  }
];

const DEFAULT_SOCIALS = {
  whatsapp: 'https://api.whatsapp.com/send/?phone=919909907237&text&type=phone_number&app_absent=0',
  facebook: 'https://www.facebook.com/Gujarat-Post-165183530766504',
  twitter: 'https://x.com/maheshrpat59606',
  instagram: 'https://instagram.com/gujaratpost',
  youtube: 'https://youtube.com/@gujaratpost'
};

async function seed() {
  const existing = await prisma.$queryRawUnsafe('SELECT id FROM contact_settings WHERE id = "default" LIMIT 1');
  if (existing && existing.length > 0) {
    console.log('contact_settings already seeded.');
    return;
  }

  await prisma.$executeRawUnsafe(`
    INSERT INTO contact_settings (
      id,
      pageTitle,
      pageSubtitle,
      headOfficeAddress,
      primaryPhone,
      whatsappNumber,
      primaryEmail,
      workingHours,
      mapEmbedUrl,
      editorialEmail,
      editorialPhone,
      adsEmail,
      adsPhone,
      grievanceName,
      grievanceDesignation,
      grievanceEmail,
      grievanceAddress,
      bureauOfficesJson,
      socialLinksJson
    ) VALUES (
      'default',
      'સંપર્ક કરો (Contact Gujarat Post)',
      'કોઈપણ સમાચાર, પ્રેસ નોટ, જાહેરાત કે માહિતી માટે અમારા પત્રકાર મિત્રો અને સંપાદકીય ટીમનો સંપર્ક સાધો.',
      'ગુજરાત પોસ્ટ ભવન, એસ.જી. હાઈવે, પ્રહલાદ નગર, અમદાવાદ - 380015, ગુજરાત.',
      '+91 99099 07237',
      '+91 99099 07237',
      'contact@gujaratpost.in',
      'સોમવાર - શનિવાર: સવારે 9:00 થી રાત્રે 9:00 | 24x7 ન્યૂઝ ડેસ્ક',
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d117506.44754760882!2d72.43965561026046!3d23.02015809244018!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e848aba5bd449%3A0x4fcedd11614f6516!2sAhmedabad%2C%20Gujarat!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin',
      'editorial@gujaratpost.in',
      '+91 99099 07237',
      'ads@gujaratpost.in',
      '+91 99099 07237',
      'મહેશ પટેલ (Mahesh Patel)',
      'તકરાર નિવારણ અધિકારી (Grievance Redressal Officer)',
      'grievance@gujaratpost.in',
      'ગુજરાત પોસ્ટ મુખ્ય કાર્યાલય, અમદાવાદ, ગુજરાત - 380015',
      ?,
      ?
    )
  `, JSON.stringify(DEFAULT_BUREAUS), JSON.stringify(DEFAULT_SOCIALS));

  console.log('Seeded default contact_settings successfully.');
}

seed()
  .catch((e) => {
    console.error('Error seeding contact_settings:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

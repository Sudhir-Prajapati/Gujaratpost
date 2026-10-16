const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const defaultStats = [
  { value: "10M+", labelGu: "માસિક વાચકો", labelEn: "Monthly Readers", labelHi: "मासिक पाठक" },
  { value: "33", labelGu: "જિલ્લા કવરેજ", labelEn: "Districts Covered", labelHi: "जिले कवर" },
  { value: "50K+", labelGu: "પ્રકાશિત સમાચારો", labelEn: "Published Articles", labelHi: "प्रकाशित लेख" },
  { value: "24/7", labelGu: "લાઇવ અપડેટ્સ", labelEn: "Live Newsdesk", labelHi: "लाइव अपडेट्स" }
];

const defaultValues = [
  {
    icon: "ShieldCheck",
    titleGu: "સત્ય અને પારદર્શિતા",
    titleEn: "Truth & Transparency",
    titleHi: "सत्य और पारदर्शिता",
    descGu: "તથ્યોની પૂરતી ચકાસણી પછી જ સમાચાર પ્રસારિત કરવા એ અમારો મૂળભૂત સિદ્ધાંત છે.",
    descEn: "Every story is thoroughly verified with authentic sources before publication.",
    descHi: "तथ्यों की गहन जांच के बाद ही समाचार प्रकाशित करना हमारा मूल सिद्धांत है।"
  },
  {
    icon: "Zap",
    titleGu: "ઝડપ અને સચોટતા",
    titleEn: "Speed & Accuracy",
    titleHi: "गति और सटीकता",
    descGu: "સમાચાર સૌથી પહેલા અને સંપૂર્ણ સાચા પહોંચાડવા માટે અદ્યતન ટેકનોલોજીનો ઉપયોગ.",
    descEn: "Delivering breaking news fast without ever compromising on factual accuracy.",
    descHi: "सटीकता से समझौता किए बिना सबसे तेज़ समाचार पहुंचाना।"
  },
  {
    icon: "Users",
    titleGu: "જનસામાન્યનો અવાજ",
    titleEn: "Voice of the Public",
    titleHi: "जनता की आवाज़",
    descGu: "સામાન્ય નાગરિકોના પાયાના પ્રશ્નો અને સમસ્યાઓને મોખરે લાવી શાસન સુધી પહોંચાડવું.",
    descEn: "Highlighting grassroots community concerns and bringing public issues to the forefront.",
    descHi: "आम जनता की समस्याओं को प्रमुखता से उठाना और शासन तक पहुंचाना।"
  },
  {
    icon: "Award",
    titleGu: "પક્ષપાતરહિત પત્રકારત્વ",
    titleEn: "Unbiased Journalism",
    titleHi: "निष्पक्ष पत्रकारिता",
    descGu: "કોઈપણ રાજકીય કે આર્થિક દબાણ વગર સંપૂર્ણ સ્વતંત્ર અને સંતુલિત અહેવાલો.",
    descEn: "Independent and balanced reporting free from political or commercial influence.",
    descHi: "किसी भी दबाव के बिना पूरी तरह स्वतंत्र और संतुलित रिपोर्टिंग।"
  }
];

const defaultTeam = [
  {
    name: "મહેશભાઈ પટેલ",
    nameEn: "Maheshbhai Patel",
    role: "તંત્રી & સંસ્થાપક",
    roleEn: "Editor-in-Chief & Founder",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400",
    email: "editor@gujaratpost.in"
  },
  {
    name: "રાજેશ શાહ",
    nameEn: "Rajesh Shah",
    role: "મેનેજિંગ એડિટર",
    roleEn: "Managing Editor",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400",
    email: "contact@gujaratpost.in"
  },
  {
    name: "ભાવિન ત્રિવેદી",
    nameEn: "Bhavin Trivedi",
    role: "સિનિયર ન્યૂઝ એડિટર",
    roleEn: "Senior News Editor",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
    email: "desk@gujaratpost.in"
  }
];

async function seedAbout() {
  const existing = await prisma.$queryRawUnsafe('SELECT id FROM about_settings WHERE id = "default" LIMIT 1');
  if (existing && existing.length > 0) {
    console.log('About settings already seeded.');
    return;
  }

  await prisma.$executeRawUnsafe(`
    INSERT INTO about_settings (
      id, titleGu, titleEn, titleHi, subtitleGu, subtitleEn, subtitleHi,
      descriptionGu, descriptionEn, descriptionHi, bannerImage,
      missionGu, missionEn, missionHi, visionGu, visionEn, visionHi,
      valuesJson, statsJson, teamJson, contactEmail, contactPhone,
      contactAddress, whatsappNumber, updatedAt
    ) VALUES (
      'default',
      'ગુજરાત પોસ્ટ વિશે',
      'About Gujarat Post',
      'गुजरात पोस्ट के बारे में',
      'સત્ય, સચોટતા અને વિશ્વસનીય પત્રકારત્વનું અગ્રણી ડિજિટલ માધ્યમ',
      'Leading Digital Media for Truth, Accuracy & Reliable Journalism',
      'सत्य, सटीकता और विश्वसनीय पत्रकारिता का प्रमुख डिजिटल माध्यम',
      'ગુજરાત પોસ્ટ એ ગુજરાત અને દેશ-વિદેશના તાજા, મહત્વપૂર્ણ અને ગ્રાઉન્ડ લેવલના સમાચારો લોકો સુધી નિષ્પક્ષ રીતે પહોંચાડતું ડિજિટલ ન્યૂઝ પ્લેટફોર્મ છે. રાજનીતિ, અર્થતંત્ર, ગુનાખોરી, રમતગમત, શિક્ષણ, ટેકનોલોજી અને મનોરંજન સહિતના દરેક ક્ષેત્રના વિશ્વસનીય સમાચારો અમારા વાચકો સુધી ક્ષણ-પ્રતિક્ષણ પહોંચાડવા માટે અમારી અનુભવી પત્રકારોની ટીમ સતત કાર્યરત છે.',
      'Gujarat Post is a premier digital news platform dedicated to delivering unbiased, verified, and timely news from Gujarat, across India, and globally. Our experienced editorial team works round the clock to cover politics, business, crime, sports, education, technology, and culture with uncompromised integrity.',
      'गुजरात पोस्ट एक प्रमुख डिजिटल समाचार मंच है जो गुजरात, देश और दुनिया के ताज़ा और प्रामाणिक समाचार निष्पक्ष रूप से पाठकों तक पहुँचाने के लिए प्रतिबद्ध है। राजनीति, व्यापार, खेल, शिक्षा और तकनीक के विश्वसनीय समाचारों के लिए लाखों पाठक गुजरात पोस्ट पर भरोसा करते हैं।',
      'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1200',
      'અમારો સંકલ્પ છે કે દરેક નાગરિક સુધી સાચા, નિષ્પક્ષ અને સચોટ સમાચાર સમયસર પહોંચે, જેથી સમાજમાં જાગૃતિ અને લોકશાહી મૂલ્યો સુદ્રઢ બને.',
      'To empower citizens with truthful, accurate, and fearless journalism that strengthens democratic values and community awareness.',
      'नागरिकों तक निष्पक्ष, सटीक और समयबद्ध समाचार पहुँचाना जिससे समाज में जागरूकता और लोकतांत्रिक मूल्य सुदृढ़ हों।',
      'ગુજરાત અને ભારતના સૌથી વધુ વિશ્વાસપાત્ર, આધુનિક અને જનહિતલક્ષી ડિજિટલ ન્યૂઝ નેટવર્ક તરીકે અગ્રેસર રહેવું.',
      'To be the most trusted, innovative, and impactful regional and national digital news network.',
      'गुजरात और भारत का सबसे विश्वसनीय और प्रभावशाली डिजिटल समाचार नेटवर्क बनना।',
      ?, ?, ?,
      'contact@gujaratpost.in',
      '+91 99099 07237',
      'ગુજરાત પોસ્ટ મીડિયા, એસ.જી. હાઇવે, અમદાવાદ - 380054 (Gujarat Post Media, S.G. Highway, Ahmedabad - 380054)',
      '+91 99099 07237',
      NOW(3)
    )
  `, JSON.stringify(defaultValues), JSON.stringify(defaultStats), JSON.stringify(defaultTeam));

  console.log('Successfully seeded default about settings!');
}

seedAbout()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

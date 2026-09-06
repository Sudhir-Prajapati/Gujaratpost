import { PrismaClient, PostStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Other Cities category & articles...');

  // 1. Upsert 'other-cities' category in DB
  const otherCat = await prisma.category.upsert({
    where: { slug: 'other-cities' },
    update: {
      name: 'Other Cities',
      nameGu: 'અન્ય શહેરો',
      nameHi: 'अन्य शहर',
      displayOrder: 25,
      showInHeader: true,
      showInHome: true,
    },
    create: {
      name: 'Other Cities',
      nameGu: 'અન્ય શહેરો',
      nameHi: 'अन्य शहर',
      slug: 'other-cities',
      displayOrder: 25,
      showInHeader: true,
      showInHome: true,
    },
  });
  console.log('Category created/updated:', otherCat);

  // 2. Also ensure 'gujarat' category exists in DB
  const gujaratCat = await prisma.category.upsert({
    where: { slug: 'gujarat' },
    update: {
      name: 'Gujarat',
      nameGu: 'ગુજરાત',
      nameHi: 'गुजरात',
      displayOrder: 30,
      showInHeader: true,
      showInHome: true,
    },
    create: {
      name: 'Gujarat',
      nameGu: 'ગુજરાત',
      nameHi: 'गुजरात',
      slug: 'gujarat',
      displayOrder: 30,
      showInHeader: true,
      showInHome: true,
    },
  });
  console.log('Gujarat category created/updated:', gujaratCat);

  // 3. Find default author
  const author = await prisma.author.findFirst();
  if (!author) {
    console.error('No author found in DB!');
    return;
  }

  // Get max article number
  const maxArt = await prisma.post.aggregate({
    _max: { articleNumber: true },
  });
  let nextArticleNum = (maxArt._max.articleNumber || 100) + 1;

  const OTHER_CITIES_ARTICLES = [
    {
      title: 'Kutch Rann Utsav 2026: Record tourism footfall recorded at White Desert Bhuj',
      titleGu: 'કચ્છ રણ ઉત્સવ 2026: સફેદ રણ ભુજ ખાતે પ્રવાસીઓનો નવો રેકોર્ડ સરાહનીય ઉત્સાહ',
      titleHi: 'कच्छ रण उत्सव 2026: सफेद रण भुज में पर्यटकों की रिकॉर्ड संख्या दर्ज',
      slug: 'kutch-rann-utsav-2026-record-tourism-footfall',
      excerpt: 'The World famous Kutch White Rann witnessed over 5 lakh national and international visitors during the cultural festival.',
      excerptGu: 'વિશ્વપ્રસિદ્ધ કચ્છના સફેદ રણમાં સાંસ્કૃતિક મહોત્સવ દરમિયાન 5 લાખથી વધુ દેશી-વિદેશી પ્રવાસીઓએ મુલાકાત લીધી.',
      excerptHi: 'विश्व प्रसिद्ध कच्छ के सफेद रण में सांस्कृतिक उत्सव के दौरान 5 लाख से अधिक पर्यटकों ने दौरा किया।',
      content: `કચ્છના ધરોડો અને સફેદ રણ ખાતે આયોજિત વાર્ષિક રણ ઉત્સવે આ વર્ષે પ્રવાસન ક્ષેત્રે નવો ઈતિહાસ રચ્યો છે. દેશ-વિદેશથી ઉમટી પડેલા લાખો પ્રવાસીઓએ કચ્છી લોકસંસ્કૃતિ, હસ્તકલા અને રાત્રિના ચંદ્રપ્રકાશમાં ચમકતા સફેદ રણનો અદ્ભુત આનંદ માણ્યો હતો.

સ્થાનિક તંત્ર દ્વારા વિશેષ ટેન્ટ સિટી, સાંસ્કૃતિક કાર્યક્રમો અને પેરામોટરિંગ જેવી સાહસિક રમતોનું આયોજન કરવામાં આવ્યું છે. જિલ્લા કલેક્ટર અને ટુરિઝમ બોર્ડના જણાવ્યા અનુસાર આ વર્ષે સ્થાનિક કારીગરો અને ગૃહ ઉદ્યોગોને પણ કરોડો રૂપિયાનો આર્થિક ફાયદો થયો છે.`,
      contentGu: `કચ્છના ધરોડો અને સફેદ રણ ખાતે આયોજિત વાર્ષિક રણ ઉત્સવે આ વર્ષે પ્રવાસન ક્ષેત્રે નવો ઈતિહાસ રચ્યો છે. દેશ-વિદેશથી ઉમટી પડેલા લાખો પ્રવાસીઓએ કચ્છી લોકસંસ્કૃતિ, હસ્તકલા અને રાત્રિના ચંદ્રપ્રકાશમાં ચમકતા સફેદ રણનો અદ્ભુત આનંદ માણ્યો હતો.

સ્થાનિક તંત્ર દ્વારા વિશેષ ટેન્ટ સિટી, સાંસ્કૃતિક કાર્યક્રમો અને પેરામોટરિંગ જેવી સાહસિક રમતોનું આયોજન કરવામાં આવ્યું છે. સ્થાનિક હસ્તકલા કારીગરોને આ આયોજનથી મોટો આર્થિક ટેકો મળ્યો છે.`,
      contentHi: `कच्छ के धोर्डो और सफेद रण में आयोजित वार्षिक रण उत्सव ने इस साल पर्यटन के क्षेत्र में नया इतिहास रचा है।`,
      featuredImage: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=90',
      location: 'Kutch',
      categoryId: otherCat.id,
      authorId: author.id,
      status: 'PUBLISHED',
      isFeatured: true,
      isTrending: true,
    },
    {
      title: 'Bhavnagar Ship Recycling Yard gets major green safety upgrade',
      titleGu: 'ભાવનગર શિપ રિસાયક્લિંગ યાર્ડ અલંગને મળ્યું ગ્રીન સેફ્ટી પ્રમાણપત્ર',
      titleHi: 'भावनगर शिप रिसाइकलिंग यार्ड अलंग को मिला ग्रीन सेफ्टी सर्टिफिकेट',
      slug: 'bhavnagar-alang-ship-recycling-green-safety-upgrade',
      excerpt: 'Alang Ship Recycling Yard achieves 100% compliance with international green shipping standards.',
      excerptGu: 'અલંગ શિપ બ્રેકિંગ યાર્ડે આંતરરાષ્ટ્રીય પર્યાવરણ અને ગ્રીન શિપિંગ ધોરણોનું 100% પાલન હાંસલ કર્યું.',
      excerptHi: 'अलंग शिप ब्रेकिंग यार्ड ने अंतरराष्ट्रीय पर्यावरण और ग्रीन शिपिंग मानकों का अनुपालन हासिल किया।',
      content: `ભાવનગર જિલ્લામાં આવેલું આંતરરાષ્ટ્રીય ખ્યાતિપ્રાપ્ત અલંગ શિપ રિસાયક્લિંગ યાર્ડ હવે પર્યાવરણ પરિરૂપ ગ્રીન યાર્ડ તરીકે ઉભરી આવ્યું છે. શિપ રિસાયક્લિંગ ઈન્ડસ્ટ્રીમાં સેફ્ટી કમ્પ્લાયન્સ અને વેસ્ટ મેનેજમેન્ટ માટે ગ્લોબલ સ્ટાન્ડર્ડ સર્ટિફિકેશન મળતાં વૈશ્વિક સ્તરે ભારતની શિપિંગ ક્ષમતા વધુ મજબૂત બની છે.`,
      contentGu: `ભાવનગર જિલ્લામાં આવેલું આંતરરાષ્ટ્રીય ખ્યાતિપ્રાપ્ત અલંગ શિપ રિસાયક્લિંગ યાર્ડ હવે પર્યાવરણ પરિરૂપ ગ્રીન યાર્ડ તરીકે ઉભરી આવ્યું છે.`,
      contentHi: `भावनगर जिले में स्थित विश्व प्रसिद्ध अलंग शिप रिसाइकलिंग यार्ड अब पर्यावरण अनुकूल ग्रीन यार्ड के रूप में उभरा है।`,
      featuredImage: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=90',
      location: 'Bhavnagar',
      categoryId: otherCat.id,
      authorId: author.id,
      status: 'PUBLISHED',
      isFeatured: true,
      isTrending: false,
    },
    {
      title: 'Junagadh Girnar Lili Parikrama completed with lakhs of devotees',
      titleGu: 'જૂનાગઢ ગિરનાર લીલી પરિક્રમા: ભક્તિ અને આસ્થાના મહાસાગર સાથે સંપન્ન',
      titleHi: 'जूनागढ़ गिरनार लीली परिक्रमा: भक्ति और आस्था के सागर के साथ संपन्न',
      slug: 'junagadh-girnar-lili-parikrama-completed-devotees',
      excerpt: 'Over 8 lakh pilgrims completed the sacred 36 km Girnar Parikrama in Junagadh.',
      excerptGu: 'જૂનાગઢ ગિરનારની પવિત્ર 36 કિમીની લીલી પરિક્રમામાં 8 લાખથી વધુ શ્રદ્ધાળુઓએ ઉત્સાહભેર ભાગ લીધો.',
      excerptHi: 'जूनागढ़ गिरनार की पवित्र 36 किमी लीली परिक्रमा में 8 लाख से अधिक श्रद्धालुओं ने भाग लिया।',
      content: `જૂનાગઢ ગિરનાર અભયારણ્યમાં યોજાયેલી વાર્ષિક 36 કિલોમીટરની લીલી પરિક્રમા સંપન્ન થઈ છે. સમગ્ર દેશમાંથી પધારેલા સાધુ-સંતો અને આબાલવૃદ્ધ શ્રદ્ધાળુઓએ ગિરનારી બાપાના જયઘોષ સાથે ભક્તિમય વાતાવરણ સર્જ્યું હતું. તંત્ર દ્વારા અન્નક્ષેત્રો અને મેડિકલ કેમ્પની શ્રેષ્ઠ સુવિધા પૂરી પાડવામાં આવી હતી.`,
      contentGu: `જૂનાગઢ ગિરનાર અભયારણ્યમાં યોજાયેલી વાર્ષિક 36 કિલોમીટરની લીલી પરિક્રમા સંપન્ન થઈ છે.`,
      contentHi: `जूनागढ़ गिरनार अभयारण्य में आयोजित वार्षिक 36 किलोमीटर की लीली परिक्रमा संपन्न हो गई है।`,
      featuredImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=90',
      location: 'Junagadh',
      categoryId: otherCat.id,
      authorId: author.id,
      status: 'PUBLISHED',
      isFeatured: true,
      isTrending: true,
    },
    {
      title: 'Jamnagar Brass Parts Export touches record high growth in 2026',
      titleGu: 'જામનગર બ્રાસપાર્ટ્સ ઉદ્યોગ: નિકાસમાં 28%નો મોટો ઉછાળો નોંઘાયો',
      titleHi: 'जामनगर पीतल पार्ट्स उद्योग: निर्यात में 28% की बड़ी बढ़त दर्ज',
      slug: 'jamnagar-brass-parts-export-record-high-growth-2026',
      excerpt: 'Jamnagar Brass City manufacturing hubs report historic order surge from European markets.',
      excerptGu: 'જામનગર બ્રાસ સિટી ઉત્પાદન એકમોને યુરોપિયન અને એશિયન બજારોમાંથી રેકોર્ડબ્રેક ઓર્ડર મળ્યા.',
      excerptHi: 'जामनगर ब्रास सिटी निर्माण इकाइयों को यूरोपीय और एशियाई बाजारों से रिकॉर्ड ऑर्डर मिले।',
      content: `જામનગરના પ્રખ્યાત બ્રાસપાર્ટ્સ ઉદ્યોગે વૈશ્વિક બજારમાં સ્થાન વધુ મજબૂત કર્યું છે. ગુણવત્તાસભર ઉત્પાદન અને આધુનિક ઈલેક્ટ્રોપ્લેટિંગ ટેક્નોલોજીના ઉપયોગથી નિકાસમાં ગત વર્ષ સરખામણીએ 28 ટકાનો મોટો વધારો થયો છે, જેનાથી હજારો કારીગરોને રોજગારી મળી છે.`,
      contentGu: `જામનગરના પ્રખ્યાત બ્રાસપાર્ટ્સ ઉદ્યોગે વૈશ્વિક બજારમાં સ્થાન વધુ મજબૂત કર્યું છે.`,
      contentHi: `जामनगर के प्रसिद्ध ब्रास पार्ट्स उद्योग ने वैश्विक बाजार में अपनी स्थिति और मजबूत की है।`,
      featuredImage: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=90',
      location: 'Jamnagar',
      categoryId: otherCat.id,
      authorId: author.id,
      status: 'PUBLISHED',
      isFeatured: false,
      isTrending: true,
    },
    {
      title: 'Mehsana Milk Dairy expansion inaugurated: New automated processing plant',
      titleGu: 'મહેસાણા દૂધસાગર ડેરીનો નવો ઓટોમેટેડ પ્રોસેસિંગ પ્લાન્ટ કાર્યરત',
      titleHi: 'महसाणा दूधसागर डेयरी का नया स्वचालित प्रसंस्करण संयंत्र शुरू',
      slug: 'mehsana-dudhsagar-dairy-expansion-automated-plant',
      excerpt: 'Mehsana Dudhsagar Dairy launches modern milk pouching unit boosting daily capacity by 10 lakh liters.',
      excerptGu: 'મહેસાણા દૂધસાગર ડેરીએ દૈનિક 10 લાખ લિટર વધારાની કેપેસિટી ધરાવતો નવો પ્લાન્ટ શરૂ કર્યો.',
      excerptHi: 'महसाणा दूधसागर डेयरी ने 10 लाख लीटर दैनिक अतिरिक्त क्षमता वाला नया संयंत्र शुरू किया।',
      content: `મહેસાણા દૂધસાગર ડેરીમાં અત્યાધુનિક ઓટોમેટેડ મિલ્ક પ્રોસેસિંગ અને પેકેજિંગ પ્લાન્ટનું લોકાર્પણ કરવામાં આવ્યું છે. આ નવા પ્લાન્ટથી ઉત્તર ગુજરાતના લાખો પશુપાલકોને દૂધના પોષણક્ષમ ભાવ મળશે અને પ્રોસેસિંગ ગુણવત્તા સુધરશે.`,
      contentGu: `મહેસાણા દૂધસાગર ડેરીમાં અત્યાધુનિક ઓટોમેટેડ મિલ્ક પ્રોસેસિંગ અને પેકેજિંગ પ્લાન્ટનું લોકાર્પણ કરવામાં આવ્યું છે.`,
      contentHi: `महसाणा दूधसागर डेयरी में अत्याधुनिक स्वचालित दूध प्रसंस्करण और पैकेजिंग संयंत्र का उद्घाटन किया गया है।`,
      featuredImage: 'https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?auto=format&fit=crop&w=1200&q=90',
      location: 'Mehsana',
      categoryId: otherCat.id,
      authorId: author.id,
      status: 'PUBLISHED',
      isFeatured: false,
      isTrending: false,
    },
    {
      title: 'Amreli Gir Forest Sanctuary reports healthy surge in Lion population',
      titleGu: 'અમરેલી ગીર પૂર્વ અને ધારી વિસ્તારમાં એશિયાટિક સિંહોની સંખ્યામાં નોંધપાત્ર વધારો',
      titleHi: 'अमरेली गिर वन क्षेत्र में एशियाई शेरों की आबादी में महत्वपूर्ण वृद्धि',
      slug: 'amreli-gir-forest-sanctuary-asiatic-lion-population-surge',
      excerpt: 'Forest department confirms safe wildlife corridors and successful conservation in Amreli Gir region.',
      excerptGu: 'અમરેલી અને ધારી રેન્જમાં એશિયાટિક બબ્બર શેર અને બાળ સિંહોની સુરક્ષિત અવરજવર વધી.',
      excerptHi: 'अमरेली और धारी रेंज में एशियाई शेरों और शावकों की सुरक्षित आवाजाही बढ़ी।',
      content: `અમરેલી જિલ્લામાં ગીર પૂર્વ વિસ્તાર અને ધારી રેન્જમાં એશિયાટિક સિંહોના પરિવારો ખુશહાલ વાતાવરણમાં વિચરતા જોવા મળ્યા છે. વન વિભાગના અસરકારક સંરક્ષણ અને સ્થાનિક ગ્રામજનોના સહયોગથી સિંહોની વસ્તીમાં સરાહનીય વધારો થયો છે.`,
      contentGu: `અમરેલી જિલ્લામાં ગીર પૂર્વ વિસ્તાર અને ધારી રેન્જમાં એશિયાટિક સિંહોના પરિવારો ખુશહાલ વાતાવરણમાં વિચરતા જોવા મળ્યા છે.`,
      contentHi: `अमरेली जिले के गिर पूर्व क्षेत्र और धारी रेंज में एशियाई शेरों के परिवार स्वच्छंद रूप से घूमते देखे गए हैं।`,
      featuredImage: 'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?auto=format&fit=crop&w=1200&q=90',
      location: 'Amreli',
      categoryId: otherCat.id,
      authorId: author.id,
      status: 'PUBLISHED',
      isFeatured: true,
      isTrending: true,
    },
    {
      title: 'Anand Milk Capital Farmers Convention: White Revolution digital initiatives',
      titleGu: 'આણંદ શ્વેત ક્રાંતિ ભૂમિ ખાતે રાજ્યકક્ષાનું પશુપાલક સંમેલન યોજાયું',
      titleHi: 'आणंद श्वेत क्रांति भूमि पर राज्य स्तरीय पशुपालक सम्मेलन आयोजित',
      slug: 'anand-milk-capital-farmers-convention-white-revolution',
      excerpt: 'Anand hosts mega dairy tech convention empowering milk producers with smart IoT tools.',
      excerptGu: 'આણંદ ખાતે આયોજિત મહા સંમેલનમાં પશુપાલકોને સ્માર્ટ ડિજિટલ મિલ્ક ટેસ્ટિંગ કિટ્સ એનાયત કરાઈ.',
      excerptHi: 'आणंद में आयोजित महा सम्मेलन में पशुपालकों को स्मार्ट डिजिटल मिल्क टेस्टिंग किट वितरित की गईं।',
      content: `શ્વેત ક્રાંતિના મથક આણંદ ખાતે દૂધ ઉત્પાદકો અને ખેડૂતોનું વિરાટ સંમેલન યોજાયું હતું. સંમેલનમાં નવીનતમ પશુપાલન ટેક્નોલોજી, ગુણવત્તા ચકાસણી સાધનો અને ડેરી ક્ષેત્રે સહકારી મોડેલને વધુ મજબૂત કરવાના પગલાં અંગે વિસ્તૃત ચર્ચા થઈ હતી.`,
      contentGu: `શ્વેત ક્રાંતિના મથક આણંદ ખાતે દૂધ ઉત્પાદકો અને ખેડૂતોનું વિરાટ સંમેલન યોજાયું હતું.`,
      contentHi: `श्वेत क्रांति के केंद्र आणंद में दूध उत्पादकों और किसानों का विशाल सम्मेलन आयोजित किया गया।`,
      featuredImage: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1200&q=90',
      location: 'Anand',
      categoryId: otherCat.id,
      authorId: author.id,
      status: 'PUBLISHED',
      isFeatured: false,
      isTrending: true,
    },
  ];

  for (const artData of OTHER_CITIES_ARTICLES) {
    const post = await prisma.post.upsert({
      where: { slug: artData.slug },
      update: {
        ...(artData as any),
        status: PostStatus.PUBLISHED,
        featuredImage: (artData as any).featuredImage || (artData as any).image,
      },
      create: {
        ...(artData as any),
        status: PostStatus.PUBLISHED,
        featuredImage: (artData as any).featuredImage || (artData as any).image,
        articleNumber: nextArticleNum++,
      },
    });
    console.log(`Seeded Other Cities article [${post.articleNumber}]:`, post.titleGu);
  }

  console.log('Finished seeding Other Cities category and 7 detailed articles successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding Other Cities:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

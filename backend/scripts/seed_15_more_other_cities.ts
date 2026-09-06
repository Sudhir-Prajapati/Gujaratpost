import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  let otherCat = await prisma.category.findFirst({
    where: { OR: [{ slug: 'other-cities' }, { slug: 'othercities' }] }
  });

  if (!otherCat) {
    otherCat = await prisma.category.create({
      data: {
        slug: 'other-cities',
        name: 'Other Cities',
        nameGu: 'અન્ય શહેરો',
        nameHi: 'अन्य शहर',
        showInHeader: true,
        showInHome: true,
        displayOrder: 25,
      }
    });
  }

  const author = await prisma.author.findFirst() || await prisma.author.create({
    data: {
      name: 'Gujarat Post Desk',
      nameGu: 'ગુજરાત પોસ્ટ ડેસ્ક',
      nameHi: 'ગુજરાત પોસ્ટ ડેસ્ક',
    } as any
  });

  const maxArt = await prisma.post.findFirst({ orderBy: { articleNumber: 'desc' } });
  let nextNum = (maxArt?.articleNumber || 250) + 1;

  const MORE_ARTICLES = [
    {
      title: 'Morbi Ceramic Industry exports touch record 15000 crore mark globally',
      titleGu: 'મોરબી સિરામિક ઉદ્યોગ: ગ્લોબલ માર્કેટમાં ૧૫,૦૦૦ કરોડની નિકાસ સાથે નવો વિક્રમ',
      titleHi: 'मोरबी सिरामिक उद्योग: वैश्विक बाजार में 15,000 करोड़ का रिकॉर्ड निर्यात',
      slug: 'morbi-ceramic-industry-exports-record-15000-crore',
      excerpt: 'Morbi Ceramic City exports porcelain and vitrified tiles to over 80 countries with green energy initiatives.',
      excerptGu: 'વિશ્વના બીજા ક્રમના સૌથી મોટા સિરામિક ક્લસ્ટર મોરબીએ વિશ્વના ૮૦થી વધુ દેશોમાં ગુણવત્તાસભર ટાઇલ્સની નિકાસ કરી.',
      excerptHi: 'विश्व के दूसरे सबसे बड़े सिरामिक क्लस्टर मोरबी ने 80 से अधिक देशों में टाइल्स का निर्यात किया।',
      content: `<p>મોરબી સિરામિક સિટીએ વૈશ્વિક ઔદ્યોગિક નકશા પર ભારતની સાખ વધુ મજબૂત કરી છે. ગ્રીન ફ્યુઅલ નેચરલ ગેસ અને સુધારેલી મેન્યુફેક્ચરિંગ ટેકનોલોજીના બળે મોરબીના ટાઇલ્સ અને સેનિટરી વેર ઉત્પાદકોએ 15,000 કરોડ રૂપિયાથી વધુની વાર્ષિક નિકાસ નોંધાવી છે.</p>
<h2>યુરોપ અને અમેરિકન માર્કેટમાં મોરબીની બોલબાલા</h2>
<p>મોરબીમાં બનેલી લાર્જ સ્લેબ વિટ્રિફાઇડ ટાઇલ્સ અને ઈકો-ફ્રેન્ડલી સિરામિક પેનલ્સની યુરોપ, મિડલ ઈસ્ટ અને ઉત્તર અમેરિકામાં ભારે માંગ રહી છે.</p>`,
      contentGu: `<p>મોરબી સિરામિક સિટીએ વૈશ્વિક ઔદ્યોગિક નકશા પર ભારતની સાખ વધુ મજબૂત કરી છે. ગ્રીન ફ્યુઅલ નેચરલ ગેસ અને સુધારેલી મેન્યુફેક્ચરિંગ ટેકનોલોજીના બળે મોરબીના ટાઇલ્સ અને સેનિટરી વેર ઉત્પાદકોએ 15,000 કરોડ રૂપિયાથી વધુની વાર્ષિક નિકાસ નોંધાવી છે.</p>`,
      contentHi: `<p>मोरबी सिरामिक सिटी ने वैश्विक औद्योगिक मानचित्र पर भारत की साख को और मजबूत किया है।</p>`,
      featuredImage: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&q=90',
      location: 'Morbi',
    },
    {
      title: 'Bharuch Narmada Ekta Setu Corridor and Petroleum Hub expansion',
      titleGu: 'ભરૂચ નર્મદા કિનારે પેટ્રોકેમિકલ્સ હબ અને નવો ઔદ્યોગિક કોરિડોર આકાર પામ્યો',
      titleHi: 'भरूच नर्मदा तट पर पेट्रोकेमिकल्स हब और नया औद्योगिक कॉरिडोर शुरू',
      slug: 'bharuch-narmada-petrochemicals-hub-industrial-corridor',
      excerpt: 'Bharuch PCPIR industrial belt attracts massive global investment in green chemicals and logistics.',
      excerptGu: 'ભરૂચ દહેજ PCPIR રીજનમાં ગ્રીન કેમિકલ્સ અને ક્લીન એનર્જી પ્રોજેક્ટ્સમાં કરોડોનું નવું રોકાણ.',
      excerptHi: 'भरूच दहेज पीसीपीआईआर क्षेत्र में ग्रीन केमिकल्स और क्लीन एनर्जी में नया निवेश।',
      content: `<p>ભરૂચ જિલ્લાના દહેજ અને અંકલેશ્વર ઔદ્યોગિક પટ્ટામાં કેમિકલ અને ફાર્માસ્યુટિકલ ક્ષેત્રે નવો અધ્યાય શરૂ થયો છે. નર્મદા નદી પરના નવા ફોરલેન કેબલ બ્રિજ અને લોજિસ્ટિક્સ પાર્કના ઉદ્ઘાટનથી માલસામાનની અવરજવર અત્યંત ઝડપી બની છે.</p>`,
      contentGu: `<p>ભરૂચ જિલ્લાના દહેજ અને અંકલેશ્વર ઔદ્યોગિક પટ્ટામાં કેમિકલ અને ફાર્માસ્યુટિકલ ક્ષેત્રે નવો અધ્યાય શરૂ થયો છે.</p>`,
      contentHi: `<p>भरूच जिले के दहेज और अंकलेश्वर औद्योगिक क्षेत्र में रसायन और फार्मास्यूटिकल क्षेत्र में नया अध्याय शुरू हुआ है।</p>`,
      featuredImage: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=1200&q=90',
      location: 'Bharuch',
    },
    {
      title: 'Patan UNESCO Heritage Rani Ki Vav and Silk Patola Museum renovation',
      titleGu: 'પાટણ યુનેસ્કો વર્લ્ડ હેરિટેજ રાણી કી વાવ અને પવિત્ર પટોળા કળા કેન્દ્રનો ગ્લોબલ કાયાકલ્પ',
      titleHi: 'पाटन यूनेस्को वर्ल्ड हेरिटेज रानी की वाव और पटोला कला केंद्र का कायाकल्प',
      slug: 'patan-unesco-rani-ki-vav-patola-museum-renovation',
      excerpt: 'Patan heritage city welcomes record tourists showcasing double ikkat Patola weaving mastery.',
      excerptGu: 'પાટણની ઐતિહાસિક રાણી કી વાવ અને હસ્તકલા પટોળા વણાટકેન્દ્ર ખાતે વિશ્વભરમાંથી પ્રવાસીઓનો ધસારો.',
      excerptHi: 'पाटन की ऐतिहासिक रानी की वाव और पटोला बुनाई केंद्र में विश्व भर से पर्यटकों का तांता।',
      content: `<p>ઉત્તર ગુજરાતના ઐતિહાસિક નગર પાટણની યુનેસ્કો વર્લ્ડ હેરિટેજ સાઇટ 'રાણી કી વાવ' અને જગપ્રસિદ્ધ 'પાટણના પટોળા' વણાટ કળા પ્રવાસીઓ માટે મુખ્ય આકર્ષણનું કેન્દ્ર બની છે. પ્રવાસન વિભાગ દ્વારા આધુનિક હેરિટેજ લાઈટિંગ અને ઓડિયો ગાઈડ સુવિધા શરૂ કરવામાં આવી છે.</p>`,
      contentGu: `<p>ઉત્તર ગુજરાતના ઐતિહાસિક નગર પાટણની યુનેસ્કો વર્લ્ડ હેરિટેજ સાઇટ 'રાણી કી વાવ' અને જગપ્રસિદ્ધ 'પાટણના પટોળા' વણાટ કળા આકર્ષણ બન્યા છે.</p>`,
      contentHi: `<p>उत्तरी गुजरात के ऐतिहासिक शहर पाटन की यूनेस्को विश्व धरोहर रानी की वाव पर्यटकों के लिए मुख्य आकर्षण बनी हुई है।</p>`,
      featuredImage: 'https://images.unsplash.com/photo-1609946782779-8b4e8e1465d4?w=1200&q=90',
      location: 'Patan',
    },
    {
      title: 'Navsari Floriculture and Exotic Fruit Plantation revolutionizes farming',
      titleGu: 'નવસારીના બાગાયતી ખેડૂતોનો કમાલ: ડ્રેગન ફ્રૂટ અને ઓર્ગેનિક ખેતીથી કરોડોની કમાણી',
      titleHi: 'नवसारी के बागवानी किसानों का कमाल: ड्रैगन फ्रूट और जैविक खेती से बड़ी कमाई',
      slug: 'navsari-floriculture-exotic-fruit-plantation-farming-revolution',
      excerpt: 'Navsari South Gujarat farmers adopt high-density drip irrigation for dragon fruit and avocados.',
      excerptGu: 'નવસારી કૃષિ યુનિવર્સિટીના માર્ગદર્શન હેઠળ દક્ષિણ ગુજરાતના ખેડૂતોએ વિદેશી ફળોનું સફળ ઉત્પાદન કર્યું.',
      excerptHi: 'नवसारी कृषि विश्वविद्यालय के मार्गदर्शन में दक्षिण गुजरात के किसानों ने विदेशी फलों का सफल उत्पादन किया।',
      content: `<p>દક્ષિણ ગુજરાતના નવસારી જિલ્લામાં હાઇ-ટેક બાગાયતી ખેતીએ નવો ચીલો ચાતર્યો છે. ઇઝરાયેલી ટપક સિંચાઈ પદ્ધતિ અને શેડનેટ ટેકનોલોજીનો ઉપયોગ કરીને નવસારીના ખેડૂતો ઓર્ગેનિક ડ્રેગન ફ્રૂટ, એવોકાડો અને ગુલાબની ખેતીથી લાખો રૂપિયાની કમાણી કરી રહ્યા છે.</p>`,
      contentGu: `<p>દક્ષિણ ગુજરાતના નવસારી જિલ્લામાં હાઇ-ટેક બાગાયતી ખેતીએ નવો ચીલો ચાતર્યો છે.</p>`,
      contentHi: `<p>दक्षिण गुजरात के नवसारी जिले में हाई-टेक बागवानी खेती ने एक नया इतिहास रचा है।</p>`,
      featuredImage: 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=1200&q=90',
      location: 'Navsari',
    },
    {
      title: 'Valsad Coastal Tourism and Hapus Mango Harvest festival',
      titleGu: 'વલસાડ તિથલ બીચ પર કોસ્ટલ ટુરિઝમ ફેસ્ટિવલ અને કેસર-હાપુસ કેરી મહોત્સવ',
      titleHi: 'वलसाड तीथल बीच पर तटीय पर्यटन उत्सव और हापुस आम महोत्सव',
      slug: 'valsad-coastal-tourism-tithal-beach-hapus-mango-festival',
      excerpt: 'Valsad Tithal Beach promenade attracts thousands with water sports and Alphonso mango exports.',
      excerptGu: 'વલસાડના પ્રખ્યાત તિથલ દરિયાકિનારે સાહસિક વોટર સ્પોર્ટ્સ અને વિશ્વપ્રસિદ્ધ હાપુસ કેરી પ્રદર્શન યોજાયું.',
      excerptHi: 'वलसाड के प्रसिद्ध तीथल समुद्र तट पर साहसिक वाटर स्पोर्ट्स और हापुस आम प्रदर्शनी का आयोजन।',
      content: `<p>વલસાડ જિલ્લાના રમણીય તિથલ બીચ ખાતે ભવ્ય બીચ ફેસ્ટિવલનું આયોજન કરવામાં આવ્યું છે. દરિયાઈ સુરક્ષા સાથે વોટર સ્કૂટર, પેરાસેલિંગ અને સાંસ્કૃતિક સાંજના કાર્યક્રમોમાં હજારો સહેલાણીઓ ઉમટી પડ્યા છે.</p>`,
      contentGu: `<p>વલસાડ જિલ્લાના રમણીય તિથલ બીચ ખાતે ભવ્ય બીચ ફેસ્ટિવલનું આયોજન કરવામાં આવ્યું છે.</p>`,
      contentHi: `<p>वलसाड जिले के सुरम्य तीथल बीच पर भव्य बीच फेस्टिवल का आयोजन किया गया।</p>`,
      featuredImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=90',
      location: 'Valsad',
    },
    {
      title: 'Porbandar Marine Fisheries Modern Harbor and Kirti Mandir tourist surge',
      titleGu: 'પોરબંદર મહાત્મા ગાંધી જન્મભૂમિ કીર્તિ મંદિર અને મરીન ફીશરીઝ બંદરનો વિકાસ',
      titleHi: 'पोरबंदर महात्मा गांधी जन्मभूमि कीर्ति मंदिर और समुद्री मत्स्य बंदरगाह विकास',
      slug: 'porbandar-marine-fisheries-harbor-kirti-mandir-tourism',
      excerpt: 'Porbandar Coast upgrades deep-sea fishing trawlers and fish processing plants.',
      excerptGu: 'પોરબંદર કીર્તિ મંદિર ખાતે શ્રદ્ધાળુઓની ભીડ અને મરીન ફિશરીઝ હબથી સ્થાનિક માછીમારોને મોટો આર્થિક લાભ.',
      excerptHi: 'पोरबंदर कीर्ति मंदिर में श्रद्धालुओं की भीड़ और समुद्री मत्स्य पालन हब से बड़ा लाभ।',
      content: `<p>ગાંધીજીના જન્મસ્થાન પોરબંદરમાં કીર્તિ મંદિર સ્મારક અને દરિયાઈ મત્સ્યોદ્યોગ બંદરનો અભૂતપૂર્વ વિકાસ થયો છે. આધુનિક કોલ્ડ સ્ટોરેજ અને પ્રોસેસિંગ પ્લાન્ટ્સ શરૂ થવાથી પોરબંદરથી ઝીંગા અને સી-ફૂડની સીધી નિકાસ વધી છે.</p>`,
      contentGu: `<p>ગાંધીજીના જન્મસ્થાન પોરબંદરમાં કીર્તિ મંદિર સ્મારક અને દરિયાઈ મત્સ્યોદ્યોગ બંદરનો વિકાસ થયો છે.</p>`,
      contentHi: `<p>गांधीजी की जन्मस्थली पोरबंदर में कीर्ति मंदिर स्मारक और समुद्री मत्स्य बंदरगाह का विकास हुआ।</p>`,
      featuredImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=90',
      location: 'Porbandar',
    },
    {
      title: 'Surendranagar Cotton Ginning and Solar Park Greenfield Power Project',
      titleGu: 'સુરેન્દ્રનગર ઝાલાવાડ કાપડ જીનિંગ હબ અને ગ્રીન સોલાર પાર્ક પ્રોજેક્ટ શરૂ',
      titleHi: 'सुरेंद्रनगर जालावाड़ कपड़ा जीनिंग हब और ग्रीन सोलर पार्क परियोजना शुरू',
      slug: 'surendranagar-cotton-ginning-solar-park-greenfield-project',
      excerpt: 'Surendranagar Jhalawad installs 500 MW solar plant powering Asia largest cotton processing units.',
      excerptGu: 'સુરેન્દ્રનગરમાં ૫૦૦ મેગાવોટનો નવો સોલાર એનર્જી પાર્ક કાર્યરત, કોટન જીનિંગ મિલને સસ્તી વીજળી મળશે.',
      excerptHi: 'सुरेंद्रनगर में 500 मेगावाट का नया सौर ऊर्जा पार्क चालू, कॉटन जीनिंग मिलों को सस्ती बिजली मिलेगी।',
      content: `<p>ઝાલાવાડની ભૂમિ સુરેન્દ્રનગર જિલ્લામાં કોટન પ્રોસેસિંગ અને પુનઃપ્રાપ્ય ઉર્જા ક્ષેત્રે ક્રાંતિકારી ફેરફારો આવ્યા છે. 500 મેગાવોટ ક્ષમતાના સોલાર પાર્કથી વિસ્તારના કપાસ ઉત્પાદકો અને જીનિંગ મિલ માલિકોને પાવર ખર્ચમાં મોટો રાહત મળશે.</p>`,
      contentGu: `<p>ઝાલાવાડની ભૂમિ સુરેન્દ્રનગર જિલ્લામાં કોટન પ્રોસેસિંગ અને સોલાર ક્ષેત્રે ક્રાંતિ આવી છે.</p>`,
      contentHi: `<p>झालावाड़ की भूमि सुरेंद्रनगर जिले में कपास प्रसंस्करण और सौर ऊर्जा क्षेत्र में क्रांति आई है।</p>`,
      featuredImage: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=1200&q=90',
      location: 'Surendranagar',
    },
    {
      title: 'Dahod Railway Electric Locomotive Factory and Tribal Skill Academy',
      titleGu: 'દાહોદ રેલવે ઇલેક્ટ્રિક લોકોમોટિવ મેન્યુફેક્ચરિંગ કારખાનું અને કૌશલ્ય વિકાસ કેન્દ્ર',
      titleHi: 'दाहोद रेलवे इलेक्ट्रिक लोकोमोटिव कारखाना और कौशल विकास केंद्र',
      slug: 'dahod-railway-electric-locomotive-factory-tribal-skill-academy',
      excerpt: 'Dahod Locomotive Plant produces high-horsepower freight engines generating 10000 tribal jobs.',
      excerptGu: 'દાહોદ ખાતે રૂ. ૨૦,૦૦૦ કરોડના ખર્ચે બનેલા રેલવે લોકોમોટિવ પ્લાન્ટમાંથી પ્રથમ હાઇ-સ્પીડ એન્જિન તૈયાર થયું.',
      excerptHi: 'दाहोद में 20,000 करोड़ रुपये के रेलवे लोकोमोटिव संयंत्र से पहला हाई-स्पीड इंजन तैयार हुआ।',
      content: `<p>આદિવાસી બહુલ દાહોદ જિલ્લામાં ભારતીય રેલવેનો અત્યાધુનિક 9000 હોર્સપાવર ઇલેક્ટ્રિક લોકોમોટિવ પ્લાન્ટ કાર્યરત થયો છે. સ્થાનિક યુવાનોને વર્લ્ડ ક્લાસ ઓટોમેશન તાલીમ આપીને રેલ એન્જિનિયરિંગ ક્ષેત્રે જોડવામાં આવી રહ્યા છે.</p>`,
      contentGu: `<p>આદિવાસી બહુલ દાહોદ જિલ્લામાં ભારતીય રેલવેનો અત્યાધુનિક ઇલેક્ટ્રિક લોકોમોટિવ પ્લાન્ટ કાર્યરત થયો છે.</p>`,
      contentHi: `<p>आदिवासी बहुल दाहोद जिले में भारतीय रेलवे का अत्याधुनिक इलेक्ट्रिक लोकोमोटिव प्लांट शुरू हुआ।</p>`,
      featuredImage: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=1200&q=90',
      location: 'Dahod',
    },
    {
      title: 'Narmada Ekta Nagar Statue of Unity records 1.5 crore tourist footfall',
      titleGu: 'નર્મદા એકતા નગર સ્ટેચ્યુ ઓફ યુનિટી: ૧.૫ કરોડથી વધુ સહેલાણીઓએ મુલાકાત લીધી',
      titleHi: 'नर्मदा एकता नगर स्टैच्यू ऑफ यूनिटी: 1.5 करोड़ से अधिक पर्यटकों ने किया दौरा',
      slug: 'narmada-ekta-nagar-statue-of-unity-record-tourist-footfall',
      excerpt: 'Statue of Unity Ekta Nagar Narmada emerges as Indias top eco-tourism destination.',
      excerptGu: 'કેવડિયા એકતા નગર ખાતે જંગલ સફારી, ગ્લો ગાર્ડન અને નર્મદા મહાઆરતી પ્રવાસીઓમાં ભારે આકર્ષણનું કેન્દ્ર બની.',
      excerptHi: 'केवडिया एकता नगर में जंगल सफारी, ग्लो गार्डन और नर्मदा महाआरती मुख्य आकर्षण बने।',
      content: `<p>નર્મદા જિલ્લાના એકતા નગર કેવડિયા સ્થિત સરદાર વલ્લભભાઈ પટેલની ૧૮૨ મીટર ઊંચી વિશ્વની સૌથી ઊંચી પ્રતિમા 'સ્ટેચ્યુ ઓફ યુનિટી' ખાતે દેશ-વિદેશથી કરોડો સહેલાણીઓ આવી રહ્યા છે. સ્થાનિક આદિવાસી મહિલાઓ અને યુવાનોને પ્રવાસન દ્વારા રોજગારી મળી છે.</p>`,
      contentGu: `<p>નર્મદા જિલ્લાના એકતા નગર સ્થિત 'સ્ટેચ્યુ ઓફ યુનિટી' ખાતે દેશ-વિદેશથી કરોડો સહેલાણીઓ આવી રહ્યા છે.</p>`,
      contentHi: `<p>नर्मदा जिले के एकता नगर स्थित 'स्टैच्यू ऑफ यूनिटी' में देश-विदेश से करोड़ों पर्यटक आ रहे हैं।</p>`,
      featuredImage: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1200&q=90',
      location: 'Narmada',
    },
    {
      title: 'Sabarkantha Himatnagar Sabar Dairy Solar Energy and Milk Powder Unit',
      titleGu: 'સાબરકાંઠા હિંમતનગર સાબર ડેરી: નવો સોલાર અને મિલ્ક પાવડર પ્લાન્ટ લોન્ચ',
      titleHi: 'साबरकांठा हिम्मतनगर साबर डेयरी: नया सौर और मिल्क पाउडर प्लांट लॉन्च',
      slug: 'sabarkantha-himatnagar-sabar-dairy-solar-milk-powder-unit',
      excerpt: 'Sabar Dairy Himatnagar increases daily milk processing capacity to 35 lakh liters.',
      excerptGu: 'સાબરકાંઠા અને અરવલ્લી જિલ્લાના સાડા ત્રણ લાખ પશુપાલકોને સાબર ડેરીનો મોટો આર્થિક ટેકો.',
      excerptHi: 'साबरकांठा और अरावली जिलों के 3.5 लाख पशुपालकों को साबर डेयरी का बड़ा वित्तीय समर्थन।',
      content: `<p>ઉત્તર ગુજરાતની પ્રતિષ્ઠિત સાબર ડેરી હિંમતનગર ખાતે અત્યાધુનિક સોલાર એનર્જી સંચાલિત દૂધ પાવડર પ્લાન્ટનું લોકાર્પણ કરાયું છે. આ ટેકનોલોજીથી ડેરીની કામગીરી વધુ પર્યાવરણ અનુકૂળ અને કાર્યક્ષમ બની છે.</p>`,
      contentGu: `<p>ઉત્તર ગુજરાતની પ્રતિષ્ઠિત સાબર ડેરી હિંમતનગર ખાતે સોલાર સંચાલિત પ્લાન્ટનું લોકાર્પણ કરાયું છે.</p>`,
      contentHi: `<p>उत्तरी गुजरात की प्रतिष्ठित साबर डेयरी हिम्मतनगर में सौर संचालित प्लांट का उद्घाटन किया गया।</p>`,
      featuredImage: 'https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?w=1200&q=90',
      location: 'Sabarkantha',
    },
    {
      title: 'Banaskantha Palanpur Banas Dairy Solar Plant and Potato Processing Hub',
      titleGu: 'બનાસકાંઠા પાલનપુર બનાસ ડેરી: બટાકા પ્રોસેસિંગ અને સોલાર ગોબર ગેસ પ્લાન્ટ',
      titleHi: 'बनासकांठा पालनपुर बनास डेयरी: आलू प्रसंस्करण और गोबर गैस प्लांट',
      slug: 'banaskantha-palanpur-banas-dairy-potato-processing-gobar-gas-plant',
      excerpt: 'Banas Dairy Palanpur exports frozen French fries and organic bio-CNG to national markets.',
      excerptGu: 'બનાસકાંઠાના ખેડૂતો દ્વારા ઉત્પાદિત બટાકામાંથી ફ્રોઝન ફ્રેન્ચ ફ્રાઈસ બનાવી વૈશ્વિક બજારમાં નિકાસ કરાઈ.',
      excerptHi: 'बनासकांठा के किसानों के आलू से फ्रोजन फ्रेंच फ्राइज़ बनाकर वैश्विक बाजार में निर्यात किया गया।',
      content: `<p>એશિયાની સૌથી મોટી સહકારી ડેરી બનાસ ડેરી પાલનપુર ખાતે બટાકા પ્રોસેસિંગ અને બાયો-CNG પ્લાન્ટે સીમાચિહ્ન રૂપ સફળતા મેળવી છે. પશુપાલકો અને ખેડૂતોને દૂધની સાથે બટાકાના પણ પોષણક્ષમ ભાવ મળી રહ્યા છે.</p>`,
      contentGu: `<p>એશિયાની સૌથી મોટી બનાસ ડેરી પાલનપુર ખાતે બટાકા પ્રોસેસિંગ પ્લાન્ટે સફળતા મેળવી છે.</p>`,
      contentHi: `<p>एशिया की सबसे बड़ी बनास डेयरी पालनपुर में आलू प्रसंस्करण संयंत्र ने बड़ी सफलता हासिल की।</p>`,
      featuredImage: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1200&q=90',
      location: 'Banaskantha',
    },
    {
      title: 'Panchmahal Champaner World Heritage Site Tourism Corridor',
      titleGu: 'પંચમહાલ પાવાગઢ મહાકાળી ધામ અને ચાંપાનેર યુનેસ્ક સાઇટનો ભવ્ય વિકાસ',
      titleHi: 'पंचमहाल पावागढ़ महाकाली धाम और चांपानेर यूनेस्को साइट का भव्य विकास',
      slug: 'panchmahal-champaner-pavagadh-mahakali-heritage-corridor',
      excerpt: 'Pavagadh Hill Ropeway and Champaner Archaeological Park see unprecedented pilgrim density.',
      excerptGu: 'પાવાગઢ ઉપર માં મહાકાળી મંદિર સુવર્ણ શિખર અને ચાંપાનેર હેરિટેજ કોરિડોરમાં લાખો ભક્તોએ દર્શન કર્યા.',
      excerptHi: 'पावागढ़ मंदिर स्वर्ण शिखर और चांपानेर हेरिटेज कॉरिडोर में लाखों भक्तों ने दर्शन किए।',
      content: `<p>પંચમહાલ જિલ્લાના પ્રસિદ્ધ શક્તિપીઠ પાવાગઢ અને યુનેસ્કો હેરિટેજ ચાંપાનેર ખાતે સુવિધાઓનો વિસ્તાર કરાયો છે. નવો રોપવે અને પદયાત્રીઓ માટેના પહોળા માર્ગોથી શ્રદ્ધાળુઓની યાત્રા અત્યંત સરળ બની છે.</p>`,
      contentGu: `<p>પંચમહાલ જિલ્લાના શક્તિપીઠ પાવાગઢ અને ચાંપાનેર ખાતે સુવિધાઓનો વિસ્તાર કરાયો છે.</p>`,
      contentHi: `<p>पंचमहाल जिले के शक्तिपीठ पावागढ़ और चांपानेर में सुविधाओं का विस्तार किया गया है।</p>`,
      featuredImage: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=1200&q=90',
      location: 'Panchmahal',
    },
    {
      title: 'Botad Salangpur Hanuman Dham Tourist Facility Expansion',
      titleGu: 'બોટાદ સાળંગપુર શ્રી કષ્ટભંજનદેવ હનુમાનજી મંદિર નવો ભોજનાલય અને યાત્રી ભવન',
      titleHi: 'बोटाद सारंगपुर श्री कष्टभंजनदेव हनुमानजी मंदिर नया भोजनालय और यात्री भवन',
      slug: 'botad-salangpur-hanuman-dham-bhojanalaya-expansion',
      excerpt: 'Salangpur Dham Botad inaugurates mega automated kitchen serving 50000 devotees daily.',
      excerptGu: 'સાળંગપુરમાં કષ્ટભંજન દેવ મંદિર ખાતે વિશ્વકક્ષાના ઓટોમેટેડ રસોડા અને યાત્રિક નિવાસનું લોકાર્પણ.',
      excerptHi: 'सारंगपुर में कष्टभंजन देव मंदिर में विश्व स्तरीय स्वचालित रसोई और यात्री निवास का उद्घाटन।',
      content: `<p>બોટાદ જિલ્લાના સાળંગપુર ધામ ખાતે શ્રી કષ્ટભંજનદેવ હનુમાનજી મંદિરે દરરોજ ૫૦,૦૦૦થી વધુ ભક્તો માટે હાઇટેક મહાપ્રસાદ ભોજનાલય આશીર્વાદરૂપ બન્યું છે. સોલાર ગ્રીડ અને હાઇજીનિક કૂકિંગ ટેકનોલોજીથી સેવાકાર્ય ચાલી રહ્યું છે.</p>`,
      contentGu: `<p>બોટાદ જિલ્લાના સાળંગપુર ધામ ખાતે શ્રી કષ્ટભંજનદેવ મંદિરે હાઇટેક મહાપ્રસાદ ભોજનાલય શરૂ થયું.</p>`,
      contentHi: `<p>बोटाद जिले के सारंगपुर धाम में श्री कष्टभंजनदेव मंदिर में हाई-टेक महाप्रसाद भोजनालय शुरू हुआ।</p>`,
      featuredImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=90',
      location: 'Botad',
    },
    {
      title: 'Gir Somnath Temple Promenade and Veraval Fisheries Modernization',
      titleGu: 'ગીર સોમનાથ પ્રથમ જ્યોતિર્લિંગ સમુદ્ર દર્શન પથ અને વેરાવળ ફિશરીઝ હબ',
      titleHi: 'गिर सोमनाथ प्रथम ज्योतिर्लिंग समुद्र दर्शन पथ और वेरावल मत्स्य हब',
      slug: 'gir-somnath-temple-promenade-veraval-fisheries-modernization',
      excerpt: 'Somnath Jyotirlinga Promenade and Veraval Fish Harbor boost spiritual tourism and exports.',
      excerptGu: 'સોમનાથ મહાદેવ મંદિરના રમણીય વારાણસી તર્જ પર બનેલા સમુદ્ર દર્શન પથ પર ભક્તોનો આનંદ.',
      excerptHi: 'सोमनाथ महादेव मंदिर के सुरम्य समुद्र दर्शन पथ पर श्रद्धालुओं का उत्साह।',
      content: `<p>પ્રથમ જ્યોતિર્લિંગ ગીર સોમનાથ મંદિર પરિસરમાં દરિયાકિનારે ૧.૫ કિલોમીટર લાંબો વોકવે 'સમુદ્ર દર્શન પથ' પ્રવાસીઓ માટે આકર્ષણ બન્યો છે. નજીકમાં આવેલા વેરાવળ ફિશિંગ પોર્ટના આધુનિકીકરણથી સાગર ખેડૂતોને પ્રોત્સાહન મળ્યું છે.</p>`,
      contentGu: `<p>પ્રથમ જ્યોતિર્લિંગ ગીર સોમનાથ મંદિર પરિસરમાં દરિયાકિનારે 'સમુદ્ર દર્શન પથ' આકર્ષણ બન્યો છે.</p>`,
      contentHi: `<p>प्रथम ज्योतिर्लिंग गिर सोमनाथ मंदिर परिसर में समुद्र दर्शन पथ आकर्षण बना हुआ है।</p>`,
      featuredImage: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&q=90',
      location: 'Gir Somnath',
    },
    {
      title: 'Devbhumi Dwarka Beyt Dwarka Signature Bridge Sudarshan Setu Launch',
      titleGu: 'દેવભૂમિ દ્વારકા ઓખા-બેટ દ્વારકા સુદર્શન સેતુ સિગ્નેચર બ્રિજ પર સહેલાણીઓની ભીડ',
      titleHi: 'देवभूमि द्वारका ओखा-बेट द्वारका सुदर्शन सेतु सिग्नेचर ब्रिज पर पर्यटकों की भीड़',
      slug: 'devbhumi-dwarka-beyt-dwarka-sudarshan-setu-signature-bridge',
      excerpt: 'Sudarshan Setu connecting Okha and Beyt Dwarka becomes India longest cable-stayed bridge.',
      excerptGu: 'ભારતના સૌથી લાંબા ૪-લેન કેબલ સ્ટેડ સેતુ સુદર્શન બ્રિજ પરથી બેટ દ્વારકાધીશ દર્શન સરળ બન્યા.',
      excerptHi: 'भारत के सबसे लंबे 4-लेन केबल स्टे सुदर्शन ब्रिज से बेट द्वारकाधीश दर्शन सुलभ हुए।',
      content: `<p>પવિત્ર યાત્રાધામ દેવભૂમિ દ્વારકામાં ઓખા અને બેટ દ્વારકાને જોડતા ૨.૩૨ કિલોમીટર લાંબા 'સુદર્શન સેતુ' (સિગ્નેચર બ્રિજ) પર દેશભરમાંથી પ્રવાસીઓ ઉમટી રહ્યા છે. સોલાર પેનલ્સ અને ભગવદ્ ગીતા શ્લોકોવાળી મનોરમ ડિઝાઇન વિહંગમ દ્રશ્ય પૂરું પાડે છે.</p>`,
      contentGu: `<p>દેવભૂમિ દ્વારકામાં ઓખા અને બેટ દ્વારકાને જોડતા 'સુદર્શન સેતુ' બ્રિજ પર સહેલાણીઓ ઉમટી રહ્યા છે.</p>`,
      contentHi: `<p>देवभूमि द्वारका में ओखा और बेट द्वारકા को जोड़ने वाले 'સુદર્શન સેતુ' पर पर्यटक उमड़ रहे हैं।</p>`,
      featuredImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=90',
      location: 'Dwarka',
    },
  ];

  for (const artData of MORE_ARTICLES) {
    const post = await prisma.post.upsert({
      where: { slug: artData.slug },
      update: {
        ...artData,
        categoryId: otherCat.id,
        authorId: author.id,
        status: 'PUBLISHED',
        isFeatured: true,
        isTrending: true,
      },
      create: {
        ...artData,
        articleNumber: nextNum++,
        categoryId: otherCat.id,
        authorId: author.id,
        status: 'PUBLISHED',
        isFeatured: true,
        isTrending: true,
      },
    });
    console.log(`Seeded extra Other Cities article [#${post.articleNumber}]:`, post.titleGu);
  }

  console.log('Successfully seeded 15 additional full-length Other Cities articles!');
}

main().catch(console.error).finally(() => prisma.$disconnect());

export interface NewsStory {
  id: string;
  category: string;
  headline: string;
  subheadline?: string;
  articleBody: string;
  image: string;
  caption?: string;
  district?: string;
}

export interface AdSlot {
  id: string;
  title?: string;
  image: string;
  link?: string;
}

export interface ZodiacSign {
  signGu: string;
  signEn: string;
  prediction: string;
}

export interface MarketRates {
  gold24k: string;
  gold22k: string;
  silver1kg: string;
  sensex: string;
  nifty: string;
}

export interface EditorialSection {
  title: string;
  authorName: string;
  authorRole: string;
  editorialText: string;
  authorImage?: string;
}

export interface Page1Data {
  mastheadTitle: string;
  mastheadTagline: string;
  city: string;
  date: string;
  price: string;
  editionInfo: string;
  headerNotice: string;
  leadStory: NewsStory;
  secondaryStories: NewsStory[];
  bottomStories: NewsStory[];
  advertisement: AdSlot;
}

export interface Page2Data {
  sectionTitle: string;
  mainDistrictStory: NewsStory;
  districtStories: NewsStory[];
}

export interface Page3Data {
  sectionTitle: string;
  businessStory: NewsStory;
  politicsStory: NewsStory;
  marketRates: MarketRates;
  editorial: EditorialSection;
  advertisement: AdSlot;
}

export interface Page4Data {
  sectionTitle: string;
  mainSportsStory: NewsStory;
  matchInfo: string;
  secondarySportsStory: NewsStory;
  entertainmentStory: NewsStory;
  horoscope: ZodiacSign[];
  advertisement: AdSlot;
}

export interface NewspaperTemplateData {
  page1: Page1Data;
  page2: Page2Data;
  page3: Page3Data;
  page4: Page4Data;
}

export function getDefaultTemplateData(cityName: string = 'અમદાવાદ', dateStr: string = '07 સપ્ટેમ્બર 2026'): NewspaperTemplateData {
  return {
    page1: {
      mastheadTitle: 'ગુજરાત પોસ્ટ',
      mastheadTagline: 'ગુજરાતનું અગ્રણી દૈનિક વર્તમાનપત્ર',
      city: cityName || 'અમદાવાદ',
      date: dateStr || 'સોમવાર, 07 સપ્ટેમ્બર 2026',
      price: '₹ 5.00',
      editionInfo: 'વર્ષ ૨૬ • અંક ૧૮૨',
      headerNotice: 'તાજા સમાચાર અને વિશ્વાસપાત્ર સત્ય માહિતી માટે વાચકોની પહેલી પસંદ',
      leadStory: {
        id: 'p1_lead',
        category: 'મુખ્ય સમાચાર',
        headline: 'ગુજરાતમાં આજે મોટો ઐતિહાસિક નિર્ણય: નવા વિકાસ પ્રકલ્પોની ભવ્ય જાહેરાત',
        subheadline: 'રાજ્યના તમામ મુખ્ય જિલ્લાઓ માટે નવી યોજનાઓને લીલી ઝંડી, કરોડોના બજેટને મંજૂરી આપાઈ',
        articleBody: 'અમદાવાદ: ગુજરાત રાજ્યમાં આજે મુખ્યમંત્રીની અધ્યક્ષતામાં યોજાયેલી ઉચ્ચ સ્તરીય બેઠકમાં રાજ્યના સર્વાંગી વિકાસ માટે અનેક મોટા અને મહત્વપૂર્ણ નિર્ણયો લેવામાં આવ્યા છે. ઇન્ફ્રાસ્ટ્રક્ચર, આરોગ્ય અને શિક્ષણ ક્ષેત્રે નવી યોજનાઓ શરૂ કરવામાં આવશે.',
        image: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80',
        caption: 'ગાંધીનગરમાં યોજાયેલી ઉચ્ચ સ્તરીય બેઠકની વિહંગમ દ્રશ્ય ઝાકી',
      },
      secondaryStories: [
        {
          id: 'p1_sec_1',
          category: 'રાજકીય',
          headline: 'ગાંધીનગરમાં વિધાનસભાનું વિશેષ સત્ર યોજાશે, આર્થિક નીતિઓ પર ચર્ચા',
          articleBody: 'ગાંધીનગર ખાતે આગામી સપ્તાહે વિધાનસભાનું વિશેષ સત્ર યોજવામાં આવશે, જેમાં રાજ્યના આર્થિક વિકાસ માટે મહત્વના ખરડાઓ પસાર કરવામાં આવશે.',
          image: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=500&q=80',
          caption: 'વિધાનસભા ગૃહ',
        },
        {
          id: 'p1_sec_2',
          category: 'શિક્ષણ',
          headline: 'રાજ્યની તમામ શાળાઓમાં સ્માર્ટ ક્લાસરૂમ યોજનાનો બીજો તબક્કો શરૂ',
          articleBody: 'શિક્ષણ વિભાગ દ્વારા વિદ્યાર્થીઓને આધુનિક ડીજીટલ શિક્ષણ પૂરું પાડવા માટે નવી ટેકનોલોજી આધારિત સ્માર્ટ કિટ્સનું વિતરણ કરવામાં આવ્યું.',
          image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=500&q=80',
          caption: 'ડીજીટલ શિક્ષણ મેળવતા વિદ્યાર્થીઓ',
        },
      ],
      bottomStories: [
        {
          id: 'p1_bot_1',
          category: 'હવામાન',
          headline: 'ગુજરાતમાં આગામી ૪૮ કલાકમાં ભારે વરસાદની આગાહી',
          articleBody: 'હવામાન વિભાગ દ્વારા દક્ષિણ ગુજરાત અને સૌરાષ્ટ્રમાં ભારે પવન સાથે વરસાદની ચેતવણી આપવામાં આવી છે.',
          image: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=400&q=80',
        },
        {
          id: 'p1_bot_2',
          category: 'આરોગ્ય',
          headline: 'સિવિલ હોસ્પિટલમાં નવું આધુનિક કાર્ડિયોલોજી વિંગ ખુલ્લું મુકાયું',
          articleBody: 'દર્દીઓને ઉત્તમ અને ત્વરિત તબીબી સારવાર મળી રહે તે માટે આધુનિક મશીનરી સાથેનું નવું સુપર-સ્પેશિયાલિટી સેન્ટર શરુ થયું.',
          image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=400&q=80',
        },
        {
          id: 'p1_bot_3',
          category: 'પરિવહન',
          headline: 'અમદાવાદ મેટ્રો ફેઝ-૨નું ટ્રાયલ રન સફળતાપૂર્વક પૂર્ણ થતાં આનંદ',
          articleBody: 'અમદાવાદથી ગાંધીનગર વચ્ચે મેટ્રો સેવા ટૂંક સમયમાં મુસાફરો માટે ખુલ્લી મુકવામાં આવશે, જે ટ્રાફિક ઘટાડવામાં મદદરૂપ થશે.',
          image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80',
        },
      ],
      advertisement: {
        id: 'p1_ad',
        title: 'જાહેરાત સ્લોટ (Front Ad)',
        image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80',
        link: 'https://gujaratpost.com',
      },
    },
    page2: {
      sectionTitle: 'ગુજરાત સમાચાર વિશેષ',
      mainDistrictStory: {
        id: 'p2_main',
        district: 'અમદાવાદ',
        category: 'અમદાવાદ',
        headline: 'અમદાવાદ મહાનગરપાલિકા દ્વારા નવા ઓવરબ્રિજનું નિર્માણ કાર્ય પૂરજોશમાં શરુ',
        articleBody: 'અમદાવાદ: શહેરના પશ્ચિમ વિસ્તારમાં ટ્રાફિકની સમસ્યામાંથી મુક્તિ મેળવવા માટે મહાનગરપાલિકા દ્વારા ₹ ૧૫૦ કરોડના ખર્ચે નવો વિશાળ ૬-લેન ઓવરબ્રિજ બનાવવામાં આવી રહ્યો છે. આ બ્રિજથી રોજના ૨ લાખથી વધુ વાહનચાલકોને સુવિધા મળશે.',
        image: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?auto=format&fit=crop&w=800&q=80',
        caption: 'ઓવરબ્રિજ કામગીરીનું કલેક્ટરશ્રી દ્વારા સ્થળ પર નિરીક્ષણ',
      },
      districtStories: [
        {
          id: 'p2_dist_1',
          district: 'સુરત',
          category: 'સુરત',
          headline: 'સુરતમાં ટેક્સટાઇલ અને ડાયમંડ ઉદ્યોગમાં ભવ્ય તેજી, નવા ઓર્ડરથી વેપારીઓમાં હરખ',
          articleBody: 'સુરતના રત્નકલાકારો અને કાપડ વેપારીઓ માટે આગામી તહેવારોની સીઝન અગાઉ વિદેશી ઓર્ડરમાં ૩૦%નો વધારો થયો છે.',
          image: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=500&q=80',
        },
        {
          id: 'p2_dist_2',
          district: 'રાજકોટ',
          category: 'રાજકોટ',
          headline: 'રાજકોટમાં એન્જિનિયરિંગ હબનો નવો પ્રોજેક્ટ મંજૂર, ૫૦૦૦ લોકોને રોજગારીની તક',
          articleBody: 'શાપર-વેરાવળ ઔદ્યોગિક વિસ્તારમાં નવું ટેકનોલોજીિકલ પાર્ક સ્થપાશે જેનાથી યુવાનોને નવી નોકરીઓ પ્રાપ્ત થશે.',
          image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=500&q=80',
        },
        {
          id: 'p2_dist_3',
          district: 'વડોદરા',
          category: 'વડોદરા',
          headline: 'વડોદરાની એમ.એસ. યુનિવર્સિટીમાં સંશોધન ક્ષેત્રે નવી આંતરરાષ્ટ્રીય સિદ્ધિ હાંસલ',
          articleBody: 'સાયન્સ ફેકલ્ટીના વૈજ્ઞાનિકોએ પર્યાવરણ સુરક્ષા માટે ઉપયોગી નવી ગ્રીન ટેકનોલોજીની શોધ કરી પૅટન્ટ મેળવી.',
          image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=500&q=80',
        },
        {
          id: 'p2_dist_4',
          district: 'ભાવનગર',
          category: 'ભાવનગર',
          headline: 'ભાવનગર બંદરના આધુનિકીકરણ માટે નવી યોજના જાહેર કરાઈ',
          articleBody: 'અલંગ શિપબ્રેકિંગ યાર્ડ અને ભાવનગર પોર્ટ પર નવો કન્ટેનર ટર્મિનલ ઊભો કરવામાં આવશે.',
          image: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=500&q=80',
        },
      ],
    },
    page3: {
      sectionTitle: 'બિઝનેસ અને એડિટોરિયલ',
      businessStory: {
        id: 'p3_biz',
        category: 'બિઝનેસ',
        headline: 'ભારતીય શેરબજારમાં ઓલ-ટાઇમ હાઇ: સેન્સેક્સ અને નિફ્ટીમાં ઐતિહાસિક ઉછાળો',
        articleBody: 'મુંબઈ: વૈશ્વિક સકારાત્મક સંકેતો અને વિદેશી રોકાણકારોની ભારે ખરીદીને કારણે ભારતીય શેરબજારમાં આજે મોટો ઉછાળો જોવા મળ્યો છે. આઇટી અને બેન્કિંગ શેરોમાં જોરદાર લેવાલી રહી હતી.',
        image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
      },
      politicsStory: {
        id: 'p3_pol',
        category: 'રાજકારણ',
        headline: 'કેન્દ્રીય કેબિનેટની મહત્વની બેઠક: નવી આર્થિક ನೀતિઓને લીલી ઝંડી',
        articleBody: 'નવી દિલ્હી: દેશના આર્થિક તંત્રને વેગ આપવા માટે કેન્દ્ર સરકારે આજે નવી નિકાસ નીતિ અને MSME ક્ષેત્ર માટે પ્રોત્સાહક પેકેજ મંજૂર કર્યું છે.',
        image: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80',
        caption: 'કેન્દ્રીય મંત્રીમંડળની બેઠક બાદ પત્રકાર પરિષદ',
      },
      marketRates: {
        gold24k: '₹ 74,500 / 10g',
        gold22k: '₹ 68,300 / 10g',
        silver1kg: '₹ 88,200 / 1kg',
        sensex: '82,350 (+450)',
        nifty: '25,240 (+135)',
      },
      editorial: {
        title: 'તંત્રીલેખ: ગુજરાતના આર્થિક અને સામાજિક વિકાસનો નવો સૂર્યોદય',
        authorName: 'રમેશભાઈ પટેલ',
        authorRole: 'મુખ્ય તંત્રી, ગુજરાત પોસ્ટ',
        editorialText: 'કોઈપણ રાજ્ય કે રાષ્ટ્રના વિકાસનો મુખ્ય આધાર તેની નીતિઓ અને પ્રજાની પરિશ્રમ ક્ષમતા પર રહેલો છે. વર્તમાન સમયમાં ગુજરાત જે ઝડપે ઔદ્યોગિક અને સામાજિક ક્ષેત્રે આગળ વધી રહ્યું છે તે સમગ્ર દેશ માટે પ્રેરણાદાયક છે. યોગ્ય સુશાસન અને પારદર્શક વહીવટથી જ આમ જનતાને સાચો ન્યાય મળી શકે છે.',
        authorImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
      },
      advertisement: {
        id: 'p3_ad',
        title: 'બિઝનેસ જાહેરાત સ્લોટ',
        image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80',
      },
    },
    page4: {
      sectionTitle: 'સ્પોર્ટ્સ અને એન્ટરટેઇનમેન્ટ',
      mainSportsStory: {
        id: 'p4_sports_main',
        category: 'રમત-ગમત',
        headline: 'ભારતીય ક્રિકેટ ટીમનો ભવ્ય વિજય: અંતિમ ઓવરમાં રોમાંચક જીત હાંસલ કરી',
        articleBody: 'અમદાવાદ: નરેન્દ્ર મોદી સ્ટેડિયમ ખાતે રમાયેલી રોમાંચક વન-ડે મેચમાં ભારતીય ક્રિકેટ ટીમે ઓસ્ટ્રેલિયા સામે ૪ વિકેટે ભવ્ય વિજય મેળવ્યો હતો. શ્રેષ્ઠ બોલિંગ અને સદી ફટકારનાર બેટ્સમેનને મેન ઓફ ધ મેચ જાહેર કરાયા.',
        image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80',
      },
      matchInfo: 'ભારત વિ. ઓસ્ટ્રેલિયા • ૩જી વન-ડે મેચ • અમદાવાદ',
      secondarySportsStory: {
        id: 'p4_sports_sec',
        category: 'એથ્લેટિક્સ',
        headline: 'ઓલિમ્પિક્સ ક્વોલિફાયરમાં ગુજરાતી ખેલાડીએ ગોલ્ડ મેડલ જીત્યો',
        articleBody: 'ટોક્યો ખાતે યોજાયેલી આંતરરાષ્ટ્રીય ભાલા ફેંક સ્પર્ધામાં ગુજરાતી એથ્લેટે ૮૮.૫ મીટરનો થ્રો ફેંકી સુવર્ણચંદ્રક પોતાના નામે કર્યો.',
        image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=400&q=80',
      },
      entertainmentStory: {
        id: 'p4_ent',
        category: 'મનોરંજન',
        headline: 'ગુજરાતી સિનેમાની નવી બ્લોકબસ્ટર ફિલ્મ: પહેલા જ દિવસે બોક્સ ઓફિસ પર ધમાકો',
        articleBody: 'પ્રસિદ્ધ ડિરેક્ટર અને કલાકારોની જોડીએ પ્રેક્ષકોના દિલ જીતી લીધા છે. થિયેટરોમાં હાઉસફુલના બોર્ડ લાગ્યા છે અને બોલીવુડ હસ્તીઓએ પણ ફિલ્મના વખાણ કર્યા છે.',
        image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
        caption: 'ફિલ્મ પ્રીમિયર દરમિયાન કલાકારોની ખાસ ક્ષણ',
      },
      horoscope: [
        { signGu: 'મેષ', signEn: 'Aries', prediction: 'આજે તમને વેપારમાં લાભદાયી તક મળશે. પરિવારમાં આનંદનું વાતાવરણ રહેશે.' },
        { signGu: 'વૃષભ', signEn: 'Taurus', prediction: 'આર્થિક સ્થિતિ મજબૂત બનશે. નવા પ્રોજેક્ટ શરૂ કરવા માટે ઉત્તમ દિવસ.' },
        { signGu: 'મિથુન', signEn: 'Gemini', prediction: 'કામકાજમાં ઉતાવળ ન કરવી. મિત્રોનો સહયોગ પ્રાપ્ત થશે.' },
        { signGu: 'કર્ક', signEn: 'Cancer', prediction: 'કારકિર્દીમાં નવી પ્રગતિના યોગ છે. આરોગ્યનું ધ્યાન રાખવું.' },
        { signGu: 'સિંહ', signEn: 'Leo', prediction: 'આત્મવિશ્વાસ વધશે. અટકેલા કાર્યો પૂર્ણ થવાથી મન પ્રસન્ન રહેશે.' },
        { signGu: 'કન્યા', signEn: 'Virgo', prediction: 'આકસ્મિક ધનલાભ થઈ શકે છે. વિદ્યાર્થીઓ માટે સફળતાનો સમય.' },
        { signGu: 'તુલા', signEn: 'Libra', prediction: 'સામાજિક પ્રતિષ્ઠામાં વધારો થશે. પારિવારિક યાત્રાનું આયોજન થશે.' },
        { signGu: 'વૃશ્ચિક', signEn: 'Scorpio', prediction: 'નવા સંપર્કોથી ફાયદો થશે. નાણાકીય લેવડદેવડમાં સાવધાની રાખવી.' },
        { signGu: 'ધન', signEn: 'Sagittarius', prediction: 'ધાર્મિક કાર્યોમાં રુચિ વધશે. કાર્યક્ષેત્રમાં પ્રશંસા મળશે.' },
        { signGu: 'મકર', signEn: 'Capricorn', prediction: 'મનોબળ દ્રઢ રહેશે. લાંબા સમયથી ચાલતી ચિંતા દૂર થશે.' },
        { signGu: 'કુંભ', signEn: 'Aquarius', prediction: 'નવી તકો પ્રાપ્ત થશે. રોકાણ માટે સમય અનુકૂળ રહેશે.' },
        { signGu: 'મીન', signEn: 'Pisces', prediction: 'સર્જનાત્મક કાર્યોમાં સફળતા મળશે. પરિવારજન સાથે સમય વીતશે.' },
      ],
      advertisement: {
        id: 'p4_ad',
        title: 'બેક પેજ જાહેરાત banner',
        image: 'https://images.unsplash.com/photo-1542744094-3a3172720449?auto=format&fit=crop&w=800&q=80',
      },
    },
  };
}

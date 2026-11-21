import { Article, Author, NavItem, Photo, Video, Language } from '@/types';



import { toGu, toGuLocal, toGuDigits, formatViews, formatDate, formatTime, hasSpecificTime, formatArticleDateTime, slugify, stripHighlightsBlock } from '@/lib/utils';







export { toGu, toGuLocal, toGuDigits, formatViews, formatDate, formatTime, hasSpecificTime, formatArticleDateTime, slugify };



export type { Article, Author, NavItem, Photo, Video, Language };







export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === 'production' ? 'https://guj-stg.gujaratpost.in' : 'http://localhost:3000');







// Empty static arrays - backend API is the single source of truth



export const ARTICLES: Article[] = [];



export const VIDEOS: Video[] = [];



export const PHOTOS: any[] = [];



export const AUTHORS: Author[] = [];



export const BREAKING_TICKER: Array<{ en: string; gu: string; hi: string; slug: string }> = [];







const WINDOWS_1252_BYTES: Record<string, number> = {



  '€': 0x80,



  '‚': 0x82,



  'ƒ': 0x83,



  '„': 0x84,



  '…': 0x85,



  '†': 0x86,



  '‡': 0x87,



  'ˆ': 0x88,



  '‰': 0x89,



  'Š': 0x8a,



  '‹': 0x8b,



  'Œ': 0x8c,



  'Ž': 0x8e,



  '‘': 0x91,



  '’': 0x92,



  '“': 0x93,



  '”': 0x94,



  '•': 0x95,



  '–': 0x96,



  '—': 0x97,



  '˜': 0x98,



  '™': 0x99,



  'š': 0x9a,



  '›': 0x9b,



  'œ': 0x9c,



  'ž': 0x9e,



  'Ÿ': 0x9f,



};







export function normalizeDisplayText(value?: string | null): string {



  const text = value || '';



  if (!/[àáâãäåæçèéêëìíîïðñòóôõöùúûüýÿÂÃ€ŒœŠšŽžŸ]/.test(text)) {



    return text;



  }







  try {



    const bytes = Array.from(text, (char) => {



      const code = char.charCodeAt(0);



      if (code <= 0xff) return code;



      return WINDOWS_1252_BYTES[char] ?? code;



    }).filter((byte) => byte >= 0 && byte <= 0xff);







    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes));



    return decoded.includes('�') ? text : decoded;



  } catch {



    return text;



  }



}







export function cleanLiteralEscapeSequences(text?: string | null): string {



  if (!text) return '';



  return text



    .replace(/\\r\\n/g, '\n')



    .replace(/\\r/g, '')



    .replace(/\\n/g, '\n')



    .replace(/\\t/g, ' ');



}







export function decodeHtmlEntities(value?: string | null): string {



  if (!value) return '';



  // Preserve srcdoc attributes so iframe embeds inside HTML never get their internal quotes & tags decoded



  const srcdocs: string[] = [];



  let protectedStr = value.replace(/\bsrcdoc=(["'])([\s\S]*?)\1/gi, (match) => {



    const idx = srcdocs.length;



    srcdocs.push(match);



    return `__GP_SRCDOC_PRESERVE_${idx}__`;



  });







  let decoded = cleanLiteralEscapeSequences(normalizeDisplayText(protectedStr))



    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))



    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))



    .replace(/&nbsp;/gi, ' ')



    .replace(/&amp;/gi, '&')



    .replace(/&lt;/gi, '<')



    .replace(/&gt;/gi, '>')



    .replace(/&quot;/gi, '"')



    .replace(/&#39;|&apos;/gi, "'");







  srcdocs.forEach((originalMatch, idx) => {



    decoded = decoded.replace(`__GP_SRCDOC_PRESERVE_${idx}__`, originalMatch);



  });







  return decoded;



}







export function cleanArticlePlainText(value?: string | null): string {
  if (!value) return '';

  let text = stripHighlightsBlock(decodeHtmlEntities(value))
    .replace(/(?:##\s*)?📌?\s*(?:એક નજરમાં|એક નજર મેં|एक नजर में|AT A GLANCE|KEY HIGHLIGHTS|HIGHLIGHTS)[^\n<]*/gi, ' ')
    .replace(/[-*—_]{3,}/g, ' ')
    .replace(/^[•*\-#\s]+/gm, ' ')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<\/?(p|div|br|h[1-6]|li|ul|ol|blockquote|figure|figcaption)[^>]*>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*_`~>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Strip any accidental breadcrumb prefix if extracted from HTML body (e.g. "હોમ / રાજનીતિ / અમદાવાદ / ...")
  text = text.replace(/^(?:હોમ|Home|होम)\s*[\/|›»•·-]\s*[^/]+?\s*[\/|›»•·-]\s*[^/]+?\s*[\/|›»•·-]?\s*/i, '');
  text = text.replace(/^(?:📌\s*)?(?:એક નજરમાં|એક નજર મેં|एक नजर में|AT A GLANCE|KEY HIGHLIGHTS|HIGHLIGHTS)\s*/i, '');
  text = text.replace(/\(KEY HIGHLIGHTS\)/gi, ' ');
  text = text.replace(/[-*—_]{3,}/g, ' ');
  return text.trim();
}







export const CATEGORY_META: Record<string, { name: string; gu: string; hi: string }> = {
  elections: { name: 'Elections', gu: 'ચૂંટણી', hi: 'चुनाव' },
  election: { name: 'Elections', gu: 'ચૂંટણી', hi: 'चुनाव' },

  'latest-news': { name: 'Latest News', gu: 'તાજા સમાચાર', hi: 'ताजा खबर' },

  'breaking-news': { name: 'Breaking News', gu: 'મુખ્ય સમાચાર', hi: 'मुख्य समाचार' },

  'live-center': { name: 'Live Center', gu: 'લાઈવ સેન્ટર', hi: 'लाइव सेंटर' },

  'popular-stories': { name: 'Popular Stories', gu: 'પોપ્યુલર સ્ટોરીઝ', hi: 'पॉपुलर स्टोरीज' },

  'loksabha-election': { name: 'Lok Sabha Election', gu: 'લોકસભા ચૂંટણી', hi: 'लोकसभा चुनाव' },

  'inflation': { name: 'Inflation', gu: 'મોંઘવારી', hi: 'महंगाई' },



  gujarat: { name: 'Gujarat', gu: 'ગુજરાત', hi: 'गुजरात' },



  state: { name: 'Gujarat', gu: 'ગુજરાત', hi: 'गुजरात' },



  national: { name: 'India', gu: 'ભારત', hi: 'भारत' },



  world: { name: 'World', gu: 'વિશ્વ', hi: 'विश्व' },



  politics: { name: 'Politics', gu: 'રાજનીતિ', hi: 'राजनीति' },



  crime: { name: 'Crime', gu: 'ક્રાઇમ', hi: 'क्राइम' },



  health: { name: 'Health', gu: 'હેલ્થ', hi: 'स्वास्थ्य' },



  entertainment: { name: 'Entertainment', gu: 'મનોરંજન', hi: 'मनोरंजन' },



  technology: { name: 'Technology', gu: 'ટેકનોલોજી', hi: 'टेक्नोलॉजी' },



  photos: { name: 'Photo Gallery', gu: 'ફોટો ગેલેરી', hi: 'फोटो गैलरी' },



  'fact-check': { name: 'Fact Check', gu: 'ફેક્ટ ચેક', hi: 'फैक्त चेक' },



  trending: { name: 'Trending', gu: 'ટ્રેન્ડિંગ', hi: 'ट्रेंडिंग' },



  'election-2027': { name: 'Election 2027', gu: 'ચૂંટણી 2027', hi: 'चुनाव 2027' },



  business: { name: 'Business', gu: 'બિઝનેસ', hi: 'बिजनेस' },



  sports: { name: 'Sports', gu: 'સ્પોર્ટ્સ', hi: 'खेल' },



  lifestyle: { name: 'Lifestyle', gu: 'લાઇફસ્ટાઇલ', hi: 'लाइफस्टाइल' },



  education: { name: 'Education', gu: 'શિક્ષણ', hi: 'शिक्षा' },



  ahmedabad: { name: 'Ahmedabad', gu: 'અમદાવાદ', hi: 'अहमदाबाद' },



  gandhinagar: { name: 'Gandhinagar', gu: 'ગાંધીનગર', hi: 'गांधीनगर' },



  rajkot: { name: 'Rajkot', gu: 'રાજકોટ', hi: 'राजकोट' },



  surat: { name: 'Surat', gu: 'સુરત', hi: 'सूरत' },



  vadodara: { name: 'Vadodara', gu: 'વડોદરા', hi: 'वडोदरा' },



  'other-cities': { name: 'Other Cities', gu: 'અન્ય શહેરો', hi: 'अन्य शहर' },



  otherCities: { name: 'Other Cities', gu: 'અન્ય શહેરો', hi: 'अन्य शहर' },



  videos: { name: 'Video', gu: 'વીડિયો', hi: 'वीडियो' },



  video: { name: 'Video', gu: 'વીડિયો', hi: 'वीडियो' },



  shorts: { name: 'Shorts', gu: 'શોર્ટ્સ', hi: 'शॉर्ट्स' },



  podcasts: { name: 'Podcasts', gu: 'પોડકાસ્ટ', hi: 'पॉडकास्ट' },



  varsad: { name: 'Rainfall', gu: 'વરસાદ', hi: 'वर्षा' },



  rain: { name: 'Rainfall', gu: 'વરસાદ', hi: 'वर्षा' },



  weather: { name: 'Weather', gu: 'હવામાન', hi: 'मौसम' },



  'gold-silver': { name: 'Gold - Silver', gu: 'ગોલ્ડ - સિલ્વર', hi: 'गोल्ड - सिल्वर' },



  webstory: { name: 'Webstory', gu: 'વેબસ્ટોરી', hi: 'વેબ स्टोरीज' },



};







export const PHOTO_CATEGORY_TRANSLATIONS: Record<string, { en: string; gu: string; hi: string }> = {



  'સમાચાર': { en: 'News', gu: 'સમાચાર', hi: 'समाचार' },



  'news': { en: 'News', gu: 'સમાચાર', hi: 'समाचार' },



  'general': { en: 'News', gu: 'સમાચાર', hi: 'समाचार' },



  'મનોરંજન': { en: 'Entertainment', gu: 'મનોરંજન', hi: 'मनोरंजन' },



  'entertainment': { en: 'Entertainment', gu: 'મનોરંજન', hi: 'मनोरंजन' },



  'ગ્લેમરસ': { en: 'Glamour', gu: 'ગ્લેમરસ', hi: 'ग्लैमर' },



  'glamour': { en: 'Glamour', gu: 'ગ્લેમરસ', hi: 'ग्लैमर' },



  'ગુજરાત': { en: 'Gujarat', gu: 'ગુજરાત', hi: 'गुजरात' },



  'gujarat': { en: 'Gujarat', gu: 'ગુજરાત', hi: 'गुजरात' },



  'સંસ્કૃતિ': { en: 'Culture', gu: 'સંસ્કૃતિ', hi: 'संस्कृति' },



  'culture': { en: 'Culture', gu: 'સંસ્કૃતિ', hi: 'संस्कृति' },



  'પ્રવાસ': { en: 'Travel', gu: 'પ્રવાસ', hi: 'यात्रा' },



  'travel': { en: 'Travel', gu: 'પ્રવાસ', hi: 'यात्रा' },



  'ઉત્સવ': { en: 'Festival', gu: 'ઉત્સવ', hi: 'उत्सव' },



  'festival': { en: 'Festival', gu: 'ઉત્સવ', hi: 'उत्सव' },



  'લાઇફસ્ટાઇલ': { en: 'Lifestyle', gu: 'લાઇફસ્ટાઇલ', hi: 'लाइफस्टाइल' },



  'લાઈફસ્ટાઈલ': { en: 'Lifestyle', gu: 'લાઇફસ્ટાઇલ', hi: 'लाइफस्टाइल' },



  'lifestyle': { en: 'Lifestyle', gu: 'લાઇફસ્ટાઇલ', hi: 'लाइफस्टाइल' },



  'ધર્મ': { en: 'Religion', gu: 'ધર્મ', hi: 'धर्म' },



  'religion': { en: 'Religion', gu: 'ધર્મ', hi: 'धर्म' },



  'ખેલ': { en: 'Sports', gu: 'ખેલ', hi: 'खेल' },



  'સ્પોર્ટ્સ': { en: 'Sports', gu: 'સ્પોર્ટ્સ', hi: 'खेल' },



  'sports': { en: 'Sports', gu: 'સ્પોર્ટ્સ', hi: 'खेल' },



  'રાજકારણ': { en: 'Politics', gu: 'રાજકારણ', hi: 'राजनीति' },
  'રાજનીતિ': { en: 'Politics', gu: 'રાજનીતિ', hi: 'રાજનીતિ' },



  'politics': { en: 'Politics', gu: 'રાજકારણ', hi: 'राजनीति' },



  'વિશ્વ': { en: 'World', gu: 'વિશ્વ', hi: 'विश्व' },



  'world': { en: 'World', gu: 'વિશ્વ', hi: 'विश्व' },



  'ફોટો ગેલેરી': { en: 'Photo Gallery', gu: 'ફોટો ગેલેરી', hi: 'फोटो गैलरी' },



  'photo gallery': { en: 'Photo Gallery', gu: 'ફોટો ગેલેરી', hi: 'फोटो गैलरी' },
};

export function getPhotoCategoryBadge(photo: any, language: Language | string): string {
  const rawCat = (photo?.category || photo?.categoryGu || '').trim();
  const title = `${photo?.captionGu || ''} ${photo?.caption || ''} ${photo?.alt || ''} ${photo?.title || ''}`.toLowerCase();

  let resolvedCat = rawCat;

  // 1. Entertainment / Bollywood / Actress / Model / Photoshoot
  const isEntertainment =
    /એક્ટ્રેસ|અભિનેત્રી|બોલિવૂડ|હોટ|બોલ્ડ|બિકિની|બિકીની|મોડલ|ગ્લેમરસ|સાડી|ડ્રેસ|શર્મા|કપૂર|ખાન|સિંહ|દિશા|મલાઇકા|સની|તસ્વીરો|તસવીરો|સેક્સી|હીરોઇન|શૂટ|ફોટોશૂટ|ગાઉન|લહેંગા|કાતિલ|અવતાર|જલવા|સ્વરૂપ|લુક|લૂક|નિકિતા|દીક્ષિત|બેન્દ્રે|કામરા|રાઉત|પટાની|પટની|અદા|લિયોની|અભિનેતા|સ્ટાર|star|actress|actor|bollywood|model|bikini|glamour|photoshoot|નાગિન|બબીતાજી|બિગ બોસ|કાર્દશિયન|સુહાની|અનુષ્કા|કિયારા|તારા સુતરિયા|કાજલ અગ્રવાલ|ભૂમિ|કેટરિના|પ્રિયંકા|જ્હાનવી|જ્હાન્વી|ઉર્ફી/i.test(title);

  // 2. Sports / Cricket
  const isSports =
    !isEntertainment &&
    /cricket|\bipl\b|ધોની|કોહલી|રોહિત|વર્લ્ડ કપ|world cup|સ્પોર્ટ્સ|sports|વાનખેડે|સ્ટેડિયમ|ઋષભ પંત/i.test(title);

  // 3. Politics / Election
  const isPolitics =
    !isEntertainment &&
    /ચૂંટણી|સંસદ|ભાજપ|કોંગ્રેસ|રાજ ઠાકરે|રાહુલ ગાંધી|શપથવિધી|election|politics/i.test(title);

  // 4. Religion / Temple
  const isReligion =
    !isEntertainment &&
    /સોમનાથ મંદિર|દ્વારકાધીશ|અંબાજી મંદિર|પાવાગઢ મંદિર|ડાકોર મંદિર|મહાદેવ|શિવલિંગ|પરિક્રમા/i.test(title);

  if (isEntertainment) {
    resolvedCat = 'મનોરંજન';
  } else if (isSports) {
    resolvedCat = 'સ્પોર્ટ્સ';
  } else if (isPolitics) {
    resolvedCat = 'રાજનીતિ';
  } else if (isReligion) {
    resolvedCat = 'ધર્મ';
  } else if (resolvedCat === 'સમાચાર' || resolvedCat === 'News' || resolvedCat === 'ધર્મ' || !resolvedCat) {
    // Photos in gallery are entertainment by default, not generic news
    resolvedCat = 'મનોરંજન';
  }

  const lowerCat = resolvedCat.toLowerCase();

  if (language === 'gu') {
    if (PHOTO_CATEGORY_TRANSLATIONS[resolvedCat]) return PHOTO_CATEGORY_TRANSLATIONS[resolvedCat].gu;
    if (PHOTO_CATEGORY_TRANSLATIONS[lowerCat]) return PHOTO_CATEGORY_TRANSLATIONS[lowerCat].gu;
    return resolvedCat || 'મનોરંજન';
  }

  if (language === 'hi') {
    if (PHOTO_CATEGORY_TRANSLATIONS[resolvedCat]) return PHOTO_CATEGORY_TRANSLATIONS[resolvedCat].hi;
    if (PHOTO_CATEGORY_TRANSLATIONS[lowerCat]) return PHOTO_CATEGORY_TRANSLATIONS[lowerCat].hi;
    return resolvedCat === 'મનોરંજન' ? 'मनोरंजन' : resolvedCat === 'સ્પોર્ટ્સ' ? 'खेल' : (resolvedCat || 'मनोरंजन');
  }

  // language === 'en'
  if (PHOTO_CATEGORY_TRANSLATIONS[resolvedCat]) return PHOTO_CATEGORY_TRANSLATIONS[resolvedCat].en;
  if (PHOTO_CATEGORY_TRANSLATIONS[lowerCat]) return PHOTO_CATEGORY_TRANSLATIONS[lowerCat].en;
  return resolvedCat === 'મનોરંજન' ? 'Entertainment' : resolvedCat === 'સ્પોર્ટ્સ' ? 'Sports' : (resolvedCat || 'Entertainment');
}









export interface CategorySeoMeta {



  title?: string;



  description?: string;



  keywords?: string[];



  h1?: string;



  h2?: string;



  url?: string;



}







export const CATEGORY_CUSTOM_SEO: Record<string, CategorySeoMeta> = {
  // 1. Fact Check
  'fact-check': {
    title: 'Gujarat Post Fact Check News | Fact Check Tools | Fake News Buster',
    description: 'Nowadays many misleading news stories and deepfakes go viral. In Gujarat Post Fact Check section, read verified facts uncovering truth behind viral articles, speeches, images, and videos.',
    keywords: ['Fact Check', 'Latest Fact Check News', 'Gujarat Post Fact Check News', 'Fact Check Tools', 'Fake News Buster', 'ફેક્ટ ચેક', 'Viral News Verification', 'Gujarat Post'],
    h1: 'Political Fact Check News, Sports Fact Check, Entertainment Fact Check',
    h2: 'International Fact Check News, How To Fact Check',
    url: 'https://www.gujaratpost.in/category/fact-check',
  },
  factcheck: {
    title: 'Gujarat Post Fact Check News | Fact Check Tools | Fake News Buster',
    description: 'Nowadays many misleading news stories and deepfakes go viral. In Gujarat Post Fact Check section, read verified facts uncovering truth behind viral articles, speeches, images, and videos.',
    keywords: ['Fact Check', 'Latest Fact Check News', 'Gujarat Post Fact Check News', 'Fact Check Tools', 'Fake News Buster', 'ફેક્ટ ચેક', 'Viral News Verification', 'Gujarat Post'],
    h1: 'Political Fact Check News, Sports Fact Check, Entertainment Fact Check',
    h2: 'International Fact Check News, How To Fact Check',
    url: 'https://www.gujaratpost.in/category/fact-check',
  },
  'Fact-Check': {
    title: 'Gujarat Post Fact Check News | Fact Check Tools | Fake News Buster',
    description: 'Nowadays many misleading news stories and deepfakes go viral. In Gujarat Post Fact Check section, read verified facts uncovering truth behind viral articles, speeches, images, and videos.',
    keywords: ['Fact Check', 'Latest Fact Check News', 'Gujarat Post Fact Check News', 'Fact Check Tools', 'Fake News Buster', 'ફેક્ટ ચેક', 'Viral News Verification', 'Gujarat Post'],
    h1: 'Political Fact Check News, Sports Fact Check, Entertainment Fact Check',
    h2: 'International Fact Check News, How To Fact Check',
    url: 'https://www.gujaratpost.in/category/fact-check',
  },

  // 2. Gujarat State
  gujarat: {
    title: 'Latest Gujarati News | Gujarat Samachar | Gujarat Post',
    description: 'Gujarat Post focuses on local news, regional updates, governance, ACB Trap, ED and IT Raid stories across Gujarat.',
    keywords: ['Latest Gujarati News', 'Gujarat Samachar', 'News in Gujarati', 'District News', 'Hyper Local', 'ACB Trap', 'ED IT Raid', 'ગુજરાત સમાચાર', 'Gujarat Breaking News', 'Gujarat Post'],
    h1: 'Latest Online News, Get Gujarati Breaking News',
    h2: 'Daily Breaking News and Headlines, Gujarati News',
    url: 'https://www.gujaratpost.in/category/gujarat',
  },
  state: {
    title: 'Latest Gujarati News | Gujarat Samachar | Gujarat Post',
    description: 'Gujarat Post focuses on local news, regional updates, governance, ACB Trap, ED and IT Raid stories across Gujarat.',
    keywords: ['Latest Gujarati News', 'Gujarat Samachar', 'News in Gujarati', 'District News', 'Hyper Local', 'ACB Trap', 'ED IT Raid', 'ગુજરાત સમાચાર', 'Gujarat Breaking News', 'Gujarat Post'],
    h1: 'Latest Online News, Get Gujarati Breaking News',
    h2: 'Daily Breaking News and Headlines, Gujarati News',
    url: 'https://www.gujaratpost.in/category/gujarat',
  },

  // 3. Elections
  elections: {
    title: 'Elections | Assembly Elections | By Elections | Lok Sabha Elections | Gujarat Post',
    description: 'At every 5 years Assembly and Lok Sabha Elections are held. Stay updated with Gujarat Assembly Election 2027, Lok Sabha Election 2029, by-elections, voting updates, exit polls, and live results on Gujarat Post.',
    keywords: ['Elections', 'Gujarat Assembly Election', 'Lok Sabha Elections', 'Gujarat By Election', 'Election Results', 'ચૂંટણી સમાચાર', 'Gujarat Election 2027', 'Lok Sabha Election 2029', 'Gujarat Post'],
    h1: 'Gujarat Assembly Elections 2027, Gujarat By Election, Lok Sabha Elections, Election Results',
    h2: 'Gujarat Elections Updates, Latest Elections News, Election Updates',
    url: 'https://www.gujaratpost.in/category/elections',
  },
  election: {
    title: 'Elections | Assembly Elections | By Elections | Lok Sabha Elections | Gujarat Post',
    description: 'At every 5 years Assembly and Lok Sabha Elections are held. Stay updated with Gujarat Assembly Election 2027, Lok Sabha Election 2029, by-elections, voting updates, exit polls, and live results on Gujarat Post.',
    keywords: ['Elections', 'Gujarat Assembly Election', 'Lok Sabha Elections', 'Gujarat By Election', 'Election Results', 'ચૂંટણી સમાચાર', 'Gujarat Election 2027', 'Lok Sabha Election 2029', 'Gujarat Post'],
    h1: 'Gujarat Assembly Elections 2027, Gujarat By Election, Lok Sabha Elections, Election Results',
    h2: 'Gujarat Elections Updates, Latest Elections News, Election Updates',
    url: 'https://www.gujaratpost.in/category/elections',
  },
  'election-2027': {
    title: 'Elections | Assembly Elections | By Elections | Lok Sabha Elections | Gujarat Post',
    description: 'At every 5 years Assembly and Lok Sabha Elections are held. Next Gujarat Assembly Election in 2027 and Lok Sabha Election to be held in 2029. Get live updates and seat analysis on Gujarat Post.',
    keywords: ['Elections', 'Gujarat Assembly Election', 'Lok Sabha Elections', 'Gujarat By Election', 'Election Results', 'ચૂંટણી સમાચાર', 'Gujarat Election 2027', 'Lok Sabha Election 2029', 'Gujarat Post'],
    h1: 'Gujarat Assembly Elections 2027, Gujarat By Election, Lok Sabha Elections, Election Results',
    h2: 'Gujarat Elections Updates, Latest Elections News, Election Updates',
    url: 'https://www.gujaratpost.in/category/elections',
  },
  'loksabha-election': {
    title: 'Lok Sabha Elections | Parliamentary Elections | Gujarat Post',
    description: 'Lok Sabha elections news, seat tally, constituency analysis, candidate declarations, campaign speeches, and election results coverage on Gujarat Post.',
    keywords: ['Lok Sabha Elections', 'Parliament Polls', 'લોકસભા ચૂંટણી', 'Election Results', 'Elections', 'Gujarat Post'],
    h1: 'Gujarat Assembly Elections 2027, Gujarat By Election, Lok Sabha Elections, Election Results',
    h2: 'Gujarat Elections Updates, Latest Elections News, Election Updates',
    url: 'https://www.gujaratpost.in/category/elections',
  },

  // 4. Ahmedabad
  ahmedabad: {
    title: 'Ahmedabad News Today | Top Stories | Ahmedabad Breaking News | Gujarat Post',
    description: 'Ahmedabad is the largest city of Gujarat and commercial hub. Read latest Ahmedabad news today, AMC updates, crime, business, civic headlines and breaking updates on Gujarat Post.',
    keywords: ['Ahmedabad News Today', 'Top Stories', 'Ahmedabad Breaking News', 'Breaking and Latest Ahmedabad Headlines', 'અમદાવાદ સમાચાર', 'AMC News', 'Gujarat Post'],
    h1: 'Ahmedabad Latest News Check Out, Latest Ahmedabad News, Ahmedabad News Today',
    h2: 'Read Ahmedabad News, Ahmedabad Breaking News',
    url: 'https://www.gujaratpost.in/category/ahmedabad',
  },

  // 5. Surat
  surat: {
    title: 'Latest Surat News | Surat News Headlines | Surat Breaking News | Gujarat Post',
    description: 'Surat is known as the Diamond City as well as Textile City. Read latest Surat news headlines, SMC updates, diamond and textile markets, crime, and live breaking stories on Gujarat Post.',
    keywords: ['Latest Surat News', 'Surat News Headlines', 'Surat Breaking News', 'Surat News Today', 'Live Surat News', 'સુરત સમાચાર', 'Diamond City News', 'Gujarat Post'],
    h1: 'Get All Latest Surat News Updates',
    h2: 'Surat Breaking News | Diamond City',
    url: 'https://www.gujaratpost.in/category/surat',
  },

  // 6. Rajkot
  rajkot: {
    title: 'Latest Rajkot News | Gujarat News of Rajkot | Headlines From Rajkot | Rajkot Today News | Gujarat Post',
    description: 'Rajkot is the vibrant commercial capital of Saurashtra. Read latest Rajkot news, Saurashtra samachar, auto spare parts, imitation jewelry market, and breaking headlines on Gujarat Post.',
    keywords: ['Latest Rajkot News', 'Gujarat News of Rajkot', 'Headlines From Rajkot', 'Rajkot Today News', 'Breaking News on Rajkot', 'Saurashtra Samachar', 'રાજકોટ સમાચાર', 'Gujarat Post'],
    h1: 'Rajkot Latest News Headlines Update',
    h2: 'Rajkot Na Samachar, Rajkot News',
    url: 'https://www.gujaratpost.in/category/rajkot',
  },

  // 7. Vadodara
  vadodara: {
    title: 'Vadodara News | Latest Vadodara News | Cultural City of Gujarat | Gujarat Post',
    description: 'Gujarat Post brings the latest Vadodara news headlines about Vadodara crime, education news, VMC politics, MSU updates, and live updates on local Vadodara news.',
    keywords: ['Vadodara News', 'Latest Vadodara News', 'Cultural City of Gujarat', 'Vadodara Breaking News', 'Vadodara Updates', 'Local News', 'વડોદરા સમાચાર', 'Sanskarinagari', 'Gujarat Post'],
    h1: 'Vadodara Latest News Headlines Update',
    h2: 'Vadodara Live News',
    url: 'https://www.gujaratpost.in/category/vadodara',
  },
  vadodra: {
    title: 'Vadodara News | Latest Vadodara News | Cultural City of Gujarat | Gujarat Post',
    description: 'Gujarat Post brings the latest Vadodara news headlines about Vadodara crime, education news, VMC politics, MSU updates, and live updates on local Vadodara news.',
    keywords: ['Vadodara News', 'Latest Vadodara News', 'Cultural City of Gujarat', 'Vadodara Breaking News', 'Vadodara Updates', 'Local News', 'વડોદરા સમાચાર', 'Sanskarinagari', 'Gujarat Post'],
    h1: 'Vadodara Latest News Headlines Update',
    h2: 'Vadodara Live News',
    url: 'https://www.gujaratpost.in/category/vadodara',
  },

  // 8. Gandhinagar
  gandhinagar: {
    title: 'Gandhinagar Samachar | Breaking News Gandhinagar | Gandhinagar News | Gujarat Post',
    description: 'Gandhinagar is the capital of Gujarat. Gujarat Post brings the latest Gandhinagar news headlines about Secretariat politics, government policy, and live updates in this news section.',
    keywords: ['Gandhinagar Samachar', 'Breaking News Gandhinagar', 'Gandhinagar News', 'Gandhinagar Latest News Updates', 'ગાંધીનગર સમાચાર', 'Sachivalay News', 'Gujarat Post'],
    h1: 'Latest Gandhinagar News',
    h2: 'Get Latest News on Gandhinagar',
    url: 'https://www.gujaratpost.in/category/gandhinagar',
  },
  gandhinager: {
    title: 'Gandhinagar Samachar | Breaking News Gandhinagar | Gandhinagar News | Gujarat Post',
    description: 'Gandhinagar is the capital of Gujarat. Gujarat Post brings the latest Gandhinagar news headlines about Secretariat politics, government policy, and live updates in this news section.',
    keywords: ['Gandhinagar Samachar', 'Breaking News Gandhinagar', 'Gandhinagar News', 'Gandhinagar Latest News Updates', 'ગાંધીનગર સમાચાર', 'Sachivalay News', 'Gujarat Post'],
    h1: 'Latest Gandhinagar News',
    h2: 'Get Latest News on Gandhinagar',
    url: 'https://www.gujaratpost.in/category/gandhinagar',
  },

  // 9. Others / Other Cities
  'other-cities': {
    title: 'District News | Crime News | Hyper Local News | Other Cities | Gujarat Post',
    description: 'Gujarat Post covers hyper-local news from all districts and talukas beyond the main metro cities. Read crime news, rural developments, administrative alerts, and local stories.',
    keywords: ['District News', 'Crime News', 'Hyper Local News', 'Latest News Updates', 'Others', 'Local News', 'ગુજરાત જિલ્લા સમાચાર', 'Gujarat Post'],
    h1: 'Latest Gujarati News',
    h2: 'Gujarati Samachar',
    url: 'https://www.gujaratpost.in/category/other-cities',
  },
  othercities: {
    title: 'District News | Crime News | Hyper Local News | Other Cities | Gujarat Post',
    description: 'Gujarat Post covers hyper-local news from all districts and talukas beyond the main metro cities. Read crime news, rural developments, administrative alerts, and local stories.',
    keywords: ['District News', 'Crime News', 'Hyper Local News', 'Latest News Updates', 'Others', 'Local News', 'ગુજરાત જિલ્લા સમાચાર', 'Gujarat Post'],
    h1: 'Latest Gujarati News',
    h2: 'Gujarati Samachar',
    url: 'https://www.gujaratpost.in/category/other-cities',
  },
  'other-city': {
    title: 'District News | Crime News | Hyper Local News | Other Cities | Gujarat Post',
    description: 'Gujarat Post covers hyper-local news from all districts and talukas beyond the main metro cities. Read crime news, rural developments, administrative alerts, and local stories.',
    keywords: ['District News', 'Crime News', 'Hyper Local News', 'Latest News Updates', 'Others', 'Local News', 'ગુજરાત જિલ્લા સમાચાર', 'Gujarat Post'],
    h1: 'Latest Gujarati News',
    h2: 'Gujarati Samachar',
    url: 'https://www.gujaratpost.in/category/other-cities',
  },
  other: {
    title: 'District News | Crime News | Hyper Local News | Other Cities | Gujarat Post',
    description: 'Gujarat Post covers hyper-local news from all districts and talukas beyond the main metro cities. Read crime news, rural developments, administrative alerts, and local stories.',
    keywords: ['District News', 'Crime News', 'Hyper Local News', 'Latest News Updates', 'Others', 'Local News', 'ગુજરાત જિલ્લા સમાચાર', 'Gujarat Post'],
    h1: 'Latest Gujarati News',
    h2: 'Gujarati Samachar',
    url: 'https://www.gujaratpost.in/category/other-cities',
  },
  others: {
    title: 'District News | Crime News | Hyper Local News | Other Cities | Gujarat Post',
    description: 'Gujarat Post covers hyper-local news from all districts and talukas beyond the main metro cities. Read crime news, rural developments, administrative alerts, and local stories.',
    keywords: ['District News', 'Crime News', 'Hyper Local News', 'Latest News Updates', 'Others', 'Local News', 'ગુજરાત જિલ્લા સમાચાર', 'Gujarat Post'],
    h1: 'Latest Gujarati News',
    h2: 'Gujarati Samachar',
    url: 'https://www.gujaratpost.in/category/other-cities',
  },

  // 10. National / India
  national: {
    title: 'Latest National News | Today Latest News | India Breaking News | Gujarat Post',
    description: 'National headlines and news from within and around India with live updates on major breaking events, politics, Supreme Court, parliament from Gujarat Post News.',
    keywords: ['Latest National News', 'Today Latest News', 'National News Today India', 'Read Latest National News', 'ભારત સમાચાર', 'India Breaking News', 'Gujarat Post'],
    h1: 'Get Latest National News, LIVE Breaking News From All States at gujaratpost.in',
    h2: 'Today Top News Headlines',
    url: 'https://www.gujaratpost.in/category/national',
  },
  india: {
    title: 'Latest National News | Today Latest News | India Breaking News | Gujarat Post',
    description: 'National headlines and news from within and around India with live updates on major breaking events, politics, Supreme Court, parliament from Gujarat Post News.',
    keywords: ['Latest National News', 'Today Latest News', 'National News Today India', 'Read Latest National News', 'ભારત સમાચાર', 'India Breaking News', 'Gujarat Post'],
    h1: 'Get Latest National News, LIVE Breaking News From All States at gujaratpost.in',
    h2: 'Today Top News Headlines',
    url: 'https://www.gujaratpost.in/category/national',
  },

  // 11. International / World
  world: {
    title: 'Top International News | International Headlines Today | World News | Gujarat Post',
    description: 'Read all international news and headlines from around the world with live updates on breaking global events, geopolitics, conflicts, and US/world news on Gujarat Post.',
    keywords: ['Top International News', 'International Headlines Today', 'World News', 'Current International Breaking News', 'વિશ્વ સમાચાર', 'Videsh Samachar', 'Gujarat Post'],
    h1: 'Read Top News Headlines Worldwide',
    h2: 'Get International News, Find Latest World News Headlines',
    url: 'https://www.gujaratpost.in/category/world',
  },
  international: {
    title: 'Top International News | International Headlines Today | World News | Gujarat Post',
    description: 'Read all international news and headlines from around the world with live updates on breaking global events, geopolitics, conflicts, and US/world news on Gujarat Post.',
    keywords: ['Top International News', 'International Headlines Today', 'World News', 'Current International Breaking News', 'વિશ્વ સમાચાર', 'Videsh Samachar', 'Gujarat Post'],
    h1: 'Read Top News Headlines Worldwide',
    h2: 'Get International News, Find Latest World News Headlines',
    url: 'https://www.gujaratpost.in/category/world',
  },

  // 12. Entertainment & Lifestyle
  entertainment: {
    title: 'Latest Entertainment News | Lifestyle News | Health Tips | Bollywood Updates | Gujarat Post',
    description: 'Entertainment and lifestyle are the most popular segments. Read Bollywood updates, OTT releases, box office, celebrity news, health tips, and lifestyle trends jointly on Gujarat Post.',
    keywords: ['Latest Entertainment News', 'Lifestyle News', 'Health Tips', 'Bollywood Updates', 'Trending Lifestyle News', 'Health and Lifestyle News', 'Entertainment News', 'મનોરંજન સમાચાર', 'Bollywood Samachar', 'Gujarat Post'],
    h1: 'Get Latest Update of Lifestyle and Entertainment',
    h2: 'Lifestyle Headline, Entertainment Movies & TV Shows',
    url: 'https://www.gujaratpost.in/category/entertainment',
  },
  manoranjan: {
    title: 'Latest Entertainment News | Lifestyle News | Health Tips | Bollywood Updates | Gujarat Post',
    description: 'Entertainment and lifestyle are the most popular segments. Read Bollywood updates, OTT releases, box office, celebrity news, health tips, and lifestyle trends jointly on Gujarat Post.',
    keywords: ['Latest Entertainment News', 'Lifestyle News', 'Health Tips', 'Bollywood Updates', 'Trending Lifestyle News', 'Health and Lifestyle News', 'Entertainment News', 'મનોરંજન સમાચાર', 'Bollywood Samachar', 'Gujarat Post'],
    h1: 'Get Latest Update of Lifestyle and Entertainment',
    h2: 'Lifestyle Headline, Entertainment Movies & TV Shows',
    url: 'https://www.gujaratpost.in/category/entertainment',
  },
  'entertainment-life-style': {
    title: 'Latest Entertainment News | Lifestyle News | Health Tips | Bollywood Updates | Gujarat Post',
    description: 'Entertainment and lifestyle are the most popular segments. Read Bollywood updates, OTT releases, box office, celebrity news, health tips, and lifestyle trends jointly on Gujarat Post.',
    keywords: ['Latest Entertainment News', 'Lifestyle News', 'Health Tips', 'Bollywood Updates', 'Trending Lifestyle News', 'Health and Lifestyle News', 'Entertainment News', 'મનોરંજન સમાચાર', 'Bollywood Samachar', 'Gujarat Post'],
    h1: 'Get Latest Update of Lifestyle and Entertainment',
    h2: 'Lifestyle Headline, Entertainment Movies & TV Shows',
    url: 'https://www.gujaratpost.in/category/entertainment',
  },

  // 13. Popular Stories / Trending
  trending: {
    title: 'Best and Popular Stories | Trending Stories | Viral News | Gujarat Post',
    description: 'In this section of Gujarat Post news you can read most popular stories, viral internet trends, human interest stories, political and current affairs buzz.',
    keywords: ['Best and Popular Stories', 'Trending Stories', 'Trending News', 'Popular Stories', 'Viral News', 'ટ્રેન્ડિંગ સમાચાર', 'Must Read Stories', 'Gujarat Post'],
    h1: 'Read the Most Popular Stories of the Day',
    h2: 'Trending Stories, Viral Buzz & Top Read News',
    url: 'https://www.gujaratpost.in/category/trending',
  },
  tranding: {
    title: 'Best and Popular Stories | Trending Stories | Viral News | Gujarat Post',
    description: 'In this section of Gujarat Post news you can read most popular stories, viral internet trends, human interest stories, political and current affairs buzz.',
    keywords: ['Best and Popular Stories', 'Trending Stories', 'Trending News', 'Popular Stories', 'Viral News', 'ટ્રેન્ડિંગ સમાચાર', 'Must Read Stories', 'Gujarat Post'],
    h1: 'Read the Most Popular Stories of the Day',
    h2: 'Trending Stories, Viral Buzz & Top Read News',
    url: 'https://www.gujaratpost.in/category/trending',
  },
  'popular-stories': {
    title: 'Best and Popular Stories | Trending Stories | Viral News | Gujarat Post',
    description: 'In this section of Gujarat Post news you can read most popular stories, viral internet trends, human interest stories, political and current affairs buzz.',
    keywords: ['Best and Popular Stories', 'Trending Stories', 'Trending News', 'Popular Stories', 'Viral News', 'ટ્રેન્ડિંગ સમાચાર', 'Must Read Stories', 'Gujarat Post'],
    h1: 'Read the Most Popular Stories of the Day',
    h2: 'Trending Stories, Viral Buzz & Top Read News',
    url: 'https://www.gujaratpost.in/category/trending',
  },

  // 14. Photo Gallery
  photos: {
    title: 'Latest News Photos | Photo Gallery News | Photo Stories | Gujarat Post',
    description: 'Find latest news photos and galleries based on latest news, Bollywood, sports, lifestyle, politics, events, and viral moments on Gujarat Post.',
    keywords: ['Latest News Photos', 'Photo Gallery News', 'Photos of the Day', 'News Photo Gallery', 'ફોટો ગેલેરી', 'Photo Stories', 'Visual News', 'Gujarat Post'],
    h1: 'Top News Trending Photo Gallery',
    h2: 'News in Photos',
    url: 'https://www.gujaratpost.in/photos',
  },
  gallery: {
    title: 'Latest News Photos | Photo Gallery News | Photo Stories | Gujarat Post',
    description: 'Find latest news photos and galleries based on latest news, Bollywood, sports, lifestyle, politics, events, and viral moments on Gujarat Post.',
    keywords: ['Latest News Photos', 'Photo Gallery News', 'Photos of the Day', 'News Photo Gallery', 'ફોટો ગેલેરી', 'Photo Stories', 'Visual News', 'Gujarat Post'],
    h1: 'Top News Trending Photo Gallery',
    h2: 'News in Photos',
    url: 'https://www.gujaratpost.in/photos',
  },
  'photo-gallery': {
    title: 'Latest News Photos | Photo Gallery News | Photo Stories | Gujarat Post',
    description: 'Find latest news photos and galleries based on latest news, Bollywood, sports, lifestyle, politics, events, and viral moments on Gujarat Post.',
    keywords: ['Latest News Photos', 'Photo Gallery News', 'Photos of the Day', 'News Photo Gallery', 'ફોટો ગેલેરી', 'Photo Stories', 'Visual News', 'Gujarat Post'],
    h1: 'Top News Trending Photo Gallery',
    h2: 'News in Photos',
    url: 'https://www.gujaratpost.in/photos',
  },

  // 15. Politics
  politics: {
    title: 'Current Affairs | Political Headline | Latest Politics News | Gujarat Post',
    description: 'Read all national and international latest and breaking news on politics, elections, governance, policy decisions, and political developments on Gujarat Post.',
    keywords: ['Current Affairs', 'Political Headline', 'Latest Politics News', 'Gujarat Politics News', 'Latest Political Headlines', 'રાજનીતિ સમાચાર', 'Gujarat Post'],
    h1: 'Live Political News & Updates',
    h2: 'Breaking Political Headlines, Election Analysis & Governance',
    url: 'https://www.gujaratpost.in/category/politics',
  },

  // 16. Crime, Business, Sports, Tech, Health, Lifestyle, Education, Weather, Gold-Silver, Jobs
  crime: {
    title: 'Crime News, Police Investigation, Legal Updates | Gujarat Post',
    description: 'Detailed coverage of Gujarat crime news, cyber crime alerts, police investigations, court verdicts, and law enforcement updates on Gujarat Post.',
    keywords: ['Crime News', 'Police Investigation', 'ક્રાઇમ સમાચાર', 'Gujarat Police', 'Cyber Crime', 'Court Verdicts', 'Gujarat Post'],
    h1: 'Crime News, Law Enforcement, Latest Police Investigations',
    h2: 'Gujarat Crime Reports, Legal Proceedings, Cyber Security & Safety',
    url: 'https://www.gujaratpost.in/category/crime',
  },
  business: {
    title: 'Business News, Share Market, Economy, Finance | Gujarat Post',
    description: 'Real-time business news, Sensex & Nifty stock market updates, mutual funds, personal finance, startups, and economic policy on Gujarat Post.',
    keywords: ['Business News', 'Share Market', 'બિઝનેસ સમાચાર', 'Sensex Today', 'Nifty 50', 'Economy News', 'Startups', 'Gujarat Post'],
    h1: 'Business News, Stock Market Live, Economy & Financial Trends',
    h2: 'Sensex & Nifty Updates, Banking, Corporate News, Startups',
    url: 'https://www.gujaratpost.in/category/business',
  },
  sports: {
    title: 'Sports News, Cricket Live Score, Football, Tennis | Gujarat Post',
    description: 'Live cricket scores, match analysis, IPL news, Team India updates, football, tennis, Olympics, and international sports coverage on Gujarat Post.',
    keywords: ['Sports News', 'Cricket Live Score', 'સ્પોર્ટ્સ સમાચાર', 'IPL News', 'Team India', 'Cricket World Cup', 'Football', 'Gujarat Post'],
    h1: 'Sports News, Cricket Scores, IPL Updates & Tournament Highlights',
    h2: 'Live Cricket Match Coverage, Football, Olympics, Player Interviews',
    url: 'https://www.gujaratpost.in/category/sports',
  },
  technology: {
    title: 'Technology News, Gadgets, AI, Smartphone Reviews | Gujarat Post',
    description: 'Latest tech news, gadget launches, AI breakthroughs, smartphone reviews, cybersecurity tips, and digital innovations on Gujarat Post.',
    keywords: ['Technology News', 'Tech News', 'ટેકનોલોજી સમાચાર', 'Gadgets', 'AI News', 'Smartphone Reviews', 'Cyber Security', 'Gujarat Post'],
    h1: 'Technology News, AI Innovations, Gadget Launches & Reviews',
    h2: 'Smartphone Launches, Tech Tips, Digital Security & Software Updates',
    url: 'https://www.gujaratpost.in/category/technology',
  },
  tech: {
    title: 'Technology News, Gadgets, AI, Smartphone Reviews | Gujarat Post',
    description: 'Latest tech news, gadget launches, AI breakthroughs, smartphone reviews, cybersecurity tips, and digital innovations on Gujarat Post.',
    keywords: ['Technology News', 'Tech News', 'ટેકનોલોજી સમાચાર', 'Gadgets', 'AI News', 'Smartphone Reviews', 'Gujarat Post'],
    h1: 'Technology News, AI Innovations, Gadget Launches & Reviews',
    h2: 'Smartphone Launches, Tech Tips, Digital Security & Software Updates',
    url: 'https://www.gujaratpost.in/category/technology',
  },
  health: {
    title: 'Health News, Wellness Tips, Fitness, Ayurveda | Gujarat Post',
    description: 'Comprehensive health news, medical breakthroughs, wellness guides, fitness routines, nutrition advice, and Ayurvedic remedies on Gujarat Post.',
    keywords: ['Health News', 'Wellness Tips', 'હેલ્થ સમાચાર', 'Fitness', 'Ayurveda', 'Nutrition Advice', 'Mental Health', 'Gujarat Post'],
    h1: 'Health News, Wellness Guides, Fitness & Medical Breakthroughs',
    h2: 'Ayurveda Advice, Fitness Routines, Mental Wellness & Healthy Living',
    url: 'https://www.gujaratpost.in/category/health',
  },
  lifestyle: {
    title: 'Lifestyle News, Fashion, Travel, Relationships, Home | Gujarat Post',
    description: 'Read latest lifestyle news, fashion trends, travel guides, home decor ideas, relationship advice, and culture stories on Gujarat Post.',
    keywords: ['Lifestyle News', 'Fashion Trends', 'લાઇફસ્ટાઇલ સમાચાર', 'Travel Guides', 'Relationship Advice', 'Culture', 'Home Decor', 'Gujarat Post'],
    h1: 'Lifestyle News, Fashion Trends, Travel Guides & Culture Stories',
    h2: 'Home Decor Ideas, Relationship Advice, Living Well & Daily Tips',
    url: 'https://www.gujaratpost.in/category/lifestyle',
  },
  education: {
    title: 'Education News, Exam Results, Career Guidance | Gujarat Post',
    description: 'Get latest education news, board exam results, university admissions, scholarship announcements, and career guidance advice on Gujarat Post.',
    keywords: ['Education News', 'Exam Results', 'શિક્ષણ સમાચાર', 'GSEB Results', 'Board Exams', 'Career Guidance', 'College Admissions', 'Gujarat Post'],
    h1: 'Education News, Board Exam Results, Admissions & Career Advice',
    h2: 'GSEB Updates, Competitive Exams, University Alerts & Scholarships',
    url: 'https://www.gujaratpost.in/category/education',
  },
  weather: {
    title: 'Weather News, Rainfall Forecast, Monsoon Updates | Gujarat Post',
    description: 'Real-time weather news, rain forecasts, monsoon alerts, cyclone warnings, and meteorological forecasts across Gujarat on Gujarat Post.',
    keywords: ['Weather News', 'Rainfall News', 'હવામાન સમાચાર', 'વરસાદ આગાહી', 'Monsoon Forecast', 'Cyclone Alert', 'IMD Gujarat', 'Gujarat Post'],
    h1: 'Weather News, Gujarat Rainfall Forecast, Monsoon & Cyclone Alerts',
    h2: 'IMD Meteorological Predictions, Heavy Rain Warnings, City Weather',
    url: 'https://www.gujaratpost.in/category/weather',
  },
  varsad: {
    title: 'Gujarat Rainfall News, Rain Forecast, Varsad Samachar | Gujarat Post',
    description: 'Latest Gujarat rainfall updates, heavy rain warnings, monsoon forecast, taluka-wise rain data, and dam water levels on Gujarat Post.',
    keywords: ['Varsad News', 'Gujarat Rainfall', 'વરસાદ સમાચાર', 'Rain Forecast', 'Monsoon Gujarat', 'Dam Water Levels', 'Gujarat Post'],
    h1: 'Gujarat Rainfall News, Heavy Rain Forecast, Monsoon Weather Updates',
    h2: 'Taluka-Wise Rain Reports, Dam Water Levels, Cyclone Warnings & Alerts',
    url: 'https://www.gujaratpost.in/category/varsad',
  },
  rainfall: {
    title: 'Gujarat Rainfall News, Rain Forecast, Varsad Samachar | Gujarat Post',
    description: 'Latest Gujarat rainfall updates, heavy rain warnings, monsoon forecast, taluka-wise rain data, and dam water levels on Gujarat Post.',
    keywords: ['Rainfall News', 'Varsad News', 'વરસાદ સમાચાર', 'Rain Forecast', 'Monsoon Gujarat', 'Gujarat Post'],
    h1: 'Gujarat Rainfall News, Heavy Rain Forecast, Monsoon Weather Updates',
    h2: 'Taluka-Wise Rain Reports, Dam Water Levels, Cyclone Warnings & Alerts',
    url: 'https://www.gujaratpost.in/category/varsad',
  },
  'gold-silver': {
    title: 'Gold - Silver Price Today, Bullion Rates in Gujarat | Gujarat Post',
    description: "Check today's gold and silver rates in Gujarat (Ahmedabad, Surat, Rajkot, Vadodara), 22K and 24K bullion prices, market trends on Gujarat Post.",
    keywords: ['Gold Price Today', 'Silver Rate Today', 'સોનું ચાંદી ભાવ', 'Gold Rate Gujarat', 'Bullion News', '24K Gold Rate', 'Gujarat Post'],
    h1: 'Gold - Silver Price Today, Live Bullion Rates & Market Trends',
    h2: '22K & 24K Gold Rates in Ahmedabad, Surat, Rajkot, Vadodara Today',
    url: 'https://www.gujaratpost.in/category/gold-silver',
  },
  jobs: {
    title: 'Jobs News, Govt Vacancies, Recruitment, Sarkari Bharti | Gujarat Post',
    description: 'Latest government jobs, Gujarat public service commission (GPSC) notifications, banking recruitment, admit cards, and job updates on Gujarat Post.',
    keywords: ['Jobs News', 'Govt Jobs Gujarat', 'સરકારી નોકરી', 'GPSC Recruitment', 'Sarkari Bharti', 'Employment News', 'Gujarat Post'],
    h1: 'Jobs News, Govt Recruitment Notifications & Career Alerts',
    h2: 'GPSC Bharti, Gujarat Govt Vacancies, Admit Cards & Exam Dates',
    url: 'https://www.gujaratpost.in/category/jobs',
  },
  editorial: {
    title: 'Editorial News, Opinion, Deep Analysis, Columns | Gujarat Post',
    description: 'Thought-provoking editorial opinion pieces, expert analysis, socio-political commentaries, and columns by veteran journalists on Gujarat Post.',
    keywords: ['Editorial News', 'Opinion', 'સંપાદકીય', 'Analysis', 'Columns', 'Journalism', 'Gujarat Post'],
    h1: 'Editorial Columns, Expert Opinions & In-Depth Analysis',
    h2: 'Political Commentary, Socio-Economic Insights & Special Essays',
    url: 'https://www.gujaratpost.in/category/editorial',
  },
  bhavnagar: {
    title: 'Bhavnagar News, Bhavnagar Samachar, Alang Port Updates | Gujarat Post',
    description: 'Latest Bhavnagar news, municipal updates, Alang ship-breaking yard stories, Ghogha ferry alerts, and regional reports on Gujarat Post.',
    keywords: ['Bhavnagar News', 'ભાવનગર સમાચાર', 'Alang Ship Recycling', 'Ghogha Ferry', 'Bhavnagar Updates', 'Gujarat Post'],
    h1: 'Bhavnagar News, Alang Yard Reports, Breaking Bhavnagar Samachar',
    h2: 'Bhavnagar Municipal Corporation, Port Developments & Local Community',
    url: 'https://www.gujaratpost.in/category/bhavnagar',
  },
  jamnagar: {
    title: 'Jamnagar News, Jamnagar Samachar, Brass City Updates | Gujarat Post',
    description: 'Get latest Jamnagar news, brass industry insights, refinery updates, Marine National Park stories, and local civic news on Gujarat Post.',
    keywords: ['Jamnagar News', 'જામનગર સમાચાર', 'Brass Parts Jamnagar', 'Refinery City News', 'Jamnagar Updates', 'Gujarat Post'],
    h1: 'Jamnagar News, Brass City Reports, Breaking Jamnagar Samachar',
    h2: 'Refinery Sector, Marine National Park, Local Community & Civic Alerts',
    url: 'https://www.gujaratpost.in/category/jamnagar',
  },
  junagadh: {
    title: 'Junagadh News, Junagadh Samachar, Gir Forest & Tourism | Gujarat Post',
    description: 'Top Junagadh news, Mount Girnar pilgrimage, Gir National Park Asiatic lion updates, agricultural news, and local alerts on Gujarat Post.',
    keywords: ['Junagadh News', 'જૂનાગઢ સમાચાર', 'Gir Forest Lions', 'Girnar Ropeway', 'Junagadh Updates', 'Gujarat Post'],
    h1: 'Junagadh News, Mount Girnar & Gir Lion Updates, Junagadh Samachar',
    h2: 'Junagadh Municipal Corporation, Tourism Alerts & Saurashtra Highlights',
    url: 'https://www.gujaratpost.in/category/junagadh',
  },
  kutch: {
    title: 'Kutch News, Bhuj Samachar, Rann of Kutch Updates | Gujarat Post',
    description: 'Read latest Kutch news, Bhuj headlines, Mundra & Kandla port developments, Rann Utsav tourism, and border district stories on Gujarat Post.',
    keywords: ['Kutch News', 'કચ્છ સમાચાર', 'Bhuj News', 'Mundra Port', 'Rann Utsav', 'Kutch Updates', 'Gujarat Post'],
    h1: 'Kutch News, Bhuj & Port Updates, Breaking Kutch Samachar',
    h2: 'Mundra & Kandla Port News, Rann Utsav Highlights, Border Security',
    url: 'https://www.gujaratpost.in/category/kutch',
  },
  anand: {
    title: 'Anand News, Milk City Samachar, Amul Dairy Updates | Gujarat Post',
    description: 'Comprehensive Anand news, Amul dairy cooperative updates, Vallabh Vidyanagar education news, agriculture, and Charotar stories on Gujarat Post.',
    keywords: ['Anand News', 'આણંદ સમાચાર', 'Amul Dairy News', 'Milk Capital', 'Charotar Samachar', 'Gujarat Post'],
    h1: 'Anand News, Milk City & Amul Dairy Highlights, Charotar Samachar',
    h2: 'Vallabh Vidyanagar Education News, Agriculture & Civic Updates',
    url: 'https://www.gujaratpost.in/category/anand',
  },
  mehsana: {
    title: 'Mehsana News, North Gujarat Samachar, Dudhsagar Dairy | Gujarat Post',
    description: 'Latest Mehsana news, North Gujarat regional updates, Dudhsagar Dairy developments, agriculture, Modhera Sun Temple events on Gujarat Post.',
    keywords: ['Mehsana News', 'મહેસાણા સમાચાર', 'Dudhsagar Dairy', 'North Gujarat News', 'Modhera Updates', 'Gujarat Post'],
    h1: 'Mehsana News, North Gujarat Regional Coverage, Mehsana Samachar',
    h2: 'Dudhsagar Dairy Developments, Agriculture, Industry & Town Alerts',
    url: 'https://www.gujaratpost.in/category/mehsana',
  },
  morbi: {
    title: 'Morbi News, Ceramic Capital Samachar, Industrial Updates | Gujarat Post',
    description: 'Stay updated with Morbi news, world-renowned ceramic industry insights, clock manufacturing, export directives, and local civic issues on Gujarat Post.',
    keywords: ['Morbi News', 'મોરબી સમાચાર', 'Ceramic Tile Capital', 'Morbi Industry', 'Morbi Updates', 'Gujarat Post'],
    h1: 'Morbi News, Ceramic Capital Updates, Breaking Morbi Samachar',
    h2: 'Ceramic Export News, Industrial Directives, Infrastructure & Local Alerts',
    url: 'https://www.gujaratpost.in/category/morbi',
  },
  videos: {
    title: 'Videos, Latest News Video Clips, Interviews | Gujarat Post',
    description: 'Watch latest video news bulletins, ground reports, political interviews, explainer videos, and viral clips on Gujarat Post.',
    keywords: ['Videos', 'News Videos', 'વીડિયો સમાચાર', 'Video Bulletins', 'Ground Reports', 'Gujarat Post'],
    h1: 'Video News, High-Impact News Bulletins & Ground Reports',
    h2: 'Political Interviews, Viral Video Clips, Explainer Videos & Bulletins',
    url: 'https://www.gujaratpost.in/videos',
  },
  shorts: {
    title: 'Shorts, Fast 60-Second Video News, Quick Bites | Gujarat Post',
    description: 'Quick 60-second video shorts, viral news reels, instant video stories, and rapid headlines on Gujarat Post.',
    keywords: ['Shorts', 'Video Shorts', 'શોર્ટ્સ', 'Viral Reels', 'Quick News Bites', 'Gujarat Post'],
    h1: 'News Shorts, Rapid 60-Second Video News & Key Headlines',
    h2: 'Trending Quick Bites, Viral Reels, Instant News Updates & Stories',
    url: 'https://www.gujaratpost.in/shorts',
  },
  webstory: {
    title: 'Web Stories, Visual Web Stories, Photos & Tips | Gujarat Post',
    description: 'Engaging visual web stories, lifestyle slides, entertainment photos, travel tips, and quick highlights on Gujarat Post.',
    keywords: ['Web Stories', 'Visual Stories', 'વેબ સ્ટોરી', 'Story Slides', 'Visual Highlights', 'Gujarat Post'],
    h1: 'Web Stories, Visual Storytelling & Engaging Slide Highlights',
    h2: 'Trending Lifestyle Web Stories, Entertainment Visuals & Travel Tips',
    url: 'https://www.gujaratpost.in/category/webstory',
  },
  'latest-news': {
    title: 'Latest News, Breaking Gujarat Samachar, Top Headlines | Gujarat Post',
    description: 'Real-time latest news stream, 24/7 breaking updates from Gujarat, India, and around the world on Gujarat Post.',
    keywords: ['Latest News', 'Breaking News', 'તાજા સમાચાર', 'Gujarat Samachar', 'Live Headlines', 'Gujarat Post'],
    h1: 'Latest News, Real-Time Breaking Updates, Taja Samachar',
    h2: 'Gujarat, National & Global Fast News Coverage',
    url: 'https://www.gujaratpost.in/category/latest-news',
  },
  'breaking-news': {
    title: 'Breaking News, Urgent Flash Headlines, Mukhya Samachar | Gujarat Post',
    description: 'Urgent breaking news alerts, instant flash headlines, fast-developing events, and verified breaking stories on Gujarat Post.',
    keywords: ['Breaking News', 'Urgent News', 'મુખ્ય સમાચાર', 'Flash Headlines', 'Live Alerts', 'Gujarat Post'],
    h1: 'Breaking News, Urgent Flash Headlines & Real-Time Alerts',
    h2: 'Top Developing Stories, Instant News Coverage & Fast Bulletins',
    url: 'https://www.gujaratpost.in/category/breaking-news',
  },
  'live-center': {
    title: 'Live Center, Real-Time News Stream, Live Samachar | Gujarat Post',
    description: 'Minute-by-minute live blog updates, verified ongoing developments, real-time crisis coverage, and key announcements on Gujarat Post.',
    keywords: ['Live Center', 'Live News', 'લાઇવ સેન્ટર', 'Live Blog', 'Real-Time News', 'Gujarat Post'],
    h1: 'Live Center, Minute-by-Minute Real-Time News Updates',
    h2: 'Ongoing Breaking Stories, Live Text Updates & Verified Reports',
    url: 'https://www.gujaratpost.in/category/live-center',
  },
  podcasts: {
    title: 'Podcasts, Audio News Shows, In-Depth Discussions | Gujarat Post',
    description: 'Listen to in-depth news podcasts, thought-provoking panel discussions, exclusive voice interviews, and news recaps on Gujarat Post.',
    keywords: ['Podcasts', 'Audio News', 'પોડકાસ્ટ', 'News Audio', 'Interviews', 'Voice Stories', 'Gujarat Post'],
    h1: 'Podcasts, In-Depth Audio Discussions & Exclusive Interviews',
    h2: 'Political Commentary, Cultural Stories & Thoughtful Conversations',
    url: 'https://www.gujaratpost.in/category/podcasts',
  },
  inflation: {
    title: 'Inflation News, Price Rise, Monghwari Samachar | Gujarat Post',
    description: 'Track price fluctuations of essential goods, vegetables, cooking oil, petrol-diesel, LPG, and cost of living updates on Gujarat Post.',
    keywords: ['Inflation News', 'Price Rise', 'મોંઘવારી સમાચાર', 'Petrol Price', 'LPG Price', 'Commodity Rates', 'Gujarat Post'],
    h1: 'Inflation News, Commodity Price Trends & Cost of Living Updates',
    h2: 'Essential Goods, Fuel & Vegetable Prices, Household Budget Impact',
    url: 'https://www.gujaratpost.in/category/inflation',
  },
};


export function getCategoryCustomSeo(rawSlug: string, fallbackName?: string, fallbackGu?: string): CategorySeoMeta {



  const cleanSlug = (rawSlug || '').toLowerCase().trim();



  const resolved = categorySlugMapping[cleanSlug] || cleanSlug;







  if (CATEGORY_CUSTOM_SEO[resolved]) {



    return CATEGORY_CUSTOM_SEO[resolved];



  }



  if (CATEGORY_CUSTOM_SEO[cleanSlug]) {



    return CATEGORY_CUSTOM_SEO[cleanSlug];



  }







  const meta = CATEGORY_META[resolved] || CATEGORY_META[cleanSlug];



  const name = fallbackName || meta?.name || cleanSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());



  const nameGu = fallbackGu || meta?.gu || name;







  return {



    title: `${name} News, ${nameGu} Samachar, Latest Updates | Gujarat Post`,



    description: `Read latest ${name} news, breaking ${nameGu} samachar, photos, videos, and daily headline reports on Gujarat Post.`,



    keywords: [name, `${name} News`, nameGu, `${nameGu} સમાચાર`, 'Gujarat Post', 'Latest News'],



    h1: `${name} News, Breaking ${nameGu} Samachar, Latest News Updates`,



    h2: `Real-Time ${name} Coverage, Political & Civic News, Daily Analysis`,



    url: `https://www.gujaratpost.in/category/${cleanSlug}`,



  };



}







export const categorySlugMapping: Record<string, string> = {
  'ahmedabad': 'ahmedabad',
  'business': 'business',
  'crime': 'crime',
  'education': 'education',
  'election': 'elections',
  'election-2027': 'elections',
  'elections': 'elections',
  'entertainment': 'entertainment',
  'entertainment-life-style': 'entertainment',
  'fact-check': 'fact-check',
  'factcheck': 'fact-check',
  'gallery': 'photos',
  'gandhinagar': 'gandhinagar',
  'gandhinager': 'gandhinagar',
  'gujarat': 'gujarat',
  'health': 'health',
  'india': 'national',
  'international': 'world',
  'lifestyle': 'lifestyle',
  'loksabha-election': 'elections',
  'manoranjan': 'entertainment',
  'national': 'national',
  'other': 'other-cities',
  'other-cities': 'other-cities',
  'other-city': 'other-cities',
  'othercities': 'other-cities',
  'others': 'other-cities',
  'photo-gallery': 'photos',
  'photos': 'photos',
  'politics': 'politics',
  'popular-stories': 'trending',
  'rajkot': 'rajkot',
  'sports': 'sports',
  'state': 'gujarat',
  'surat': 'surat',
  'tech': 'technology',
  'technology': 'technology',
  'tranding': 'trending',
  'trending': 'trending',
  'vadodara': 'vadodara',
  'vadodra': 'vadodara',
  'varsad': 'varsad',
  'world': 'world',
};

export const NAV_ITEMS: NavItem[] = [



  ['Home', 'મુખ્ય', 'મુખ્ય', '/'],



  ['Video', 'વીડિયો', 'વીડિયો', '/videos'],



  ['Gujarat', 'ગુજરાત', 'ગુજરાત', '/category/gujarat'],



  ['India', 'ભારત', 'ભારત', '/category/national'],



  ['World', 'વિશ્વ', 'વિશ્વ', '/category/world'],



  ['Politics', 'રાજકારણ', 'રાજકારણ', '/category/politics'],



  ['Crime', 'ક્રાઇમ', 'ક્રાઇમ', '/category/crime'],



  ['Health', 'આરોગ્ય', 'આરોગ્ય', '/category/health'],



  ['Entertainment', 'મનોરંજન', 'મનોરંજન', '/category/entertainment'],



  ['Technology', 'ટેકનોલોજી', 'ટેકનોલોજી', '/category/technology'],



  ['Photos', 'ફોટો ગેલેરી', 'ફોટો ગેલેરી', '/photos'],



  ['Fact Check', 'ફેક્ટ ચેક', 'ફેક્ટ ચેક', '/category/fact-check'],



  ['Trending', 'ટ્રેન્ડિંગ', 'ટ્રેન્ડિંગ', '/category/trending'],



  ['Election 2027', 'ચૂંટણી 2027', 'ચૂંટણી 2027', '/category/election-2027'],



  ['Podcast', 'પોડકાસ્ટ', 'પોડકાસ્ટ', '/videos?tab=podcast'],



  ['Instagram', 'ઇન્સ્ટાગ્રામ', 'ઇન્સ્ટાગ્રામ', '/videos'],



  ['Webstory', 'વેબસ્ટોરી', 'વેબસ્ટોરી', '/category/webstory'],



  ['Weather', 'હવામાન', 'હવામાન', '/category/weather'],



  ['Gold-Silver', 'સોનું-ચાંદી', 'સોનું-ચાંદી', '/category/gold-silver'],



  ['State News', 'રાજ્યના સમાચાર', 'રાજ્યના સમાચાર', '/category/state'],



  ['Ahmedabad', 'અમદાવાદ', 'અમદાવાદ', '/category/ahmedabad'],



  ['Rajkot', 'રાજકોટ', 'રાજકોટ', '/category/rajkot'],



  ['Surat', 'સુરત', 'સુરત', '/category/surat'],



  ['Vadodara', 'વડોદરા', 'વડોદરા', '/category/vadodara'],



  ['Business', 'બિઝનેસ', 'બિઝનેસ', '/category/business'],



  ['Sports', 'રમતગમત', 'રમતગમત', '/category/sports'],



  ['Education', 'શિક્ષણ', 'શિક્ષણ', '/category/education'],



  ['Watch Never Ends', 'વીડિયો સેક્શન', 'વીડિયો સેક્શન', '/watch'],



  ['Shorts', 'શોર્ટ્સ', 'શોર્ટ્સ', '/videos'],



  ['E-paper', 'ઈ-પેપર', 'ઈ-પેપર', '/epaper'],



].map(([label, labelGu, labelHi, href]) => ({ label, labelGu, labelHi, href }));







export const getLocalized = (language: Language, values: { en?: string; gu?: string; hi?: string }) => {



  const enRaw = (values?.en || '').trim();



  const guRaw = (values?.gu || '').trim();



  const hiRaw = (values?.hi || '').trim();







  // Validate script types to prevent duplicated Gujarati text from being mistaken as English or Hindi



  const isValidEn = Boolean(enRaw && /[A-Za-z]/.test(enRaw) && !/[\u0A80-\u0AFF]/.test(enRaw));



  const isValidHi = Boolean(hiRaw && /[\u0900-\u097F]/.test(hiRaw) && !/[\u0A80-\u0AFF]/.test(hiRaw));



  const isValidGu = Boolean(guRaw && /[\u0A80-\u0AFF]/.test(guRaw));







  const en = isValidEn ? enRaw : '';



  const hi = isValidHi ? hiRaw : '';



  const gu = isValidGu ? guRaw : (guRaw || enRaw || hiRaw);







  if (language === 'en') return normalizeDisplayText(en || gu || hi || enRaw || hiRaw);



  if (language === 'hi') return normalizeDisplayText(hi || gu || en || hiRaw || enRaw);



  return normalizeDisplayText(gu || en || hi || guRaw);



};







export const getArticleTitle = (article: Article, language: Language) =>



  getLocalized(language, { en: article?.title || '', gu: article?.titleGu || '', hi: article?.titleHi || '' });







export const getArticleExcerpt = (article: Article, language: Language) => {
  if (!article) return '';
  const cleanField = (val?: string | null) => {
    if (!val || val === 'null' || val === 'undefined' || val === 'Gujarat Post news flash.') return '';
    return val.trim();
  };
  const raw = getLocalized(language, {
    en: cleanField(article?.excerpt),
    gu: cleanField(article?.excerptGu),
    hi: cleanField(article?.excerptHi)
  });

  const cleaned = cleanArticlePlainText(raw);
  if (cleaned === 'null' || cleaned === 'undefined' || cleaned === 'Gujarat Post news flash.') return '';
  return cleaned;
};

export const getArticleExcerptHtml = (article: Article, language: Language) => {
  if (!article) return '';
  const cleanField = (val?: string | null) => {
    if (!val || val === 'null' || val === 'undefined' || val === 'Gujarat Post news flash.') return '';
    return val.trim();
  };
  const raw = getLocalized(language, {
    en: cleanField(article?.excerpt),
    gu: cleanField(article?.excerptGu),
    hi: cleanField(article?.excerptHi)
  });

  if (!raw || raw === 'null' || raw === 'undefined' || raw === 'Gujarat Post news flash.') return '';

  let text = decodeHtmlEntities(raw).replace(/!\[.*?\]\(.*?\)/g, '').trim();
  if (!text || text === 'null' || text === 'undefined' || text === 'Gujarat Post news flash.') return '';







  // If a block/embed (figure, iframe, div) was accidentally enclosed inside an <a> tag, safely unwrap it



  text = text.replace(/<a\b([^>]*)>([\s\S]*?)(<(figure|div|iframe)\b[\s\S]*?<\/\4>)([\s\S]*?)<\/a>/gi, (match, attrs, before, media, _tag, after) => {



    const p1 = before.trim() ? `<a${attrs}>${before}</a>` : '';



    const cleanAfter = (after || '').replace(/^(?:<p>\s*<br\s*\/?>\s*<\/p>)+/gi, '').trim();



    const p2 = cleanAfter ? `<a${attrs}>${cleanAfter}</a>` : '';



    return `${p1}${media}${p2}`;



  });







  return text;



};







const getContentScore = (value?: string) => {



  const raw = (value || '').trim();



  if (!raw) return 0;







  const textLength = raw



    .replace(/<[^>]*>/g, ' ')



    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')



    .replace(/\s+/g, ' ')



    .trim().length;



  const paragraphCount = (raw.match(/<\/p>/gi) || []).length + (raw.match(/\n\s*\n/g) || []).length;



  const mediaCount = (raw.match(/<img|<figure|<iframe|!\[[^\]]*\]\(/gi) || []).length;



  const headingCount = (raw.match(/<h[1-6]|^#{1,6}\s/gim) || []).length;







  return textLength + paragraphCount * 120 + mediaCount * 250 + headingCount * 80;



};







export const getArticleContent = (article: Article, language: Language) => {



  const preferred = getLocalized(language, {



    en: article?.content || '',



    gu: article?.contentGu || '',



    hi: article?.contentHi || '',



  });







  const available = [article?.content || '', article?.contentGu || '', article?.contentHi || '']



    .map((content) => ({ content: content.trim(), score: getContentScore(content) }))



    .filter((entry) => entry.content);







  if (!available.length) return '';







  const cleanPref = (preferred || '').trim();
  if (cleanPref && cleanPref !== 'Gujarat Post news flash.' && cleanPref.length > 30) {
    return cleanLiteralEscapeSequences(cleanPref);
  }

  const richest = available.reduce((best, entry) => (entry.score > best.score ? entry : best), available[0]);
  return cleanLiteralEscapeSequences(richest.content);



};







export const getCategoryLabel = (



  input: any,



  language: Language = 'gu'



): string => {



  if (!input) return language === 'gu' ? 'સમાચાર' : language === 'hi' ? 'समाचार' : 'News';







  let rawCat = '';



  let catGu = '';



  let catHi = '';







  if (typeof input === 'string') {



    rawCat = input;



  } else if (typeof input === 'object') {



    rawCat = input.categorySlug || input.category || '';



    catGu = input.categoryGu || '';



    catHi = input.categoryHi || '';



  }







  const catLower = rawCat.trim().toLowerCase();



  let meta = CATEGORY_META[catLower];







  if (!meta) {



    for (const key of Object.keys(CATEGORY_META)) {



      const m = CATEGORY_META[key];



      if (



        m.gu.trim().toLowerCase() === catLower ||



        m.name.trim().toLowerCase() === catLower ||



        m.hi.trim().toLowerCase() === catLower



      ) {



        meta = m;



        break;



      }



    }



  }







  if (!meta) {



    if (catLower === 'સમાચાર' || catLower === 'સમાચાર' || catLower === 'news') {



      meta = { name: 'News', gu: 'સમાચાર', hi: 'समाचार' };



    } else if (catLower === 'ફોટો ગેલેરી' || catLower === 'ફોટો' || catLower === 'photos' || catLower === 'photo') {



      meta = { name: 'Photo Gallery', gu: 'ફોટો ગેલેરી', hi: 'फोटो गैलरी' };



    } else if (catLower === 'રાજકારણ' || catLower === 'રાજનીતિ' || catLower === 'politics') {



      meta = { name: 'Politics', gu: 'રાજકારણ', hi: 'राजनीति' };



    } else if (catLower === 'રમતગમત' || catLower === 'સ્પોર્ટ્સ' || catLower === 'sports') {



      meta = { name: 'Sports', gu: 'રમતગમત', hi: 'खेल' };



    } else if (catLower === 'મનોરંજન' || catLower === 'entertainment') {



      meta = { name: 'Entertainment', gu: 'મનોરંજન', hi: 'मनोरंजन' };



    } else if (catLower === 'વિશેષ' || catLower === 'વિશેષ કવરેજ' || catLower === 'special coverage') {



      meta = { name: 'Special Coverage', gu: 'વિશેષ કવરેજ', hi: 'विशेष कवरेज' };



    }



  }







  if (meta) {



    return normalizeDisplayText(language === 'hi' ? meta.hi : language === 'gu' ? meta.gu : meta.name);



  }







  const guCategoryMap: Record<string, string> = {



    'fact-check': 'ફેક્ટ ચેક',



    'factcheck': 'ફેક્ટ ચેક',



    'fact check': 'ફેક્ટ ચેક',



    'state': 'રાજ્ય',



    'state news': 'રાજ્યના સમાચાર',



    'health': 'આરોગ્ય',



    'crime': 'ક્રાઇમ',



    'entertainment': 'મનોરંજન',



    'technology': 'ટેકનોલોજી',



    'tech': 'ટેકનોલોજી',



    'national': 'ભારત',



    'india': 'ભારત',



    'international': 'વિદેશ',



    'world': 'વિશ્વ',



    'business': 'બિઝનેસ',



    'sports': 'રમતગમત',



    'education': 'શિક્ષણ',



    'politics': 'રાજકારણ',



    'astrology': 'જ્યોતિષ',



    'lifestyle': 'લાઇફસ્ટાઇલ',



    'news': 'સમાચાર',



    'general': 'સામાન્ય',



  };







  const hiCategoryMap: Record<string, string> = {



    'fact-check': 'फैक्ट चेक',



    'factcheck': 'फैक्ट चेक',



    'fact check': 'फैक्ट चेक',



    'state': 'राज्य',



    'state news': 'राज्य समाचार',



    'health': 'स्वास्थ्य',



    'crime': 'क्राइम',



    'entertainment': 'मनोरंजन',



    'technology': 'टेक्नोलॉजी',



    'tech': 'टेक्नोलॉजी',



    'national': 'भारत',



    'india': 'भारत',



    'international': 'विदेश',



    'world': 'विश्व',



    'business': 'बिजनेस',



    'sports': 'खेल',



    'education': 'शिक्षा',



    'politics': 'राजनीति',



    'astrology': 'ज्योतिष',



    'lifestyle': 'लाइफस्टाइल',



    'news': 'समाचार',



    'general': 'सामान्य',



  };







  if (language === 'gu') {



    return normalizeDisplayText(guCategoryMap[catLower] || catGu || rawCat || 'સમાચાર');



  }



  if (language === 'hi') {



    return normalizeDisplayText(hiCategoryMap[catLower] || catHi || rawCat || 'समाचार');



  }







  if (/[\u0A80-\u0AFF]/.test(rawCat) || /[\u0900-\u097F]/.test(rawCat)) {



    return 'News';



  }







  return normalizeDisplayText(rawCat.toUpperCase() || 'NEWS');



};







export const getLocationLabel = (article: Article | { location?: string }, language: Language) => {



  const loc = article?.location?.trim();



  if (!loc) return '';



  const locLower = loc.toLowerCase();







  const guMap: Record<string, string> = {



    'national': 'ભારત',



    'india': 'ભારત',



    'desh': 'ભારત',



    'international': 'વિદેશ',



    'world': 'વિશ્વ',



    'gujarat': 'ગુજરાત',



    'ahmedabad': 'અમદાવાદ',



    'gandhinagar': 'ગાંધીનગર',



    'rajkot': 'રાજકોટ',



    'surat': 'સુરત',



    'vadodara': 'વડોદરા',



    'bhavnagar': 'ભાવનગર',



    'jamnagar': 'જામનગર',



    'junagadh': 'જૂનાગઢ',



    'kutch': 'કચ્છ',



    'bhuj': 'ભુજ',



    'anand': 'આણંદ',



    'mehsana': 'મહેસાણા',



    'morbi': 'મોરબી',



    'amreli': 'અમરેલી',



    'bharuch': 'ભરૂચ',



    'aravalli': 'અરવલ્લી',



    'banaskantha': 'બનાસકાંઠા',



    'botad': 'બોટાદ',



    'chhota udepur': 'છોટા ઉદેપુર',



    'dahod': 'દાહોદ',



    'dang': 'ડાંગ',



    'devbhumi dwarka': 'દેવભૂમિ દ્વારકા',



    'gir somnath': 'ગીર સોમનાથ',



    'kheda': 'ખેડા',



    'mahisagar': 'મહીસાગર',



    'narmada': 'નર્મદા',



    'navsari': 'નવસારી',



    'panchmahal': 'પંચમહાલ',



    'patan': 'પાટણ',



    'porbandar': 'પોરબંદર',



    'sabarkantha': 'સાબરકાંઠા',



    'surendranagar': 'સુરેન્દ્રનગર',



    'tapi': 'તાપી',



    'valsad': 'વલસાડ',



    'daman and diu': 'દમણ અને દીવ',



    'vav-tharad': 'વાવ-થરાદ',



    'delhi': 'દિલ્હી',



    'mumbai': 'મુંબઈ',



    'kolkata': 'કોલકાતા',



    'chennai': 'ચેન્નઈ',



    'bangalore': 'બેંગ્લોર',



    'hyderabad': 'હૈદ્રાબાદ',



    'pune': 'પૂણે',



    'jaipur': 'જયપુર',



  };







  const hiMap: Record<string, string> = {



    'national': 'राष्ट्रीय',



    'india': 'राष्ट्रीय',



    'international': 'विदेश',



    'world': 'विश्व',



    'gujarat': 'गुजरात',



    'ahmedabad': 'अहमदाबाद',



    'gandhinagar': 'गांधीनगर',



    'rajkot': 'राजकोट',



    'surat': 'सूरत',



    'vadodara': 'वडोदरा',



    'bhavnagar': 'भावनगर',



    'jamnagar': 'जामनगर',



    'junagadh': 'जूनागढ़',



    'kutch': 'कच्छ',



    'anand': 'आणंद',



    'mehsana': 'महेसाणा',



    'morbi': 'मोरबी',



    'amreli': 'अमरेली',



    'bharuch': 'भरूच',



    'delhi': 'दिल्ली',



    'mumbai': 'मुंबई',



  };







  if (language === 'gu') {



    return guMap[locLower] || loc;



  }



  if (language === 'hi') {



    return hiMap[locLower] || loc;



  }



  return loc;



};







export const getRelativeTime = (dateString?: string | Date | null, language: Language = 'gu'): string => {



  if (!dateString) {



    if (language === 'gu') return 'હમણાં જ';



    if (language === 'hi') return 'अभी';



    return 'Just now';



  }







  const date = new Date(dateString);



  const now = new Date();



  const diffMs = now.getTime() - date.getTime();



  if (isNaN(diffMs) || diffMs < 0) {



    if (language === 'gu') return 'હમણાં જ';



    if (language === 'hi') return 'अभी';



    return 'Just now';



  }







  const diffSecs = Math.floor(diffMs / 1000);



  const diffMins = Math.floor(diffSecs / 60);



  const diffHours = Math.floor(diffMins / 60);



  const diffDays = Math.floor(diffHours / 24);







  if (language === 'gu') {



    if (diffMins < 1) return 'હમણાં જ';



    if (diffMins < 60) return `${toGu(diffMins)} મિનિટ પહેલાં`;



    if (diffHours < 24) return `${toGu(diffHours)} કલાક પહેલાં`;



    if (diffDays < 30) return `${toGu(diffDays)} દિવસ પહેલાં`;



    return `${toGu(Math.floor(diffDays / 30))} મહિના પહેલાં`;



  }







  if (language === 'hi') {



    if (diffMins < 1) return 'अभी';



    if (diffMins < 60) return `${diffMins} मिनट पहले`;



    if (diffHours < 24) return `${diffHours} घंटे पहले`;



    if (diffDays < 30) return `${diffDays} दिन पहले`;



    return `${Math.floor(diffDays / 30)} महीने पहले`;



  }







  // English



  if (diffMins < 1) return 'Just now';



  if (diffMins < 60) return `${diffMins}m ago`;



  if (diffHours < 24) return `${diffHours}h ago`;



  if (diffDays < 30) return `${diffDays}d ago`;



  return `${Math.floor(diffDays / 30)} mo ago`;



};







export const getArticlesByCategory = (cat: string) => [];



export const getTrendingArticles = () => [];



export const getFeaturedArticles = () => [];



export const getRelatedArticles = (article: Article) => [];



export const searchArticles = (query: string) => [];




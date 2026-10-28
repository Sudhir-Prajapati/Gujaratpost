import { Article, Author, NavItem, Photo, Video, Language } from '@/types';
import { toGu, toGuLocal, toGuDigits, formatViews, formatDate, formatTime, hasSpecificTime, formatArticleDateTime, slugify } from '@/lib/utils';

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
  return cleanLiteralEscapeSequences(normalizeDisplayText(value))
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

export function cleanArticlePlainText(value?: string | null): string {
  let text = decodeHtmlEntities(value)
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
  return text.trim();
}

export const CATEGORY_META: Record<string, { name: string; gu: string; hi: string }> = {
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
  'politics': { en: 'Politics', gu: 'રાજકારણ', hi: 'राजनीति' },
  'વિશ્વ': { en: 'World', gu: 'વિશ્વ', hi: 'विश्व' },
  'world': { en: 'World', gu: 'વિશ્વ', hi: 'विश्व' },
  'ફોટો ગેલેરી': { en: 'Photo Gallery', gu: 'ફોટો ગેલેરી', hi: 'फोटो गैलरी' },
  'photo gallery': { en: 'Photo Gallery', gu: 'ફોટો ગેલેરી', hi: 'फोटो गैलरी' },
};

export function getPhotoCategoryBadge(photo: any, language: Language | string): string {
  const cat = (photo?.category || '').trim();
  const lowerCat = cat.toLowerCase();

  if (language === 'gu') {
    if (photo?.categoryGu) return photo.categoryGu;
    if (PHOTO_CATEGORY_TRANSLATIONS[cat]) return PHOTO_CATEGORY_TRANSLATIONS[cat].gu;
    if (PHOTO_CATEGORY_TRANSLATIONS[lowerCat]) return PHOTO_CATEGORY_TRANSLATIONS[lowerCat].gu;
    return cat || 'સમાચાર';
  }

  if (language === 'hi') {
    if (photo?.categoryHi) return photo.categoryHi;
    if (PHOTO_CATEGORY_TRANSLATIONS[cat]) return PHOTO_CATEGORY_TRANSLATIONS[cat].hi;
    if (PHOTO_CATEGORY_TRANSLATIONS[lowerCat]) return PHOTO_CATEGORY_TRANSLATIONS[lowerCat].hi;
    return cat === 'સમાચાર' ? 'समाचार' : (cat || 'समाचार');
  }

  // language === 'en'
  if (photo?.categoryEn) return photo.categoryEn;
  if (PHOTO_CATEGORY_TRANSLATIONS[cat]) return PHOTO_CATEGORY_TRANSLATIONS[cat].en;
  if (PHOTO_CATEGORY_TRANSLATIONS[lowerCat]) return PHOTO_CATEGORY_TRANSLATIONS[lowerCat].en;
  return cat === 'સમાચાર' ? 'News' : (cat || 'News');
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
    title: 'Gujarat Post Fact Check News | Fact Check Tools',
    description: 'Now a day many misleading news goes viral. In fact check news section you can read the facts in a piece of writing, news article, video speech etc are correct or not.',
    keywords: ['Fact Check', 'Latest Fact Check News', 'ફેક્ટ ચેક', 'Viral News Verification', 'Gujarat Post'],
    h1: 'Political Fact Check News, Sports Fact Check, Entertainment Fact C Political',
    h2: 'International Fact Check News, How To Fact Check',
    url: 'https://www.gujaratpost.in/category/fact-check',
  },
  factcheck: {
    title: 'Gujarat Post Fact Check News | Fact Check Tools',
    description: 'Now a day many misleading news goes viral. In fact check news section you can read the facts in a piece of writing, news article, video speech etc are correct or not.',
    keywords: ['Fact Check', 'Latest Fact Check News', 'ફેક્ટ ચેક', 'Viral News Verification', 'Gujarat Post'],
    h1: 'Political Fact Check News, Sports Fact Check, Entertainment Fact C Political',
    h2: 'International Fact Check News, How To Fact Check',
    url: 'https://www.gujaratpost.in/category/fact-check',
  },

  // 2. Gujarat State
  gujarat: {
    title: 'Gujarat News, Gujarat Samachar, Latest Breaking News | Gujarat Post',
    description: 'Read latest Gujarat news, breaking Gujarat Samachar, political updates, state developments, photos, and videos from across Gujarat on Gujarat Post.',
    keywords: ['Gujarat News', 'Gujarat Samachar', 'ગુજરાત સમાચાર', 'Latest Gujarat News', 'Gujarat Breaking News', 'Gujarat Politics', 'Gujarat Post'],
    h1: 'Gujarat News, Breaking Gujarat Samachar, Latest News Updates',
    h2: 'Gujarat Political News, City News, Real-Time Breaking Headlines',
    url: 'https://www.gujaratpost.in/category/gujarat',
  },
  state: {
    title: 'Gujarat News, Gujarat Samachar, Latest Breaking News | Gujarat Post',
    description: 'Read latest Gujarat news, breaking Gujarat Samachar, political updates, state developments, photos, and videos from across Gujarat on Gujarat Post.',
    keywords: ['Gujarat News', 'Gujarat Samachar', 'ગુજરાત સમાચાર', 'Latest Gujarat News', 'Gujarat Breaking News', 'Gujarat Post'],
    h1: 'Gujarat News, Breaking Gujarat Samachar, Latest News Updates',
    h2: 'Gujarat Political News, City News, Real-Time Breaking Headlines',
    url: 'https://www.gujaratpost.in/category/gujarat',
  },

  // 3. National / India
  national: {
    title: 'National News, India News, Bharat Samachar | Gujarat Post',
    description: 'Stay updated with the latest India national news, government policies, politics, national affairs, photos, and breaking stories on Gujarat Post.',
    keywords: ['National News', 'India News', 'ભારત સમાચાર', 'Latest India News', 'National Breaking News', 'Indian Politics', 'Gujarat Post'],
    h1: 'National News, Latest India News, Breaking Bharat Samachar',
    h2: 'Indian Politics, Governance, National Affairs & Daily Highlights',
    url: 'https://www.gujaratpost.in/category/national',
  },
  india: {
    title: 'National News, India News, Bharat Samachar | Gujarat Post',
    description: 'Stay updated with the latest India national news, government policies, politics, national affairs, photos, and breaking stories on Gujarat Post.',
    keywords: ['National News', 'India News', 'ભારત સમાચાર', 'Latest India News', 'National Breaking News', 'Gujarat Post'],
    h1: 'National News, Latest India News, Breaking Bharat Samachar',
    h2: 'Indian Politics, Governance, National Affairs & Daily Highlights',
    url: 'https://www.gujaratpost.in/category/national',
  },

  // 4. World / International
  world: {
    title: 'World News, International News, Videsh Samachar | Gujarat Post',
    description: 'Get the latest world news, international headlines, global politics, diplomatic affairs, conflict updates, and trending stories on Gujarat Post.',
    keywords: ['World News', 'International News', 'વિશ્વ સમાચાર', 'Global News', 'Foreign Affairs', 'Geopolitics', 'Gujarat Post'],
    h1: 'World News, Global Affairs, Breaking International Headlines',
    h2: 'International Geopolitics, US News, Global Conflicts & World Updates',
    url: 'https://www.gujaratpost.in/category/world',
  },
  international: {
    title: 'World News, International News, Videsh Samachar | Gujarat Post',
    description: 'Get the latest world news, international headlines, global politics, diplomatic affairs, conflict updates, and trending stories on Gujarat Post.',
    keywords: ['World News', 'International News', 'વિશ્વ સમાચાર', 'Global News', 'Foreign Affairs', 'Gujarat Post'],
    h1: 'World News, Global Affairs, Breaking International Headlines',
    h2: 'International Geopolitics, US News, Global Conflicts & World Updates',
    url: 'https://www.gujaratpost.in/category/world',
  },

  // 5. Politics
  politics: {
    title: 'Political News, Politics Samachar, Election Updates | Gujarat Post',
    description: 'Explore latest political news, election analysis, political party statements, government decisions, and exclusive reports on Gujarat Post.',
    keywords: ['Politics News', 'Political News', 'રાજનીતિ સમાચાર', 'Gujarat Politics', 'Election News', 'Government Decisions', 'Gujarat Post'],
    h1: 'Political News, Government Policies, Latest Election Updates',
    h2: 'Gujarat & National Politics, Election Analysis, Political Speeches',
    url: 'https://www.gujaratpost.in/category/politics',
  },

  // 6. Crime
  crime: {
    title: 'Crime News, Police Investigation, Legal Updates | Gujarat Post',
    description: 'Read latest crime news, police investigations, court rulings, cyber crime alerts, and law enforcement updates from Gujarat and India on Gujarat Post.',
    keywords: ['Crime News', 'Police News', 'ક્રાઇમ સમાચાર', 'Gujarat Crime News', 'Cyber Crime', 'Court Cases', 'Gujarat Post'],
    h1: 'Crime News, Law Enforcement, Latest Police Investigations',
    h2: 'Gujarat Crime Reports, Legal Proceedings, Cyber Security & Safety',
    url: 'https://www.gujaratpost.in/category/crime',
  },

  // 7. Business
  business: {
    title: 'Business News, Share Market, Economy, Finance | Gujarat Post',
    description: 'Get live business news, stock market updates, Sensex & Nifty trends, economy, banking, startups, and personal finance news on Gujarat Post.',
    keywords: ['Business News', 'Share Market', 'બિઝનેસ સમાચાર', 'Stock Market News', 'Sensex Nifty', 'Economy News', 'Startups', 'Gujarat Post'],
    h1: 'Business News, Stock Market Live, Economy & Financial Trends',
    h2: 'Sensex & Nifty Updates, Banking, Corporate News, Startups',
    url: 'https://www.gujaratpost.in/category/business',
  },

  // 8. Sports
  sports: {
    title: 'Sports News, Cricket Live Score, Football, Tennis | Gujarat Post',
    description: 'Latest sports news, live cricket scores, IPL updates, Team India matches, football, badminton, athletics, and tournament results on Gujarat Post.',
    keywords: ['Sports News', 'Cricket News', 'સ્પોર્ટ્સ સમાચાર', 'IPL Live', 'Cricket Score', 'Team India', 'Football', 'Gujarat Post'],
    h1: 'Sports News, Cricket Scores, IPL Updates & Tournament Highlights',
    h2: 'Live Cricket Match Coverage, Football, Olympics, Player Interviews',
    url: 'https://www.gujaratpost.in/category/sports',
  },

  // 9. Entertainment
  entertainment: {
    title: 'Entertainment News, Bollywood, OTT, Cinema | Gujarat Post',
    description: 'Catch all the latest entertainment news, Bollywood gossip, movie reviews, OTT web series releases, Dhollywood updates, and celebrity interviews on Gujarat Post.',
    keywords: ['Entertainment News', 'Bollywood News', 'મનોરંજન સમાચાર', 'Movie Reviews', 'OTT Releases', 'Dhollywood News', 'Celebrities', 'Gujarat Post'],
    h1: 'Entertainment News, Bollywood Gossip, Movie Reviews & OTT Releases',
    h2: 'Dhollywood Updates, Celebrity Interviews, Box Office Collection',
    url: 'https://www.gujaratpost.in/category/entertainment',
  },
  manoranjan: {
    title: 'Entertainment News, Bollywood, OTT, Cinema | Gujarat Post',
    description: 'Catch all the latest entertainment news, Bollywood gossip, movie reviews, OTT web series releases, Dhollywood updates, and celebrity interviews on Gujarat Post.',
    keywords: ['Entertainment News', 'Bollywood News', 'મનોરંજન સમાચાર', 'Movie Reviews', 'OTT Releases', 'Gujarat Post'],
    h1: 'Entertainment News, Bollywood Gossip, Movie Reviews & OTT Releases',
    h2: 'Dhollywood Updates, Celebrity Interviews, Box Office Collection',
    url: 'https://www.gujaratpost.in/category/entertainment',
  },
  'entertainment-life-style': {
    title: 'Entertainment & Lifestyle News, Bollywood, Trends | Gujarat Post',
    description: 'Latest entertainment and lifestyle news, Bollywood updates, fashion trends, celebrity lifestyle, and leisure stories on Gujarat Post.',
    keywords: ['Entertainment News', 'Lifestyle News', 'મનોરંજન લાઈફસ્ટાઈલ', 'Fashion Trends', 'Bollywood', 'Gujarat Post'],
    h1: 'Entertainment & Lifestyle News, Celebrity Buzz, Fashion & Living',
    h2: 'Bollywood Lifestyle, Trend Reports, Entertainment Features & Reviews',
    url: 'https://www.gujaratpost.in/category/entertainment-life-style',
  },

  // 10. Technology
  technology: {
    title: 'Technology News, Gadgets, AI, Smartphone Reviews | Gujarat Post',
    description: 'Latest technology news, smartphone launches, artificial intelligence trends, gadget reviews, cybersecurity alerts, and tech updates on Gujarat Post.',
    keywords: ['Technology News', 'Tech News', 'ટેકનોલોજી સમાચાર', 'Gadget Reviews', 'Smartphone News', 'AI News', 'Tech Guides', 'Gujarat Post'],
    h1: 'Technology News, Smartphone Launches, Gadget Reviews & AI Trends',
    h2: 'Artificial Intelligence, Cyber Security, Tech Guides & Innovation',
    url: 'https://www.gujaratpost.in/category/technology',
  },
  tech: {
    title: 'Technology News, Gadgets, AI, Smartphone Reviews | Gujarat Post',
    description: 'Latest technology news, smartphone launches, artificial intelligence trends, gadget reviews, cybersecurity alerts, and tech updates on Gujarat Post.',
    keywords: ['Technology News', 'Tech News', 'ટેકનોલોજી સમાચાર', 'Gadgets', 'AI News', 'Gujarat Post'],
    h1: 'Technology News, Smartphone Launches, Gadget Reviews & AI Trends',
    h2: 'Artificial Intelligence, Cyber Security, Tech Guides & Innovation',
    url: 'https://www.gujaratpost.in/category/technology',
  },

  // 11. Health
  health: {
    title: 'Health News, Wellness Tips, Fitness, Ayurveda | Gujarat Post',
    description: 'Discover top health news, medical discoveries, healthy diet tips, mental wellness, fitness routines, and Ayurveda lifestyle advice on Gujarat Post.',
    keywords: ['Health News', 'Wellness Tips', 'આરોગ્ય સમાચાર', 'Fitness Tips', 'Diet Nutrition', 'Ayurveda Advice', 'Mental Health', 'Gujarat Post'],
    h1: 'Health News, Medical Discoveries, Wellness & Nutrition Tips',
    h2: 'Ayurveda Advice, Fitness Routines, Mental Wellness & Healthy Living',
    url: 'https://www.gujaratpost.in/category/health',
  },

  // 12. Lifestyle
  lifestyle: {
    title: 'Lifestyle News, Fashion, Travel, Relationships, Home | Gujarat Post',
    description: 'Read latest lifestyle news, fashion trends, travel guides, home decor ideas, relationship advice, and culture stories on Gujarat Post.',
    keywords: ['Lifestyle News', 'Fashion Trends', 'લાઇફસ્ટાઇલ સમાચાર', 'Travel Guides', 'Relationship Advice', 'Culture', 'Home Decor', 'Gujarat Post'],
    h1: 'Lifestyle News, Fashion Trends, Travel Guides & Culture Stories',
    h2: 'Home Decor Ideas, Relationship Advice, Living Well & Daily Tips',
    url: 'https://www.gujaratpost.in/category/lifestyle',
  },

  // 13. Education
  education: {
    title: 'Education News, Exam Results, Career Guidance | Gujarat Post',
    description: 'Get latest education news, board exam results, university admissions, scholarship announcements, and career guidance advice on Gujarat Post.',
    keywords: ['Education News', 'Exam Results', 'શિક્ષણ સમાચાર', 'GSEB Results', 'Board Exams', 'Career Guidance', 'College Admissions', 'Gujarat Post'],
    h1: 'Education News, Board Exam Results, Admissions & Career Advice',
    h2: 'GSEB Updates, Competitive Exams, University Alerts & Scholarships',
    url: 'https://www.gujaratpost.in/category/education',
  },

  // 14. Weather & Rainfall
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

  // 15. Trending
  trending: {
    title: 'Trending News, Viral Stories, Social Media Buzz | Gujarat Post',
    description: 'Discover trending news, viral videos, social media buzz, popular stories, and trending topics that are captivating readers right now on Gujarat Post.',
    keywords: ['Trending News', 'Viral News', 'ટ્રેન્ડિંગ સમાચાર', 'Viral Videos', 'Social Media Trends', 'Popular Stories', 'Gujarat Post'],
    h1: 'Trending News, Viral Videos, Top Social Media Stories & Buzz',
    h2: 'What is Going Viral Today, Popular Internet Stories, Must-Read Topics',
    url: 'https://www.gujaratpost.in/category/trending',
  },
  tranding: {
    title: 'Trending News, Viral Stories, Social Media Buzz | Gujarat Post',
    description: 'Discover trending news, viral videos, social media buzz, popular stories, and trending topics that are captivating readers right now on Gujarat Post.',
    keywords: ['Trending News', 'Viral News', 'ટ્રેન્ડિંગ સમાચાર', 'Viral Videos', 'Gujarat Post'],
    h1: 'Trending News, Viral Videos, Top Social Media Stories & Buzz',
    h2: 'What is Going Viral Today, Popular Internet Stories, Must-Read Topics',
    url: 'https://www.gujaratpost.in/category/trending',
  },

  // 16. Gold & Silver
  'gold-silver': {
    title: 'Gold - Silver Price Today, Bullion Rates in Gujarat | Gujarat Post',
    description: "Check today's gold and silver rates in Gujarat (Ahmedabad, Surat, Rajkot, Vadodara), 22K and 24K bullion prices, market trends on Gujarat Post.",
    keywords: ['Gold Price Today', 'Silver Rate Today', 'સોનું ચાંદી ભાવ', 'Gold Rate Gujarat', 'Bullion News', '24K Gold Rate', 'Gujarat Post'],
    h1: 'Gold - Silver Price Today, Live Bullion Rates & Market Trends',
    h2: '22K & 24K Gold Rates in Ahmedabad, Surat, Rajkot, Vadodara Today',
    url: 'https://www.gujaratpost.in/category/gold-silver',
  },

  // 17. Jobs
  jobs: {
    title: 'Jobs News, Govt Vacancies, Recruitment, Sarkari Bharti | Gujarat Post',
    description: 'Latest job notifications, government recruitment (Sarkari Bharti), GPSC, banking, railway, defense, and private job vacancies on Gujarat Post.',
    keywords: ['Jobs News', 'Sarkari Bharti', 'નોકરી સમાચાર', 'Government Jobs', 'GPSC Recruitment', 'Railway Jobs', 'Bank Vacancy', 'Gujarat Post'],
    h1: 'Jobs News, Government Vacancies, Sarkari Bharti & Recruitment',
    h2: 'Gujarat Govt Job Alerts, GPSC, Banking, Police & Private Vacancies',
    url: 'https://www.gujaratpost.in/category/jobs',
  },

  // 18. Editorial
  editorial: {
    title: 'Editorial News, Opinion, Deep Analysis, Columns | Gujarat Post',
    description: 'Read thought-provoking editorial columns, expert opinions, political analysis, cultural commentary, and op-ed perspectives on Gujarat Post.',
    keywords: ['Editorial News', 'Opinion', 'તંત્રીલેખ', 'Editorial Analysis', 'Columns', 'Op-Ed', 'Gujarat Post'],
    h1: 'Editorial News, Expert Opinions, In-Depth Analysis & Columns',
    h2: 'Socio-Political Perspectives, Op-Ed Commentary, Special Insights',
    url: 'https://www.gujaratpost.in/category/editorial',
  },

  // 19. Photo Gallery
  photos: {
    title: 'Photo Gallery, High-Resolution News Pictures, Visuals | Gujarat Post',
    description: 'Browse stunning photo galleries, HD news pictures, celebrity images, cultural festivals, sports visuals, and breaking event photos on Gujarat Post.',
    keywords: ['Photo Gallery', 'News Photos', 'ફોટો ગેલેરી', 'HD Pictures', 'Celebrity Photos', 'Gujarat Photos', 'Sports Visuals', 'Gujarat Post'],
    h1: 'Photo Gallery, High-Definition News Visuals, Top Picture Stories',
    h2: 'Festivals, Politics, Entertainment, Sports & Daily Visual Highlights',
    url: 'https://www.gujaratpost.in/photos',
  },

  // 20. Election 2027
  'election-2027': {
    title: 'Election 2027 News, Gujarat Assembly Polls, Analysis | Gujarat Post',
    description: 'Complete coverage of Gujarat Assembly elections 2027, political campaigns, party manifestos, candidate lists, voter surveys, and analysis on Gujarat Post.',
    keywords: ['Election 2027', 'Gujarat Assembly Election', 'ચૂંટણી 2027', 'Gujarat Election News', 'Political Campaigns', 'Gujarat Post'],
    h1: 'Election 2027 News, Gujarat Assembly Poll Updates, Campaigns',
    h2: 'Candidate Profiles, Constituency Analysis, Voting Trends & Manifesto',
    url: 'https://www.gujaratpost.in/category/election-2027',
  },

  // 21. Major Gujarat Cities
  ahmedabad: {
    title: 'Ahmedabad News, Ahmedabad Samachar, Breaking City Updates | Gujarat Post',
    description: 'Latest Ahmedabad news, local updates, civic affairs, traffic, AMC developments, crime, business, and cultural events in Ahmedabad on Gujarat Post.',
    keywords: ['Ahmedabad News', 'Ahmedabad Samachar', 'અમદાવાદ સમાચાર', 'AMC News', 'Ahmedabad Breaking News', 'Traffic Ahmedabad', 'Gujarat Post'],
    h1: 'Ahmedabad News, AMC Civic Updates, Breaking Ahmedabad Samachar',
    h2: 'Ahmedabad Traffic, Crime Reports, Real Estate & Local City Events',
    url: 'https://www.gujaratpost.in/category/ahmedabad',
  },
  surat: {
    title: 'Surat News, Surat Samachar, Diamond & Textile City News | Gujarat Post',
    description: 'Get latest Surat news, SMC civic alerts, diamond and textile market updates, crime, traffic, and local stories from Surat on Gujarat Post.',
    keywords: ['Surat News', 'Surat Samachar', 'સુરત સમાચાર', 'SMC News', 'Diamond City News', 'Textile Market Surat', 'Gujarat Post'],
    h1: 'Surat News, Diamond & Textile Updates, Breaking Surat Samachar',
    h2: 'SMC Civic Alerts, Business News, Infrastructure & City Highlights',
    url: 'https://www.gujaratpost.in/category/surat',
  },
  vadodara: {
    title: 'Vadodara News, Vadodara Samachar, Sanskarinagari Updates | Gujarat Post',
    description: 'Read latest Vadodara news, VMC civic updates, cultural happenings, MSU campus news, and crime reports from Vadodara on Gujarat Post.',
    keywords: ['Vadodara News', 'Baroda News', 'વડોદરા સમાચાર', 'VMC News', 'MSU Vadodara', 'Sanskarinagari Updates', 'Gujarat Post'],
    h1: 'Vadodara News, VMC Civic Reports, Breaking Vadodara Samachar',
    h2: 'Sanskarinagari Events, MS University Updates, City Infrastructure',
    url: 'https://www.gujaratpost.in/category/vadodara',
  },
  vadodra: {
    title: 'Vadodara News, Vadodara Samachar, Sanskarinagari Updates | Gujarat Post',
    description: 'Read latest Vadodara news, VMC civic updates, cultural happenings, MSU campus news, and crime reports from Vadodara on Gujarat Post.',
    keywords: ['Vadodara News', 'Baroda News', 'વડોદરા સમાચાર', 'VMC News', 'MSU Vadodara', 'Gujarat Post'],
    h1: 'Vadodara News, VMC Civic Reports, Breaking Vadodara Samachar',
    h2: 'Sanskarinagari Events, MS University Updates, City Infrastructure',
    url: 'https://www.gujaratpost.in/category/vadodara',
  },
  rajkot: {
    title: 'Rajkot News, Rajkot Samachar, Saurashtra News Updates | Gujarat Post',
    description: 'Top Rajkot news, RMC municipal updates, industrial developments, Saurashtra regional reports, crime, and culture from Rajkot on Gujarat Post.',
    keywords: ['Rajkot News', 'Rajkot Samachar', 'રાજકોટ સમાચાર', 'RMC News', 'Saurashtra News', 'Rajkot Industry', 'Gujarat Post'],
    h1: 'Rajkot News, Saurashtra Regional Highlights, Breaking Rajkot Samachar',
    h2: 'RMC Municipal Reports, Engineering Industry, Local Community News',
    url: 'https://www.gujaratpost.in/category/rajkot',
  },
  gandhinagar: {
    title: 'Gandhinagar News, Capital City Samachar, Secretariat Updates | Gujarat Post',
    description: 'Latest Gandhinagar news, Gujarat Secretariat (Sachivalaya) government decisions, policy announcements, GMC updates on Gujarat Post.',
    keywords: ['Gandhinagar News', 'ગાંધીનગર સમાચાર', 'Sachivalaya News', 'GMC Updates', 'Capital City News', 'Gujarat Govt', 'Gujarat Post'],
    h1: 'Gandhinagar News, Gujarat Sachivalaya Directives, Capital City Samachar',
    h2: 'Government Policies, Administrative Directives, GMC Civic Updates',
    url: 'https://www.gujaratpost.in/category/gandhinagar',
  },
  gandhinager: {
    title: 'Gandhinagar News, Capital City Samachar, Secretariat Updates | Gujarat Post',
    description: 'Latest Gandhinagar news, Gujarat Secretariat (Sachivalaya) government decisions, policy announcements, GMC updates on Gujarat Post.',
    keywords: ['Gandhinagar News', 'ગાંધીનગર સમાચાર', 'Sachivalaya News', 'GMC Updates', 'Gujarat Post'],
    h1: 'Gandhinagar News, Gujarat Sachivalaya Directives, Capital City Samachar',
    h2: 'Government Policies, Administrative Directives, GMC Civic Updates',
    url: 'https://www.gujaratpost.in/category/gandhinagar',
  },
  'other-cities': {
    title: 'Gujarat Cities News, District Samachar, Regional Updates | Gujarat Post',
    description: 'Read local news from Bhavnagar, Jamnagar, Junagadh, Kutch, Anand, Mehsana, Morbi, and districts across Gujarat on Gujarat Post.',
    keywords: ['Gujarat District News', 'અન્ય શહેરો સમાચાર', 'Bhavnagar News', 'Jamnagar News', 'Kutch News', 'Morbi News', 'Gujarat Post'],
    h1: 'Gujarat District News, Regional City Reports, Town & Village Updates',
    h2: 'Saurashtra, North Gujarat, Central & South Gujarat District Samachar',
    url: 'https://www.gujaratpost.in/category/other-cities',
  },
  othercities: {
    title: 'Gujarat Cities News, District Samachar, Regional Updates | Gujarat Post',
    description: 'Read local news from Bhavnagar, Jamnagar, Junagadh, Kutch, Anand, Mehsana, Morbi, and districts across Gujarat on Gujarat Post.',
    keywords: ['Gujarat District News', 'અન્ય શહેરો સમાચાર', 'Gujarat Cities', 'Gujarat Post'],
    h1: 'Gujarat District News, Regional City Reports, Town & Village Updates',
    h2: 'Saurashtra, North Gujarat, Central & South Gujarat District Samachar',
    url: 'https://www.gujaratpost.in/category/other-cities',
  },

  // 22. Specific Districts
  bhavnagar: {
    title: 'Bhavnagar News, Bhavnagar Samachar, Alang Port Updates | Gujarat Post',
    description: 'Latest Bhavnagar news, municipal updates, Alang ship-breaking yard news, crime, culture, and coastal developments on Gujarat Post.',
    keywords: ['Bhavnagar News', 'ભાવનગર સમાચાર', 'Alang News', 'Bhavnagar Samachar', 'Gujarat Post'],
    h1: 'Bhavnagar News, Alang Yard Reports, Breaking Bhavnagar Samachar',
    h2: 'Bhavnagar Municipal Corporation, Port Developments & Local Community',
    url: 'https://www.gujaratpost.in/category/bhavnagar',
  },
  jamnagar: {
    title: 'Jamnagar News, Jamnagar Samachar, Brass City Updates | Gujarat Post',
    description: 'Read latest Jamnagar news, Reliance refinery updates, brass parts industry, Marine National Park, and city news on Gujarat Post.',
    keywords: ['Jamnagar News', 'જામનગર સમાચાર', 'Brass City News', 'Jamnagar Samachar', 'Gujarat Post'],
    h1: 'Jamnagar News, Brass City Reports, Breaking Jamnagar Samachar',
    h2: 'Refinery Sector, Marine National Park, Local Community & Civic Alerts',
    url: 'https://www.gujaratpost.in/category/jamnagar',
  },
  junagadh: {
    title: 'Junagadh News, Junagadh Samachar, Gir Forest & Tourism | Gujarat Post',
    description: 'Latest Junagadh news, Gir Somnath lion safari updates, Mount Girnar ropeway, tourism, agriculture, and municipal reports on Gujarat Post.',
    keywords: ['Junagadh News', 'જૂનાગઢ સમાચાર', 'Girnar News', 'Gir Lions', 'Junagadh Samachar', 'Gujarat Post'],
    h1: 'Junagadh News, Mount Girnar & Gir Lion Updates, Junagadh Samachar',
    h2: 'Junagadh Municipal Corporation, Tourism Alerts & Saurashtra Highlights',
    url: 'https://www.gujaratpost.in/category/junagadh',
  },
  kutch: {
    title: 'Kutch News, Bhuj Samachar, Rann of Kutch Updates | Gujarat Post',
    description: 'Top Kutch news, Bhuj, Gandhidham, Kandla and Mundra ports, Rann Utsav festival, earthquake preparedness, border security on Gujarat Post.',
    keywords: ['Kutch News', 'કચ્છ સમાચાર', 'Bhuj News', 'Mundra Port', 'Rann of Kutch', 'Kutch Samachar', 'Gujarat Post'],
    h1: 'Kutch News, Bhuj & Port Updates, Breaking Kutch Samachar',
    h2: 'Mundra & Kandla Port News, Rann Utsav Highlights, Border Security',
    url: 'https://www.gujaratpost.in/category/kutch',
  },
  anand: {
    title: 'Anand News, Milk City Samachar, Amul Dairy Updates | Gujarat Post',
    description: 'Latest Anand news, Amul dairy developments, Charotar agricultural updates, Vidyanagar student campus news on Gujarat Post.',
    keywords: ['Anand News', 'આણંદ સમાચાર', 'Amul News', 'Charotar News', 'Vallabh Vidyanagar', 'Gujarat Post'],
    h1: 'Anand News, Milk City & Amul Dairy Highlights, Charotar Samachar',
    h2: 'Vallabh Vidyanagar Education News, Agriculture & Civic Updates',
    url: 'https://www.gujaratpost.in/category/anand',
  },
  mehsana: {
    title: 'Mehsana News, North Gujarat Samachar, Dudhsagar Dairy | Gujarat Post',
    description: 'Top Mehsana news, North Gujarat regional affairs, Dudhsagar dairy, agriculture, oil & gas industry updates on Gujarat Post.',
    keywords: ['Mehsana News', 'મહેસાણા સમાચાર', 'North Gujarat News', 'Dudhsagar Dairy', 'Gujarat Post'],
    h1: 'Mehsana News, North Gujarat Regional Coverage, Mehsana Samachar',
    h2: 'Dudhsagar Dairy Developments, Agriculture, Industry & Town Alerts',
    url: 'https://www.gujaratpost.in/category/mehsana',
  },
  morbi: {
    title: 'Morbi News, Ceramic Capital Samachar, Industrial Updates | Gujarat Post',
    description: 'Latest Morbi news, ceramic tile manufacturing, clock making industry, civic infrastructure, and local business reports on Gujarat Post.',
    keywords: ['Morbi News', 'મોરબી સમાચાર', 'Ceramic City News', 'Morbi Samachar', 'Morbi Industry', 'Gujarat Post'],
    h1: 'Morbi News, Ceramic Capital Updates, Breaking Morbi Samachar',
    h2: 'Ceramic Export News, Industrial Directives, Infrastructure & Local Alerts',
    url: 'https://www.gujaratpost.in/category/morbi',
  },

  // 23. Special formats
  videos: {
    title: 'Videos, Latest News Video Clips, Interviews | Gujarat Post',
    description: 'Watch latest video news bulletins, exclusive ground reports, political interviews, viral videos, and entertainment clips on Gujarat Post.',
    keywords: ['Video News', 'News Videos', 'વીડિયો સમાચાર', 'Gujarat Post Videos', 'News Clips', 'Gujarat Post'],
    h1: 'Video News, High-Impact News Bulletins & Ground Reports',
    h2: 'Political Interviews, Viral Video Clips, Explainer Videos & Bulletins',
    url: 'https://www.gujaratpost.in/videos',
  },
  shorts: {
    title: 'Shorts, Fast 60-Second Video News, Quick Bites | Gujarat Post',
    description: 'Watch bite-sized news shorts, fast 60-second updates, top highlights, and trending reels on Gujarat Post.',
    keywords: ['News Shorts', 'શોર્ટ્સ', 'Quick News', 'Short Videos', 'Reels News', 'Gujarat Post'],
    h1: 'News Shorts, Rapid 60-Second Video News & Key Headlines',
    h2: 'Trending Quick Bites, Viral Reels, Instant News Updates & Stories',
    url: 'https://www.gujaratpost.in/shorts',
  },
  webstory: {
    title: 'Web Stories, Visual Web Stories, Photos & Tips | Gujarat Post',
    description: 'Immerse in visual web stories, photo slideshows, quick lifestyle tips, entertainment gossip, and travel guides on Gujarat Post.',
    keywords: ['Web Stories', 'વેબસ્ટોરી', 'Visual Stories', 'Photo Stories', 'Webstory Gujarat', 'Gujarat Post'],
    h1: 'Web Stories, Visual Storytelling & Engaging Slide Highlights',
    h2: 'Trending Lifestyle Web Stories, Entertainment Visuals & Travel Tips',
    url: 'https://www.gujaratpost.in/category/webstory',
  },
};

/**
 * Robust SEO Resolver for any category slug.
 * If slug exists in CATEGORY_CUSTOM_SEO, returns exact custom SEO.
 * If not, automatically constructs full SEO metadata (Title, Meta Description, Keywords, H1, H2, URL)
 * so that 100% of categories receive professional search engine optimization.
 */
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
  gujarat: "gujarat",
  state: "gujarat",
  national: "national",
  world: "world",
  politics: "politics",
  crime: "crime",
  health: "health",
  entertainment: "entertainment",
  technology: "technology",
  photos: "photos",
  "fact-check": "fact-check",
  factcheck: "fact-check",
  trending: "trending",
  "election-2027": "election-2027",
  ahmedabad: "ahmedabad",
  gandhinagar: "gandhinagar",
  gandhinager: "gandhinagar",
  rajkot: "rajkot",
  surat: "surat",
  vadodara: "vadodara",
  vadodra: "vadodara",
  "other-cities": "other-cities",
  othercities: "other-cities",
  "other-city": "other-cities",
  other: "other-cities",
  business: "business",
  sports: "sports",
  lifestyle: "lifestyle",
  education: "education",
  varsad: "varsad",
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
  const raw = getLocalized(language, { en: article?.excerpt || '', gu: article?.excerptGu || '', hi: article?.excerptHi || '' });
  return cleanArticlePlainText(raw);
};

export const getArticleExcerptHtml = (article: Article, language: Language) => {
  const raw = getLocalized(language, { en: article?.excerpt || '', gu: article?.excerptGu || '', hi: article?.excerptHi || '' });
  return decodeHtmlEntities(raw).replace(/!\[.*?\]\(.*?\)/g, '').trim();
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

  const richest = available.reduce((best, entry) => (entry.score > best.score ? entry : best), available[0]);
  const preferredScore = getContentScore(preferred);

  const selected = preferredScore >= richest.score * 0.6 ? preferred : richest.content;
  return cleanLiteralEscapeSequences(selected);
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

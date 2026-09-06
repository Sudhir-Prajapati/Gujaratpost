import { Article, Author, NavItem, Photo, Video, Language } from '@/types';
import { toGu, toGuLocal, toGuDigits, formatViews, formatDate, formatTime, slugify } from '@/lib/utils';

export { toGu, toGuLocal, toGuDigits, formatViews, formatDate, formatTime, slugify };

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://gujaratpost.com';

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

export function decodeHtmlEntities(value?: string | null): string {
  return normalizeDisplayText(value)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

export function cleanArticlePlainText(value?: string | null): string {
  return decodeHtmlEntities(value)
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<\/?(p|div|br|h[1-6]|li|ul|ol|blockquote|figure|figcaption)[^>]*>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*_`~>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
  videos: { name: 'Videos', gu: 'વીડિયો', hi: 'वीडियो' },
  shorts: { name: 'Shorts', gu: 'શોર્ટ્સ', hi: 'शॉर्ट्स' },
  podcasts: { name: 'Podcasts', gu: 'પોડકાસ્ટ', hi: 'पॉडकास्ट' },
  varsad: { name: 'Rainfall', gu: 'વરસાદ', hi: 'वर्षा' },
  rain: { name: 'Rainfall', gu: 'વરસાદ', hi: 'वर्षा' },
  weather: { name: 'Weather', gu: 'હવામાન', hi: 'मौसम' },
  'gold-silver': { name: 'Gold - Silver', gu: 'ગોલ્ડ - સિલ્વર', hi: 'गोल्ड - सिल्वर' },
  webstory: { name: 'Webstory', gu: 'વેબસ્ટોરી', hi: 'वेब स्टोरीज' },
};

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
  trending: "trending",
  "election-2027": "election-2027",
  ahmedabad: "ahmedabad",
  gandhinagar: "gandhinagar",
  rajkot: "rajkot",
  surat: "surat",
  vadodara: "vadodara",
  "other-cities": "other-cities",
  otherCities: "other-cities",
  business: "business",
  sports: "sports",
  lifestyle: "lifestyle",
  education: "education",
  varsad: "varsad",
};

export const NAV_ITEMS: NavItem[] = [
  ['Home', 'મુખ્ય', 'મુખ્ય', '/'],
  ['Videos', 'વીડિયો', 'વીડિયો', '/videos'],
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
  ['Instagram', 'ઇન્સ્ટાગ્રામ', 'ઇન્સ્ટાગ્રામ', '/category/instagram'],
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
  ['Shorts', 'શોર્ટ્સ', 'શોર્ટ્સ', '/shorts'],
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

  return preferredScore >= richest.score * 0.6 ? preferred : richest.content;
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
  const meta = CATEGORY_META[catLower];

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
    'national': 'રાષ્ટ્રીય',
    'india': 'દેશ / રાષ્ટ્રીય',
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
    'national': 'राष्ट्रीय',
    'india': 'देश',
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

  return normalizeDisplayText(rawCat.toUpperCase() || 'NEWS');
};

export const getLocationLabel = (article: Article | { location?: string }, language: Language) => {
  const loc = article?.location?.trim();
  if (!loc) return '';
  const locLower = loc.toLowerCase();

  const guMap: Record<string, string> = {
    'national': 'રાષ્ટ્રીય',
    'india': 'રાષ્ટ્રીય',
    'desh': 'દેશ',
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

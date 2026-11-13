import type { Article } from '@/types';

/**
 * Normalizes any category identifier (English name, Gujarati name, Hindi name, or slug)
 * into a canonical lowercase category key.
 */
export function normalizeCategory(cat?: string | null): string {
  if (!cat) return '';
  const clean = String(cat)
    .toLowerCase()
    .trim()
    .replace(/[\s\-_]+/g, '');

  if (['national', 'india', 'bharat', 'desh', 'ભારત', 'भारत'].some((k) => clean.includes(k.replace(/[\s\-_]+/g, '')))) return 'national';
  if (['gujarat', 'state', 'ગુજરાત', 'गुजरात'].some((k) => clean.includes(k.replace(/[\s\-_]+/g, '')))) return 'gujarat';
  if (['world', 'international', 'global', 'videsh', 'વિશ્વ', 'विश्व'].some((k) => clean.includes(k.replace(/[\s\-_]+/g, '')))) return 'world';
  if (['politics', 'rajkaran', 'rajneeti', 'રાજનીતિ', 'રાજકારણ', 'राजनीति'].some((k) => clean.includes(k.replace(/[\s\-_]+/g, '')))) return 'politics';
  if (['entertainment', 'manoranjan', 'cinema', 'bollywood', 'movies', 'મનોરંજન', 'मनोरंजन'].some((k) => clean.includes(k.replace(/[\s\-_]+/g, '')))) return 'entertainment';
  if (['sports', 'ramatgamat', 'khel', 'cricket', 'સ્પોર્ટ્સ', 'રમતગમત', 'રમત-ગમત', 'खेल'].some((k) => clean.includes(k.replace(/[\s\-_]+/g, '')))) return 'sports';
  if (['technology', 'tech', 'ટેકનોલોજી', 'ટેક્નોલોજી', 'टेक्नोलॉजी'].some((k) => clean.includes(k.replace(/[\s\-_]+/g, '')))) return 'technology';
  if (['business', 'vyapar', 'market', 'gold', 'બિઝનેસ', 'વેપાર', 'बिजनेस'].some((k) => clean.includes(k.replace(/[\s\-_]+/g, '')))) return 'business';
  if (['crime', 'gunho', 'crimebranch', 'ક્રાઇમ', 'ક્રાઈમ', 'क्राइम'].some((k) => clean.includes(k.replace(/[\s\-_]+/g, '')))) return 'crime';
  if (['health', 'swasthya', 'arogya', 'હેલ્થ', 'સ્વાસ્થ્ય', 'આરોગ્ય'].some((k) => clean.includes(k.replace(/[\s\-_]+/g, '')))) return 'health';
  if (['education', 'shikshan', 'vidya', 'શિક્ષણ', 'शिक्षा'].some((k) => clean.includes(k.replace(/[\s\-_]+/g, '')))) return 'education';
  if (['lifestyle', 'jeevan', 'લાઇફસ્ટાઇલ', 'લાઇફ-સ્ટાઇલ', 'लाइफस्टाइल'].some((k) => clean.includes(k.replace(/[\s\-_]+/g, '')))) return 'lifestyle';
  if (['factcheck', 'ફેક્ટચેક', 'ફૅક્ટચેક', 'ફેક્ટ'].some((k) => clean.includes(k.replace(/[\s\-_]+/g, '')))) return 'fact-check';
  if (['election', 'ચૂંટણી', 'ચૂંટણી2027', 'chunav'].some((k) => clean.includes(k.replace(/[\s\-_]+/g, '')))) return 'election';

  // Gujarat city subcategories
  if (['ahmedabad', 'અમદાવાદ', 'अहमदाबाद'].some((k) => clean.includes(k.replace(/[\s\-_]+/g, '')))) return 'ahmedabad';
  if (['surat', 'સુરત', 'सूरत'].some((k) => clean.includes(k.replace(/[\s\-_]+/g, '')))) return 'surat';
  if (['vadodara', 'વડોદરા', 'वडोदरा'].some((k) => clean.includes(k.replace(/[\s\-_]+/g, '')))) return 'vadodara';
  if (['rajkot', 'રાજકોટ', 'રાજકોટ'].some((k) => clean.includes(k.replace(/[\s\-_]+/g, '')))) return 'rajkot';
  if (['gandhinagar', 'ગાંધીનગર', 'गांधीनगर'].some((k) => clean.includes(k.replace(/[\s\-_]+/g, '')))) return 'gandhinagar';
  if (['bhavnagar', 'ભાવનગર'].some((k) => clean.includes(k))) return 'bhavnagar';
  if (['jamnagar', 'જામનગર'].some((k) => clean.includes(k))) return 'jamnagar';
  if (['kutch', 'કચ્છ'].some((k) => clean.includes(k))) return 'kutch';
  if (['junagadh', 'જૂનાગઢ'].some((k) => clean.includes(k))) return 'junagadh';

  return clean;
}

const GUJARAT_CITIES = new Set([
  'ahmedabad', 'surat', 'vadodara', 'rajkot', 'gandhinagar',
  'bhavnagar', 'jamnagar', 'kutch', 'junagadh', 'morbi', 'mehsana', 'anand'
]);

/**
 * Returns true if candidate article belongs to the same category as the target article.
 */
export function isSameCategory(item: Article | null | undefined, target: Article | null | undefined): boolean {
  if (!item || !target) return false;

  // 1. Direct Category ID match
  if (item.categoryId && target.categoryId && String(item.categoryId).trim() === String(target.categoryId).trim()) {
    return true;
  }

  // 2. Canonical category key match
  const catA = normalizeCategory(item.categorySlug || item.category || item.categoryGu || item.categoryHi);
  const catB = normalizeCategory(target.categorySlug || target.category || target.categoryGu || target.categoryHi);
  if (catA && catB && catA === catB) {
    return true;
  }

  // 3. Gujarati category string exact match
  if (item.categoryGu && target.categoryGu && item.categoryGu.trim() === target.categoryGu.trim()) {
    return true;
  }

  // 4. City subcategory under Gujarat parent match
  if (
    (catA === 'gujarat' && GUJARAT_CITIES.has(catB)) ||
    (catB === 'gujarat' && GUJARAT_CITIES.has(catA))
  ) {
    return true;
  }

  return false;
}

/**
 * Get article published/created timestamp in ms.
 */
export function getArticleTimestamp(art: Article | null | undefined): number {
  if (!art) return 0;
  const pubDateStr = art.publishedAt || (art as any).createdAt;
  if (!pubDateStr) return 0;
  if (pubDateStr instanceof Date) return (pubDateStr as Date).getTime();
  const time = new Date(pubDateStr).getTime();
  return isNaN(time) ? 0 : time;
}

/**
 * Get auto-incrementing article number.
 */
export function getArticleNumber(art: Article | null | undefined): number {
  if (!art) return 0;
  return typeof (art as any).articleNumber === 'number' ? (art as any).articleNumber : 0;
}

/**
 * Calculate age in days relative to reference time.
 */
export function getArticleAgeDays(art: Article | null | undefined, refTime = Date.now()): number {
  const pubTime = getArticleTimestamp(art);
  if (pubTime <= 0) return 999;
  return Math.max(0, (refTime - pubTime) / (1000 * 60 * 60 * 24));
}

/**
 * Sort articles strictly by recency: newest timestamp first,
 * with articleNumber descending as tie-breaker.
 */
export function sortArticlesByNewest(articles: Article[]): Article[] {
  return [...articles].sort((a, b) => {
    const timeA = getArticleTimestamp(a);
    const timeB = getArticleTimestamp(b);
    // If difference is more than 2 minutes, order strictly by published timestamp
    if (Math.abs(timeA - timeB) > 120000) {
      return timeB - timeA;
    }
    // Otherwise break tie using higher auto-increment articleNumber
    return getArticleNumber(b) - getArticleNumber(a);
  });
}


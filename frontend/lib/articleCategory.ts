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

  // 1b. Multi-category ID match (via categories or categoryIds arrays)
  const itemCatIds = new Set<string>();
  if (item.categoryId) itemCatIds.add(String(item.categoryId).trim());
  if (Array.isArray((item as any).categories)) {
    for (const c of (item as any).categories) {
      const id = typeof c === 'string' ? c : (c?.categoryId || c?.id);
      if (id) itemCatIds.add(String(id).trim());
    }
  }
  if (Array.isArray((item as any).categoryIds)) {
    for (const id of (item as any).categoryIds) {
      if (id) itemCatIds.add(String(id).trim());
    }
  }

  const targetCatIds = new Set<string>();
  if (target.categoryId) targetCatIds.add(String(target.categoryId).trim());
  if (Array.isArray((target as any).categories)) {
    for (const c of (target as any).categories) {
      const id = typeof c === 'string' ? c : (c?.categoryId || c?.id);
      if (id) targetCatIds.add(String(id).trim());
    }
  }
  if (Array.isArray((target as any).categoryIds)) {
    for (const id of (target as any).categoryIds) {
      if (id) targetCatIds.add(String(id).trim());
    }
  }

  for (const id of itemCatIds) {
    if (targetCatIds.has(id)) return true;
  }

  // 2. Canonical category key match
  const catA = normalizeCategory(item.categorySlug || item.category || item.categoryGu || item.categoryHi);
  const catB = normalizeCategory(target.categorySlug || target.category || target.categoryGu || target.categoryHi);
  if (catA && catB && catA === catB) {
    return true;
  }

  // 2b. Multi-category normalized slugs/names match
  const getArticleNormalizedCats = (art: any): Set<string> => {
    const set = new Set<string>();
    const primary = normalizeCategory(art.categorySlug || art.category || art.categoryGu || art.categoryHi);
    if (primary) set.add(primary);
    if (Array.isArray(art.categories)) {
      for (const c of art.categories) {
        const slug = normalizeCategory(c?.category?.slug || c?.category?.name || c?.slug || c?.name || c?.nameGu);
        if (slug) set.add(slug);
      }
    }
    return set;
  };

  const itemCats = getArticleNormalizedCats(item);
  const targetCats = getArticleNormalizedCats(target);
  for (const c of itemCats) {
    if (targetCats.has(c)) return true;
    if (
      (c === 'gujarat' && [...targetCats].some((t) => GUJARAT_CITIES.has(t))) ||
      (targetCats.has('gujarat') && GUJARAT_CITIES.has(c))
    ) {
      return true;
    }
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

/**
 * Determines whether a category string or slug belongs to soft-news / lifestyle / feature categories:
 * - Health / Wellness / Lifestyle (હેલ્થ / સ્વાસ્થ્ય / આરોગ્ય / લાઈફસ્ટાઈલ)
 * - Technology / Gadgets (ટેકનોલોજી / ટેક્નોલોજી / ટેક)
 * - Entertainment / Cinema / Bollywood / Manoranjan (મનોરંજન / સિનેમા / બોલિવૂડ / ફિલ્મ)
 */
export function isSoftNewsCategoryString(str?: string | null): boolean {
  if (!str) return false;
  const clean = String(str).toLowerCase().trim().replace(/[\s\-_]+/g, '');
  if (!clean) return false;

  // 1. Health / Wellness / Lifestyle
  if (
    clean === 'health' ||
    clean === 'helth' ||
    clean === 'lifestyle' ||
    clean.includes('health') ||
    clean.includes('હેલ્થ') ||
    clean.includes('સ્વાસ્થ્ય') ||
    clean.includes('આરોગ્ય') ||
    clean.includes('swasthya') ||
    clean.includes('arogya') ||
    clean.includes('lifestyle') ||
    clean.includes('લાઇફસ્ટાઇલ') ||
    clean.includes('લાઈફસ્ટાઈલ') ||
    clean.includes('fitness') ||
    clean.includes('તંદુરસ્તી') ||
    clean.includes('ayurved')
  ) {
    return true;
  }

  // 2. Technology / Tech / Gadgets
  if (
    clean === 'technology' ||
    clean === 'tech' ||
    clean === 'gadgets' ||
    clean.includes('technology') ||
    clean.includes('tech') ||
    clean.includes('ટેકનોલોજી') ||
    clean.includes('ટેક્નોલોજી') ||
    clean.includes('ટેકનો') ||
    clean.includes('ટેક્નો') ||
    clean.includes('टेक्नोलॉजी') ||
    clean.includes('तकनीक') ||
    clean.includes('gadget')
  ) {
    return true;
  }

  // 3. Entertainment / Cinema / Bollywood / Manoranjan
  if (
    clean === 'entertainment' ||
    clean === 'manoranjan' ||
    clean === 'cinema' ||
    clean === 'bollywood' ||
    clean.includes('entertainment') ||
    clean.includes('manoranjan') ||
    clean.includes('મનોરંજન') ||
    clean.includes('એન્ટરટેઈનમેન્ટ') ||
    clean.includes('मनोरंजन') ||
    clean.includes('bollywood') ||
    clean.includes('બોલિવૂડ') ||
    clean.includes('બોલીવુડ') ||
    clean.includes('સિનેમા') ||
    clean.includes('cinema') ||
    clean.includes('movies') ||
    clean.includes('ફિલ્મ') ||
    clean.includes('film')
  ) {
    return true;
  }

  return false;
}

/**
 * Determines if an article solely/exclusively belongs to soft-news categories:
 * Health (હેલ્થ), Technology (ટેકનોલોજી), or Entertainment (મનોરંજન).
 * Standalone health, tech, and entertainment stories are strictly excluded from
 * "Latest News" (લેટેસ્ટ સમાચાર) and general story suggestions/recommendations.
 * (If an article also has hard news categories like Gujarat, Politics, Crime, National, etc., it is kept).
 */
export function isExcludedFromLatestNews(cand: any): boolean {
  if (!cand) return false;

  // 1. Check all entries in categories array if present
  if (Array.isArray(cand.categories) && cand.categories.length > 0) {
    const validCats = cand.categories.filter(Boolean);
    if (validCats.length > 0) {
      const hasSoft = validCats.some((c: any) =>
        isSoftNewsCategoryString(c?.slug) ||
        isSoftNewsCategoryString(c?.name) ||
        isSoftNewsCategoryString(c?.nameGu) ||
        isSoftNewsCategoryString(c?.nameHi) ||
        isSoftNewsCategoryString(c?.category?.slug) ||
        isSoftNewsCategoryString(c?.category?.name) ||
        isSoftNewsCategoryString(c?.category?.nameGu)
      );

      if (hasSoft) {
        // Check if there are other categories that are NOT soft news (i.e. Hard news)
        const hasHardNews = validCats.some((c: any) => {
          const s = c?.slug || c?.category?.slug || '';
          const n = c?.name || c?.nameGu || c?.category?.name || c?.category?.nameGu || '';
          return !isSoftNewsCategoryString(s) && !isSoftNewsCategoryString(n);
        });

        // If it has NO hard news categories, it is solely soft news (health, tech, or entertainment)!
        if (!hasHardNews) {
          return true;
        }
        // It has other hard news categories (e.g. Gujarat, Politics, Crime, National), so it's a hard news story
        return false;
      }
    }
  }

  // 2. Check primary category fields
  const primarySlug = cand.categorySlug || cand.category?.slug || '';
  const primaryName = cand.category || cand.categoryGu || cand.categoryHi || cand.category?.name || cand.category?.nameGu || '';

  if (isSoftNewsCategoryString(primarySlug) || isSoftNewsCategoryString(primaryName)) {
    return true;
  }

  return false;
}

/**
 * Backward compatibility alias so all existing callers of isSolelyHealthArticle
 * automatically exclude Health, Technology, and Entertainment from Latest News & suggestions.
 */
export const isSolelyHealthArticle = isExcludedFromLatestNews;




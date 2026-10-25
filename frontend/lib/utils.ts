import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS class names efficiently.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns standard English digits (0-9) for all input numbers/strings.
 * Converts any Gujarati digits back to standard English numerals.
 */
export function toGu(num: number | string): string {
  const guToEng: Record<string, string> = {
    '૦': '0', '૧': '1', '૨': '2', '૩': '3', '૪': '4',
    '૫': '5', '૬': '6', '૭': '7', '૮': '8', '૯': '9'
  };
  return String(num).replace(/[૦-૯]/g, (d) => guToEng[d] || d);
}

// Backward compatibility aliases
export const toGuDigits = toGu;
export const toGuLocal = toGu;

/**
 * Formats view count numbers into clean short strings (e.g. 1.5L, 82K).
 */
export function formatViews(value: number): string {
  if (!value || isNaN(value)) return "0";
  if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return String(value);
}

export function formatDate(dateStr: string, language?: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr || '';

    let activeLang = language;
    if (!activeLang && typeof document !== 'undefined') {
      activeLang = document.documentElement.lang || 'gu';
    }
    if (!activeLang) activeLang = 'gu';

    if (activeLang === 'gu') {
      const monthGu = ['જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન', 'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર'][d.getMonth()];
      return `${d.getDate()} ${monthGu}, ${d.getFullYear()}`;
    }
    if (activeLang === 'hi') {
      const monthHi = ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'][d.getMonth()];
      return `${d.getDate()} ${monthHi}, ${d.getFullYear()}`;
    }

    return d.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Formats ISO date string into 12-hour time (e.g. "10:00 AM").
 */
export function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/**
 * Checks if a date string has a specific time (hours/minutes) or is date-only / midnight.
 */
export function hasSpecificTime(dateStr?: string | null): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const str = dateStr.trim();
  if (!str) return false;
  if (/^\d{4}-\d{2}-\d{2}$/.test(str) || /^\d{2}\/\d{2}\/\d{4}$/.test(str)) return false;
  if (str.includes('T00:00:00') || str.endsWith(' 00:00:00') || str.endsWith(' 00:00')) return false;
  const d = new Date(str);
  if (isNaN(d.getTime())) return false;
  return true;
}

/**
 * Formats article release/update timestamp as:
 * - "Oct 24, 2026 | 8:17 AM" (if time is present)
 * - "Oct 24, 2026" (if date only / time not present)
 */
export function formatArticleDateTime(dateStr?: string | null): string {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const str = dateStr.trim();
  if (!str) return '';

  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(str) || /^\d{2}\/\d{2}\/\d{4}$/.test(str);
  const isMidnight = str.includes('T00:00:00') || str.endsWith(' 00:00:00') || str.endsWith(' 00:00');
  const hasTime = !isDateOnly && !isMidnight;

  let d: Date;
  if (isDateOnly && /^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const parts = str.split('-').map(Number);
    d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12, 0, 0));
  } else {
    d = new Date(str);
  }

  if (isNaN(d.getTime())) return '';

  let datePart = '';
  try {
    datePart = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    });
  } catch {
    datePart = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  if (!hasTime) {
    return datePart;
  }

  let timePart = '';
  try {
    timePart = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  } catch {
    timePart = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  return timePart ? `${datePart} | ${timePart}` : datePart;
}

/**
 * Slugifies string for URL generation.
 */
export function slugify(value: string): string {
  if (!value) return '';
  // Try standard Latin-safe slugify first
  const latin = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  // If we got a valid slug from Latin characters, use it
  if (latin && latin.length >= 3) return latin;
  // For non-Latin scripts (Gujarati, Hindi, etc.), build a slug from
  // a safe prefix + timestamp so it is always non-empty and unique
  const prefix = 'gujaratpost-news';
  const ts = Date.now().toString(36); // e.g. "lkj3x"
  return `${prefix}-${ts}`;
}

/**
 * Category color code mapping for UI tags and badges.
 */
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    Gujarat: '#c0392b',
    State: '#c0392b',
    Ahmedabad: '#c0392b',
    Rajkot: '#c0392b',
    Surat: '#c0392b',
    Vadodara: '#c0392b',
    Crime: '#8e44ad',
    Politics: '#2980b9',
    Business: '#16a085',
    Sports: '#e67e22',
    Entertainment: '#d35400',
    Technology: '#2471a3',
    Lifestyle: '#1abc9c',
    Education: '#27ae60',
    World: '#7f8c8d',
    'Gujarat Election 2027': '#c0392b',
  };
  return colors[category] || '#c0392b';
}

/**
 * Maps a trending topic tag (e.g. "# ચૂંટણી 2026", "# વરસાદ", "# ગોલ્ડ - સિલ્વર")
 * to its matching navbar category/page route if available, otherwise redirects to /search.
 */
export function getTrendingTopicHref(tag: string): string {
  if (!tag) return '/search';

  const clean = tag.replace(/^#/, '').trim();
  const lower = clean.toLowerCase();

  // Standard Main Navbar Category & Page Mappings ONLY
  const categoryMap: Record<string, string> = {
    // Election / ચૂંટણી 2027
    'ચૂંટણી 2026': '/category/election-2027',
    'ચૂંટણી 2027': '/category/election-2027',
    'election-2027': '/category/election-2027',
    'election 2027': '/category/election-2027',
    'election 2026': '/category/election-2027',

    // Main Categories
    'ગુજરાત': '/category/gujarat',
    'gujarat': '/category/gujarat',
    'ભારત': '/category/national',
    'national': '/category/national',
    'india': '/category/national',
    'વિશ્વ': '/category/world',
    'world': '/category/world',
    'રાજનીતિ': '/category/politics',
    'રાજકારણ': '/category/politics',
    'politics': '/category/politics',
    'ક્રાઇમ': '/category/crime',
    'કાઇમ': '/category/crime',
    'crime': '/category/crime',
    'હેલ્થ': '/category/health',
    'આરોગ્ય': '/category/health',
    'health': '/category/health',
    'મનોરંજન': '/category/entertainment',
    'entertainment': '/category/entertainment',
    'ટેકનોલોજી': '/category/technology',
    'technology': '/category/technology',
    'સ્પોર્ટ્સ': '/category/sports',
    'sports': '/category/sports',
    'રમતગમત': '/category/sports',
    'બિઝનેસ': '/category/business',
    'business': '/category/business',

    // Media & Special Pages
    'ફોટો ગેલેરી': '/photos',
    'photos': '/photos',
    'ફેક્ટ ચેક': '/category/fact-check',
    'fact-check': '/category/fact-check',
    'ટ્રેન્ડિંગ': '/category/trending',
    'trending': '/category/trending',
    'પોડકાસ્ટ': '/videos?tab=podcast',
    'podcast': '/videos?tab=podcast',
    'વીડિયો': '/videos',
    'videos': '/videos',
    'વેબસ્ટોરી': '/web-stories',
    'webstory': '/web-stories',
    'webstories': '/web-stories',
    'ઇન્સ્ટાગ્રામ': '/videos',
    'instagram': '/videos',

    // Cities
    'અમદાવાદ': '/category/gujarat?city=ahmedabad',
    'ahmedabad': '/category/gujarat?city=ahmedabad',
    'ગાંધીનગર': '/category/gujarat?city=gandhinagar',
    'gandhinagar': '/category/gujarat?city=gandhinagar',
    'સુરત': '/category/surat',
    'surat': '/category/surat',
    'વડોદરા': '/category/vadodara',
    'vadodara': '/category/vadodara',
    'રાજકોટ': '/category/rajkot',
    'rajkot': '/category/rajkot',
  };

  // Direct exact match
  if (categoryMap[clean]) return categoryMap[clean];
  if (categoryMap[lower]) return categoryMap[lower];

  // Default fallback for topics like 'વરસાદ' (Rain), 'સોના-ચાંદી', 'સેમિકન્ડક્ટર', 'ડાયમંડ ઉદ્યોગ', custom topics: Search Page!
  return `/search?q=${encodeURIComponent(clean)}`;
}

/**
 * Sort articles strictly latest first: by articleNumber desc, fallback to publishedAt/createdAt desc.
 * Avoids sorting by updatedAt which can misplace older edited/updated articles.
 */
export function sortArticlesByLatest<T extends any>(list: T[]): T[] {
  return [...(list || [])].sort((a: any, b: any) => {
    const aNum = typeof a?.articleNumber === 'number' ? a.articleNumber : (parseInt(a?.articleNumber, 10) || 0);
    const bNum = typeof b?.articleNumber === 'number' ? b.articleNumber : (parseInt(b?.articleNumber, 10) || 0);
    if (bNum > 0 && aNum > 0 && bNum !== aNum) return bNum - aNum;
    if (bNum > 0 && aNum === 0) return -1;
    if (aNum > 0 && bNum === 0) return 1;
    const aTime = new Date(a?.publishedAt || a?.createdAt || 0).getTime();
    const bTime = new Date(b?.publishedAt || b?.createdAt || 0).getTime();
    return bTime - aTime;
  });
}



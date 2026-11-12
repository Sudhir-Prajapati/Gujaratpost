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

export interface CategoryBadgeStyle {
  pill: string;
  dot: string;
  chevron: string;
  hex: string;
}

/**
 * Maps any category slug, name, Gujarati/Hindi label to a distinct, beautiful, consistent color theme.
 * Wherever a tag (e.g. Ahmedabad, Gujarat, Bharat, Vishv, Surat, etc.) appears, it uses its exact signature color.
 */
export function getCategoryBadgeStyle(slugOrLabel?: any, secondaryLabel?: string): CategoryBadgeStyle {
  let combined = '';
  if (typeof slugOrLabel === 'string') {
    combined = slugOrLabel;
  } else if (slugOrLabel && typeof slugOrLabel === 'object') {
    combined = `${slugOrLabel.slug || ''} ${slugOrLabel.name || ''} ${slugOrLabel.nameGu || ''} ${slugOrLabel.categorySlug || ''} ${slugOrLabel.category || ''}`;
  }
  if (secondaryLabel) {
    combined += ` ${secondaryLabel}`;
  }
  const key = combined.toLowerCase().trim();

  // 1. Ahmedabad (Green / Emerald - signature green color)
  if (key.includes('ahmedabad') || key.includes('અમદાવાદ') || key.includes('अहमदाबाद')) {
    return {
      pill: 'bg-emerald-50 hover:bg-emerald-100/90 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-700/60',
      dot: 'bg-emerald-500',
      chevron: 'text-emerald-600/80 dark:text-emerald-400/80',
      hex: '#059669',
    };
  }

  // 2. Gujarat (Teal / Ocean Teal)
  if (key.includes('gujarat') || key.includes('ગુજરાત') || key.includes('गुजरात') || key === 'state' || key.includes('state news')) {
    return {
      pill: 'bg-teal-50 hover:bg-teal-100/90 dark:bg-teal-950/40 dark:hover:bg-teal-950/70 text-teal-800 dark:text-teal-300 border-teal-300/80 dark:border-teal-700/60',
      dot: 'bg-teal-500',
      chevron: 'text-teal-600/80 dark:text-teal-400/80',
      hex: '#0d9488',
    };
  }

  // 3. Bharat / National / India (Indigo / Deep Royal Blue)
  if (key.includes('national') || key.includes('bharat') || key.includes('ભારત') || key.includes('भारत') || key.includes('india') || key.includes('દેશ')) {
    return {
      pill: 'bg-indigo-50 hover:bg-indigo-100/90 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border-indigo-300/80 dark:border-indigo-700/60',
      dot: 'bg-indigo-500',
      chevron: 'text-indigo-600/80 dark:text-indigo-400/80',
      hex: '#4f46e5',
    };
  }

  // 4. Vishv / World / International (Sky / Cyan Blue)
  if (key.includes('world') || key.includes('vishv') || key.includes('વિશ્વ') || key.includes('विश्व') || key.includes('international') || key.includes('global')) {
    return {
      pill: 'bg-sky-50 hover:bg-sky-100/90 dark:bg-sky-950/40 dark:hover:bg-sky-950/70 text-sky-800 dark:text-sky-300 border-sky-300/80 dark:border-sky-700/60',
      dot: 'bg-sky-500',
      chevron: 'text-sky-600/80 dark:text-sky-400/80',
      hex: '#0284c7',
    };
  }

  // 5. Surat (Cyan)
  if (key.includes('surat') || key.includes('સુરત') || key.includes('सूरत')) {
    return {
      pill: 'bg-cyan-50 hover:bg-cyan-100/90 dark:bg-cyan-950/40 dark:hover:bg-cyan-950/70 text-cyan-800 dark:text-cyan-300 border-cyan-300/80 dark:border-cyan-700/60',
      dot: 'bg-cyan-500',
      chevron: 'text-cyan-600/80 dark:text-cyan-400/80',
      hex: '#0891b2',
    };
  }

  // 6. Rajkot (Amber / Golden Yellow)
  if (key.includes('rajkot') || key.includes('રાજકોટ') || key.includes('રાજકોટ')) {
    return {
      pill: 'bg-amber-50 hover:bg-amber-100/90 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 text-amber-900 dark:text-amber-300 border-amber-300/80 dark:border-amber-700/60',
      dot: 'bg-amber-500',
      chevron: 'text-amber-600/80 dark:text-amber-400/80',
      hex: '#d97706',
    };
  }

  // 7. Vadodara / Baroda (Violet)
  if (key.includes('vadodara') || key.includes('વડોદરા') || key.includes('वडोदरा') || key.includes('baroda')) {
    return {
      pill: 'bg-violet-50 hover:bg-violet-100/90 dark:bg-violet-950/40 dark:hover:bg-violet-950/70 text-violet-800 dark:text-violet-300 border-violet-300/80 dark:border-violet-700/60',
      dot: 'bg-violet-500',
      chevron: 'text-violet-600/80 dark:text-violet-400/80',
      hex: '#7c3aed',
    };
  }

  // 8. Gandhinagar (Lime)
  if (key.includes('gandhinagar') || key.includes('ગાંધીનગર') || key.includes('गांधीनगर')) {
    return {
      pill: 'bg-lime-50 hover:bg-lime-100/90 dark:bg-lime-950/40 dark:hover:bg-lime-950/70 text-lime-900 dark:text-lime-300 border-lime-300/80 dark:border-lime-700/60',
      dot: 'bg-lime-500',
      chevron: 'text-lime-600/80 dark:text-lime-400/80',
      hex: '#65a30d',
    };
  }

  // 9. Crime (Rose / Crimson Red)
  if (key.includes('crime') || key.includes('ક્રાઇમ') || key.includes('ક્રાઈમ') || key.includes('क्राइम')) {
    return {
      pill: 'bg-rose-50 hover:bg-rose-100/90 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-300/80 dark:border-rose-700/60',
      dot: 'bg-rose-500',
      chevron: 'text-rose-600/80 dark:text-rose-400/80',
      hex: '#e11d48',
    };
  }

  // 10. Politics (Purple)
  if (key.includes('politics') || key.includes('rajkaran') || key.includes('rajniti') || key.includes('રાજકારણ') || key.includes('રાજનીતિ') || key.includes('राजनीति')) {
    return {
      pill: 'bg-purple-50 hover:bg-purple-100/90 dark:bg-purple-950/40 dark:hover:bg-purple-950/70 text-purple-800 dark:text-purple-300 border-purple-300/80 dark:border-purple-700/60',
      dot: 'bg-purple-500',
      chevron: 'text-purple-600/80 dark:text-purple-400/80',
      hex: '#9333ea',
    };
  }

  // 11. Sports (Orange)
  if (key.includes('sports') || key.includes('sport') || key.includes('cricket') || key.includes('રમત') || key.includes('સ્પોર્ટ્સ') || key.includes('खेल')) {
    return {
      pill: 'bg-orange-50 hover:bg-orange-100/90 dark:bg-orange-950/40 dark:hover:bg-orange-950/70 text-orange-800 dark:text-orange-300 border-orange-300/80 dark:border-orange-700/60',
      dot: 'bg-orange-500',
      chevron: 'text-orange-600/80 dark:text-orange-400/80',
      hex: '#ea580c',
    };
  }

  // 12. Business / Vyapar (Blue)
  if (key.includes('business') || key.includes('vyapar') || key.includes('વેપાર') || key.includes('બિઝનેસ') || key.includes('व्यापार') || key.includes('बिज़नेस') || key.includes('share')) {
    return {
      pill: 'bg-blue-50 hover:bg-blue-100/90 dark:bg-blue-950/40 dark:hover:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-300/80 dark:border-blue-700/60',
      dot: 'bg-blue-500',
      chevron: 'text-blue-600/80 dark:text-blue-400/80',
      hex: '#2563eb',
    };
  }

  // 13. Entertainment (Fuchsia / Pink)
  if (key.includes('entertainment') || key.includes('bollywood') || key.includes('cinema') || key.includes('movie') || key.includes('film') || key.includes('મનોરંજન') || key.includes('मनोरंजन')) {
    return {
      pill: 'bg-fuchsia-50 hover:bg-fuchsia-100/90 dark:bg-fuchsia-950/40 dark:hover:bg-fuchsia-950/70 text-fuchsia-800 dark:text-fuchsia-300 border-fuchsia-300/80 dark:border-fuchsia-700/60',
      dot: 'bg-fuchsia-500',
      chevron: 'text-fuchsia-600/80 dark:text-fuchsia-400/80',
      hex: '#c026d3',
    };
  }

  // 14. Technology (Slate)
  if (key.includes('technology') || key.includes('tech') || key.includes('ટેક્નોલોજી') || key.includes('ટેકનોલોજી') || key.includes('ટેક') || key.includes('टेक')) {
    return {
      pill: 'bg-slate-100 hover:bg-slate-200/90 dark:bg-slate-800/60 dark:hover:bg-slate-800 dark:text-slate-200 border-slate-300/80 dark:border-slate-700/60 text-slate-800',
      dot: 'bg-slate-500',
      chevron: 'text-slate-600/80 dark:text-slate-400/80',
      hex: '#475569',
    };
  }

  // 15. Fact Check (Emerald)
  if (key.includes('fact') || key.includes('ફેક્ટ')) {
    return {
      pill: 'bg-emerald-50 hover:bg-emerald-100/90 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-700/60',
      dot: 'bg-emerald-500',
      chevron: 'text-emerald-600/80 dark:text-emerald-400/80',
      hex: '#059669',
    };
  }

  // 16. Health (Rose)
  if (key.includes('health') || key.includes('heath') || key.includes('fitness') || key.includes('હેલ્થ') || key.includes('સ્વાસ્થ્ય')) {
    return {
      pill: 'bg-rose-50 hover:bg-rose-100/90 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-300/80 dark:border-rose-700/60',
      dot: 'bg-rose-500',
      chevron: 'text-rose-600/80 dark:text-rose-400/80',
      hex: '#e11d48',
    };
  }

  // 17. Lifestyle (Pink)
  if (key.includes('lifestyle') || key.includes('લાઇફસ્ટાઇલ') || key.includes('લાઈફસ્ટાઈલ') || key.includes('લાઇફ')) {
    return {
      pill: 'bg-pink-50 hover:bg-pink-100/90 dark:bg-pink-950/40 dark:hover:bg-pink-950/70 text-pink-800 dark:text-pink-300 border-pink-300/80 dark:border-pink-700/60',
      dot: 'bg-pink-500',
      chevron: 'text-pink-600/80 dark:text-pink-400/80',
      hex: '#db2777',
    };
  }

  // 18. Education (Teal)
  if (key.includes('education') || key.includes('shikshan') || key.includes('શિક્ષણ') || key.includes('शिक्षा')) {
    return {
      pill: 'bg-teal-50 hover:bg-teal-100/90 dark:bg-teal-950/40 dark:hover:bg-teal-950/70 text-teal-800 dark:text-teal-300 border-teal-300/80 dark:border-teal-700/60',
      dot: 'bg-teal-500',
      chevron: 'text-teal-600/80 dark:text-teal-400/80',
      hex: '#0d9488',
    };
  }

  // 19. Gold - Silver (Amber / Yellow)
  if (key.includes('gold') || key.includes('silver') || key.includes('ગોલ્ડ') || key.includes('સિલ્વર')) {
    return {
      pill: 'bg-amber-50 hover:bg-amber-100/90 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 text-amber-900 dark:text-amber-300 border-amber-300/80 dark:border-amber-700/60',
      dot: 'bg-amber-500',
      chevron: 'text-amber-600/80 dark:text-amber-400/80',
      hex: '#ca8a04',
    };
  }

  // 20. Election (Orange)
  if (key.includes('election') || key.includes('ચૂંટણી') || key.includes('चुनाव')) {
    return {
      pill: 'bg-orange-50 hover:bg-orange-100/90 dark:bg-orange-950/40 dark:hover:bg-orange-950/70 text-orange-800 dark:text-orange-300 border-orange-300/80 dark:border-orange-700/60',
      dot: 'bg-orange-500',
      chevron: 'text-orange-600/80 dark:text-orange-400/80',
      hex: '#ea580c',
    };
  }

  // 21. Dharm / Astrology (Amber)
  if (key.includes('dharm') || key.includes('astrology') || key.includes('rashifal') || key.includes('ધર્મ') || key.includes('જ્યોતિષ') || key.includes('રાશિફળ')) {
    return {
      pill: 'bg-amber-50 hover:bg-amber-100/90 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 text-amber-900 dark:text-amber-300 border-amber-300/80 dark:border-amber-700/60',
      dot: 'bg-amber-500',
      chevron: 'text-amber-600/80 dark:text-amber-400/80',
      hex: '#d97706',
    };
  }

  // 22. Other Cities / Jamnagar / Bhavnagar / etc. (Sky)
  if (key.includes('other-cities') || key.includes('jamnagar') || key.includes('bhavnagar') || key.includes('junagadh') || key.includes('bhuj') || key.includes('kutch') || key.includes('અન્ય શહેરો') || key.includes('જામનગર') || key.includes('ભાવનગર')) {
    return {
      pill: 'bg-sky-50 hover:bg-sky-100/90 dark:bg-sky-950/40 dark:hover:bg-sky-950/70 text-sky-800 dark:text-sky-300 border-sky-300/80 dark:border-sky-700/60',
      dot: 'bg-sky-500',
      chevron: 'text-sky-600/80 dark:text-sky-400/80',
      hex: '#0284c7',
    };
  }

  // Fallback default
  return {
    pill: 'bg-slate-100/90 hover:bg-slate-200/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-foreground/85 border-slate-200/80 dark:border-white/[0.08]',
    dot: 'bg-[#B3121B]',
    chevron: 'text-muted-foreground/80',
    hex: '#B3121B',
  };
}

/**
 * Category color code mapping for UI tags and badges.
 */
export function getCategoryColor(category: any): string {
  if (!category) return '#c0392b';
  return getCategoryBadgeStyle(category).hex;
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



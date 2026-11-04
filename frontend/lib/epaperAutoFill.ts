import { getBackendApiUrl } from './api';
import {
  NewspaperTemplateData,
  Page1Data,
  Page2Data,
  Page3Data,
  Page4Data,
  NewsStory,
} from '@/components/epaper/types';

/**
 * Cleanly strips HTML tags, script, style, and decodes HTML entities into readable plain text.
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  let text = String(html)
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '');

  // HTML entity decode
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&rdquo;/gi, '"')
    .replace(/&ldquo;/gi, '"')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&bull;/gi, '•')
    .replace(/&ndash;/gi, '–')
    .replace(/&mdash;/gi, '—');

  // Normalize whitespace & linebreaks
  text = text.replace(/[ \t\r]+/g, ' ');
  text = text.replace(/\n\s*\n\s*\n+/g, '\n\n');
  return text.trim();
}

/**
 * Fits text within a maximum length by slicing at the closest sentence ending (or word boundary),
 * ensuring the layout never breaks and text reads naturally without mid-word truncation.
 */
export function fitTextToLength(text: string, maxLen: number): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;

  // Look for a Gujarati/English sentence ending (period, danda, question, exclamation)
  const candidate = trimmed.slice(0, maxLen);
  const sentenceEndMatches = [...candidate.matchAll(/[.?!।]\s+/g)];
  if (sentenceEndMatches.length > 0) {
    const lastMatch = sentenceEndMatches[sentenceEndMatches.length - 1];
    const endPos = (lastMatch.index || 0) + 1;
    if (endPos >= maxLen * 0.5) {
      return trimmed.slice(0, endPos).trim();
    }
  }

  // If no good sentence ending found, cut at the last word boundary
  const lastSpace = candidate.lastIndexOf(' ');
  if (lastSpace > maxLen * 0.4) {
    return candidate.slice(0, lastSpace).trim() + '...';
  }

  return candidate.trim() + '...';
}

/**
 * Splits article text into 1, 2, or 3 balanced paragraphs sized precisely
 * for newspaper columns.
 */
export function extractParagraphs(
  fullText: string,
  maxP1 = 480,
  maxP2 = 380,
  maxP3 = 340
): { paragraph1: string; paragraph2: string; paragraph3: string; body: string } {
  const clean = stripHtml(fullText);
  if (!clean) {
    return { paragraph1: '', paragraph2: '', paragraph3: '', body: '' };
  }

  // Split by natural paragraph breaks
  let blocks = clean
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 15);

  // If there's only 1 big block or 0 blocks, intelligently split by sentences
  if (blocks.length <= 1) {
    const textToSplit = blocks[0] || clean;
    const sentences = textToSplit
      .split(/(?<=[.?!।])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (sentences.length >= 6) {
      const chunk1 = sentences.slice(0, Math.ceil(sentences.length / 3)).join(' ');
      const chunk2 = sentences.slice(Math.ceil(sentences.length / 3), Math.ceil((sentences.length * 2) / 3)).join(' ');
      const chunk3 = sentences.slice(Math.ceil((sentences.length * 2) / 3)).join(' ');
      blocks = [chunk1, chunk2, chunk3];
    } else if (sentences.length >= 3) {
      const chunk1 = sentences.slice(0, Math.ceil(sentences.length / 2)).join(' ');
      const chunk2 = sentences.slice(Math.ceil(sentences.length / 2)).join(' ');
      blocks = [chunk1, chunk2];
    } else {
      blocks = [textToSplit];
    }
  }

  const p1 = fitTextToLength(blocks[0] || '', maxP1);
  const p2 = fitTextToLength(blocks[1] || '', maxP2);
  const p3 = maxP3 > 0 ? fitTextToLength(blocks[2] || '', maxP3) : '';

  const combined = [p1, p2, p3].filter(Boolean).join('\n\n');
  return { paragraph1: p1, paragraph2: p2, paragraph3: p3, body: combined };
}

/**
 * Maps a single published article from the backend into a standardized NewsStory slot object.
 */
export function mapArticleToStory(
  article: any,
  slotType: 'lead' | 'side' | 'block' | 'feature' | 'sports' | 'brief' = 'block'
): NewsStory {
  if (!article) return {};

  const headline = (article.titleGu || article.title || '').trim();
  const subheadline = stripHtml(article.excerptGu || article.excerpt || '').trim();
  const category = (
    article.categoryGu ||
    article.category?.nameGu ||
    article.category?.name ||
    article.category ||
    'સમાચાર'
  ).trim();
  const location = (article.location || '').trim();
  const image = article.featuredImage || article.image || '';

  const rawContent =
    article.contentGu ||
    article.content ||
    article.excerptGu ||
    article.excerpt ||
    '';

  let maxP1 = 450;
  let maxP2 = 350;
  let maxP3 = 350;

  if (slotType === 'lead') {
    maxP1 = 550;
    maxP2 = 420;
    maxP3 = 420;
  } else if (slotType === 'side') {
    maxP1 = 400;
    maxP2 = 320;
    maxP3 = 250;
  } else if (slotType === 'block') {
    maxP1 = 340;
    maxP2 = 280;
    maxP3 = 180;
  } else if (slotType === 'feature' || slotType === 'sports') {
    maxP1 = 300;
    maxP2 = 220;
    maxP3 = 0;
  } else if (slotType === 'brief') {
    maxP1 = 200;
    maxP2 = 0;
    maxP3 = 0;
  }

  const { paragraph1, paragraph2, paragraph3, body } = extractParagraphs(
    rawContent,
    maxP1,
    maxP2,
    maxP3
  );

  return {
    id: article.id,
    category,
    headline,
    subheadline: subheadline ? subheadline.slice(0, 110) : undefined,
    location: location || undefined,
    image,
    paragraph1,
    paragraph2,
    paragraph3,
    articleBody: body,
    body,
  };
}

/**
 * Fetches published articles from `/api/public/articles` with content included.
 */
export async function fetchPublishedArticles(options: {
  categorySlug?: string;
  limit?: number;
  query?: string;
} = {}): Promise<any[]> {
  const limit = options.limit || 30;
  const params = new URLSearchParams({
    limit: String(limit),
    includeContent: 'true',
  });
  if (options.categorySlug) params.append('categorySlug', options.categorySlug);
  if (options.query) params.append('query', options.query);

  try {
    const url = getBackendApiUrl(`/api/public/articles?${params.toString()}`);
    const res = await fetch(url);
    if (!res.ok) {
      console.warn('Failed to fetch articles:', res.status, res.statusText);
      return [];
    }
    const json = await res.json();
    if (json?.data?.articles && Array.isArray(json.data.articles)) {
      return json.data.articles;
    }
    if (json?.articles && Array.isArray(json.articles)) {
      return json.articles;
    }
    return [];
  } catch (err) {
    console.error('Error in fetchPublishedArticles:', err);
    return [];
  }
}

/**
 * Auto-fill Page 1 (Front Page) slots from an array of published articles.
 */
export function autoFillPage1(page1: Page1Data, articles: any[]): Page1Data {
  if (!articles || articles.length === 0) return page1;
  const clone: Page1Data = JSON.parse(JSON.stringify(page1));

  let artIdx = 0;

  // 1. Lead Story / Main Headline
  if (articles[artIdx]) {
    const lead = mapArticleToStory(articles[artIdx], 'lead');
    clone.leadStory = { ...clone.leadStory, ...lead };
    clone.mainHeadline = { ...clone.mainHeadline, ...lead };
    artIdx++;
  }

  // 2. Side Top News
  if (articles[artIdx]) {
    const side = mapArticleToStory(articles[artIdx], 'side');
    clone.sideTopNews = { ...clone.sideTopNews, ...side };
    artIdx++;
  }

  // 3. News Blocks (3 slots)
  if (!Array.isArray(clone.newsBlocks)) clone.newsBlocks = [];
  for (let i = 0; i < 3; i++) {
    if (articles[artIdx]) {
      const block = mapArticleToStory(articles[artIdx], 'block');
      clone.newsBlocks[i] = { ...(clone.newsBlocks[i] || {}), ...block };
      artIdx++;
    }
  }

  // 4. Bottom Left Feature
  if (articles[artIdx]) {
    const feat = mapArticleToStory(articles[artIdx], 'feature');
    clone.bottomLeftFeature = { ...(clone.bottomLeftFeature || {}), ...feat };
    artIdx++;
  }

  // 5. Bottom Middle Sports
  if (articles[artIdx]) {
    const sports = mapArticleToStory(articles[artIdx], 'sports');
    clone.bottomMiddleSports = { ...(clone.bottomMiddleSports || {}), ...sports };
    artIdx++;
  }

  // 6. Bottom Stories (up to 3 slots)
  if (!Array.isArray(clone.bottomStories)) clone.bottomStories = [];
  for (let i = 0; i < 3; i++) {
    if (articles[artIdx]) {
      const bStory = mapArticleToStory(articles[artIdx], 'feature');
      clone.bottomStories[i] = { ...(clone.bottomStories[i] || {}), ...bStory };
      artIdx++;
    }
  }

  return clone;
}

/**
 * Auto-fill Page 2 (Gujarat News) slots from an array of published articles.
 */
export function autoFillPage2(page2: Page2Data, articles: any[]): Page2Data {
  if (!articles || articles.length === 0) return page2;
  const clone: Page2Data = JSON.parse(JSON.stringify(page2));

  let artIdx = 0;

  // 1. Main District Story (Lead)
  if (articles[artIdx]) {
    const lead = mapArticleToStory(articles[artIdx], 'lead');
    clone.mainDistrictStory = { ...clone.mainDistrictStory, ...lead };
    artIdx++;
  }

  // 2. Side Lead Story
  if (articles[artIdx]) {
    const side = mapArticleToStory(articles[artIdx], 'side');
    clone.sideLeadStory = { ...clone.sideLeadStory, ...side };
    artIdx++;
  }

  // 3. District Stories (3 slots)
  if (!Array.isArray(clone.districtStories)) clone.districtStories = [];
  for (let i = 0; i < 3; i++) {
    if (articles[artIdx]) {
      const dStory = mapArticleToStory(articles[artIdx], 'block');
      clone.districtStories[i] = { ...(clone.districtStories[i] || {}), ...dStory };
      artIdx++;
    }
  }

  // 4. Bottom Left Feature (Agriculture / Rural)
  if (articles[artIdx]) {
    const bLeft = mapArticleToStory(articles[artIdx], 'feature');
    clone.bottomLeftFeature = { ...(clone.bottomLeftFeature || {}), ...bLeft };
    artIdx++;
  }

  // 5. Bottom Right Feature (Education / Development)
  if (articles[artIdx]) {
    const bRight = mapArticleToStory(articles[artIdx], 'feature');
    clone.bottomRightFeature = { ...(clone.bottomRightFeature || {}), ...bRight };
    artIdx++;
  }

  return clone;
}

/**
 * Auto-fill Page 3 (Business & Economy) slots from an array of published articles.
 */
export function autoFillPage3(page3: Page3Data, articles: any[]): Page3Data {
  if (!articles || articles.length === 0) return page3;
  const clone: Page3Data = JSON.parse(JSON.stringify(page3));

  let artIdx = 0;

  // 1. Business Story (Lead)
  if (articles[artIdx]) {
    const lead = mapArticleToStory(articles[artIdx], 'lead');
    clone.businessStory = { ...clone.businessStory, ...lead };
    artIdx++;
  }

  // 2. Politics / Policy Story
  if (articles[artIdx]) {
    const pol = mapArticleToStory(articles[artIdx], 'side');
    clone.politicsStory = { ...clone.politicsStory, ...pol };
    artIdx++;
  }

  // 3. Tech Story
  if (articles[artIdx]) {
    const tech = mapArticleToStory(articles[artIdx], 'block');
    clone.techStory = { ...(clone.techStory || {}), ...tech };
    artIdx++;
  }

  // 4. Banking Story
  if (articles[artIdx]) {
    const bank = mapArticleToStory(articles[artIdx], 'block');
    clone.bankingStory = { ...(clone.bankingStory || {}), ...bank };
    artIdx++;
  }

  // 5. Startup Story
  if (articles[artIdx]) {
    const start = mapArticleToStory(articles[artIdx], 'block');
    clone.startupStory = { ...(clone.startupStory || {}), ...start };
    artIdx++;
  }

  // 6. Commodity Story
  if (articles[artIdx]) {
    const comm = mapArticleToStory(articles[artIdx], 'block');
    clone.commodityStory = { ...(clone.commodityStory || {}), ...comm };
    artIdx++;
  }

  // 7. Corporate Briefs (up to 3 items)
  if (!Array.isArray(clone.corporateBriefs)) clone.corporateBriefs = [];
  for (let i = 0; i < 3; i++) {
    if (articles[artIdx]) {
      const brief = mapArticleToStory(articles[artIdx], 'brief');
      clone.corporateBriefs[i] = { ...(clone.corporateBriefs[i] || {}), ...brief };
      artIdx++;
    }
  }

  return clone;
}

/**
 * Auto-fill Page 4 (Sports & Entertainment) slots from arrays of published articles.
 */
export function autoFillPage4(
  page4: Page4Data,
  sportsArticles: any[],
  entArticles: any[] = []
): Page4Data {
  const clone: Page4Data = JSON.parse(JSON.stringify(page4));
  const pool = [...sportsArticles, ...entArticles];
  if (pool.length === 0) return page4;

  let sIdx = 0;

  // 1. Main Sports Story (Lead)
  if (sportsArticles[sIdx]) {
    const lead = mapArticleToStory(sportsArticles[sIdx], 'lead');
    clone.mainSportsStory = { ...clone.mainSportsStory, ...lead };
    sIdx++;
  }

  // 2. Secondary Sports Story
  if (sportsArticles[sIdx]) {
    const sec = mapArticleToStory(sportsArticles[sIdx], 'side');
    clone.secondarySportsStory = { ...clone.secondarySportsStory, ...sec };
    sIdx++;
  }

  // 3. Sports Briefs (3 items)
  if (!Array.isArray(clone.sportsBriefs)) clone.sportsBriefs = [];
  for (let i = 0; i < 3; i++) {
    if (sportsArticles[sIdx]) {
      const brief = mapArticleToStory(sportsArticles[sIdx], 'brief');
      clone.sportsBriefs[i] = { ...(clone.sportsBriefs[i] || {}), ...brief };
      sIdx++;
    }
  }

  let eIdx = 0;

  // 4. Entertainment Story
  if (entArticles[eIdx] || pool[sIdx]) {
    const entArt = entArticles[eIdx] || pool[sIdx++];
    const ent = mapArticleToStory(entArt, 'lead');
    clone.entertainmentStory = { ...clone.entertainmentStory, ...ent };
    eIdx++;
  }

  // 5. OTT / Lifestyle Story
  if (entArticles[eIdx] || pool[sIdx]) {
    const ottArt = entArticles[eIdx] || pool[sIdx++];
    const ott = mapArticleToStory(ottArt, 'block');
    clone.ottLifestyleStory = { ...(clone.ottLifestyleStory || {}), ...ott };
    eIdx++;
  }

  // 6. Bottom Stories (up to 3 items)
  if (!Array.isArray(clone.bottomStories)) clone.bottomStories = [];
  for (let i = 0; i < 3; i++) {
    const nextArt = pool[sIdx] || entArticles[eIdx];
    if (nextArt) {
      const bStory = mapArticleToStory(nextArt, 'feature');
      clone.bottomStories[i] = { ...(clone.bottomStories[i] || {}), ...bStory };
      sIdx++;
    }
  }

  return clone;
}

/**
 * Auto-fill all 4 pages of the Newspaper template using live website articles.
 */
export async function autoFillAllPages(
  currentData: NewspaperTemplateData
): Promise<NewspaperTemplateData> {
  // Parallel fetch articles from relevant categories
  const [topArticles, gujaratArticles, businessArticles, sportsArticles, entertainmentArticles] =
    await Promise.all([
      fetchPublishedArticles({ limit: 25 }),
      fetchPublishedArticles({ categorySlug: 'gujarat', limit: 20 }),
      fetchPublishedArticles({ categorySlug: 'business', limit: 20 }),
      fetchPublishedArticles({ categorySlug: 'sports', limit: 15 }),
      fetchPublishedArticles({ categorySlug: 'entertainment', limit: 15 }),
    ]);

  // Fallbacks: if category-specific articles are fewer, blend with topArticles
  const safeGujarat = gujaratArticles.length >= 6 ? gujaratArticles : [...gujaratArticles, ...topArticles];
  const safeBusiness = businessArticles.length >= 6 ? businessArticles : [...businessArticles, ...topArticles];
  const safeSports = sportsArticles.length >= 4 ? sportsArticles : [...sportsArticles, ...topArticles];
  const safeEntertainment = entertainmentArticles.length >= 3 ? entertainmentArticles : [...entertainmentArticles, ...topArticles];

  let clone: NewspaperTemplateData = JSON.parse(JSON.stringify(currentData));
  clone.page1 = autoFillPage1(clone.page1, topArticles);
  clone.page2 = autoFillPage2(clone.page2, safeGujarat);
  clone.page3 = autoFillPage3(clone.page3, safeBusiness);
  clone.page4 = autoFillPage4(clone.page4, safeSports, safeEntertainment);

  return clone;
}


import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SITE_URL, cleanArticlePlainText, getArticleTitle, getArticleExcerpt, getArticleContent } from "@/data";
import type { Language } from "@/types";
import { getPublicArticleBySlug, getPublicArticles } from "@/lib/api";
import { getOpenGraphImageUrl } from "@/lib/facebookShare";
import NewsDetailClient from "./NewsDetailClient";
import { filterUniqueArticles } from "@/lib/articleDeduplication";
import { isSameCategory, normalizeCategory, sortArticlesByNewest, getArticleAgeDays } from "@/lib/articleCategory";

export const revalidate = 30;

export async function generateStaticParams() {
  if (process.env.NODE_ENV === 'development') {
    return [];
  }
  try {
    const res = await getPublicArticles({ limit: 30 });
    if (res && Array.isArray(res.articles)) {
      return res.articles.map((art: any) => ({
        slug: art.slug,
      }));
    }
  } catch (err) {
    console.warn('Failed to pre-generate static params for news detail pages:', err);
  }
  return [];
}

async function serverTranslateText(text: string, targetLang: 'gu' | 'hi' | 'en'): Promise<string> {
  if (!text || !text.trim()) return '';
  const trimmed = text.trim();
  const hasDevanagari = /[\u0900-\u097F]/.test(trimmed);
  const hasGujarati = /[\u0A80-\u0AFF]/.test(trimmed);
  const hasLatin = /[A-Za-z]/.test(trimmed) && !hasGujarati && !hasDevanagari;

  if (targetLang === 'hi' && hasDevanagari && !hasGujarati) return trimmed;
  if (targetLang === 'gu' && hasGujarati) return trimmed;
  if (targetLang === 'en' && hasLatin) return trimmed;

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return trimmed;
    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translated = data[0].map((item: any) => item[0]).join('');
      if (translated && translated.trim()) return translated.trim();
    }
  } catch {}
  return trimmed;
}

export async function generateMetadata(
  props: {
    params: Promise<{ slug: string }>;
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
  }
): Promise<Metadata> {
  const { slug } = await props.params;
  const search = props.searchParams ? await props.searchParams : {};
  const rawLang = typeof search?.lang === 'string' ? search.lang.toLowerCase() : '';
  const lang: Language = (rawLang === 'en' || rawLang === 'hi' || rawLang === 'gu') ? (rawLang as Language) : 'gu';

  try {
    const article = await getPublicArticleBySlug(slug);
    if (!article) return {};
    const canonicalUrl = `https://gujaratpost.in/news/${article.slug}${lang !== 'gu' ? `?lang=${lang}` : ''}`;
    const authorName = typeof article.author === 'string' ? article.author : article.author?.name || 'Gujarat Post';

    // Raw candidate title based on language
    const rawCandidateTitle = (lang === 'hi' && article.titleHi && /[\u0900-\u097F]/.test(article.titleHi))
      ? article.titleHi
      : (lang === 'gu' && article.titleGu)
      ? article.titleGu
      : (lang === 'en' && article.title)
      ? article.title
      : (article.titleGu || article.title || 'Gujarat Post');

    // Guarantee translation if database record does not have the target script
    const translatedTitle = await serverTranslateText(cleanArticlePlainText(rawCandidateTitle), lang);
    const cleanTitle = cleanArticlePlainText(translatedTitle) || 'Gujarat Post';

    // Localized description: Gujarati by default, or specific selected language (hi / en)
    const rawCandidateExcerpt = (lang === 'hi' && article.excerptHi && /[\u0900-\u097F]/.test(article.excerptHi))
      ? article.excerptHi
      : (lang === 'gu' && article.excerptGu)
      ? article.excerptGu
      : (lang === 'en' && article.excerpt)
      ? article.excerpt
      : (article.excerptGu || article.excerpt || article.contentGu || article.content || '');

    let cleanDesc = cleanArticlePlainText(rawCandidateExcerpt);
    cleanDesc = cleanDesc.replace(/^(?:હોમ|Home|ભોમ|સમાચાર)\s*[\/|›»•·-]\s*[^/]+?\s*[\/|›»•·-]\s*[^/]+?\s*[\/|›»•·-]?\s*/i, '');
    cleanDesc = cleanDesc.replace(/^(?:રાજનીતિ|ગુજરાત|અમદાવાદ|સુરત|વડોદરા|રાજકોટ|ગાંધીનગર|ક્રાઇમ|બિઝનેસ)\s*[·•|/–-]\s*/i, '');
    if (cleanDesc.length > 170) {
      const slice = cleanDesc.slice(0, 170);
      const lastSpace = slice.lastIndexOf(' ');
      cleanDesc = (lastSpace > 110 ? slice.slice(0, lastSpace) : slice).trim() + '...';
    }
    if (cleanDesc) {
      cleanDesc = cleanArticlePlainText(await serverTranslateText(cleanDesc, lang));
    }

    // Strip any residual breadcrumbs or category/city prefixes
    cleanDesc = cleanDesc.replace(/^(?:હોમ|Home|ભોમ|સમાચાર)\s*[\/|›»•·-]\s*[^/]+?\s*[\/|›»•·-]\s*[^/]+?\s*[\/|›»•·-]?\s*/i, '');
    cleanDesc = cleanDesc.replace(/^(?:રાજનીતિ|ગુજરાત|અમદાવાદ|સુરત|વડોદરા|રાજકોટ|ગાંધીનગર|ક્રાઇમ|બિઝનેસ)\s*[·•|/–-]\s*/i, '');
    if (cleanDesc.length > 170) {
      const slice = cleanDesc.slice(0, 170);
      const lastSpace = slice.lastIndexOf(' ');
      cleanDesc = (lastSpace > 110 ? slice.slice(0, lastSpace) : slice).trim() + '...';
    }
    if (!cleanDesc || cleanDesc.length < 20) {
      cleanDesc = lang === 'en'
        ? `${cleanTitle} - Read all latest and breaking news on Gujarat Post.`
        : lang === 'hi'
        ? `${cleanTitle} - गुजरात और देश-दुनिया की सभी महत्वपूर्ण खबरें पढ़ें गुजरात पोस्ट पर.`
        : `${cleanTitle} - ગુજરાત અને દેશ-દુનિયાના તમામ મહત્વપૂર્ણ સમાચાર વાંચો ગુજરાત પોસ્ટ પર.`;
    }
    const imageUrl = getOpenGraphImageUrl(article.image);
    const locale = lang === 'gu' ? 'gu_IN' : lang === 'hi' ? 'hi_IN' : 'en_US';

    return {
      title: cleanTitle,
      description: cleanDesc,
      alternates: { canonical: canonicalUrl },
      authors: [{ name: authorName }],
      openGraph: {
        title: cleanTitle,
        description: cleanDesc,
        url: canonicalUrl,
        siteName: "Gujarat Post",
        locale,
        images: [
          {
            url: imageUrl,
            secureUrl: imageUrl,
            width: 1200,
            height: 630,
            type: "image/jpeg",
            alt: cleanTitle,
          },
        ],
        type: "article",
        publishedTime: article.publishedAt,
        modifiedTime: article.updatedAt,
        authors: [authorName],
        tags: article.tags || [],
      },
      twitter: {
        card: "summary_large_image",
        site: "@gujaratpostin",
        creator: "@gujaratpostin",
        title: cleanTitle,
        description: cleanDesc,
        images: [imageUrl],
      },
    };
  } catch {
    return {};
  }
}

export default async function NewsDetailPage(
  props: {
    params: Promise<{ slug: string }>;
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
  }
) {
  const { slug } = await props.params;
  const search = props.searchParams ? await props.searchParams : {};
  const rawLang = typeof search?.lang === 'string' ? search.lang.toLowerCase() : '';
  const initialLang: Language = (rawLang === 'en' || rawLang === 'hi' || rawLang === 'gu') ? (rawLang as Language) : 'gu';
  let article = await getPublicArticleBySlug(slug);
  if (!article) {
    const decoded = decodeURIComponent(slug);
    if (decoded !== slug) {
      article = await getPublicArticleBySlug(decoded);
    }
  }

  if (!article) notFound();

  // Normalize author safely
  if (!article.author || typeof article.author === 'string') {
    article.author = {
      id: 'admin',
      name: (typeof article.author === 'string' && article.author) ? article.author : 'Gujarat Post'
    };
  }

  // Dynamically fetch related articles prioritizing strict same-category & recency
  const rawCatSlug = (article.categorySlug || article.category || '').toLowerCase().trim();
  const canonicalCat = normalizeCategory(rawCatSlug);

  const catQueries = [
    getPublicArticles({ categorySlug: canonicalCat || rawCatSlug, limit: 100, sort: 'latest' }).catch(() => ({ articles: [], total: 0, totalPages: 1 })),
  ];
  if (article.categoryId) {
    catQueries.push(
      getPublicArticles({ categorySlug: article.categoryId, limit: 100, sort: 'latest' }).catch(() => ({ articles: [], total: 0, totalPages: 1 }))
    );
  }
  if (article.category && article.category.toLowerCase().trim() !== canonicalCat) {
    catQueries.push(
      getPublicArticles({ categorySlug: article.category.toLowerCase().trim(), limit: 100, sort: 'latest' }).catch(() => ({ articles: [], total: 0, totalPages: 1 }))
    );
  }

  const [catResponses, fallbackRes, trendingRes] = await Promise.all([
    Promise.all(catQueries),
    getPublicArticles({ limit: 100, sort: 'latest' }).catch(() => ({ articles: [], total: 0, totalPages: 1 })),
    getPublicArticles({ isTrending: true, limit: 50, sort: 'latest' }).catch(() => ({ articles: [], total: 0, totalPages: 1 })),
  ]);

  const categoryArticles = catResponses.flatMap((r) => r?.articles || []);
  const fallbackArticles = fallbackRes?.articles || [];
  const trending = filterUniqueArticles(trendingRes?.articles || [], [article]);

  // Deep deduplication against current active article
  const currentId = String(article.id || '');
  const currentSlug = String(article.slug || '').trim().toLowerCase();
  const currentTitle = String(article.title || article.titleGu || '').trim().toLowerCase();

  const isCurrentArticle = (a: any) => {
    if (!a) return true;
    const aId = String(a.id || '');
    const aSlug = String(a.slug || '').trim().toLowerCase();
    const aTitle = String(a.title || a.titleGu || '').trim().toLowerCase();
    if (currentId && aId === currentId) return true;
    if (currentSlug && aSlug === currentSlug) return true;
    if (currentTitle && aTitle === currentTitle) return true;
    return false;
  };

  const allRawCandidates = [...categoryArticles, ...fallbackArticles];
  const uniquePool = filterUniqueArticles(allRawCandidates, [article]).filter((a) => !isCurrentArticle(a));

  // 1. Filter strictly for SAME CATEGORY articles and sort newest first
  const sameCategoryCandidates = sortArticlesByNewest(
    uniquePool.filter((item) => isSameCategory(item, article))
  );

  // 2. Partition same-category articles by freshness:
  // Fresh news: last 3-4 days (<= 4.0 days)
  const freshSameCategory = sameCategoryCandidates.filter((item) => getArticleAgeDays(item) <= 4.0);
  const olderSameCategory = sameCategoryCandidates.filter((item) => getArticleAgeDays(item) > 4.0);

  // 3. Related list: fresh same-category first (newest to oldest), then older same-category (newest to oldest)
  let related: typeof uniquePool = [...freshSameCategory, ...olderSameCategory];

  // 4. Safety fallback: ONLY if the database has fewer than 4 articles in this entire category, fill up to 8 with fresh articles from other categories
  if (related.length < 4) {
    const otherCandidates = sortArticlesByNewest(
      uniquePool.filter((item) => !isSameCategory(item, article))
    );
    const freshOther = otherCandidates.filter((item) => getArticleAgeDays(item) <= 4.0);
    const needed = 8 - related.length;
    related = [...related, ...freshOther.slice(0, needed)];
  }

  const articleUrl = `${SITE_URL}/news/${article.slug}`;
  const rawCandidateHeadline = (initialLang === 'hi' && article.titleHi && /[\u0900-\u097F]/.test(article.titleHi))
    ? article.titleHi
    : (initialLang === 'gu' && article.titleGu)
    ? article.titleGu
    : (initialLang === 'en' && article.title)
    ? article.title
    : (article.titleGu || article.title || 'Gujarat Post');
  const cleanHeadline = cleanArticlePlainText(await serverTranslateText(cleanArticlePlainText(rawCandidateHeadline), initialLang)) || article.title;

  const localizedExcerpt = getArticleExcerpt(article, initialLang);
  const cleanExcerpt = cleanArticlePlainText(localizedExcerpt) || article.excerpt;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: cleanHeadline,
    alternativeHeadline: article.titleGu || article.title,
    description: cleanExcerpt,
    inLanguage: initialLang === 'gu' ? 'gu-IN' : initialLang === 'hi' ? 'hi-IN' : 'en-US',
    image: [article.image],
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      "@type": "Person",
      name: typeof article.author === 'string' ? article.author : (article.author?.name || 'Gujarat Post'),
    },
    publisher: {
      "@type": "Organization",
      name: "Gujarat Post",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/globe.svg`,
      },
    },
    mainEntityOfPage: articleUrl,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      <NewsDetailClient
        article={article}
        related={related}
        trending={trending}
        articleUrl={articleUrl}
        initialLanguage={initialLang}
      />
    </>
  );
}


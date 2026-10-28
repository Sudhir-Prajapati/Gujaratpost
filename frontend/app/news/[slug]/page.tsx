import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SITE_URL, cleanArticlePlainText } from "@/data";
import { getPublicArticleBySlug, getPublicArticles } from "@/lib/api";
import { getOpenGraphImageUrl } from "@/lib/facebookShare";
import NewsDetailClient from "./NewsDetailClient";

export const revalidate = 30;

export async function generateStaticParams() {
  try {
    const res = await getPublicArticles({ limit: 50 });
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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const article = await getPublicArticleBySlug(slug);
    if (!article) return {};
    const canonicalUrl = `https://gujaratpost.in/news/${article.slug}`;
    const authorName = typeof article.author === 'string' ? article.author : article.author?.name || 'Gujarat Post';
    const cleanTitle = cleanArticlePlainText(article.title) || 'Gujarat Post';
    let cleanDesc = cleanArticlePlainText(article.excerpt || article.content || '');
    // Strip any residual breadcrumbs or category/city prefixes
    cleanDesc = cleanDesc.replace(/^(?:હોમ|Home|ભોમ|સમાચાર)\s*[\/|›»•·-]\s*[^/]+?\s*[\/|›»•·-]\s*[^/]+?\s*[\/|›»•·-]?\s*/i, '');
    cleanDesc = cleanDesc.replace(/^(?:રાજનીતિ|ગુજરાત|અમદાવાદ|સુરત|વડોદરા|રાજકોટ|ગાંધીનગર|ક્રાઇમ|બિઝનેસ)\s*[·•|/–-]\s*/i, '');
    if (cleanDesc.length > 170) {
      const slice = cleanDesc.slice(0, 170);
      const lastSpace = slice.lastIndexOf(' ');
      cleanDesc = (lastSpace > 110 ? slice.slice(0, lastSpace) : slice).trim() + '...';
    }
    if (!cleanDesc || cleanDesc.length < 20) {
      cleanDesc = `${cleanTitle} - ગુજરાત અને દેશ-દુનિયાના તમામ મહત્વપૂર્ણ સમાચાર વાંચો ગુજરાત પોસ્ટ પર.`;
    }
    const imageUrl = getOpenGraphImageUrl(article.image);

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
        locale: "gu_IN",
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

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
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

  // Dynamically fetch related articles and calculate smart relevance scores
  const categorySlug = (article.category || '').toLowerCase().replace(/\s+/g, '-');
  const [catRes, fallbackRes, trendingRes] = await Promise.all([
    getPublicArticles({ categorySlug, limit: 20, includeContent: true }).catch(() => ({ articles: [], total: 0, totalPages: 1 })),
    getPublicArticles({ limit: 50, includeContent: true }).catch(() => ({ articles: [], total: 0, totalPages: 1 })),
    getPublicArticles({ isTrending: true, limit: 20, includeContent: true }).catch(() => ({ articles: [], total: 0, totalPages: 1 })),
  ]);

  const categoryArticles = catRes?.articles || [];
  const fallbackArticles = fallbackRes?.articles || [];
  const trending = trendingRes?.articles || [];

  const currentTags = new Set([
    ...(article.tags || []),
    ...(article.tagsGu || []),
    ...(article.tagsHi || []),
  ].map((t) => t?.toLowerCase().trim()).filter(Boolean));

  const currentId = String(article.id || '');
  const currentSlug = String(article.slug || '').trim().toLowerCase();
  const currentTitle = String(article.title || article.titleGu || '').trim().toLowerCase();

  const allCandidates = [...categoryArticles, ...fallbackArticles];
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();
  const seenTitles = new Set<string>();

  const uniqueCandidates: typeof allCandidates = [];
  for (const a of allCandidates) {
    if (!a) continue;
    const aId = String(a.id || '');
    const aSlug = String(a.slug || '').trim().toLowerCase();
    const aTitle = String(a.title || a.titleGu || '').trim().toLowerCase();

    // Strictly skip if it matches the current active article
    if (aId === currentId || (currentSlug && aSlug === currentSlug) || (currentTitle && aTitle === currentTitle)) {
      continue;
    }

    // Strictly skip if already seen by ID, slug, or title
    if ((aId && seenIds.has(aId)) || (aSlug && seenSlugs.has(aSlug)) || (aTitle && seenTitles.has(aTitle))) {
      continue;
    }

    if (aId) seenIds.add(aId);
    if (aSlug) seenSlugs.add(aSlug);
    if (aTitle) seenTitles.add(aTitle);
    uniqueCandidates.push(a);
  }

  const GENERIC_TAGS = new Set([
    'news', 'popular stories', 'popular-stories', 'popularstories',
    'trending', 'breaking', 'breaking news', 'national', 'સમાચાર',
    'ન્યૂઝ', 'લાઇવ', 'વિશેષ', 'ગુજરાત', 'ભારત'
  ]);

  const articleSlugWords = (article.slug || '')
    .split('-')
    .filter((w) => w.length > 3 && !['gujaratpost', 'news', 'from', 'with', 'turns', 'into'].includes(w));

  const scoredRelated = uniqueCandidates.map((item) => {
    let score = 0;

    // 1. Same category bonus (primary relevance factor)
    const itemCatSlug = (item.category || '').toLowerCase().replace(/\s+/g, '-');
    if (itemCatSlug === categorySlug && categorySlug !== '') {
      score += 25;
    }

    // 2. Tag overlap bonus (specific tags heavily weighted, generic tags minimally weighted)
    const itemTags = [
      ...(item.tags || []),
      ...(item.tagsGu || []),
      ...(item.tagsHi || []),
    ].map((t) => t?.toLowerCase().trim()).filter(Boolean);

    itemTags.forEach((t) => {
      if (currentTags.has(t)) {
        score += GENERIC_TAGS.has(t) ? 2 : 15;
      }
    });

    // 3. Title / Slug keyword similarity (e.g. "cjp", "sharma", "murder", "brics", etc.)
    const itemSlug = (item.slug || '').toLowerCase();
    articleSlugWords.forEach((word) => {
      if (itemSlug.includes(word)) {
        score += 12;
      }
    });

    // 4. Same location bonus
    if (item.location && article.location && item.location.toLowerCase().trim() === article.location.toLowerCase().trim()) {
      score += 15;
    }

    // 5. Popularity & Featured status
    if (item.isTrending) score += 4;
    if (item.isFeatured) score += 3;
    if (item.views) score += Math.min(item.views / 200, 5);

    // 6. Recency bonus
    const pubTime = new Date(item.publishedAt || (item as any).createdAt || 0).getTime();
    if (pubTime > 0) {
      const daysDiff = (Date.now() - pubTime) / (1000 * 60 * 60 * 24);
      if (daysDiff >= 0 && daysDiff <= 7) {
        score += (7 - daysDiff) * 0.5;
      }
    }

    return { item, score };
  });

  scoredRelated.sort((a, b) => b.score - a.score);

  const related = scoredRelated.map((entry) => entry.item);

  const articleUrl = `${SITE_URL}/news/${article.slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    alternativeHeadline: article.titleGu,
    description: article.excerpt,
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <NewsDetailClient article={article} related={related} trending={trending} articleUrl={articleUrl} />
    </>
  );
}


import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SITE_URL } from "@/data";
import { getPublicArticleBySlug, getPublicArticles } from "@/lib/api";
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
    const url = `/news/${article.slug}`;
    const authorName = typeof article.author === 'string' ? article.author : article.author?.name || 'Gujarat Post';

    return {
      title: article.title,
      description: article.excerpt,
      alternates: { canonical: url },
      authors: [{ name: authorName }],
      openGraph: {
        title: article.title,
        description: article.excerpt,
        url,
        siteName: "Gujarat Post",
        images: [{ url: article.image || '', width: 1200, height: 630, alt: article.title }],
        type: "article",
        publishedTime: article.publishedAt,
        modifiedTime: article.updatedAt,
        authors: [authorName],
        tags: article.tags || [],
      },
      twitter: {
        card: "summary_large_image",
        title: article.title,
        description: article.excerpt,
        images: [article.image || ''],
      },
    };
  } catch {
    return {};
  }
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getPublicArticleBySlug(slug);

  if (!article) notFound();

  // Dynamically fetch related articles and calculate smart relevance scores
  const categorySlug = (article.category || '').toLowerCase().replace(/\s+/g, '-');
  const [catRes, fallbackRes, trendingRes] = await Promise.all([
    getPublicArticles({ categorySlug, limit: 20 }).catch(() => ({ articles: [], total: 0, totalPages: 1 })),
    getPublicArticles({ limit: 50 }).catch(() => ({ articles: [], total: 0, totalPages: 1 })),
    getPublicArticles({ isTrending: true, limit: 20 }).catch(() => ({ articles: [], total: 0, totalPages: 1 })),
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

  const scoredRelated = uniqueCandidates.map((item) => {
    let score = 0;

    // 1. Same category bonus
    const itemCatSlug = (item.category || '').toLowerCase().replace(/\s+/g, '-');
    if (itemCatSlug === categorySlug && categorySlug !== '') {
      score += 10;
    }

    // 2. Tag overlap bonus
    const itemTags = [
      ...(item.tags || []),
      ...(item.tagsGu || []),
      ...(item.tagsHi || []),
    ].map((t) => t?.toLowerCase().trim()).filter(Boolean);

    let matchingTagsCount = 0;
    itemTags.forEach((t) => {
      if (currentTags.has(t)) matchingTagsCount++;
    });
    score += matchingTagsCount * 8;

    // 3. Popularity & Featured status
    if (item.isTrending) score += 4;
    if (item.isFeatured) score += 3;
    if (item.views) score += Math.min(item.views / 200, 5);

    // 4. Recency bonus
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
      name: article.author.name,
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

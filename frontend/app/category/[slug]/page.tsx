import { CATEGORY_META, categorySlugMapping, CATEGORY_CUSTOM_SEO, getCategoryCustomSeo } from "@/data";
import { getPublicArticles, getPublicCategories } from "@/lib/api";
import { sortArticlesByLatest } from "@/lib/utils";
import CategoryPageClient from "./CategoryPageClient";
import { notFound, redirect } from "next/navigation";

// Force dynamic rendering — always fetch fresh articles from the backend API
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rawLower = (slug || '').toLowerCase().trim();
  const resolvedSlug = categorySlugMapping[rawLower] || categorySlugMapping[slug] || rawLower;
  const category = CATEGORY_META[resolvedSlug as keyof typeof CATEGORY_META];
  const name = category?.name || slug;

  const customSeo = getCategoryCustomSeo(resolvedSlug, name, category?.gu) || CATEGORY_CUSTOM_SEO[resolvedSlug] || CATEGORY_CUSTOM_SEO[rawLower];

  const pageTitle = customSeo?.title || `${name} News`;
  const metaDesc = customSeo?.description || `Latest ${name} news, photos and videos from Gujarat Post.`;
  const canonicalUrl = customSeo?.url || `/category/${slug}`;

  return {
    title: customSeo?.title ? { absolute: customSeo.title } : pageTitle,
    description: metaDesc,
    keywords: customSeo?.keywords,
    alternates: {
      canonical: canonicalUrl,
      types: {
        'application/rss+xml': `/rss/${resolvedSlug || slug}.xml`,
      },
    },
    openGraph: {
      title: pageTitle.includes('Gujarat Post') ? pageTitle : `${pageTitle} | Gujarat Post`,
      description: metaDesc,
      url: canonicalUrl,
      type: "website",
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle.includes('Gujarat Post') ? pageTitle : `${pageTitle} | Gujarat Post`,
      description: metaDesc,
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ page?: string; limit?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams?.page || "1", 10);
  const limit = parseInt(resolvedSearchParams?.limit || "42", 10);

  const rawLower = (slug || '').toLowerCase().trim();
  const resolvedSlug = categorySlugMapping[rawLower] || categorySlugMapping[slug] || rawLower;

  // Direct multimedia / special category routes to their dedicated pages
  if (resolvedSlug === 'videos' || resolvedSlug === 'video') {
    redirect('/videos');
  }
  if (resolvedSlug === 'shorts') {
    redirect('/shorts');
  }
  if (resolvedSlug === 'podcasts') {
    redirect('/videos?tab=podcast');
  }
  if (resolvedSlug === 'photos' || resolvedSlug === 'photo-gallery') {
    redirect('/photos');
  }
  if (resolvedSlug === 'epaper') {
    redirect('/epaper');
  }

  const fallbackCat = CATEGORY_META[resolvedSlug as keyof typeof CATEGORY_META];

  // Known categories have local metadata, so only fetch their article feed before rendering.
  // Custom database categories still need the category list for validation and labels.
  const [dbCategories, catRes, politicsRes] = await Promise.all([
    fallbackCat ? Promise.resolve([]) : getPublicCategories().catch(() => []),
    getPublicArticles({
      categorySlug: resolvedSlug === 'trending' ? undefined : resolvedSlug,
      isTrending: resolvedSlug === 'trending' ? true : undefined,
      page,
      limit,
    }).catch(() => ({ articles: [], total: 0, totalPages: 1 })),
    resolvedSlug === 'trending'
      ? getPublicArticles({ categorySlug: 'politics', limit: 10 }).catch(() => ({ articles: [], total: 0, totalPages: 1 }))
      : Promise.resolve({ articles: [], total: 0, totalPages: 1 }),
  ]);

  const dbCat = (Array.isArray(dbCategories) ? dbCategories : []).find((c: any) => c.slug === resolvedSlug);

  if (!dbCat && !fallbackCat) {
    notFound();
  }

  const categoryData = {
    name: dbCat?.name || fallbackCat?.name || slug,
    nameGu: dbCat?.nameGu || fallbackCat?.gu || slug,
    nameHi: dbCat?.nameHi || fallbackCat?.hi || slug,
    description: dbCat?.description || dbCat?.descriptionGu || "",
    icon: dbCat?.icon || "newspaper",
    color: dbCat?.color || "#dc2626",
  };

  const customSeo = getCategoryCustomSeo(resolvedSlug, categoryData.name, categoryData.nameGu);

  let rawArticles = catRes?.articles || [];
  let total = catRes?.total || 0;
  let totalPages = catRes?.totalPages || 1;

  // Fallback: If category filter returns 0 articles, load general published news so category page is never blank
  if (!rawArticles || rawArticles.length === 0) {
    const fallbackRes = await getPublicArticles({
      page: 1,
      limit: 42,
    }).catch(() => ({ articles: [], total: 0, totalPages: 1 }));
    rawArticles = fallbackRes.articles || [];
    total = fallbackRes.total || rawArticles.length;
    totalPages = fallbackRes.totalPages || 1;
  }

  const articles = sortArticlesByLatest(rawArticles);
  const politicsArticles = sortArticlesByLatest(politicsRes?.articles || []);

  return (
    <CategoryPageClient
      articles={articles}
      category={categoryData}
      trending={[]}
      politicsArticles={politicsArticles}
      customSeo={customSeo}
      currentPage={page}
      totalPages={totalPages || Math.ceil(total / limit)}
      slug={slug}
      resolvedSlug={resolvedSlug}
    />
  );
}

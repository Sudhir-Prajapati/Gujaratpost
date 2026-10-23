import { CATEGORY_META, categorySlugMapping } from "@/data";
import { getPublicArticles, getPublicCategories } from "@/lib/api";
import { sortArticlesByLatest } from "@/lib/utils";
import CategoryPageClient from "./CategoryPageClient";
import { notFound, redirect } from "next/navigation";

// Force dynamic rendering — always fetch fresh articles from the backend API
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateStaticParams() {
  const metaKeys = Object.keys(CATEGORY_META).filter((slug) => !["videos", "shorts", "podcasts"].includes(slug));
  const mappingKeys = Object.keys(categorySlugMapping).filter((key) => !["videos", "shorts", "podcasts"].includes(key));
  const allSlugs = Array.from(new Set([...metaKeys, ...mappingKeys]));
  return allSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resolvedSlug = categorySlugMapping[slug] || slug;
  const category = CATEGORY_META[resolvedSlug as keyof typeof CATEGORY_META];
  const name = category?.name || slug;

  return {
    title: `${name} News`,
    description: `Latest ${name} news, photos and videos from Gujarat Post.`,
    alternates: {
      canonical: `/category/${slug}`,
      types: {
        'application/rss+xml': `/rss/${resolvedSlug || slug}.xml`,
      },
    },
    openGraph: {
      title: `${name} News | Gujarat Post`,
      description: `Latest ${name} news from Gujarat Post.`,
      url: `/category/${slug}`,
      type: "website",
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
  const limit = parseInt(resolvedSearchParams?.limit || "40", 10);

  const resolvedSlug = categorySlugMapping[slug] || slug;

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
  const [dbCategories, catRes] = await Promise.all([
    fallbackCat ? Promise.resolve([]) : getPublicCategories().catch(() => []),
    getPublicArticles({
      categorySlug: resolvedSlug === 'trending' ? undefined : resolvedSlug,
      isTrending: resolvedSlug === 'trending' ? true : undefined,
      page,
      limit,
    }).catch(() => ({ articles: [], total: 0, totalPages: 1 })),
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

  let rawArticles = catRes?.articles || [];
  let total = catRes?.total || 0;
  let totalPages = catRes?.totalPages || 1;

  // Fallback: If category filter returns 0 articles, load general published news so category page is never blank
  if (!rawArticles || rawArticles.length === 0) {
    const fallbackRes = await getPublicArticles({
      page: 1,
      limit: 40,
    }).catch(() => ({ articles: [], total: 0, totalPages: 1 }));
    rawArticles = fallbackRes.articles || [];
    total = fallbackRes.total || rawArticles.length;
    totalPages = fallbackRes.totalPages || 1;
  }

  const articles = sortArticlesByLatest(rawArticles);
  

  return (
    <CategoryPageClient
      articles={articles}
      category={categoryData}
      trending={[]}
      currentPage={page}
      totalPages={totalPages || Math.ceil(total / limit)}
      slug={slug}
      resolvedSlug={resolvedSlug}
    />
  );
}

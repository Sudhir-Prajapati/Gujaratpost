import { categorySlugMapping, CATEGORY_META, getCategoryCustomSeo } from "@/data";
import { permanentRedirect } from "next/navigation";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rawLower = (slug || '').toLowerCase().trim();
  const resolvedSlug = categorySlugMapping[rawLower] || categorySlugMapping[slug] || rawLower;
  const category = CATEGORY_META[resolvedSlug as keyof typeof CATEGORY_META];
  const name = category?.name || (slug || '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const customSeo = getCategoryCustomSeo(resolvedSlug, name, category?.gu);
  const pageTitle = customSeo?.title || `${name} News | Gujarat Post`;
  const metaDesc = customSeo?.description || `Latest ${name} news, photos and videos from Gujarat Post.`;
  const canonicalUrl = resolvedSlug === 'photos' || resolvedSlug === 'gallery'
    ? 'https://www.gujaratpost.in/photos'
    : `https://www.gujaratpost.in/category/${resolvedSlug}`;

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

export default async function NewsListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ page?: string; limit?: string }>;
}) {
  const { slug } = await params;
  const rawLower = (slug || '').toLowerCase().trim();
  const resolvedSlug = categorySlugMapping[rawLower] || categorySlugMapping[slug] || rawLower;

  if (resolvedSlug === 'photos' || resolvedSlug === 'gallery') {
    permanentRedirect('/photos');
  }

  // 301 Permanent Redirect to real canonical category URL
  permanentRedirect(`/category/${resolvedSlug}`);
}

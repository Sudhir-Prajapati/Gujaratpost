/**
 * Normalizes a Prisma Article model (with included category, author, and tags relations)
 * to the structure expected by the frontend client components.
 */
export function normalizeArticle(art: any): any {
  if (!art) return null;
  return {
    id: art.id,
    slug: art.slug,
    title: art.title,
    titleGu: art.titleGu,
    titleHi: art.titleHi,
    excerpt: art.excerpt,
    excerptGu: art.excerptGu,
    excerptHi: art.excerptHi,
    content: art.content || "",
    contentGu: art.contentGu || "",
    contentHi: art.contentHi || "",
    image: art.featuredImage || art.thumbnail || "",
    category: art.category?.name || "",
    categorySlug: art.category?.slug || "",
    categoryGu: art.category?.nameGu || "",
    categoryHi: art.category?.nameHi || "",
    tags: art.tags?.map((t: any) => t.name) || [],
    tagsGu: art.tags?.map((t: any) => t.nameGu || t.name) || [],
    tagsHi: art.tags?.map((t: any) => t.nameHi || t.name) || [],
    author: {
      id: art.author?.id || "",
      name: art.author?.name || "",
      nameGu: art.author?.nameGu || art.author?.name || "",
      nameHi: art.author?.nameHi || art.author?.name || "",
      image: art.author?.image || "",
      designation: art.author?.designation || "",
      designationGu: art.author?.designationGu || art.author?.designation || "",
      designationHi: art.author?.designationHi || art.author?.designation || "",
      bio: art.author?.bio || "",
      bioGu: art.author?.bioGu || art.author?.bio || "",
      bioHi: art.author?.bioHi || art.author?.bio || "",
    },
    publishedAt: art.publishedAt?.toISOString?.() || art.publishedAt || new Date().toISOString(),
    updatedAt: art.updatedAt?.toISOString?.() || art.updatedAt || new Date().toISOString(),
    readingTime: art.readingTime || 3,
    isTrending: art.isTrending || false,
    isBreaking: art.isBreaking || false,
    isFeatured: art.isFeatured || false,
    views: art.views || 0,
  };
}

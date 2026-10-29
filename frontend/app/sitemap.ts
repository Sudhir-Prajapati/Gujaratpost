import type { MetadataRoute } from 'next';
import { getPublicArticles, getPublicCategories } from '@/lib/api';

export const revalidate = 1800; // Cache and regenerate at most every 30 minutes

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.startsWith('http')
      ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '')
      : 'https://gujaratpost.in';

  const now = new Date();

  // 1. Core static section routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: 'always',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/videos`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/photos`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/shorts`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/epaper`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/aqi`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/advertise`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/terms-of-use`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  // 2. Dynamic Categories
  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const categories = await getPublicCategories();
    if (Array.isArray(categories) && categories.length > 0) {
      const seen = new Set<string>();
      categoryRoutes = categories
        .filter((c: any) => c && c.slug && c.isActive !== false)
        .map((c: any) => c.slug.trim().toLowerCase())
        .filter((slug: string) => {
          if (!slug || seen.has(slug) || ['home', 'main'].includes(slug)) return false;
          seen.add(slug);
          return true;
        })
        .map((slug: string) => ({
          url: `${baseUrl}/category/${encodeURIComponent(slug)}`,
          lastModified: now,
          changeFrequency: 'hourly',
          priority: 0.85,
        }));
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Sitemap category fetch error:', err);
    }
  }

  // 3. Dynamic News Articles (latest 1000 articles)
  let articleRoutes: MetadataRoute.Sitemap = [];
  try {
    const articlesRes = await getPublicArticles({ limit: 1000, sort: 'latest' });
    const articles = articlesRes?.articles || [];
    if (Array.isArray(articles) && articles.length > 0) {
      const seen = new Set<string>();
      articleRoutes = articles
        .filter((art: any) => art && art.slug)
        .filter((art: any) => {
          const s = String(art.slug).trim();
          if (!s || seen.has(s)) return false;
          seen.add(s);
          return true;
        })
        .map((art: any) => ({
          url: `${baseUrl}/news/${encodeURIComponent(String(art.slug).trim())}`,
          lastModified: art.updatedAt
            ? new Date(art.updatedAt)
            : art.publishedAt
            ? new Date(art.publishedAt)
            : now,
          changeFrequency: 'daily',
          priority: 0.9,
        }));
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Sitemap articles fetch error:', err);
    }
  }

  return [...staticRoutes, ...categoryRoutes, ...articleRoutes];
}


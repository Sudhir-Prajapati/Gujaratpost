import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { sendSuccess } from '../utils/response.js';
import { withDbRetry } from '../utils/db.js';
import { redisClient } from '../config/redis.js';

const heroPostSelect = {
  id: true,
  slug: true,
  articleNumber: true,
  title: true,
  titleGu: true,
  titleHi: true,
  excerpt: true,
  excerptGu: true,
  excerptHi: true,
  featuredImage: true,
  category: {
    select: {
      id: true,
      name: true,
      nameGu: true,
      nameHi: true,
      slug: true,
    },
  },
  author: {
    select: {
      id: true,
      name: true,
      nameGu: true,
      nameHi: true,
      image: true,
    },
  },
  isFeatured: true,
  isTrending: true,
  isBreaking: true,
  readingTime: true,
  createdAt: true,
  updatedAt: true,
};

function formatPost(p: any) {
  if (!p) return null;
  return {
    id: p.id,
    slug: p.slug,
    articleNumber: p.articleNumber,
    title: p.title,
    titleGu: p.titleGu,
    titleHi: p.titleHi,
    excerpt: p.excerpt || '',
    excerptGu: p.excerptGu || '',
    excerptHi: p.excerptHi || '',
    image: p.featuredImage,
    featuredImage: p.featuredImage,
    category: p.category?.name || '',
    categoryGu: p.category?.nameGu || '',
    categoryHi: p.category?.nameHi || '',
    author: p.author ? {
      id: p.author.id,
      name: p.author.name,
      nameGu: p.author.nameGu,
      nameHi: p.author.nameHi,
      image: p.author.image,
    } : null,
    isFeatured: p.isFeatured,
    isTrending: p.isTrending,
    isBreaking: p.isBreaking,
    readingTime: p.readingTime,
    publishedAt: p.publishedAt || p.createdAt,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

let heroSettingsMemCache: { timestamp: number; data: any } | null = null;
let heroSettingsInFlightPromise: Promise<any> | null = null;
const HERO_CACHE_TTL_MS = 60 * 1000; // 60s in-memory TTL

export function invalidateHeroSettingsCache() {
  heroSettingsMemCache = null;
  heroSettingsInFlightPromise = null;
  if (redisClient.isOpen) {
    redisClient.del('cache:hero_settings').catch(() => {});
  }
}

export class HeroController {
  /**
   * Get hero section slots settings and resolved articles
   */
  static async getHeroSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const now = Date.now();
      if (heroSettingsMemCache && now - heroSettingsMemCache.timestamp < HERO_CACHE_TTL_MS) {
        return sendSuccess(res, heroSettingsMemCache.data, 'Hero section settings retrieved successfully.');
      }

      if (redisClient.isOpen) {
        try {
          const cached = await redisClient.get('cache:hero_settings');
          if (cached) {
            const parsed = JSON.parse(cached);
            heroSettingsMemCache = { timestamp: now, data: parsed };
            return sendSuccess(res, parsed, 'Hero section settings retrieved successfully.');
          }
        } catch {
          // Fall back to database
        }
      }

      if (heroSettingsInFlightPromise) {
        const data = await heroSettingsInFlightPromise;
        return sendSuccess(res, data, 'Hero section settings retrieved successfully.');
      }

      heroSettingsInFlightPromise = (async () => {
        let heroSetting: any = null;
        try {
          heroSetting = await withDbRetry(() =>
            prisma.heroSetting.findUnique({
              where: { id: 'default' },
            })
          );
        } catch (err: any) {
          console.warn('Warning: heroSetting query error, using fallback:', err?.message);
          heroSetting = null;
        }

        let slot1Id = heroSetting?.slot1Id;
        let slot2Id = heroSetting?.slot2Id;
        let slot3Id = heroSetting?.slot3Id;

        // Fetch backup featured or published posts in case any slot is missing
        const fallbackPosts = await prisma.post.findMany({
          where: { status: 'PUBLISHED' },
          orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
          take: 10,
          select: heroPostSelect,
        });

        const fallbackFormatted = fallbackPosts.map(formatPost);

        if (!slot1Id && fallbackPosts[0]) slot1Id = fallbackPosts[0].id;
        if (!slot2Id && fallbackPosts[1]) slot2Id = fallbackPosts[1].id;
        if (!slot3Id && fallbackPosts[2]) slot3Id = fallbackPosts[2].id;

        const targetIds = [slot1Id, slot2Id, slot3Id].filter((id): id is string => Boolean(id));

        const postsMap = new Map<string, any>();
        if (targetIds.length > 0) {
          const posts = await prisma.post.findMany({
            where: { id: { in: targetIds }, status: 'PUBLISHED' },
            select: heroPostSelect,
          });
          posts.forEach((p) => postsMap.set(p.id, formatPost(p)));
        }

        const s1 = (slot1Id ? postsMap.get(slot1Id) : null) || fallbackFormatted[0] || null;
        const s2 = (slot2Id ? postsMap.get(slot2Id) : null) || fallbackFormatted[1] || null;
        const s3 = (slot3Id ? postsMap.get(slot3Id) : null) || fallbackFormatted[2] || null;

        const slots = [s1, s2, s3];

        const DEFAULT_TOPICS = ['ચૂંટણી 2026', 'વરસાદ', 'સોના-ચાંદી', 'ક્રિકેટ', 'મેટ્રો', 'સેમિકન્ડક્ટર', 'ડાયમંડ ઉદ્યોગ', 'ટ્રાફિક'];

        let parsedTopics = DEFAULT_TOPICS;
        if (heroSetting?.trendingTopics) {
          try {
            parsedTopics = JSON.parse(heroSetting.trendingTopics);
          } catch {
            parsedTopics = heroSetting.trendingTopics.split(',').map((t: string) => t.trim()).filter(Boolean);
          }
        }

        let parsedTrendingNewsIds: string[] = [];
        if (heroSetting?.trendingNewsIds) {
          try {
            parsedTrendingNewsIds = JSON.parse(heroSetting.trendingNewsIds);
          } catch {
            parsedTrendingNewsIds = [];
          }
        }

        let trendingNewsArticles: any[] = [];
        if (parsedTrendingNewsIds.length > 0) {
          const posts = await prisma.post.findMany({
            where: { id: { in: parsedTrendingNewsIds }, status: 'PUBLISHED' },
            select: heroPostSelect,
          });
          const map = new Map<string, any>();
          posts.forEach((p) => map.set(p.id, formatPost(p)));
          trendingNewsArticles = parsedTrendingNewsIds
            .map((id) => map.get(id))
            .filter(Boolean);
        }

        if (trendingNewsArticles.length === 0) {
          const defaultTrendingPosts = await prisma.post.findMany({
            where: { status: 'PUBLISHED' },
            orderBy: [{ isTrending: 'desc' }, { createdAt: 'desc' }],
            take: 10,
            select: heroPostSelect,
          });
          trendingNewsArticles = defaultTrendingPosts.map(formatPost);
          parsedTrendingNewsIds = trendingNewsArticles.map((a: any) => a.id);
        }

        // Ensure all active published isTrending posts are merged at the top of trendingNewsArticles
        const allTrendingPosts = await prisma.post.findMany({
          where: { isTrending: true, status: 'PUBLISHED' },
          orderBy: [{ createdAt: 'desc' }],
          take: 10,
          select: heroPostSelect,
        });
        const formattedTrending = allTrendingPosts.map(formatPost);
        const combinedTrending = [...formattedTrending, ...trendingNewsArticles];
        trendingNewsArticles = combinedTrending.filter((art, idx, arr) => art && arr.findIndex((x) => x?.id === art.id) === idx);

        let parsedPopularNewsIds: string[] = [];
        if (heroSetting?.popularNewsIds) {
          try {
            parsedPopularNewsIds = JSON.parse(heroSetting.popularNewsIds);
          } catch {
            parsedPopularNewsIds = [];
          }
        }

        let popularNewsArticles: any[] = [];
        if (parsedPopularNewsIds.length > 0) {
          const posts = await prisma.post.findMany({
            where: { id: { in: parsedPopularNewsIds }, status: 'PUBLISHED' },
            select: heroPostSelect,
          });
          const map = new Map<string, any>();
          posts.forEach((p) => map.set(p.id, formatPost(p)));
          popularNewsArticles = parsedPopularNewsIds
            .map((id) => map.get(id))
            .filter(Boolean);
        }

        if (popularNewsArticles.length === 0) {
          const defaultPopularPosts = await prisma.post.findMany({
            where: { status: 'PUBLISHED' },
            orderBy: { createdAt: 'desc' },
            take: 12,
            select: heroPostSelect,
          });
          popularNewsArticles = defaultPopularPosts.map(formatPost);
          parsedPopularNewsIds = popularNewsArticles.map((a: any) => a.id);
        }

        let parsedHeroGridIds: string[] = [];
        if ((heroSetting as any)?.heroGridIds) {
          try {
            parsedHeroGridIds = JSON.parse((heroSetting as any).heroGridIds);
          } catch {
            parsedHeroGridIds = [];
          }
        }

        let heroGridArticles: any[] = [];
        if (parsedHeroGridIds.length > 0) {
          const posts = await prisma.post.findMany({
            where: { id: { in: parsedHeroGridIds }, status: 'PUBLISHED' },
            select: heroPostSelect,
          });
          const map = new Map<string, any>();
          posts.forEach((p) => map.set(p.id, formatPost(p)));
          heroGridArticles = parsedHeroGridIds
            .map((id) => map.get(id))
            .filter(Boolean);
        }

        if (heroGridArticles.length === 0) {
          const defaultHeroPosts = await prisma.post.findMany({
            where: { status: 'PUBLISHED' },
            orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
            take: 16,
            select: heroPostSelect,
          });
          heroGridArticles = defaultHeroPosts.map(formatPost);
          parsedHeroGridIds = heroGridArticles.map((a: any) => a.id);
        }

        // Ensure all active published isFeatured posts are merged at the top of heroGridArticles
        const allFeaturedPosts = await prisma.post.findMany({
          where: { isFeatured: true, status: 'PUBLISHED' },
          orderBy: [{ createdAt: 'desc' }],
          take: 6,
          select: heroPostSelect,
        });
        const formattedFeatured = allFeaturedPosts.map(formatPost);
        const combinedHeroGrid = [...formattedFeatured, ...heroGridArticles];
        heroGridArticles = combinedHeroGrid.filter((art, idx, arr) => art && arr.findIndex((x) => x?.id === art.id) === idx);

        let parsedMostReadIds: string[] = [];
        if ((heroSetting as any)?.mostReadIds) {
          try {
            parsedMostReadIds = JSON.parse((heroSetting as any).mostReadIds);
          } catch {
            parsedMostReadIds = [];
          }
        }

        let mostReadArticles: any[] = [];
        if (parsedMostReadIds.length > 0) {
          const posts = await prisma.post.findMany({
            where: { id: { in: parsedMostReadIds }, status: 'PUBLISHED' },
            select: heroPostSelect,
          });
          const map = new Map<string, any>();
          posts.forEach((p) => map.set(p.id, formatPost(p)));
          mostReadArticles = parsedMostReadIds
            .map((id) => map.get(id))
            .filter(Boolean);
        }

        if (mostReadArticles.length === 0) {
          const defaultMostReadPosts = await prisma.post.findMany({
            where: { status: 'PUBLISHED' },
            orderBy: [{ views: 'desc' }, { createdAt: 'desc' }],
            take: 3,
            select: heroPostSelect,
          });
          mostReadArticles = defaultMostReadPosts.map(formatPost);
          parsedMostReadIds = mostReadArticles.map((a: any) => a.id);
        }

        return {
          setting: {
            ...(heroSetting || { id: 'default', slot1Id, slot2Id, slot3Id }),
            trendingTopics: parsedTopics,
            trendingNewsIds: parsedTrendingNewsIds,
            popularNewsIds: parsedPopularNewsIds,
            mostReadIds: parsedMostReadIds,
            heroGridIds: parsedHeroGridIds,
          },
          slots,
          trendingTopics: parsedTopics,
          trendingNewsIds: parsedTrendingNewsIds,
          trendingNewsArticles,
          popularNewsIds: parsedPopularNewsIds,
          popularNewsArticles,
          mostReadIds: parsedMostReadIds,
          mostReadArticles,
          heroGridIds: parsedHeroGridIds,
          heroGridArticles,
        };
      })();

      let resultData: any;
      try {
        resultData = await heroSettingsInFlightPromise;
      } finally {
        heroSettingsInFlightPromise = null;
      }

      heroSettingsMemCache = { timestamp: Date.now(), data: resultData };
      if (redisClient.isOpen) {
        redisClient.setEx('cache:hero_settings', 60, JSON.stringify(resultData)).catch(() => {});
      }

      return sendSuccess(res, resultData, 'Hero section settings retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update hero section slot articles, trending topics, trending news, and popular news
   */
  static async updateHeroSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const { slot1Id, slot2Id, slot3Id, trendingTopics, trendingNewsIds, popularNewsIds, mostReadIds, heroGridIds } = req.body;

      const topicsStr = Array.isArray(trendingTopics)
        ? JSON.stringify(trendingTopics)
        : typeof trendingTopics === 'string'
        ? trendingTopics
        : null;

      const newsIdsStr = Array.isArray(trendingNewsIds)
        ? JSON.stringify(trendingNewsIds)
        : typeof trendingNewsIds === 'string'
        ? trendingNewsIds
        : null;

      const popularIdsStr = Array.isArray(popularNewsIds)
        ? JSON.stringify(popularNewsIds)
        : typeof popularNewsIds === 'string'
        ? popularNewsIds
        : null;

      const mostReadIdsStr = Array.isArray(mostReadIds)
        ? JSON.stringify(mostReadIds)
        : typeof mostReadIds === 'string'
        ? mostReadIds
        : null;

      const heroGridIdsStr = Array.isArray(heroGridIds)
        ? JSON.stringify(heroGridIds)
        : typeof heroGridIds === 'string'
        ? heroGridIds
        : null;

      const updatedSetting = await prisma.heroSetting.upsert({
        where: { id: 'default' },
        update: {
          slot1Id: slot1Id || null,
          slot2Id: slot2Id || null,
          slot3Id: slot3Id || null,
          trendingTopics: topicsStr,
          trendingNewsIds: newsIdsStr,
          popularNewsIds: popularIdsStr,
          mostReadIds: mostReadIdsStr,
          heroGridIds: heroGridIdsStr,
        } as any,
        create: {
          id: 'default',
          slot1Id: slot1Id || null,
          slot2Id: slot2Id || null,
          slot3Id: slot3Id || null,
          trendingTopics: topicsStr,
          trendingNewsIds: newsIdsStr,
          popularNewsIds: popularIdsStr,
          mostReadIds: mostReadIdsStr,
          heroGridIds: heroGridIdsStr,
        } as any,
      });

      const featuredIds = [slot1Id, slot2Id, slot3Id].filter((id): id is string => Boolean(id));

      // Mark the selected slot articles as isFeatured: true
      if (featuredIds.length > 0) {
        await prisma.post.updateMany({
          where: { id: { in: featuredIds } },
          data: { isFeatured: true },
        });
      }

      // Update isTrending flag for assigned trending news articles
      if (Array.isArray(trendingNewsIds) && trendingNewsIds.length > 0) {
        await prisma.post.updateMany({
          where: { id: { in: trendingNewsIds } },
          data: { isTrending: true },
        });
      }

      let parsedTopics = ['ચૂંટણી 2026', 'વરસાદ', 'સોના-ચાંદી', 'ક્રિકેટ', 'મેટ્રો', 'સેમિકન્ડક્ટર', 'ડાયમંડ ઉદ્યોગ', 'ટ્રાફિક'];
      if (updatedSetting.trendingTopics) {
        try {
          parsedTopics = JSON.parse(updatedSetting.trendingTopics);
        } catch {
          parsedTopics = updatedSetting.trendingTopics.split(',').map((t: string) => t.trim()).filter(Boolean);
        }
      }

      let parsedTrendingNewsIds: string[] = [];
      if (updatedSetting.trendingNewsIds) {
        try {
          parsedTrendingNewsIds = JSON.parse(updatedSetting.trendingNewsIds);
        } catch {
          parsedTrendingNewsIds = [];
        }
      }

      let parsedPopularNewsIds: string[] = [];
      if (updatedSetting.popularNewsIds) {
        try {
          parsedPopularNewsIds = JSON.parse(updatedSetting.popularNewsIds);
        } catch {
          parsedPopularNewsIds = [];
        }
      }

      let parsedMostReadIds: string[] = [];
      if ((updatedSetting as any)?.mostReadIds) {
        try {
          parsedMostReadIds = JSON.parse((updatedSetting as any).mostReadIds);
        } catch {
          parsedMostReadIds = [];
        }
      }

      const postsMap = new Map<string, any>();
      if (featuredIds.length > 0) {
        const posts = await prisma.post.findMany({
          where: { id: { in: featuredIds } },
          select: heroPostSelect,
        });
        posts.forEach((p) => postsMap.set(p.id, formatPost(p)));
      }

      const slots = [
        slot1Id ? postsMap.get(slot1Id) || null : null,
        slot2Id ? postsMap.get(slot2Id) || null : null,
        slot3Id ? postsMap.get(slot3Id) || null : null,
      ];

      let trendingNewsArticles: any[] = [];
      if (parsedTrendingNewsIds.length > 0) {
        const posts = await prisma.post.findMany({
          where: { id: { in: parsedTrendingNewsIds }, status: 'PUBLISHED' },
          select: heroPostSelect,
        });
        const map = new Map<string, any>();
        posts.forEach((p) => map.set(p.id, formatPost(p)));
        trendingNewsArticles = parsedTrendingNewsIds
          .map((id) => map.get(id))
          .filter(Boolean);
      }

      let popularNewsArticles: any[] = [];
      if (parsedPopularNewsIds.length > 0) {
        const posts = await prisma.post.findMany({
          where: { id: { in: parsedPopularNewsIds }, status: 'PUBLISHED' },
          select: heroPostSelect,
        });
        const map = new Map<string, any>();
        posts.forEach((p) => map.set(p.id, formatPost(p)));
        popularNewsArticles = parsedPopularNewsIds
          .map((id) => map.get(id))
          .filter(Boolean);
      }

      let mostReadArticles: any[] = [];
      if (parsedMostReadIds.length > 0) {
        const posts = await prisma.post.findMany({
          where: { id: { in: parsedMostReadIds }, status: 'PUBLISHED' },
          select: heroPostSelect,
        });
        const map = new Map<string, any>();
        posts.forEach((p) => map.set(p.id, formatPost(p)));
        mostReadArticles = parsedMostReadIds
          .map((id) => map.get(id))
          .filter(Boolean);
      }

      let parsedHeroGridIds: string[] = [];
      if ((updatedSetting as any)?.heroGridIds) {
        try {
          parsedHeroGridIds = JSON.parse((updatedSetting as any).heroGridIds);
        } catch {
          parsedHeroGridIds = [];
        }
      }

      let heroGridArticles: any[] = [];
      if (parsedHeroGridIds.length > 0) {
        const posts = await prisma.post.findMany({
          where: { id: { in: parsedHeroGridIds }, status: 'PUBLISHED' },
          select: heroPostSelect,
        });
        const map = new Map<string, any>();
        posts.forEach((p) => map.set(p.id, formatPost(p)));
        heroGridArticles = parsedHeroGridIds
          .map((id) => map.get(id))
          .filter(Boolean);
      }

      invalidateHeroSettingsCache();

      return sendSuccess(res, {
        setting: {
          ...updatedSetting,
          trendingTopics: parsedTopics,
          trendingNewsIds: parsedTrendingNewsIds,
          popularNewsIds: parsedPopularNewsIds,
          mostReadIds: parsedMostReadIds,
          heroGridIds: parsedHeroGridIds,
        },
        slots,
        trendingTopics: parsedTopics,
        trendingNewsIds: parsedTrendingNewsIds,
        trendingNewsArticles,
        popularNewsIds: parsedPopularNewsIds,
        popularNewsArticles,
        mostReadIds: parsedMostReadIds,
        mostReadArticles,
        heroGridIds: parsedHeroGridIds,
        heroGridArticles,
      }, 'Hero section settings updated successfully.');
    } catch (error) {
      next(error);
    }
  }
}

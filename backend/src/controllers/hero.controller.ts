import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { sendSuccess } from '../utils/response.js';
import { withDbRetry } from '../utils/db.js';
import { redisClient } from '../config/redis.js';
import { clearPublicRoutesCache } from '../utils/publicCache.js';

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
  views: true,
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
    views: p.views ?? 0,
    publishedAt: p.publishedAt || p.createdAt,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

let heroSettingsMemCache: { timestamp: number; data: any } | null = null;
let heroSettingsInFlightPromise: Promise<any> | null = null;
const HERO_CACHE_TTL_MS = 10 * 1000; // 10s in-memory TTL — fast enough for near-instant admin updates

let heroColumnsEnsured = false;
export async function ensureHeroSettingsTableColumns() {
  if (heroColumnsEnsured) return;
  try {
    const columns: any = await prisma.$queryRawUnsafe(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'hero_settings' 
        AND TABLE_SCHEMA = DATABASE()
    `);
    const colNames = new Set((columns || []).map((c: any) => (c.COLUMN_NAME || c.column_name || '').toLowerCase()));

    if (!colNames.has('electionbannerenabled')) {
      await prisma.$executeRawUnsafe(`ALTER TABLE hero_settings ADD COLUMN electionBannerEnabled TINYINT(1) NOT NULL DEFAULT 0`).catch(() => {});
      console.log('✅ Added missing electionBannerEnabled column to hero_settings');
    }
    if (!colNames.has('electionbannerjson')) {
      await prisma.$executeRawUnsafe(`ALTER TABLE hero_settings ADD COLUMN electionBannerJson LONGTEXT NULL`).catch(() => {});
      console.log('✅ Added missing electionBannerJson column to hero_settings');
    }
    if (!colNames.has('livecenterjson')) {
      await prisma.$executeRawUnsafe(`ALTER TABLE hero_settings ADD COLUMN liveCenterJson LONGTEXT NULL`).catch(() => {});
      console.log('✅ Added missing liveCenterJson column to hero_settings');
    }
    if (!colNames.has('heroslidermode')) {
      await prisma.$executeRawUnsafe(`ALTER TABLE hero_settings ADD COLUMN heroSliderMode VARCHAR(50) DEFAULT 'auto'`).catch(() => {});
    }
    if (!colNames.has('herosliderids')) {
      await prisma.$executeRawUnsafe(`ALTER TABLE hero_settings ADD COLUMN heroSliderIds TEXT NULL`).catch(() => {});
    }
    if (!colNames.has('herogridmode')) {
      await prisma.$executeRawUnsafe(`ALTER TABLE hero_settings ADD COLUMN heroGridMode VARCHAR(50) DEFAULT 'auto'`).catch(() => {});
    }
    if (!colNames.has('mostreadmode')) {
      await prisma.$executeRawUnsafe(`ALTER TABLE hero_settings ADD COLUMN mostReadMode VARCHAR(50) DEFAULT 'auto'`).catch(() => {});
    }
    heroColumnsEnsured = true;
  } catch (err: any) {
    console.warn('⚠️ ensureHeroSettingsTableColumns notice:', err?.message || err);
  }
}

export function invalidateHeroSettingsCache() {
  heroSettingsMemCache = null;
  heroSettingsInFlightPromise = null;
  clearPublicRoutesCache();
  if (redisClient.isOpen) {
    redisClient.del('cache:hero_settings').catch(() => { });
    redisClient.del('cache:public:/api/public/tickers').catch(() => { });
    redisClient.del('cache:public:/api/public/hero-settings').catch(() => { });
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

        if (!heroSetting) {
          try {
            const rawRows: any = await prisma.$queryRawUnsafe(`SELECT * FROM hero_settings WHERE id = 'default' LIMIT 1`);
            if (rawRows && rawRows.length > 0) {
              heroSetting = rawRows[0];
            }
          } catch (rawErr: any) {
            console.warn('Warning: raw hero_settings query error:', rawErr?.message);
          }
        }

        // 1. Parse all IDs from heroSetting
        let slot1Id = heroSetting?.slot1Id;
        let slot2Id = heroSetting?.slot2Id;
        let slot3Id = heroSetting?.slot3Id;

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

        let parsedPopularNewsIds: string[] = [];
        if (heroSetting?.popularNewsIds) {
          try {
            parsedPopularNewsIds = JSON.parse(heroSetting.popularNewsIds);
          } catch {
            parsedPopularNewsIds = [];
          }
        }

        let parsedHeroGridIds: string[] = [];
        if ((heroSetting as any)?.heroGridIds) {
          try {
            parsedHeroGridIds = JSON.parse((heroSetting as any).heroGridIds);
          } catch {
            parsedHeroGridIds = [];
          }
        }

        let parsedMostReadIds: string[] = [];
        if ((heroSetting as any)?.mostReadIds) {
          try {
            parsedMostReadIds = JSON.parse((heroSetting as any).mostReadIds);
          } catch {
            parsedMostReadIds = [];
          }
        }

        let mostReadMode = (heroSetting as any)?.mostReadMode;
        if (!mostReadMode) {
          try {
            const rawRows: any = await prisma.$queryRawUnsafe(`SELECT mostReadMode FROM hero_settings WHERE id = 'default' LIMIT 1`);
            if (rawRows && rawRows[0]?.mostReadMode) {
              mostReadMode = rawRows[0].mostReadMode;
            }
          } catch { }
        }
        mostReadMode = mostReadMode || 'auto';

        const heroSliderMode = (heroSetting as any)?.heroSliderMode || 'auto';
        let parsedHeroSliderIds: string[] = [];
        if ((heroSetting as any)?.heroSliderIds) {
          try {
            parsedHeroSliderIds = JSON.parse((heroSetting as any).heroSliderIds);
          } catch {
            parsedHeroSliderIds = [];
          }
        }

        // 2. Collect all target IDs into a single Set for 1 batch query
        const rawSlotIds = [slot1Id, slot2Id, slot3Id].filter((id): id is string => Boolean(id));
        const allTargetIds = Array.from(new Set([
          ...rawSlotIds,
          ...parsedTrendingNewsIds,
          ...parsedPopularNewsIds,
          ...parsedHeroGridIds,
          ...parsedMostReadIds,
          ...parsedHeroSliderIds,
        ]));

        // 3. Parallel Stage: Execute all queries concurrently via Promise.all
        // - Query A: Batch fetch all target articles by ID (replaces 5 separate queries)
        // - Query B: Top featured & published fallback (take 16) - serves slot fallbacks, heroGrid fallbacks
        // - Query C: Active featured posts (take 6) - merged into heroGrid
        // - Query D: Active trending posts (take 10) - merged into trending
        // - Query E: Popular fallback (take 12) - conditional
        // - Query F: Most-read fallback (take 3) - conditional
        const [
          targetPostsRes,
          featuredFallbackRes,
          activeFeaturedRes,
          activeTrendingRes,
          popularFallbackRes,
          mostReadFallbackRes,
        ] = await Promise.all([
          // Query A: All target IDs in 1 query
          allTargetIds.length > 0
            ? withDbRetry(() =>
              prisma.post.findMany({
                where: { id: { in: allTargetIds }, status: 'PUBLISHED' },
                select: heroPostSelect,
              })
            ).catch(() => [])
            : Promise.resolve([]),

          // Query B: Fallback for slots and heroGrid (latest posts first)
          withDbRetry(() =>
            prisma.post.findMany({
              where: { status: 'PUBLISHED' },
              orderBy: { articleNumber: 'desc' },
              take: 16,
              select: heroPostSelect,
            })
          ).catch(() => []),

          // Query C: Active featured posts (marked Home / News)
          withDbRetry(() =>
            prisma.post.findMany({
              where: { isFeatured: true, status: 'PUBLISHED' },
              orderBy: [{ articleNumber: 'desc' }],
              take: 20,
              select: heroPostSelect,
            })
          ).catch(() => []),

          // Query D: Fact Check posts (for Fact Check slider)
          withDbRetry(() =>
            prisma.post.findMany({
              where: {
                status: 'PUBLISHED',
                OR: [
                  { category: { slug: 'fact-check' } },
                  { category: { slug: 'factcheck' } },
                  { category: { name: { contains: 'Fact Check' } } },
                  { category: { nameGu: { contains: 'ફેક્ટ ચેક' } } },
                  { title: { contains: 'FACT CHECK' } },
                  { title: { contains: 'Fact Check' } },
                  { title: { contains: 'Fact check' } },
                  { title: { contains: 'Fack check' } },
                  { title: { contains: 'Fact-Check' } },
                  { title: { contains: 'ફેક્ટ ચેક' } },
                  { slug: { contains: 'fact-check' } },
                ],
              },
              orderBy: { articleNumber: 'desc' },
              take: 10,
              select: heroPostSelect,
            })
          ).catch(() => []),

          // Query E: Popular fallback (only if needed)
          parsedPopularNewsIds.length === 0
            ? withDbRetry(() =>
              prisma.post.findMany({
                where: { status: 'PUBLISHED' },
                orderBy: { createdAt: 'desc' },
                take: 12,
                select: heroPostSelect,
              })
            ).catch(() => [])
            : Promise.resolve([]),

          // Query F: Top-read posts from past 7 days (last week) for auto mode & fallback
          withDbRetry(() => {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return prisma.post.findMany({
              where: {
                status: 'PUBLISHED',
                createdAt: { gte: sevenDaysAgo },
              },
              orderBy: [
                { views: 'desc' },
                { articleNumber: 'desc' },
              ],
              take: 10,
              select: heroPostSelect,
            });
          }).catch(() => []),
        ]);

        // 4. Assemble lookups in memory
        const postsMap = new Map<string, any>();
        targetPostsRes.forEach((p: any) => postsMap.set(p.id, formatPost(p)));
        featuredFallbackRes.forEach((p: any) => {
          if (!postsMap.has(p.id)) {
            postsMap.set(p.id, formatPost(p));
          }
        });

        const fallbackFormatted = featuredFallbackRes.map(formatPost);

        // Resolve Slots: Return explicitly assigned articles if set by Admin.
        // If not assigned by admin (null/empty), leave as null so client/user side knows to use auto fallback (Articles 10, 11, 12).
        const s1 = (slot1Id && postsMap.get(slot1Id)) ? postsMap.get(slot1Id) : null;
        const s2 = (slot2Id && postsMap.get(slot2Id)) ? postsMap.get(slot2Id) : null;
        const s3 = (slot3Id && postsMap.get(slot3Id)) ? postsMap.get(slot3Id) : null;
        const slots = [s1, s2, s3];

        // Resolve Trending News (preserving order and fallback)
        let trendingNewsArticles: any[] = [];
        if (parsedTrendingNewsIds.length > 0) {
          trendingNewsArticles = parsedTrendingNewsIds
            .map((id) => postsMap.get(id))
            .filter(Boolean);
        }

        const isFactCheckPost = (a: any) => {
          if (!a) return false;
          const catSlug = (a.category?.slug || a.categorySlug || '').toLowerCase();
          const title = (a.title || '').toLowerCase();
          const slug = (a.slug || '').toLowerCase();
          return (
            catSlug === 'fact-check' ||
            catSlug === 'factcheck' ||
            catSlug.includes('fact') ||
            title.includes('fact check') ||
            title.includes('fack check') ||
            title.includes('ફેક્ટ ચેક') ||
            slug.includes('fact-check')
          );
        };

        const validTrendingFromSetting = trendingNewsArticles.filter(isFactCheckPost);
        const formattedTrendingRes = activeTrendingRes.map(formatPost);
        const allFactChecks = [...formattedTrendingRes, ...validTrendingFromSetting];
        trendingNewsArticles = allFactChecks
          .filter((art, idx, arr) => art && arr.findIndex((x) => x?.id === art.id) === idx)
          .sort((a: any, b: any) => (b.articleNumber || 0) - (a.articleNumber || 0))
          .slice(0, 10);

        // Resolve Popular News (preserving order and fallback)
        let popularNewsArticles: any[] = [];
        if (parsedPopularNewsIds.length > 0) {
          popularNewsArticles = parsedPopularNewsIds
            .map((id) => postsMap.get(id))
            .filter(Boolean);
        }

        if (popularNewsArticles.length === 0) {
          popularNewsArticles = (popularFallbackRes.length > 0 ? popularFallbackRes : fallbackFormatted.slice(0, 12)).map(formatPost);
          parsedPopularNewsIds = popularNewsArticles.map((a: any) => a.id);
        }

        // Resolve Hero Grid (strictly 9 articles for top hero section)
        const heroGridMode = (heroSetting as any)?.heroGridMode || 'auto';
        let heroGridArticles: any[] = [];
        if (heroGridMode === 'manual') {
          if (parsedHeroGridIds.length > 0) {
            heroGridArticles = parsedHeroGridIds
              .map((id) => postsMap.get(id))
              .filter(Boolean)
              .slice(0, 9);
          }
        } else {
          // AUTO MODE: Prioritize articles where admin selected "Home / News" (isFeatured = true)
          const featuredFormatted = (activeFeaturedRes || []).map(formatPost);
          if (featuredFormatted.length > 0) {
            heroGridArticles = featuredFormatted.slice(0, 9);
          } else {
            heroGridArticles = fallbackFormatted.slice(0, 9);
          }
          parsedHeroGridIds = heroGridArticles.map((a: any) => a.id);
        }

        // Resolve Most Read (Automatic 30-day top read articles vs Manual Top 10)
        let autoMostReadPosts = [...mostReadFallbackRes];
        if (autoMostReadPosts.length < 10) {
          const seenIds = new Set(autoMostReadPosts.map((p: any) => p?.id).filter(Boolean));
          for (const p of featuredFallbackRes) {
            if (autoMostReadPosts.length >= 10) break;
            if (p?.id && !seenIds.has(p.id)) {
              seenIds.add(p.id);
              autoMostReadPosts.push(p);
            }
          }
        }
        const formattedAutoMostRead = autoMostReadPosts
          .slice(0, 10)
          .map(formatPost)
          .filter((a): a is NonNullable<typeof a> => Boolean(a && a.id));

        let mostReadArticles: any[] = [];
        if (mostReadMode === 'manual') {
          if (parsedMostReadIds.length > 0) {
            mostReadArticles = parsedMostReadIds
              .map((id) => postsMap.get(id))
              .filter((a): a is NonNullable<typeof a> => Boolean(a && a.id))
              .slice(0, 10);
          }
          // If admin selected fewer than 10, fill remaining from auto top read
          if (mostReadArticles.length < 10) {
            const existingIds = new Set(mostReadArticles.map((a: any) => a.id));
            for (const autoArt of formattedAutoMostRead) {
              if (mostReadArticles.length >= 10) break;
              if (autoArt && autoArt.id && !existingIds.has(autoArt.id)) {
                existingIds.add(autoArt.id);
                mostReadArticles.push(autoArt);
              }
            }
          }
        } else {
          // Automatic mode: strictly past 7 days top read articles
          mostReadArticles = formattedAutoMostRead;
          parsedMostReadIds = mostReadArticles.map((a: any) => a.id);
        }

        // Resolve Hero Slider Articles (preserving order)
        let heroSliderArticles: any[] = [];
        if (parsedHeroSliderIds.length > 0) {
          heroSliderArticles = parsedHeroSliderIds
            .map((id) => postsMap.get(id))
            .filter(Boolean);
        }

        return {
          setting: {
            ...(heroSetting || { id: 'default', slot1Id, slot2Id, slot3Id }),
            tickerLabel: (heroSetting as any)?.tickerLabel || null,
            trendingTopics: parsedTopics,
            trendingNewsIds: parsedTrendingNewsIds,
            popularNewsIds: parsedPopularNewsIds,
            mostReadIds: parsedMostReadIds,
            mostReadMode,
            heroGridIds: parsedHeroGridIds,
            heroGridMode,
            heroSliderMode,
            heroSliderIds: parsedHeroSliderIds,
            electionBannerEnabled: (heroSetting as any)?.electionBannerEnabled ?? false,
            electionBannerJson: (heroSetting as any)?.electionBannerJson || null,
          },
          slots,
          tickerLabel: (heroSetting as any)?.tickerLabel || null,
          trendingTopics: parsedTopics,
          trendingNewsIds: parsedTrendingNewsIds,
          trendingNewsArticles,
          popularNewsIds: parsedPopularNewsIds,
          popularNewsArticles,
          mostReadIds: parsedMostReadIds,
          mostReadMode,
          mostReadArticles,
          autoMostReadArticles: formattedAutoMostRead,
          heroGridIds: parsedHeroGridIds,
          heroGridArticles,
          heroGridMode,
          heroSliderMode,
          heroSliderIds: parsedHeroSliderIds,
          heroSliderArticles,
          electionBannerEnabled: (heroSetting as any)?.electionBannerEnabled ?? false,
          electionBannerJson: (heroSetting as any)?.electionBannerJson || null,
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
        redisClient.setEx('cache:hero_settings', 10, JSON.stringify(resultData)).catch(() => { });
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
      const { slot1Id, slot2Id, slot3Id, trendingTopics, trendingNewsIds, popularNewsIds, mostReadIds, mostReadMode, heroGridIds, heroGridMode, tickerLabel, heroSliderMode, heroSliderIds, electionBannerEnabled, electionBannerJson } = req.body;

      const tickerLabelStr = tickerLabel !== undefined
        ? (typeof tickerLabel === 'object' ? JSON.stringify(tickerLabel) : String(tickerLabel))
        : undefined;

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

      const heroSliderIdsStr = Array.isArray(heroSliderIds)
        ? JSON.stringify(heroSliderIds)
        : typeof heroSliderIds === 'string'
          ? heroSliderIds
          : null;

      const updateData: any = {};
      if (slot1Id !== undefined) updateData.slot1Id = slot1Id || null;
      if (slot2Id !== undefined) updateData.slot2Id = slot2Id || null;
      if (slot3Id !== undefined) updateData.slot3Id = slot3Id || null;
      if (trendingTopics !== undefined) updateData.trendingTopics = topicsStr;
      if (trendingNewsIds !== undefined) updateData.trendingNewsIds = newsIdsStr;
      if (popularNewsIds !== undefined) updateData.popularNewsIds = popularIdsStr;
      if (mostReadIds !== undefined) updateData.mostReadIds = mostReadIdsStr;
      if (heroGridIds !== undefined) updateData.heroGridIds = heroGridIdsStr;
      if (tickerLabelStr !== undefined) updateData.tickerLabel = tickerLabelStr;
      if (heroSliderMode !== undefined) updateData.heroSliderMode = heroSliderMode || 'auto';
      if (heroSliderIds !== undefined) updateData.heroSliderIds = heroSliderIdsStr;
      if (electionBannerEnabled !== undefined) updateData.electionBannerEnabled = Boolean(electionBannerEnabled);
      if (electionBannerJson !== undefined) updateData.electionBannerJson = typeof electionBannerJson === 'object' ? JSON.stringify(electionBannerJson) : (electionBannerJson || null);

      await ensureHeroSettingsTableColumns().catch(() => {});

      let updatedSetting: any = null;
      try {
        updatedSetting = await prisma.heroSetting.upsert({
          where: { id: 'default' },
          update: updateData,
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
            tickerLabel: tickerLabelStr || null,
            heroSliderMode: heroSliderMode || 'auto',
            heroSliderIds: heroSliderIdsStr,
            electionBannerEnabled: Boolean(electionBannerEnabled),
            electionBannerJson: typeof electionBannerJson === 'object' ? JSON.stringify(electionBannerJson) : (electionBannerJson || null),
          } as any,
        });
      } catch (upsertErr: any) {
        console.warn('prisma.heroSetting.upsert error, using resilient SQL update:', upsertErr?.message);
        const keys = Object.keys(updateData);
        if (keys.length > 0) {
          try {
            const sets = keys.map((k) => `\`${k}\` = ?`).join(', ');
            const values = keys.map((k) => updateData[k]);
            await prisma.$executeRawUnsafe(
              `UPDATE hero_settings SET ${sets}, updatedAt = NOW() WHERE id = 'default'`,
              ...values
            );
          } catch (sqlErr: any) {
            console.warn('Batch SQL update failed, updating individually:', sqlErr?.message);
            for (const key of keys) {
              try {
                await prisma.$executeRawUnsafe(
                  `UPDATE hero_settings SET \`${key}\` = ?, updatedAt = NOW() WHERE id = 'default'`,
                  updateData[key]
                );
              } catch { }
            }
          }
        }
        try {
          const rows: any = await prisma.$queryRawUnsafe(`SELECT * FROM hero_settings WHERE id = 'default' LIMIT 1`);
          updatedSetting = rows?.[0] || { id: 'default', ...updateData };
        } catch {
          updatedSetting = { id: 'default', ...updateData };
        }
      }

      if (!updatedSetting) {
        try {
          const rows: any = await prisma.$queryRawUnsafe(`SELECT * FROM hero_settings WHERE id = 'default' LIMIT 1`);
          updatedSetting = rows?.[0] || { id: 'default', ...updateData };
        } catch {
          updatedSetting = { id: 'default', ...updateData };
        }
      }

      if (heroGridMode !== undefined) {
        try {
          await prisma.$executeRawUnsafe(
            `UPDATE hero_settings SET heroGridMode = ? WHERE id = 'default'`,
            heroGridMode || 'auto'
          );
          (updatedSetting as any).heroGridMode = heroGridMode || 'auto';
        } catch (rawErr) {
          console.warn('Could not update heroGridMode via raw SQL:', rawErr);
        }
      }

      if (mostReadMode !== undefined) {
        try {
          await prisma.$executeRawUnsafe(
            `UPDATE hero_settings SET mostReadMode = ? WHERE id = 'default'`,
            mostReadMode || 'auto'
          );
          (updatedSetting as any).mostReadMode = mostReadMode || 'auto';
        } catch (rawErr) {
          console.warn('Could not update mostReadMode via raw SQL:', rawErr);
        }
      }

      // Do NOT set isFeatured: true on slot articles.
      // Slot articles are explicitly assigned to slot1Id, slot2Id, slot3Id in heroSettings
      // and must not mutate post flags or bleed into heroGrid/upper positions.

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

      const activeSlot1Id = slot1Id !== undefined ? slot1Id : (updatedSetting?.slot1Id || null);
      const activeSlot2Id = slot2Id !== undefined ? slot2Id : (updatedSetting?.slot2Id || null);
      const activeSlot3Id = slot3Id !== undefined ? slot3Id : (updatedSetting?.slot3Id || null);
      const featuredIds = [activeSlot1Id, activeSlot2Id, activeSlot3Id].filter((id): id is string => Boolean(id));
      const postsMap = new Map<string, any>();
      if (featuredIds.length > 0) {
        const posts = await withDbRetry(() =>
          prisma.post.findMany({
            where: { id: { in: featuredIds } },
            select: heroPostSelect,
          })
        ).catch(() => []);
        posts.forEach((p) => postsMap.set(p.id, formatPost(p)));
      }

      const slots = [
        activeSlot1Id ? postsMap.get(activeSlot1Id) || null : null,
        activeSlot2Id ? postsMap.get(activeSlot2Id) || null : null,
        activeSlot3Id ? postsMap.get(activeSlot3Id) || null : null,
      ];

      let trendingNewsArticles: any[] = [];
      if (parsedTrendingNewsIds.length > 0) {
        const posts = await withDbRetry(() =>
          prisma.post.findMany({
            where: { id: { in: parsedTrendingNewsIds }, status: 'PUBLISHED' },
            select: heroPostSelect,
          })
        ).catch(() => []);
        const map = new Map<string, any>();
        posts.forEach((p) => map.set(p.id, formatPost(p)));
        trendingNewsArticles = parsedTrendingNewsIds
          .map((id) => map.get(id))
          .filter(Boolean);
      }

      let popularNewsArticles: any[] = [];
      if (parsedPopularNewsIds.length > 0) {
        const posts = await withDbRetry(() =>
          prisma.post.findMany({
            where: { id: { in: parsedPopularNewsIds }, status: 'PUBLISHED' },
            select: heroPostSelect,
          })
        ).catch(() => []);
        const map = new Map<string, any>();
        posts.forEach((p) => map.set(p.id, formatPost(p)));
        popularNewsArticles = parsedPopularNewsIds
          .map((id) => map.get(id))
          .filter(Boolean);
      }

      let finalMostReadMode = (updatedSetting as any)?.mostReadMode || mostReadMode;
      if (!finalMostReadMode) {
        try {
          const rawRows: any = await prisma.$queryRawUnsafe(`SELECT mostReadMode FROM hero_settings WHERE id = 'default' LIMIT 1`);
          if (rawRows && rawRows[0]?.mostReadMode) {
            finalMostReadMode = rawRows[0].mostReadMode;
          }
        } catch { }
      }
      finalMostReadMode = finalMostReadMode || 'auto';

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const autoTopPosts = await withDbRetry(() =>
        prisma.post.findMany({
          where: {
            status: 'PUBLISHED',
            createdAt: { gte: sevenDaysAgo },
          },
          orderBy: [
            { views: 'desc' },
            { articleNumber: 'desc' },
          ],
          take: 10,
          select: heroPostSelect,
        })
      ).catch(() => []);

      let autoPool = [...autoTopPosts];
      if (autoPool.length < 10) {
        const extraPosts = await withDbRetry(() =>
          prisma.post.findMany({
            where: { status: 'PUBLISHED' },
            orderBy: [
              { views: 'desc' },
              { articleNumber: 'desc' },
            ],
            take: 10,
            select: heroPostSelect,
          })
        ).catch(() => []);
        const seenIds = new Set(autoPool.map((p) => p.id));
        for (const ep of extraPosts) {
          if (autoPool.length >= 10) break;
          if (!seenIds.has(ep.id)) {
            seenIds.add(ep.id);
            autoPool.push(ep);
          }
        }
      }
      const formattedAutoMostRead = autoPool
        .slice(0, 10)
        .map(formatPost)
        .filter((a): a is NonNullable<typeof a> => Boolean(a && a.id));

      let mostReadArticles: any[] = [];
      if (finalMostReadMode === 'manual') {
        if (parsedMostReadIds.length > 0) {
          const posts = await withDbRetry(() =>
            prisma.post.findMany({
              where: { id: { in: parsedMostReadIds }, status: 'PUBLISHED' },
              select: heroPostSelect,
            })
          ).catch(() => []);
          const map = new Map<string, any>();
          posts.forEach((p) => map.set(p.id, formatPost(p)));
          mostReadArticles = parsedMostReadIds
            .map((id) => map.get(id))
            .filter((a): a is NonNullable<typeof a> => Boolean(a && a.id))
            .slice(0, 10);
        }
        if (mostReadArticles.length < 10) {
          const existingIds = new Set(mostReadArticles.map((a: any) => a.id));
          for (const autoArt of formattedAutoMostRead) {
            if (mostReadArticles.length >= 10) break;
            if (autoArt && autoArt.id && !existingIds.has(autoArt.id)) {
              existingIds.add(autoArt.id);
              mostReadArticles.push(autoArt);
            }
          }
        }
      } else {
        mostReadArticles = formattedAutoMostRead;
        parsedMostReadIds = mostReadArticles.map((a: any) => a.id);
      }

      const finalHeroGridMode = (updatedSetting as any)?.heroGridMode || 'auto';
      let parsedHeroGridIds: string[] = [];
      if ((updatedSetting as any)?.heroGridIds) {
        try {
          parsedHeroGridIds = JSON.parse((updatedSetting as any).heroGridIds);
        } catch {
          parsedHeroGridIds = [];
        }
      }

      let heroGridArticles: any[] = [];
      if (finalHeroGridMode === 'manual') {
        if (parsedHeroGridIds.length > 0) {
          const posts = await withDbRetry(() =>
            prisma.post.findMany({
              where: { id: { in: parsedHeroGridIds }, status: 'PUBLISHED' },
              select: heroPostSelect,
            })
          ).catch(() => []);
          const map = new Map<string, any>();
          posts.forEach((p) => map.set(p.id, formatPost(p)));
          heroGridArticles = parsedHeroGridIds
            .map((id) => map.get(id))
            .filter(Boolean)
            .slice(0, 9);
        }
      } else {
        // AUTO MODE: Prioritize articles where admin selected "Home / News" (isFeatured = true)
        let posts = await withDbRetry(() =>
          prisma.post.findMany({
            where: { isFeatured: true, status: 'PUBLISHED' },
            orderBy: { articleNumber: 'desc' },
            take: 9,
            select: heroPostSelect,
          })
        ).catch(() => []);
        if (posts.length === 0) {
          posts = await withDbRetry(() =>
            prisma.post.findMany({
              where: { status: 'PUBLISHED' },
              orderBy: { articleNumber: 'desc' },
              take: 9,
              select: heroPostSelect,
            })
          ).catch(() => []);
        }
        heroGridArticles = posts.map(formatPost);
        parsedHeroGridIds = heroGridArticles.map((a: any) => a.id);
      }

      const finalHeroSliderMode = (updatedSetting as any)?.heroSliderMode || 'auto';
      let parsedHeroSliderIds: string[] = [];
      if ((updatedSetting as any)?.heroSliderIds) {
        try {
          parsedHeroSliderIds = JSON.parse((updatedSetting as any).heroSliderIds);
        } catch {
          parsedHeroSliderIds = [];
        }
      }

      let heroSliderArticles: any[] = [];
      if (parsedHeroSliderIds.length > 0) {
        const posts = await withDbRetry(() =>
          prisma.post.findMany({
            where: { id: { in: parsedHeroSliderIds }, status: 'PUBLISHED' },
            select: heroPostSelect,
          })
        ).catch(() => []);
        const map = new Map<string, any>();
        posts.forEach((p) => map.set(p.id, formatPost(p)));
        heroSliderArticles = parsedHeroSliderIds
          .map((id) => map.get(id))
          .filter(Boolean);
      }

      invalidateHeroSettingsCache();

      return sendSuccess(res, {
        setting: {
          ...updatedSetting,
          tickerLabel: (updatedSetting as any)?.tickerLabel || null,
          trendingTopics: parsedTopics,
          trendingNewsIds: parsedTrendingNewsIds,
          popularNewsIds: parsedPopularNewsIds,
          mostReadIds: parsedMostReadIds,
          mostReadMode: finalMostReadMode,
          heroGridIds: parsedHeroGridIds,
          heroGridMode: finalHeroGridMode,
          heroSliderMode: finalHeroSliderMode,
          heroSliderIds: parsedHeroSliderIds,
        },
        slots,
        tickerLabel: (updatedSetting as any)?.tickerLabel || null,
        trendingTopics: parsedTopics,
        trendingNewsIds: parsedTrendingNewsIds,
        trendingNewsArticles,
        popularNewsIds: parsedPopularNewsIds,
        popularNewsArticles,
        mostReadIds: parsedMostReadIds,
        mostReadMode: finalMostReadMode,
        mostReadArticles,
        autoMostReadArticles: formattedAutoMostRead,
        heroGridIds: parsedHeroGridIds,
        heroGridArticles,
        heroGridMode: finalHeroGridMode,
        heroSliderMode: finalHeroSliderMode,
        heroSliderIds: parsedHeroSliderIds,
        heroSliderArticles,
        electionBannerEnabled: (updatedSetting as any)?.electionBannerEnabled ?? false,
        electionBannerJson: (updatedSetting as any)?.electionBannerJson || null,
      }, 'Hero section settings updated successfully.');
    } catch (error) {
      next(error);
    }
  }
}

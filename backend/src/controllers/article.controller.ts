import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { sendSuccess } from '../utils/response.js';
import { BadRequestError } from '../utils/errors.js';
import { invalidateHeroSettingsCache } from './hero.controller.js';
import { clearPublicRoutesCache } from '../utils/publicCache.js';

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

let lastAutoPublishTime = 0;
const AUTO_PUBLISH_COOLDOWN_MS = 5 * 60 * 1000; // Run at most once every 5 minutes

export async function syncArticleToHeroSettings(postId: string, isFeatured?: boolean, isTrending?: boolean, status?: string) {
  try {
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { status: true, isFeatured: true, isTrending: true } });
    if (!post) return;

    const isPublished = post.status === 'PUBLISHED';
    const effectiveFeatured = isPublished && (isFeatured !== undefined ? isFeatured : post.isFeatured);
    const effectiveTrending = isPublished && (isTrending !== undefined ? isTrending : post.isTrending);

    const heroSetting = await prisma.heroSetting.findUnique({ where: { id: 'default' } });
    if (!heroSetting) {
      if (effectiveFeatured) {
        await prisma.heroSetting.create({
          data: {
            id: 'default',
            slot1Id: postId,
            heroGridIds: JSON.stringify([postId]),
            trendingNewsIds: effectiveTrending ? JSON.stringify([postId]) : undefined,
          },
        });
      }
      return;
    }

    let heroGridIds: string[] = [];
    if (heroSetting.heroGridIds) {
      try { heroGridIds = JSON.parse(heroSetting.heroGridIds); } catch { heroGridIds = []; }
    }

    let trendingNewsIds: string[] = [];
    if (heroSetting.trendingNewsIds) {
      try { trendingNewsIds = JSON.parse(heroSetting.trendingNewsIds); } catch { trendingNewsIds = []; }
    }

    let updated = false;
    let slot1Id = heroSetting.slot1Id;
    let slot2Id = heroSetting.slot2Id;
    let slot3Id = heroSetting.slot3Id;

    if (effectiveFeatured) {
      heroGridIds = [postId, ...heroGridIds.filter((id) => id !== postId)].slice(0, 20);
      if (slot1Id !== postId) {
        slot1Id = postId;
      }
      updated = true;
    } else {
      heroGridIds = heroGridIds.filter((id) => id !== postId);
      if (slot1Id === postId) slot1Id = heroGridIds[0] || null;
      if (slot2Id === postId) slot2Id = null;
      if (slot3Id === postId) slot3Id = null;
      updated = true;
    }

    if (effectiveTrending) {
      trendingNewsIds = [postId, ...trendingNewsIds.filter((id) => id !== postId)].slice(0, 15);
      updated = true;
    } else {
      trendingNewsIds = trendingNewsIds.filter((id) => id !== postId);
      updated = true;
    }

    if (updated) {
      await prisma.heroSetting.update({
        where: { id: 'default' },
        data: {
          slot1Id,
          slot2Id,
          slot3Id,
          heroGridIds: JSON.stringify(heroGridIds),
          trendingNewsIds: JSON.stringify(trendingNewsIds),
        },
      });
      invalidateHeroSettingsCache();
      clearPublicRoutesCache();
    }
  } catch (err) {
    console.warn('syncArticleToHeroSettings non-fatal error:', err);
  }
}

export async function autoPublishDueArticles() {
  const nowMs = Date.now();
  if (nowMs - lastAutoPublishTime < AUTO_PUBLISH_COOLDOWN_MS) {
    return;
  }
  lastAutoPublishTime = nowMs;

  try {
    const now = new Date();
    const updated = await prisma.post.updateMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: now },
      },
      data: {
        status: 'PUBLISHED',
      },
    });
    if (updated.count > 0) {
      invalidateHeroSettingsCache();
      clearPublicRoutesCache();
    }
  } catch (err) {
    console.error('Error auto-publishing due articles:', err);
  }
}

export class ArticleController {
  /**
   * Fetch all articles (posts) with filters.
   */
  static async getAllArticles(req: Request, res: Response, next: NextFunction) {
    try {
      await autoPublishDueArticles();

      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
      const skip = (page - 1) * limit;

      const query = req.query.query as string || '';
      const categorySlug = req.query.categorySlug as string || '';
      const status = req.query.status as string || '';
      const location = req.query.location as string || '';

      const where: any = {};

      if (location) {
        where.location = { contains: location };
      }

      if (query) {
        const cleanQuery = query.replace(/^#/, '').trim();
        const numQuery = parseInt(cleanQuery, 10);
        where.OR = [
          { title: { contains: query } },
          { titleGu: { contains: query } },
          { titleHi: { contains: query } },
          { content: { contains: query } },
          { slug: { contains: query } },
          ...(!isNaN(numQuery) && numQuery > 0 ? [{ articleNumber: numQuery }] : []),
        ];
      }

      if (categorySlug) {
        const catSlugLower = categorySlug.toLowerCase().trim();
        if (catSlugLower === 'other-cities' || catSlugLower === 'othercities') {
          where.OR = [
            { category: { slug: { in: ['other-cities', 'othercities', 'gujarat', 'state'] } } },
            { location: { notIn: ['Ahmedabad', 'Gandhinagar', 'Surat', 'Vadodara', 'Rajkot', 'અમદાવાદ', 'ગાંધીનગર', 'સુરત', 'વડોદરા', 'રાજકોટ'] } },
          ];
        } else {
          where.OR = [
            { category: { slug: catSlugLower } },
            { location: { contains: catSlugLower } },
            { location: { contains: categorySlug } },
          ];
        }
      }

      if (status) {
        where.status = status;
      }

      const dateStr = (req.query.date as string || '').trim();
      const startDateStr = (req.query.startDate as string || '').trim();
      const endDateStr = (req.query.endDate as string || '').trim();

      if (dateStr) {
        const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
        const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);
        if (!isNaN(startOfDay.getTime()) && !isNaN(endOfDay.getTime())) {
          where.createdAt = {
            gte: startOfDay,
            lte: endOfDay,
          };
        }
      } else if (startDateStr || endDateStr) {
        where.createdAt = {};
        if (startDateStr) where.createdAt.gte = new Date(`${startDateStr}T00:00:00.000Z`);
        if (endDateStr) where.createdAt.lte = new Date(`${endDateStr}T23:59:59.999Z`);
      }

      const [articles, total] = await Promise.all([
        prisma.post.findMany({
          where,
          select: {
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
            status: true,
            scheduledAt: true,
            authorId: true,
            categoryId: true,
            location: true,
            readingTime: true,
            priority: true,
            isTrending: true,
            isBreaking: true,
            isFeatured: true,
            views: true,
            createdAt: true,
            updatedAt: true,
            language: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            author: {
              select: {
                id: true,
                name: true,
              },
            },
            tags: true,
          },
          orderBy: [
            { createdAt: 'desc' },
            { articleNumber: 'desc' },
          ],
          skip,
          take: limit,
        }),
        prisma.post.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return sendSuccess(res, {
        articles,
        total,
        totalPages,
      }, 'Articles list retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch details of a single article.
   */
  static async getArticleById(req: Request, res: Response, next: NextFunction) {
    try {
      await autoPublishDueArticles();
      const { id } = req.params;
      const article = await prisma.post.findUnique({
        where: { id },
        include: {
          category: true,
          author: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });

      if (!article) {
        throw new BadRequestError('Article not found.');
      }

      return sendSuccess(res, { article }, 'Article retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new article.
   */
  static async createArticle(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        language: rawLanguage,
        title,
        titleGu,
        titleHi,
        excerpt,
        excerptGu,
        excerptHi,
        content,
        contentGu,
        contentHi,
        featuredImage,
        status,
        categoryId,
        authorId,
        priority,
        readingTime,
        isTrending,
        isBreaking,
        isFeatured,
        articleNumber,
        seoTitle,
        seoDescription,
        seoKeywords,
        canonicalUrl,
        metaRobots,
        tags, // array of { name: string }
        slug,
        location,
        scheduledAt,
      } = req.body;

      // Validate language: must be 'gu', 'en', or 'hi'. Default to 'gu'.
      let safeLanguage = 'gu';
      if (typeof rawLanguage === 'string' && ['gu', 'en', 'hi'].includes(rawLanguage.trim().toLowerCase())) {
        safeLanguage = rawLanguage.trim().toLowerCase();
      }

      if (!title || !content || !categoryId || !authorId) {
        throw new BadRequestError('Title, content, categoryId, and authorId are required.');
      }

      if (status === 'SCHEDULED' || scheduledAt) {
        if (!scheduledAt) {
          throw new BadRequestError('Scheduled publish date & time is required for scheduled articles.');
        }
        const schedTime = new Date(scheduledAt).getTime();
        if (isNaN(schedTime) || schedTime <= Date.now() - 10000) {
          throw new BadRequestError('Scheduled publish date & time must be set in the future (later than current time).');
        }
      }

      let assignedArticleNum: number;
      if (articleNumber !== undefined && articleNumber !== null && String(articleNumber).trim() !== '') {
        const num = parseInt(String(articleNumber), 10);
        if (!isNaN(num) && num > 0) {
          const dup = await prisma.post.findFirst({ where: { articleNumber: num } });
          if (!dup) {
            assignedArticleNum = num;
          } else {
            const maxArticle = await prisma.post.findFirst({
              orderBy: { articleNumber: 'desc' },
              select: { articleNumber: true },
            });
            assignedArticleNum = (maxArticle?.articleNumber ?? 0) + 1;
          }
        } else {
          const maxArticle = await prisma.post.findFirst({
            orderBy: { articleNumber: 'desc' },
            select: { articleNumber: true },
          });
          assignedArticleNum = (maxArticle?.articleNumber ?? 0) + 1;
        }
      } else {
        const maxArticle = await prisma.post.findFirst({
          orderBy: { articleNumber: 'desc' },
          select: { articleNumber: true },
        });
        assignedArticleNum = (maxArticle?.articleNumber ?? 0) + 1;
      }

      let postSlug = slug;
      if (!postSlug || typeof postSlug !== 'string' || postSlug.trim() === '') {
        postSlug = slugify(title);
      } else {
        postSlug = slugify(postSlug);
      }

      // Check unique slug
      const existing = await prisma.post.findUnique({
        where: { slug: postSlug },
      });
      if (existing) {
        postSlug = `${postSlug}-${Math.random().toString(36).substring(2, 7)}`;
      }

      // Deduplicate tags by slug to prevent unique constraint failures on post_tags
      const uniqueTagsMap = new Map<string, { name: string; slug: string }>();
      if (Array.isArray(tags)) {
        for (const t of tags) {
          const rawName = typeof t === 'string' ? t : t?.name;
          if (rawName && typeof rawName === 'string' && rawName.trim() !== '') {
            const name = rawName.trim();
            const tagSlug = slugify(name);
            if (tagSlug && !uniqueTagsMap.has(tagSlug)) {
              uniqueTagsMap.set(tagSlug, { name, slug: tagSlug });
            }
          }
        }
      }

      const tagConnectOrCreate = Array.from(uniqueTagsMap.values()).map(({ name, slug: tagSlug }) => ({
        where: { slug: tagSlug },
        create: {
          slug: tagSlug,
          name,
          nameGu: name,
          nameHi: name,
        },
      }));

      const post = await prisma.post.create({
        data: {
          slug: postSlug,
          articleNumber: assignedArticleNum,
          language: safeLanguage,
          title: title.trim(),
          titleGu: (titleGu || title).trim(),
          titleHi: (titleHi || title).trim(),
          excerpt: (excerpt || '').trim(),
          excerptGu: (excerptGu || excerpt || '').trim(),
          excerptHi: (excerptHi || excerpt || '').trim(),
          content: content.trim(),
          contentGu: (contentGu || content).trim(),
          contentHi: (contentHi || content).trim(),
          featuredImage: (featuredImage || '').trim(),
          status: status || 'DRAFT',
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          authorId,
          categoryId,
          location: location ? String(location).trim() : null,
          priority: priority ? Number(priority) : 0,
          readingTime: readingTime ? Number(readingTime) : 0,
          isTrending: !!isTrending,
          isBreaking: !!isBreaking,
          isFeatured: !!isFeatured,
          seoTitle: (seoTitle || '').trim(),
          seoDescription: (seoDescription || '').trim(),
          seoKeywords: (seoKeywords || '').trim(),
          canonicalUrl: (canonicalUrl || '').trim(),
          metaRobots: (metaRobots || '').trim(),
          tags: {
            create: tagConnectOrCreate.map((t: any) => ({
              tag: {
                connectOrCreate: t,
              },
            })),
          },
        },
        include: {
          category: true,
          author: true,
          tags: { include: { tag: true } },
        },
      });

      if (post.isFeatured || post.isTrending) {
        await syncArticleToHeroSettings(post.id, post.isFeatured, post.isTrending);
      }

      clearPublicRoutesCache();
      invalidateHeroSettingsCache();

      return sendSuccess(res, { article: post }, 'Article created successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update details of an existing article.
   */
  static async updateArticle(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const {
        language: rawLanguage,
        title,
        titleGu,
        titleHi,
        excerpt,
        excerptGu,
        excerptHi,
        content,
        contentGu,
        contentHi,
        featuredImage,
        status,
        categoryId,
        authorId,
        priority,
        readingTime,
        isTrending,
        isBreaking,
        isFeatured,
        articleNumber,
        seoTitle,
        seoDescription,
        seoKeywords,
        canonicalUrl,
        metaRobots,
        tags, // array of { name: string }
        slug,
        location,
        scheduledAt,
      } = req.body;

      const existingPost = await prisma.post.findUnique({
        where: { id },
      });
      if (!existingPost) {
        throw new BadRequestError('Article not found.');
      }

      const updateData: any = {};

      if (rawLanguage !== undefined) {
        if (typeof rawLanguage === 'string' && ['gu', 'en', 'hi'].includes(rawLanguage.trim().toLowerCase())) {
          updateData.language = rawLanguage.trim().toLowerCase();
        }
      }

      if (location !== undefined) updateData.location = location ? String(location).trim() : null;

      if (title !== undefined) updateData.title = title.trim();
      if (titleGu !== undefined) updateData.titleGu = titleGu.trim();
      if (titleHi !== undefined) updateData.titleHi = titleHi.trim();
      if (excerpt !== undefined) updateData.excerpt = excerpt.trim();
      if (excerptGu !== undefined) updateData.excerptGu = excerptGu.trim();
      if (excerptHi !== undefined) updateData.excerptHi = excerptHi.trim();
      if (content !== undefined) updateData.content = content.trim();
      if (contentGu !== undefined) updateData.contentGu = contentGu.trim();
      if (contentHi !== undefined) updateData.contentHi = contentHi.trim();
      if (featuredImage !== undefined) updateData.featuredImage = featuredImage.trim();
      if (status !== undefined) updateData.status = status;
      if (scheduledAt !== undefined) {
        if (scheduledAt) {
          const schedTime = new Date(scheduledAt).getTime();
          if (isNaN(schedTime) || schedTime <= Date.now() - 10000) {
            throw new BadRequestError('Scheduled publish date & time must be set in the future (later than current time).');
          }
          updateData.scheduledAt = new Date(scheduledAt);
        } else {
          updateData.scheduledAt = null;
        }
      }
      if (categoryId !== undefined) updateData.categoryId = categoryId;
      if (authorId !== undefined) updateData.authorId = authorId;
      if (priority !== undefined) updateData.priority = Number(priority);
      if (readingTime !== undefined) updateData.readingTime = Number(readingTime);
      if (isTrending !== undefined) updateData.isTrending = !!isTrending;
      if (isBreaking !== undefined) updateData.isBreaking = !!isBreaking;
      if (isFeatured !== undefined) updateData.isFeatured = !!isFeatured;
      if (articleNumber !== undefined && articleNumber !== null && String(articleNumber).trim() !== '') {
        const num = parseInt(String(articleNumber), 10);
        if (!isNaN(num) && num > 0) {
          // Check if the number is already taken by another article
          const duplicate = await prisma.post.findFirst({
            where: { articleNumber: num, NOT: { id } },
          });
          if (!duplicate) {
            updateData.articleNumber = num;
          }
        }
      }
      if (seoTitle !== undefined) updateData.seoTitle = seoTitle.trim();
      if (seoDescription !== undefined) updateData.seoDescription = seoDescription.trim();
      if (seoKeywords !== undefined) updateData.seoKeywords = seoKeywords.trim();
      if (canonicalUrl !== undefined) updateData.canonicalUrl = canonicalUrl.trim();
      if (metaRobots !== undefined) updateData.metaRobots = metaRobots.trim();

      if (slug !== undefined) {
        let postSlug = slugify(slug);
        if (postSlug !== existingPost.slug) {
          const duplicate = await prisma.post.findUnique({
            where: { slug: postSlug },
          });
          if (duplicate) {
            postSlug = `${postSlug}-${Math.random().toString(36).substring(2, 7)}`;
          }
        }
        updateData.slug = postSlug;
      }

      if (tags !== undefined && Array.isArray(tags)) {
        const uniqueTagsMap = new Map<string, { name: string; slug: string }>();
        for (const t of tags) {
          const rawName = typeof t === 'string' ? t : t?.name;
          if (rawName && typeof rawName === 'string' && rawName.trim() !== '') {
            const name = rawName.trim();
            const tagSlug = slugify(name);
            if (tagSlug && !uniqueTagsMap.has(tagSlug)) {
              uniqueTagsMap.set(tagSlug, { name, slug: tagSlug });
            }
          }
        }

        updateData.tags = {
          deleteMany: {},
          create: Array.from(uniqueTagsMap.values()).map(({ name, slug: tagSlug }) => ({
            tag: {
              connectOrCreate: {
                where: { slug: tagSlug },
                create: {
                  slug: tagSlug,
                  name,
                  nameGu: name,
                  nameHi: name,
                },
              },
            },
          })),
        };
      }

      const updated = await prisma.post.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
          author: true,
          tags: { include: { tag: true } },
        },
      });

      if (isFeatured !== undefined || isTrending !== undefined) {
        await syncArticleToHeroSettings(updated.id, updated.isFeatured, updated.isTrending);
      }

      clearPublicRoutesCache();
      invalidateHeroSettingsCache();

      return sendSuccess(res, { article: updated }, 'Article updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete an article.
   */
  static async deleteArticle(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const article = await prisma.post.findUnique({ where: { id } });
      if (!article) {
        throw new BadRequestError('Article not found.');
      }

      await prisma.post.delete({
        where: { id },
      });

      clearPublicRoutesCache();
      invalidateHeroSettingsCache();

      return sendSuccess(res, null, 'Article deleted successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * [SUPER_ADMIN] Count articles older than a given cutoff date (preview before bulk delete).
   * Query: GET /api/admin/articles/old-count?before=YYYY-MM-DD
   */
  static async countOldArticles(req: Request, res: Response, next: NextFunction) {
    try {
      const { before } = req.query as { before?: string };
      if (!before) {
        return res.status(400).json({ success: false, message: 'before date is required (YYYY-MM-DD)' });
      }
      const cutoff = new Date(`${before}T23:59:59.999Z`);
      if (isNaN(cutoff.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid date format' });
      }
      const count = await prisma.post.count({
        where: { createdAt: { lte: cutoff } },
      });
      return sendSuccess(res, { count, before, cutoff: cutoff.toISOString() }, `${count} articles found before ${before}`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * [SUPER_ADMIN] Bulk delete all articles older than a given cutoff date.
   * Body: DELETE /api/admin/articles/bulk-delete-old  { before: 'YYYY-MM-DD', confirm: true }
   */
  static async bulkDeleteOldArticles(req: Request, res: Response, next: NextFunction) {
    try {
      const { before, confirm } = req.body as { before?: string; confirm?: boolean };
      if (!before) {
        return res.status(400).json({ success: false, message: 'before date is required (YYYY-MM-DD)' });
      }
      if (!confirm) {
        return res.status(400).json({ success: false, message: 'confirm must be true to proceed with bulk deletion' });
      }
      const cutoff = new Date(`${before}T23:59:59.999Z`);
      if (isNaN(cutoff.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid date format' });
      }
      const result = await prisma.post.deleteMany({
        where: { createdAt: { lte: cutoff } },
      });
      clearPublicRoutesCache();
      invalidateHeroSettingsCache();
      return sendSuccess(res, { deleted: result.count, before }, `${result.count} articles deleted successfully.`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * [SUPER_ADMIN] List articles within a date range for preview.
   * GET /api/admin/articles/range-list?from=YYYY-MM-DD&to=YYYY-MM-DD&page=1&limit=20
   */
  static async listArticlesInRange(req: Request, res: Response, next: NextFunction) {
    try {
      const { from, to, page = '1', limit = '20' } = req.query as Record<string, string>;
      if (!from || !to) {
        return res.status(400).json({ success: false, message: 'from and to dates are required (YYYY-MM-DD)' });
      }
      const fromDate = new Date(`${from}T00:00:00.000Z`);
      const toDate = new Date(`${to}T23:59:59.999Z`);
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid date format' });
      }
      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
      const where = { createdAt: { gte: fromDate, lte: toDate } };
      const [articles, total] = await Promise.all([
        prisma.post.findMany({
          where,
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            createdAt: true,
            author: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
        }),
        prisma.post.count({ where }),
      ]);
      return sendSuccess(res, { articles, total, page: pageNum, limit: limitNum, from, to }, `${total} articles in range`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * [SUPER_ADMIN] Count articles within a date range.
   * GET /api/admin/articles/range-count?from=YYYY-MM-DD&to=YYYY-MM-DD
   */
  static async countArticlesInRange(req: Request, res: Response, next: NextFunction) {
    try {
      const { from, to } = req.query as { from?: string; to?: string };
      if (!from || !to) {
        return res.status(400).json({ success: false, message: 'from and to dates are required (YYYY-MM-DD)' });
      }
      const fromDate = new Date(`${from}T00:00:00.000Z`);
      const toDate = new Date(`${to}T23:59:59.999Z`);
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid date format' });
      }
      const count = await prisma.post.count({ where: { createdAt: { gte: fromDate, lte: toDate } } });
      return sendSuccess(res, { count, from, to }, `${count} articles between ${from} and ${to}`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * [SUPER_ADMIN] Bulk delete all articles within a date range.
   * DELETE /api/admin/articles/bulk-delete-range  body: { from, to, confirm: true }
   */
  static async bulkDeleteArticlesInRange(req: Request, res: Response, next: NextFunction) {
    try {
      const { from, to, confirm } = req.body as { from?: string; to?: string; confirm?: boolean };
      if (!from || !to) {
        return res.status(400).json({ success: false, message: 'from and to dates are required (YYYY-MM-DD)' });
      }
      if (!confirm) {
        return res.status(400).json({ success: false, message: 'confirm must be true to proceed' });
      }
      const fromDate = new Date(`${from}T00:00:00.000Z`);
      const toDate = new Date(`${to}T23:59:59.999Z`);
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid date format' });
      }
      const result = await prisma.post.deleteMany({
        where: { createdAt: { gte: fromDate, lte: toDate } },
      });
      clearPublicRoutesCache();
      invalidateHeroSettingsCache();
      return sendSuccess(res, { deleted: result.count, from, to }, `${result.count} articles deleted successfully.`);
    } catch (error) {
      next(error);
    }
  }
}

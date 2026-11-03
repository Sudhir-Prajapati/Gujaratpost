import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { sendSuccess } from '../utils/response.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';
import { generatePublicRssFeed, invalidatePublicRssCache } from '../services/rss.service.js';
import { testExternalFeed, syncRssSource } from '../services/rssImport.service.js';
import { validateSafeUrl } from '../utils/ssrf.js';
import { clearPublicRoutesCache } from '../utils/publicCache.js';

function slugify(text: string): string {
  const s = text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  return s || `gp-news-${Date.now().toString(36)}`;
}

export class RssController {
  /**
   * GET /api/public/rss and /api/public/rss/:category
   * Public RSS 2.0 dynamic feed generation.
   */
  static async getPublicRss(req: Request, res: Response, next: NextFunction) {
    try {
      const categorySlug = req.params.category;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const lang = ((req.query.lang as string) || (req.query.language as string) || 'gu').toLowerCase().trim();
      const feed = await generatePublicRssFeed({
        categorySlug,
        limit,
        lang,
      });

      // Handle conditional HTTP requests (ETag & Last-Modified)
      const ifNoneMatch = req.headers['if-none-match'];
      const ifModifiedSince = req.headers['if-modified-since'];

      if (ifNoneMatch && ifNoneMatch === feed.etag) {
        res.setHeader('ETag', feed.etag);
        res.setHeader('Last-Modified', feed.lastModified.toUTCString());
        return res.status(304).end();
      }

      if (ifModifiedSince) {
        const clientDate = new Date(ifModifiedSince);
        if (!isNaN(clientDate.getTime()) && clientDate.getTime() >= Math.floor(feed.lastModified.getTime() / 1000) * 1000) {
          res.setHeader('ETag', feed.etag);
          res.setHeader('Last-Modified', feed.lastModified.toUTCString());
          return res.status(304).end();
        }
      }

      res.set({
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
        ETag: feed.etag,
        'Last-Modified': feed.lastModified.toUTCString(),
      });

      return res.status(200).send(feed.xml);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /rss-feed-politics.php (and /api/public/rss-feed-politics.php)
   * Legacy PHP RSS feed endpoint for Dailyhunt compatibility.
   * Maps query parameter `?name=...` to corresponding dynamic feed.
   */
  static async getLegacyPoliticsRss(req: Request, res: Response, next: NextFunction) {
    try {
            const rawName = (req.query.name as string || '').trim().toLowerCase();
      let cleanTopic = rawName;
      if (cleanTopic.includes('-updates-')) {
        cleanTopic = cleanTopic.split('-updates-')[0].trim();
      } else if (cleanTopic.includes('_updates_')) {
        cleanTopic = cleanTopic.split('_updates_')[0].trim();
      } else if (cleanTopic.startsWith('updates-')) {
        cleanTopic = cleanTopic.replace(/^updates-/, '').trim();
      } else if (cleanTopic.endsWith('-updates')) {
        cleanTopic = cleanTopic.replace(/-updates$/, '').trim();
      }

      const LEGACY_MAP: Record<string, string> = {
        'news': 'home',
        'homepage': 'home',
        'home': 'home',
        'main': 'home',
        'top': 'home',
        'all': 'home',
        'gujpost': 'home',
        'gujarat': 'gujarat',
        'gandhinagar': 'gandhinagar',
        'ahmedabad': 'ahmedabad',
        'surat': 'surat',
        'vadodara': 'vadodara',
        'rajkot': 'rajkot',
        'others': 'other-cities',
        'other-cities': 'other-cities',
        'national': 'national',
        'india': 'national',
        'international': 'world',
        'world': 'world',
        'entertainment': 'entertainment',
        'entertainmentlifestyle': 'entertainment',
        'entertainment-lifestyle': 'entertainment',
        'entertainment-life-style': 'entertainment',
        'lifestyle': 'lifestyle',
        'popular-stories': 'trending',
        'trending': 'trending',
        'politics': 'politics',
        'fact-check': 'fact-check',
        'factcheck': 'fact-check',
        'health': 'health',
        'technology': 'technology',
        'tech': 'technology',
        'crime': 'crime',
        'video': 'videos',
        'videos': 'videos',
        'shorts': 'videos',
        'instagram': 'instagram',
        'reels': 'instagram',
        'gallery': 'photos',
        'photos': 'photos',
        'photo': 'photos',
      };

      const isHome = !cleanTopic || ['home', 'homepage', 'news', 'main', 'top', 'all', 'gujpost'].includes(cleanTopic);
      const categorySlug = isHome ? 'home' : (LEGACY_MAP[cleanTopic] || cleanTopic);
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const lang = ((req.query.lang as string) || (req.query.language as string) || 'gu').toLowerCase().trim();

      const feed = await generatePublicRssFeed({
        categorySlug,
        limit,
        lang,
      });

      const ifNoneMatch = req.headers['if-none-match'];
      const ifModifiedSince = req.headers['if-modified-since'];

      if (ifNoneMatch && ifNoneMatch === feed.etag) {
        res.setHeader('ETag', feed.etag);
        res.setHeader('Last-Modified', feed.lastModified.toUTCString());
        return res.status(304).end();
      }

      if (ifModifiedSince) {
        const clientDate = new Date(ifModifiedSince);
        if (!isNaN(clientDate.getTime()) && clientDate.getTime() >= Math.floor(feed.lastModified.getTime() / 1000) * 1000) {
          res.setHeader('ETag', feed.etag);
          res.setHeader('Last-Modified', feed.lastModified.toUTCString());
          return res.status(304).end();
        }
      }

      res.set({
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
        ETag: feed.etag,
        'Last-Modified': feed.lastModified.toUTCString(),
      });

      return res.status(200).send(feed.xml);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /rss-feed-gallery.php (and /api/public/rss-feed-gallery.php)
   * Legacy PHP Gallery RSS feed endpoint for Dailyhunt compatibility.
   */
  static async getLegacyGalleryRss(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const lang = ((req.query.lang as string) || (req.query.language as string) || 'gu').toLowerCase().trim();
      const feed = await generatePublicRssFeed({
        categorySlug: 'photos',
        limit,
        lang,
      });

      const ifNoneMatch = req.headers['if-none-match'];
      const ifModifiedSince = req.headers['if-modified-since'];

      if (ifNoneMatch && ifNoneMatch === feed.etag) {
        res.setHeader('ETag', feed.etag);
        res.setHeader('Last-Modified', feed.lastModified.toUTCString());
        return res.status(304).end();
      }

      if (ifModifiedSince) {
        const clientDate = new Date(ifModifiedSince);
        if (!isNaN(clientDate.getTime()) && clientDate.getTime() >= Math.floor(feed.lastModified.getTime() / 1000) * 1000) {
          res.setHeader('ETag', feed.etag);
          res.setHeader('Last-Modified', feed.lastModified.toUTCString());
          return res.status(304).end();
        }

      }

      res.set({
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
        ETag: feed.etag,
        'Last-Modified': feed.lastModified.toUTCString(),
      });

      return res.status(200).send(feed.xml);
    } catch (error) {
      next(error);
    }
  }


  // ==========================================
  // Admin RSS Source Management
  // ==========================================

  /**
   * GET /api/admin/rss/sources
   */
  static async listSources(req: Request, res: Response, next: NextFunction) {
    try {
      const sources = await prisma.rssSource.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true, nameGu: true, slug: true } },
          _count: { select: { items: true, logs: true } },
        },
      });

      return sendSuccess(res, { sources }, 'RSS Sources retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/rss/sources
   */
  static async createSource(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, url, categoryId, pollingInterval, isActive } = req.body;

      if (!name || typeof name !== 'string' || !name.trim()) {
        throw new BadRequestError('Source name is required.');
      }
      if (!url || typeof url !== 'string' || !url.trim()) {
        throw new BadRequestError('Valid Feed URL is required.');
      }

      const cleanUrl = url.trim();

      // Validate URL format and protect against SSRF during source creation
      const allowLocalInDev = process.env.NODE_ENV !== 'production';
      const urlCheck = await validateSafeUrl(cleanUrl, { allowLocalInDev });
      if (!urlCheck.safe) {
        throw new BadRequestError(urlCheck.error || 'Invalid or unsafe feed URL.');
      }

      // If categoryId is specified, verify it exists
      if (categoryId) {
        const cat = await prisma.category.findUnique({ where: { id: categoryId } });
        if (!cat) throw new BadRequestError('Specified category not found.');
      }

      const source = await prisma.rssSource.create({
        data: {
          name: name.trim(),
          url: cleanUrl,
          categoryId: categoryId || null,
          pollingInterval: Math.max(15, parseInt(pollingInterval, 10) || 60),
          isActive: isActive !== undefined ? Boolean(isActive) : true,
        },
        include: {
          category: true,
        },
      });

      return sendSuccess(res, { source }, 'RSS Source created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/rss/sources/:id
   */
  static async getSourceById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const source = await prisma.rssSource.findUnique({
        where: { id },
        include: {
          category: true,
          logs: {
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
          _count: { select: { items: true } },
        },
      });

      if (!source) {
        throw new NotFoundError('RSS Source not found.');
      }

      return sendSuccess(res, { source }, 'RSS Source details retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/admin/rss/sources/:id
   */
  static async updateSource(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, url, categoryId, pollingInterval, isActive } = req.body;

      const existing = await prisma.rssSource.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundError('RSS Source not found.');
      }

      const data: any = {};
      if (name !== undefined) data.name = String(name).trim();
      if (url !== undefined) {
        const cleanUrl = String(url).trim();
        const allowLocalInDev = process.env.NODE_ENV !== 'production';
        const urlCheck = await validateSafeUrl(cleanUrl, { allowLocalInDev });
        if (!urlCheck.safe) {
          throw new BadRequestError(urlCheck.error || 'Invalid or unsafe feed URL.');
        }
        data.url = cleanUrl;
      }
      if (categoryId !== undefined) data.categoryId = categoryId || null;
      if (pollingInterval !== undefined) data.pollingInterval = Math.max(15, parseInt(pollingInterval, 10) || 60);
      if (isActive !== undefined) data.isActive = Boolean(isActive);

      const updated = await prisma.rssSource.update({
        where: { id },
        data,
        include: { category: true },
      });

      return sendSuccess(res, { source: updated }, 'RSS Source updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/admin/rss/sources/:id/toggle
   * Quickly toggle active status of an RSS Source.
   */
  static async toggleSource(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const existing = await prisma.rssSource.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundError('RSS Source not found.');
      }

      const updated = await prisma.rssSource.update({
        where: { id },
        data: { isActive: !existing.isActive },
        include: { category: true },
      });

      return sendSuccess(res, { source: updated }, `RSS Source ${updated.isActive ? 'activated' : 'paused'}`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/rss/sources/:id
   */
  static async deleteSource(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const existing = await prisma.rssSource.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundError('RSS Source not found.');
      }

      await prisma.rssSource.delete({ where: { id } });
      return sendSuccess(res, null, 'RSS Source deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/rss/test
   * Tests a feed URL (without persisting) to preview structure and check SSRF.
   */
  static async testFeedUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string' || !url.trim()) {
        throw new BadRequestError('Feed URL is required.');
      }

      const result = await testExternalFeed(url.trim());
      return sendSuccess(res, result, 'Feed validated and previewed successfully');
    } catch (error: any) {
      next(new BadRequestError(error.message || 'Failed to validate feed URL'));
    }
  }

  /**
   * POST /api/admin/rss/sources/:id/sync
   * Triggers immediate synchronization of an RSS Source.
   */
  static async triggerSourceSync(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const syncResult = await syncRssSource(id);
      return sendSuccess(res, syncResult, 'RSS Feed synchronization completed');
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // Admin Imported RSS Items Moderation
  // ==========================================

  /**
   * GET /api/admin/rss/items
   */
  static async listItems(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string, 10) || 20));
      const skip = (page - 1) * limit;

      const sourceId = req.query.sourceId as string;
      const status = req.query.status as string;
      const query = req.query.query as string;

      const where: any = {};
      if (sourceId) where.sourceId = sourceId;
      if (status) where.status = status;
      if (query && query.trim()) {
        where.OR = [
          { title: { contains: query.trim() } },
          { excerpt: { contains: query.trim() } },
          { author: { contains: query.trim() } },
        ];
      }

      const [items, total] = await Promise.all([
        prisma.rssItem.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            source: { select: { id: true, name: true } },
            targetCategory: { select: { id: true, name: true, nameGu: true, slug: true } },
          },
        }),
        prisma.rssItem.count({ where }),
      ]);

      return sendSuccess(
        res,
        {
          items,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
          },
        },
        'RSS Items retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/rss/items/:id
   */
  static async getItemById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const item = await prisma.rssItem.findUnique({
        where: { id },
        include: {
          source: true,
          targetCategory: true,
        },
      });

      if (!item) {
        throw new NotFoundError('Imported RSS item not found.');
      }

      return sendSuccess(res, { item }, 'RSS item details retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/admin/rss/items/:id
   * Edit item fields prior to publishing.
   */
  static async updateItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { title, titleGu, excerpt, content, imageUrl, targetCategoryId } = req.body;

      const existing = await prisma.rssItem.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundError('RSS item not found.');
      }

      const data: any = {};
      if (title !== undefined) data.title = String(title).trim();
      if (titleGu !== undefined) data.titleGu = String(titleGu).trim();
      if (excerpt !== undefined) data.excerpt = String(excerpt).trim();
      if (content !== undefined) data.content = String(content).trim();
      if (imageUrl !== undefined) data.imageUrl = String(imageUrl).trim();
      if (targetCategoryId !== undefined) data.targetCategoryId = targetCategoryId || null;

      const updated = await prisma.rssItem.update({
        where: { id },
        data,
      });

      return sendSuccess(res, { item: updated }, 'RSS item updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/rss/items/:id/publish
   * Converts the reviewed RSS item into a full GujaratPost Article (Post).
   */
  static async publishItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const {
        categoryId: overrideCategoryId,
        authorId: overrideAuthorId,
        title: overrideTitle,
        content: overrideContent,
        excerpt: overrideExcerpt,
        imageUrl: overrideImage,
        isFeatured,
        isTrending,
        isBreaking,
      } = req.body;

      const rssItem = await prisma.rssItem.findUnique({
        where: { id },
        include: { source: true },
      });

      if (!rssItem) {
        throw new NotFoundError('RSS item not found.');
      }

      // Prevent duplicate publication
      if (rssItem.status === 'PUBLISHED' || rssItem.publishedPostId) {
        throw new BadRequestError('This RSS item has already been published as an article.');
      }

      // Resolve Category
      const targetCatId = overrideCategoryId || rssItem.targetCategoryId || rssItem.source.categoryId;
      let category = targetCatId ? await prisma.category.findUnique({ where: { id: targetCatId } }) : null;
      if (!category) {
        category = await prisma.category.findFirst({ where: { isActive: true } });
        if (!category) {
          throw new BadRequestError('No active Category found to assign to article.');
        }
      }

      // Resolve Author
      let authorId = overrideAuthorId;
      if (!authorId) {
        const userAuthor = req.user?.userId
          ? await prisma.author.findUnique({ where: { userId: req.user.userId } })
          : null;
        if (userAuthor) {
          authorId = userAuthor.id;
        } else {
          const defaultAuthor = await prisma.author.findFirst();
          if (!defaultAuthor) {
            throw new BadRequestError('No Author profile found in system to assign as author.');
          }
          authorId = defaultAuthor.id;
        }
      }

      // Assign sequential articleNumber
      const maxArticle = await prisma.post.findFirst({
        orderBy: { articleNumber: 'desc' },
        select: { articleNumber: true },
      });
      const assignedArticleNum = (maxArticle?.articleNumber ?? 0) + 1;

      // Prepare final content and titles
      const finalTitle = (overrideTitle || rssItem.title || 'Samachar').trim();
      const finalTitleGu = (rssItem.titleGu || finalTitle).trim();
      const finalExcerpt = (overrideExcerpt || rssItem.excerpt || finalTitle).trim();
      const sourceCredit = rssItem.sourceUrl ? `\n\n<p><em>સ્ત્રોત: <a href="${rssItem.sourceUrl}" target="_blank" rel="noopener noreferrer">${rssItem.source.name}</a></em></p>` : '';
      const finalContent = (overrideContent || rssItem.content || finalExcerpt).trim() + sourceCredit;
      const finalImage = (overrideImage || rssItem.imageUrl || '').trim();

      // Generate unique slug
      let postSlug = slugify(finalTitle);
      const existingSlug = await prisma.post.findUnique({ where: { slug: postSlug } });
      if (existingSlug) {
        postSlug = `${postSlug}-${Math.random().toString(36).substring(2, 7)}`;
      }

      // Create new official Post record
      const post = await prisma.post.create({
        data: {
          slug: postSlug,
          articleNumber: assignedArticleNum,
          language: 'gu',
          title: finalTitle,
          titleGu: finalTitleGu,
          titleHi: finalTitle,
          excerpt: finalExcerpt,
          excerptGu: finalExcerpt,
          excerptHi: finalExcerpt,
          content: finalContent,
          contentGu: finalContent,
          contentHi: finalContent,
          featuredImage: finalImage,
          status: 'PUBLISHED',
          authorId,
          categoryId: category.id,
          canonicalUrl: rssItem.sourceUrl || undefined,
          isFeatured: Boolean(isFeatured),
          isTrending: Boolean(isTrending),
          isBreaking: Boolean(isBreaking),
        },
      });

      // Update RssItem state to PUBLISHED
      await prisma.rssItem.update({
        where: { id },
        data: {
          status: 'PUBLISHED',
          publishedPostId: post.id,
          reviewedAt: new Date(),
          reviewedById: req.user?.userId || null,
        },
      });

      // Invalidate caches
      clearPublicRoutesCache();
      invalidatePublicRssCache();

      return sendSuccess(res, { post, rssItem }, 'RSS Item successfully converted and published as article', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/rss/items/:id/reject
   */
  static async rejectItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const existing = await prisma.rssItem.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundError('RSS item not found.');
      }

      const updated = await prisma.rssItem.update({
        where: { id },
        data: {
          status: 'REJECTED',
          reviewedAt: new Date(),
          reviewedById: req.user?.userId || null,
        },
      });

      return sendSuccess(res, { item: updated }, 'RSS item marked as rejected');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/rss/items/:id/approve
   */
  static async approveItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const existing = await prisma.rssItem.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundError('RSS item not found.');
      }

      const updated = await prisma.rssItem.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedById: req.user?.userId || null,
        },
      });

      return sendSuccess(res, { item: updated }, 'RSS item marked as approved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/rss/items/bulk
   * Bulk action: approve, reject, or delete.
   */
  static async bulkAction(req: Request, res: Response, next: NextFunction) {
    try {
      const { ids, action } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        throw new BadRequestError('ids array is required.');
      }

      if (action === 'DELETE') {
        await prisma.rssItem.deleteMany({ where: { id: { in: ids } } });
        return sendSuccess(res, null, `Successfully deleted ${ids.length} RSS items.`);
      }

      if (action === 'REJECT') {
        await prisma.rssItem.updateMany({
          where: { id: { in: ids } },
          data: {
            status: 'REJECTED',
            reviewedAt: new Date(),
            reviewedById: req.user?.userId || null,
          },
        });
        return sendSuccess(res, null, `Successfully rejected ${ids.length} RSS items.`);
      }

      if (action === 'APPROVE') {
        await prisma.rssItem.updateMany({
          where: { id: { in: ids } },
          data: {
            status: 'APPROVED',
            reviewedAt: new Date(),
            reviewedById: req.user?.userId || null,
          },
        });
        return sendSuccess(res, null, `Successfully approved ${ids.length} RSS items.`);
      }

      throw new BadRequestError(`Invalid action: "${action}". Permitted actions: APPROVE, REJECT, DELETE.`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/rss/logs
   * Retrieve recent RSS fetch logs across all sources.
   */
  static async listLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string, 10) || 50));
      const skip = (page - 1) * limit;
      const sourceId = req.query.sourceId as string;

      const where: any = {};
      if (sourceId) where.sourceId = sourceId;

      const [logs, total] = await Promise.all([
        prisma.rssFetchLog.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            source: { select: { id: true, name: true, url: true } },
          },
        }),
        prisma.rssFetchLog.count({ where }),
      ]);

      return sendSuccess(
        res,
        {
          logs,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
          },
        },
        'RSS Fetch logs retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }
}

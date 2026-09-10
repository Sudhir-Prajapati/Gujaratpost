import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { sendSuccess } from '../utils/response.js';
import { BadRequestError } from '../utils/errors.js';

const YOUTUBE_CHANNEL_ID = 'UCqQ8YbFSZ4j8J4iVJOHurTw';
const CHANNEL_HANDLE = '@Gujaratpostnews';

let lastAutoSyncTime = 0;
const AUTO_SYNC_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes cooldown

/**
 * Extract a clean 11-char YouTube video ID from any URL format.
 * Supports: watch?v=, youtu.be/, /shorts/, /embed/, bare ID
 */
function extractYouTubeId(input: string): string {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const m = trimmed.match(pattern);
    if (m?.[1]) return m[1];
  }
  return trimmed;
}

function cleanTitle(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/,\s*[\d.,]+\s*[KMkm]?\s*views.*$/i, '')
    .replace(/-\s*play\s*Short.*$/i, '')
    .replace(/\\u0026/g, '&')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\\n/g, ' ')
    .trim();
}

/**
 * Fetch latest videos directly from YouTube RSS Feed + Channel HTML Scrape
 */
export async function fetchYouTubeFeed(): Promise<any[]> {
  const items: any[] = [];
  const seenIds = new Set<string>();

  // 1. Fetch official YouTube RSS Feed
  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`;
    const rssRes = await fetch(rssUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (rssRes.ok) {
      const xmlText = await rssRes.text();
      const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
      let match;
      while ((match = entryRegex.exec(xmlText)) !== null) {
        const entryXml = match[1];
        const getTag = (tag: string) => {
          const m = entryXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/[tag]>`));
          return m ? m[1].trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"') : '';
        };
        const getAttr = (tag: string, attr: string) => {
          const m = entryXml.match(new RegExp(`<${tag}[^>]*\\s${attr}="([^"]*)"[^>]*>`));
          return m ? m[1] : '';
        };

        const videoId = getAttr('yt:videoId', 'url') || getTag('yt:videoId');
        const title = cleanTitle(getTag('title'));
        const link = getAttr('link', 'href') || `https://www.youtube.com/watch?v=${videoId}`;
        const published = getTag('published') || new Date().toISOString();
        const viewsMatch = entryXml.match(/views="(\d+)"/);
        const viewsCount = viewsMatch ? parseInt(viewsMatch[1]) : 0;

        if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId) && !seenIds.has(videoId)) {
          seenIds.add(videoId);
          const isShort = link.includes('/shorts/') || title.toLowerCase().includes('#short') || title.toLowerCase().includes('#shorts');
          items.push({
            youtubeId: videoId,
            title: title || 'Gujarat Post News',
            titleGu: title || 'Gujarat Post News',
            titleHi: title || 'Gujarat Post News',
            description: title,
            embedUrl: `https://www.youtube.com/embed/${videoId}`,
            thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            type: isShort ? 'short' : 'video',
            duration: isShort ? '0:58' : '10:00',
            views: viewsCount,
            publishedAt: new Date(published),
          });
        }
      }
    }
  } catch (e) {
    console.warn('YouTube RSS sync error:', e);
  }

  // 2. Fetch Channel Videos Tab directly (HTML scrape for additional latest videos)
  try {
    const channelUrl = `https://www.youtube.com/${CHANNEL_HANDLE}/videos`;
    const chanRes = await fetch(channelUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (chanRes.ok) {
      const html = await chanRes.text();
      const match = html.match(/ytInitialData\s*=\s*({[\s\S]*?});/);
      if (match) {
        const data = JSON.parse(match[1]);
        const parseNode = (node: any) => {
          if (!node || typeof node !== 'object') return;
          const v = node.videoRenderer || node.gridVideoRenderer || node.lockupViewModel;
          if (v) {
            const videoId = v.videoId || v.contentId;
            if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId) && !seenIds.has(videoId)) {
              seenIds.add(videoId);
              const title = cleanTitle(v.title?.runs?.[0]?.text || v.title?.simpleText || v.metadata?.lockupMetadataViewModel?.title?.content || 'Gujarat Post News');
              items.push({
                youtubeId: videoId,
                title,
                titleGu: title,
                titleHi: title,
                description: title,
                embedUrl: `https://www.youtube.com/embed/${videoId}`,
                thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                type: 'video',
                duration: '10:00',
                views: 0,
                publishedAt: new Date(),
              });
            }
          }
          for (const key of Object.keys(node)) {
            if (typeof node[key] === 'object') parseNode(node[key]);
          }
        };
        parseNode(data);
      }
    }
  } catch (e) {
    console.warn('YouTube channel scrape error:', e);
  }

  return items;
}

/**
 * Automatically sync and save all YouTube channel videos into the database,
 * clean any duplicate records, and mark the top 20 latest regular videos as featured.
 */
export async function syncYouTubeVideosToDatabase(): Promise<{ syncedCount: number; newCount: number }> {
  const ytVideos = await fetchYouTubeFeed();
  if (!ytVideos || ytVideos.length === 0) return { syncedCount: 0, newCount: 0 };

  let newCount = 0;
  const regularVideos = ytVideos.filter((v) => v.type === 'video' || !v.type);
  const now = new Date();

  // Deduplicate and upsert each regular video in exact YouTube channel order
  const featuredIds: string[] = [];

  for (let i = 0; i < regularVideos.length; i++) {
    const item = regularVideos[i];
    const isTop20 = i < 20;
    const simulatedDate = new Date(now.getTime() - i * 3600 * 1000 * 6);

    const matches = await prisma.video.findMany({
      where: { youtubeId: item.youtubeId },
    });

    if (matches.length > 0) {
      const primary = matches[0];
      await prisma.video.update({
        where: { id: primary.id },
        data: {
          title: item.title,
          titleGu: item.titleGu || item.title,
          titleHi: item.titleHi || item.title,
          description: item.description || item.title,
          thumbnail: item.thumbnail,
          embedUrl: item.embedUrl,
          duration: item.duration || '10:00',
          type: 'video',
          isFeatured: isTop20,
          publishedAt: simulatedDate,
        },
      });

      if (isTop20) featuredIds.push(primary.id);

      // Remove any duplicate records with the same youtubeId
      if (matches.length > 1) {
        const duplicateIds = matches.slice(1).map((m) => m.id);
        await prisma.video.deleteMany({
          where: { id: { in: duplicateIds } },
        });
      }
    } else {
      const created = await prisma.video.create({
        data: {
          title: item.title,
          titleGu: item.titleGu || item.title,
          titleHi: item.titleHi || item.title,
          description: item.description || item.title,
          thumbnail: item.thumbnail,
          youtubeId: item.youtubeId,
          embedUrl: item.embedUrl,
          duration: item.duration || '10:00',
          type: 'video',
          isFeatured: isTop20,
          channel: 'Gujarat Post News',
          views: item.views || 0,
          publishedAt: simulatedDate,
        },
      });
      newCount++;
      if (isTop20) featuredIds.push(created.id);
    }
  }

  // Ensure all other regular videos are marked as not featured
  if (featuredIds.length > 0) {
    await prisma.video.updateMany({
      where: {
        type: 'video',
        id: { notIn: featuredIds },
      },
      data: { isFeatured: false },
    });
  }


  return { syncedCount: ytVideos.length, newCount };
}

/**
 * Scrape YouTube Shorts feed directly from channel @Gujaratpostnews/shorts
 */
export async function scrapeYouTubeShortsFeed(): Promise<any[]> {
  const url = `https://www.youtube.com/${CHANNEL_HANDLE}/shorts`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (!res.ok) return [];
    const html = await res.text();
    const items: any[] = [];
    const seen = new Set<string>();

    const match = html.match(/ytInitialData\s*=\s*({[\s\S]*?});/);
    if (match) {
      try {
        const data = JSON.parse(match[1]);
        const parseNode = (node: any) => {
          if (!node || typeof node !== 'object') return;
          if (node.shortsLockupViewModel) {
            const svm = node.shortsLockupViewModel;
            const videoId =
              svm.entityId?.replace(/^shorts-shelf-item-/, '')?.replace(/^shorts-lockup-viewModel-/, '') ||
              svm.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId ||
              svm.videoId;

            if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId) && !seen.has(videoId)) {
              seen.add(videoId);
              const rawTitle = cleanTitle(svm.accessibilityText || svm.headline?.content || svm.title?.content || 'Gujarat Post Short');
              items.push({
                youtubeId: videoId,
                title: rawTitle,
                titleGu: rawTitle,
                titleHi: rawTitle,
                thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                duration: '0:58',
                type: 'short',
              });
            }
          }
          if (node.reelItemRenderer || node.shortsItemRenderer) {
            const v = node.reelItemRenderer || node.shortsItemRenderer;
            const videoId = v.videoId || v.reelId;
            if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId) && !seen.has(videoId)) {
              seen.add(videoId);
              const rawTitle = cleanTitle(v.headline?.simpleText || v.title?.simpleText || v.accessibility?.accessibilityData?.label || 'Gujarat Post Short');
              items.push({
                youtubeId: videoId,
                title: rawTitle,
                titleGu: rawTitle,
                titleHi: rawTitle,
                thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                duration: '0:58',
                type: 'short',
              });
            }
          }
          for (const k of Object.keys(node)) {
            parseNode(node[k]);
          }
        };
        parseNode(data);
      } catch (e) {}
    }

    const shortsIdRegex = /(?:\/shorts\/|"reelWatchEndpoint":\{\s*"videoId":\s*")([a-zA-Z0-9_-]{11})/g;
    let m;
    while ((m = shortsIdRegex.exec(html)) !== null) {
      const videoId = m[1];
      if (videoId && !seen.has(videoId)) {
        seen.add(videoId);
        items.push({
          youtubeId: videoId,
          title: 'Gujarat Post Short',
          titleGu: 'Gujarat Post Short',
          titleHi: 'Gujarat Post Short',
          thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          duration: '0:58',
          type: 'short',
        });
      }
    }

    return items;
  } catch (e) {
    console.warn('YouTube Shorts scrape error:', e);
    return [];
  }
}

/**
 * Automatically sync and save all YouTube channel Shorts into the database,
 * and clean any duplicate records.
 */
export async function syncYouTubeShortsToDatabase(): Promise<{ syncedCount: number; newCount: number }> {
  const ytShorts = await scrapeYouTubeShortsFeed();
  if (!ytShorts || ytShorts.length === 0) return { syncedCount: 0, newCount: 0 };

  let newCount = 0;
  const now = new Date();
  const featuredIds: string[] = [];

  for (let i = 0; i < ytShorts.length; i++) {
    const item = ytShorts[i];
    const isTop40 = i < 40;
    const simulatedDate = new Date(now.getTime() - i * 3600 * 1000 * 3);

    const matches = await prisma.video.findMany({
      where: { youtubeId: item.youtubeId },
    });

    if (matches.length > 0) {
      const primary = matches[0];
      await prisma.video.update({
        where: { id: primary.id },
        data: {
          title: item.title,
          titleGu: item.titleGu || item.title,
          titleHi: item.titleHi || item.title,
          description: item.title,
          thumbnail: item.thumbnail,
          embedUrl: `https://www.youtube.com/embed/${item.youtubeId}`,
          duration: '0:58',
          type: 'short',
          isFeatured: isTop40,
          publishedAt: simulatedDate,
        },
      });

      if (isTop40) featuredIds.push(primary.id);

      // Remove duplicate rows
      if (matches.length > 1) {
        const duplicateIds = matches.slice(1).map((m) => m.id);
        await prisma.video.deleteMany({
          where: { id: { in: duplicateIds } },
        });
      }
    } else {
      const created = await prisma.video.create({
        data: {
          title: item.title,
          titleGu: item.titleGu || item.title,
          titleHi: item.titleHi || item.title,
          description: item.title,
          thumbnail: item.thumbnail,
          youtubeId: item.youtubeId,
          embedUrl: `https://www.youtube.com/embed/${item.youtubeId}`,
          duration: '0:58',
          type: 'short',
          isFeatured: isTop40,
          channel: 'Gujarat Post News',
          views: 0,
          publishedAt: simulatedDate,
        },
      });
      newCount++;
      if (isTop40) featuredIds.push(created.id);
    }
  }

  // Ensure all other shorts are marked as not featured
  if (featuredIds.length > 0) {
    await prisma.video.updateMany({
      where: {
        type: 'short',
        id: { notIn: featuredIds },
      },
      data: { isFeatured: false },
    });
  }

  return { syncedCount: ytShorts.length, newCount };
}

export class VideoController {
  /**
   * Fetch all videos with pagination, search query, type, and category filters.
   * Also triggers non-blocking background auto-sync from YouTube.
   */
  static async getAllVideos(req: Request, res: Response, next: NextFunction) {
    try {
      const type = req.query.type as string || '';

      // Background auto-sync from YouTube channel if cooldown has elapsed
      if (Date.now() - lastAutoSyncTime > AUTO_SYNC_INTERVAL_MS) {
        lastAutoSyncTime = Date.now();
        if (type === 'short') {
          syncYouTubeShortsToDatabase().catch((e) => console.warn('Background auto-sync shorts error:', e));
        } else {
          syncYouTubeVideosToDatabase().catch((e) => console.warn('Background auto-sync error:', e));
        }
      }

      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.max(1, parseInt(req.query.limit as string) || 12);
      const skip = (page - 1) * limit;

      const query = req.query.query as string || '';
      const categoryId = req.query.categoryId as string || '';

      const where: any = {};

      if (query) {
        where.OR = [
          { title: { contains: query } },
          { titleGu: { contains: query } },
          { titleHi: { contains: query } },
          { description: { contains: query } },
        ];
      }

      if (type) {
        where.type = type;
      }

      if (categoryId) {
        where.categoryId = categoryId;
      }

      const [videos, total, totalFeatured] = await Promise.all([
        prisma.video.findMany({
          where,
          orderBy: [
            { isFeatured: 'desc' },
            { publishedAt: 'desc' },
            { createdAt: 'desc' },
          ],
          skip,
          take: limit,
        }),
        prisma.video.count({ where }),
        prisma.video.count({ where: { ...where, isFeatured: true } }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return sendSuccess(res, {
        videos,
        totalPages,
        total,
        totalFeatured,
      }, 'Videos list retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * On-demand manual sync all YouTube channel videos into database.
   */
  static async syncYouTubeVideos(req: Request, res: Response, next: NextFunction) {
    try {
      const isShort = req.query.type === 'short' || req.body.type === 'short';
      if (isShort) {
        const stats = await syncYouTubeShortsToDatabase();
        return sendSuccess(
          res,
          stats,
          `Successfully synced ${stats.syncedCount} Shorts from YouTube (${stats.newCount} newly added).`
        );
      }

      const stats = await syncYouTubeVideosToDatabase();
      return sendSuccess(
        res,
        stats,
        `Successfully synced ${stats.syncedCount} videos from YouTube (${stats.newCount} newly added). Top 20 latest videos are automatically featured.`
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * On-demand manual sync all YouTube Shorts into database.
   */
  static async syncYouTubeShorts(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await syncYouTubeShortsToDatabase();
      return sendSuccess(
        res,
        stats,
        `Successfully synced ${stats.syncedCount} Shorts from YouTube (${stats.newCount} newly added).`
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Save a new video entry.
   */
  static async createVideo(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        title,
        titleGu,
        titleHi,
        youtubeId,
        type,
        description,
        duration,
        isFeatured,
        channel,
        categoryId,
        categoryName,
      } = req.body;

      if (!title || !youtubeId) {
        throw new BadRequestError('Title and YouTube Video ID are required.');
      }

      // Normalize: extract bare ID from any YouTube URL format
      const cleanId = extractYouTubeId(youtubeId);
      const embedUrl = `https://www.youtube.com/embed/${cleanId}`;
      const thumbnail = `https://img.youtube.com/vi/${cleanId}/maxresdefault.jpg`;

      let finalCategoryName = categoryName || null;
      if (categoryId && !finalCategoryName) {
        const cat = await prisma.category.findUnique({ where: { id: categoryId } });
        if (cat) finalCategoryName = cat.name;
      }

      const video = await prisma.video.create({
        data: {
          title: title.trim(),
          titleGu: (titleGu || title).trim(),
          titleHi: (titleHi || title).trim(),
          youtubeId: cleanId,
          embedUrl,
          thumbnail,
          type: type || 'video',
          description: description ? description.trim() : null,
          duration: duration || '0:00',
          isFeatured: isFeatured !== undefined ? !!isFeatured : true,
          channel: channel ? channel.trim() : 'Gujarat Post News',
          categoryId: categoryId || null,
          categoryName: finalCategoryName,
        } as any,
      });

      return sendSuccess(res, video, 'Video added successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update details of an existing video.
   */
  static async updateVideo(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const {
        title,
        titleGu,
        titleHi,
        youtubeId,
        type,
        description,
        duration,
        isFeatured,
        channel,
        categoryId,
        categoryName,
      } = req.body;

      const existing = await prisma.video.findUnique({ where: { id } });
      if (!existing) {
        throw new BadRequestError('Video not found.');
      }

      const updateData: any = {};

      if (title !== undefined) updateData.title = title.trim();
      if (titleGu !== undefined) updateData.titleGu = titleGu.trim();
      if (titleHi !== undefined) updateData.titleHi = titleHi.trim();
      if (type !== undefined) updateData.type = type;
      if (description !== undefined) updateData.description = description ? description.trim() : null;
      if (duration !== undefined) updateData.duration = duration;
      if (categoryId !== undefined) {
        updateData.categoryId = categoryId || null;
        if (categoryId) {
          const cat = await prisma.category.findUnique({ where: { id: categoryId } });
          updateData.categoryName = cat ? cat.name : (categoryName || null);
        } else {
          updateData.categoryName = null;
        }
      }
      if (isFeatured !== undefined) {
        updateData.isFeatured = !!isFeatured;
      }
      if (channel !== undefined) updateData.channel = channel.trim();

      if (youtubeId !== undefined) {
        const cleanId = extractYouTubeId(youtubeId);
        if (cleanId !== existing.youtubeId) {
          updateData.youtubeId = cleanId;
          updateData.embedUrl = `https://www.youtube.com/embed/${cleanId}`;
          updateData.thumbnail = `https://img.youtube.com/vi/${cleanId}/maxresdefault.jpg`;
        }
      }

      const updated = await prisma.video.update({
        where: { id },
        data: updateData,
      });

      return sendSuccess(res, updated, 'Video updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a video.
   */
  static async deleteVideo(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const existing = await prisma.video.findUnique({ where: { id } });
      if (!existing) {
        throw new BadRequestError('Video not found.');
      }

      await prisma.video.delete({
        where: { id },
      });

      return sendSuccess(res, null, 'Video deleted successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk delete all short videos (type === 'short')
   */
  static async deleteAllShorts(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await prisma.video.deleteMany({
        where: { type: 'short' },
      });
      return sendSuccess(res, { count: result.count }, `Deleted ${result.count} short videos.`);
    } catch (error) {
      next(error);
    }
  }
}

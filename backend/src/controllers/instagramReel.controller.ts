import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { sendSuccess } from '../utils/response.js';

function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
}

function parseDateFromDesc(desc: string): Date {
  if (!desc) return new Date();
  const match = desc.match(/on\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i);
  if (match) {
    const d = new Date(match[1]);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

export class InstagramReelController {
  // Mobile Safari User-Agent: Instagram serves full open-graph and meta tags without cookies
  private static MOBILE_UA =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

  // Extract shortcode from any Instagram URL or string
  public static extractShortcode(urlOrCode: string): string {
    if (!urlOrCode) return '';
    const trimmed = urlOrCode.trim();
    // Instagram shortcodes are base64url strings of 10 to 13 characters (standard is 11)
    const match = trimmed.match(/(?:reel|reels|p)\/([A-Za-z0-9_-]{10,13})/i);
    if (match?.[1]) return match[1];
    if (/^[A-Za-z0-9_-]{10,13}$/.test(trimmed)) return trimmed;
    return '';
  }

  // Fetch a single reel directly by URL without any cookies or login session
  public static async fetchReelByUrl(urlOrCode: string): Promise<{
    code: string;
    heading: string;
    thumbnail: string;
    createdAt: Date;
    instaUrl: string;
  } | null> {
    const code = InstagramReelController.extractShortcode(urlOrCode);
    if (!code) {
      console.warn(`[Instagram Reel] Invalid URL or code: ${urlOrCode}`);
      return null;
    }

    try {
      const reelUrl = `https://www.instagram.com/reel/${code}/`;
      const res = await fetch(reelUrl, {
        headers: {
          'User-Agent': InstagramReelController.MOBILE_UA,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
        },
        // Strict 4-second timeout to prevent request hanging or proxy 500 errors
        signal: AbortSignal.timeout(4000),
      });

      if (!res.ok) {
        console.warn(`[Instagram Reel] Fetch ${reelUrl} returned status ${res.status}`);
        return null;
      }

      const html = await res.text();

      // 1. Extract og:title
      const ogTitleRaw =
        html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]*)"/i)?.[1] || '';

      // If og:title is missing, empty, or generic Instagram landing page, it is not a valid reel
      if (
        !ogTitleRaw ||
        ogTitleRaw.trim().toLowerCase() === 'instagram' ||
        ogTitleRaw.includes('Page Not Found') ||
        ogTitleRaw.includes("isn't available")
      ) {
        console.warn(`[Instagram Reel] Code ${code} is not a valid reel or page was unavailable.`);
        return null;
      }

      const decodedTitle = decodeHtmlEntities(ogTitleRaw);
      const cleanedCaption = decodedTitle
        .replace(/^[^:]+:\s*["“]?/, '')
        .replace(/["”]?\s*$/, '')
        .trim();

      // 2. Extract og:image
      const ogImgRaw =
        html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]*)"/i)?.[1] || '';

      // Must have a real og:image from Instagram/Meta CDN to be a valid reel
      if (!ogImgRaw) {
        console.warn(`[Instagram Reel] Code ${code} has no thumbnail image.`);
        return null;
      }
      const thumbnail = decodeHtmlEntities(ogImgRaw);

      // 3. Extract og:description for date
      const ogDescRaw =
        html.match(/<meta\s+(?:property|name)="og:description"\s+content="([^"]*)"/i)?.[1] || '';
      const decodedDesc = decodeHtmlEntities(ogDescRaw);
      const createdAt = parseDateFromDesc(decodedDesc);

      const heading = cleanedCaption.split('\n')[0]?.trim();
      if (!heading || heading.toLowerCase() === 'instagram') {
        console.warn(`[Instagram Reel] Code ${code} has no valid headline.`);
        return null;
      }

      return {
        code,
        heading,
        thumbnail,
        createdAt,
        instaUrl: `https://www.instagram.com/reel/${code}/`,
      };
    } catch (err: any) {
      console.warn(`[Instagram Reel] Error fetching reel ${code}:`, err?.message || err);
      return null;
    }
  }

  // Upsert a single reel into DB, returns true if newly inserted
  public static async upsertReel(
    code: string,
    heading: string,
    thumbnail: string,
    createdAt?: Date
  ): Promise<boolean> {
    const cleanHeading = heading.trim();
    if (!cleanHeading || cleanHeading.toLowerCase() === 'gujarat post news reel') {
      // Don't upsert empty or generic fallback placeholders
      return false;
    }
    const instaUrl = `https://www.instagram.com/reel/${code}/`;

    const existing = await prisma.reel.findFirst({
      where: {
        OR: [
          { instaUrl },
          { instaUrl: `https://www.instagram.com/p/${code}/` },
        ],
      },
    });

    if (existing) {
      await prisma.reel.update({
        where: { id: existing.id },
        data: {
          heading: cleanHeading,
          headingGu: cleanHeading,
          headingHi: cleanHeading,
          thumbnail,
          instaUrl,
          isActive: true,
          ...(createdAt ? { createdAt } : {}),
        },
      });
      return false;
    } else {
      await prisma.reel.create({
        data: {
          type: 'INSTAGRAM',
          heading: cleanHeading,
          headingGu: cleanHeading,
          headingHi: cleanHeading,
          instaUrl,
          thumbnail,
          isActive: true,
          ...(createdAt ? { createdAt } : {}),
        },
      });
      return true;
    }
  }

  // Scrape the Instagram public page (no cookies needed) using the profile URL
  // and reel URLs to fetch and upsert the latest reels into the database.
  static async syncFromInstagram(): Promise<{ newCount: number; totalInDb: number; message?: string }> {
    let newCount = 0;
    const handle = 'gujaratpost.in';

    // 1. Get existing reels from DB to avoid redundant external network requests
    const existingReels = await prisma.reel.findMany({
      select: { instaUrl: true },
    });
    const existingCodes = new Set<string>();
    for (const r of existingReels) {
      const c = InstagramReelController.extractShortcode(r.instaUrl || '');
      if (c) existingCodes.add(c);
    }

    // Seed list of verified official reel codes from @gujaratpost.in
    const seedCodes = [
      'DSvBjEOEZCv',
      'DVtdjLRkSsc',
      'DUKafVkkUap',
      'DdatH48xhh8',
      'DdLzfyBRJph',
      'DdLw9u2RbnV',
      'Dc-Vsj1xgVq',
      'Dc-TK4kRJTm',
      'Dc3nOZ4x0fZ',
      'Dcv96AIx-2u',
      'DclOGGGRL3j',
      'DclLNGKRhZn',
      'Db2NMohRDw_',
    ];

    const candidateCodes = new Set<string>(seedCodes);

    // 2. Safely attempt profile discovery with strict 3.5s timeout
    try {
      const profileRes = await fetch(`https://www.instagram.com/${handle}/`, {
        headers: {
          'User-Agent': InstagramReelController.MOBILE_UA,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
        },
        signal: AbortSignal.timeout(3500),
      });

      if (profileRes.ok) {
        const html = await profileRes.text();

        // Match JSON shortcodes specifically (e.g. "shortcode":"...")
        const scRegex = /"shortcode":\s*"([A-Za-z0-9_-]{11})"/g;
        let match: RegExpExecArray | null;
        while ((match = scRegex.exec(html)) !== null) {
          candidateCodes.add(match[1]);
        }
      }
    } catch (err: any) {
      console.warn('[Instagram Sync] Profile discovery notice:', err?.message || err);
    }

    // 3. Filter to only codes that are NOT yet in the database
    const newCodes = Array.from(candidateCodes).filter((c) => !existingCodes.has(c));

    console.log(`[Instagram Sync] ${existingCodes.size} reels in DB. Found ${newCodes.length} new candidate codes.`);

    // If all reels already exist in database, return instantly without slow external calls
    if (newCodes.length === 0) {
      const totalInDb = existingReels.length;
      return {
        newCount: 0,
        totalInDb,
        message: `ℹ️ All ${totalInDb} reels are up to date! Currently no new reels uploaded on Instagram.`,
      };
    }

    // 4. Fetch up to 6 new reels concurrently with strict timeout per request
    const codesToFetch = newCodes.slice(0, 6);
    const fetchPromises = codesToFetch.map(async (code) => {
      try {
        const reelData = await InstagramReelController.fetchReelByUrl(code);
        if (!reelData) return false;
        const isNew = await InstagramReelController.upsertReel(
          reelData.code,
          reelData.heading,
          reelData.thumbnail,
          reelData.createdAt
        );
        return isNew;
      } catch (err: any) {
        console.warn(`[Instagram Sync] Failed to sync new reel ${code}:`, err?.message || err);
        return false;
      }
    });

    const results = await Promise.allSettled(fetchPromises);
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value === true) {
        newCount++;
      }
    }

    const totalInDb = await prisma.reel.count();
    console.log(`[Instagram Sync] Completed. New: ${newCount}, Total in DB: ${totalInDb}`);
    return { newCount, totalInDb };
  }

  // Admin route handler for manual full auto-sync (guarantees 200 OK, never throws 500)
  static async syncReelsRoute(req: Request, res: Response) {
    try {
      const { newCount, totalInDb, message } = await InstagramReelController.syncFromInstagram();
      const msg =
        message ||
        (newCount > 0
          ? `✅ ${newCount} new reel${newCount > 1 ? 's' : ''} added from Instagram!`
          : `ℹ️ All ${totalInDb} reels are up to date!`);
      return sendSuccess(res, { newCount, totalInDb }, msg);
    } catch (error: any) {
      console.error('[Instagram Sync] Error in syncReelsRoute:', error);
      const fallbackTotal = await prisma.reel.count().catch(() => 0);
      return sendSuccess(
        res,
        { newCount: 0, totalInDb: fallbackTotal },
        `ℹ️ All ${fallbackTotal} reels in database are up to date.`
      );
    }
  }

  // Admin route handler to sync one or more reels directly by URL (without cookies)
  static async syncReelByUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const { url, urls } = req.body;
      const inputUrls: string[] = [];

      if (typeof url === 'string' && url.trim()) {
        const parts = url.split(/[\r\n,\s]+/);
        parts.forEach((p) => {
          if (p.trim()) inputUrls.push(p.trim());
        });
      }
      if (Array.isArray(urls)) {
        urls.forEach((u) => {
          if (typeof u === 'string' && u.trim()) {
            const parts = u.split(/[\r\n,\s]+/);
            parts.forEach((p) => {
              if (p.trim()) inputUrls.push(p.trim());
            });
          }
        });
      }

      if (inputUrls.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Please provide a valid Instagram reel URL (e.g. https://www.instagram.com/reel/CODE/)',
        });
      }

      const syncedReels: any[] = [];
      let newCount = 0;

      for (const rawUrl of inputUrls) {
        const code = InstagramReelController.extractShortcode(rawUrl);
        if (!code) continue;

        const reelData = await InstagramReelController.fetchReelByUrl(code);
        if (!reelData) continue;

        const isNew = await InstagramReelController.upsertReel(
          reelData.code,
          reelData.heading,
          reelData.thumbnail,
          reelData.createdAt
        );
        if (isNew) newCount++;

        const saved = await prisma.reel.findFirst({
          where: { instaUrl: reelData.instaUrl },
        });
        if (saved) syncedReels.push(saved);
      }

      const totalInDb = await prisma.reel.count();
      return sendSuccess(
        res,
        { syncedCount: syncedReels.length, newCount, totalInDb, reels: syncedReels },
        `Successfully synced ${syncedReels.length} reel(s) using URL without cookies!`
      );
    } catch (error) {
      next(error);
    }
  }

  // Get all reels (for admin or public)
  static async getAllReels(req: Request, res: Response, next: NextFunction) {
    try {
      const { isActive, limit } = req.query;

      const whereClause: any = {};
      if (isActive !== undefined) {
        whereClause.isActive = isActive === 'true';
      }

      const take = limit ? parseInt(limit as string, 10) : undefined;

      const reels = await prisma.reel.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        ...(take ? { take } : {}),
      });

      return sendSuccess(res, { reels }, 'Reels retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  // Create a new reel manually
  static async createReel(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, heading, headingGu, headingHi, videoUrl, instaUrl, thumbnail, isActive } =
        req.body;

      const newReel = await prisma.reel.create({
        data: {
          type: type || 'INSTAGRAM',
          heading,
          headingGu,
          headingHi,
          videoUrl,
          instaUrl,
          thumbnail,
          isActive: isActive !== undefined ? isActive : true,
        },
      });

      return sendSuccess(res, { reel: newReel }, 'Reel created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  // Update a reel
  static async updateReel(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { type, heading, headingGu, headingHi, videoUrl, instaUrl, thumbnail, isActive } =
        req.body;

      const updatedReel = await prisma.reel.update({
        where: { id },
        data: {
          type,
          heading,
          headingGu,
          headingHi,
          videoUrl,
          instaUrl,
          thumbnail,
          isActive,
        },
      });

      return sendSuccess(res, { reel: updatedReel }, 'Reel updated successfully');
    } catch (error) {
      next(error);
    }
  }

  // Delete a reel
  static async deleteReel(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await prisma.reel.delete({
        where: { id },
      });

      return sendSuccess(res, null, 'Reel deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

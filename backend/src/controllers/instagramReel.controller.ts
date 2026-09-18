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
    const match = trimmed.match(/(?:reel|reels|p)\/([A-Za-z0-9_-]{8,25})/i);
    if (match?.[1]) return match[1];
    if (/^[A-Za-z0-9_-]{8,25}$/.test(trimmed)) return trimmed;
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
      });

      if (!res.ok) {
        console.warn(`[Instagram Reel] Fetch ${reelUrl} returned status ${res.status}`);
        return null;
      }

      const html = await res.text();

      // 1. Extract og:title
      const ogTitleRaw =
        html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]*)"/i)?.[1] || '';
      const decodedTitle = decodeHtmlEntities(ogTitleRaw);
      const cleanedCaption = decodedTitle
        .replace(/^[^:]+:\s*["“]?/, '')
        .replace(/["”]?\s*$/, '')
        .trim();

      // 2. Extract og:image
      const ogImgRaw =
        html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]*)"/i)?.[1] || '';
      const thumbnail =
        decodeHtmlEntities(ogImgRaw) || `https://www.instagram.com/p/${code}/media/?size=l`;

      // 3. Extract og:description for date
      const ogDescRaw =
        html.match(/<meta\s+(?:property|name)="og:description"\s+content="([^"]*)"/i)?.[1] || '';
      const decodedDesc = decodeHtmlEntities(ogDescRaw);
      const createdAt = parseDateFromDesc(decodedDesc);

      const heading = cleanedCaption.split('\n')[0]?.trim() || 'Gujarat Post News Reel';

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
    const cleanHeading = heading.trim() || 'Gujarat Post News Reel';
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
  static async syncFromInstagram(): Promise<{ newCount: number; totalInDb: number }> {
    let newCount = 0;
    const handle = 'gujaratpost.in';

    // Verified recent official reel codes from @gujaratpost.in
    const discoveredCodes = new Set<string>([
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
    ]);

    try {
      // Fetch public profile to discover any newly uploaded reel codes
      const profileRes = await fetch(`https://www.instagram.com/${handle}/`, {
        headers: {
          'User-Agent': InstagramReelController.MOBILE_UA,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
        },
      });

      if (profileRes.ok) {
        const html = await profileRes.text();

        // 1. Try finding polaris_ordered_timeline_connection in script tags
        const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
        for (const s of scripts) {
          const sc = s[1];
          if (sc.includes('polaris_ordered_timeline_connection')) {
            try {
              const parsed = JSON.parse(sc);
              function findConnection(obj: any): any {
                if (!obj || typeof obj !== 'object') return null;
                if (obj.polaris_ordered_timeline_connection) return obj.polaris_ordered_timeline_connection;
                for (const key of Object.keys(obj)) {
                  const found = findConnection(obj[key]);
                  if (found) return found;
                }
                return null;
              }
              const conn = findConnection(parsed);
              if (conn && Array.isArray(conn.edges)) {
                for (const edge of conn.edges) {
                  const code = edge?.node?.code;
                  if (code) discoveredCodes.add(code);
                }
              }
            } catch {
              // Non-fatal, continue with regex parsing
            }
          }
        }

        // 2. Also search for any shortcodes via regex
        const codeRegex = /"code"\s*:\s*"([A-Za-z0-9_-]{8,25})"/g;
        let match: RegExpExecArray | null;
        while ((match = codeRegex.exec(html)) !== null) {
          discoveredCodes.add(match[1]);
        }
      }
    } catch (err: any) {
      console.warn('[Instagram Sync] Profile discovery warning:', err?.message || err);
    }

    console.log(`[Instagram Sync] Processing ${discoveredCodes.size} reel URLs...`);

    // Fetch and upsert each reel without cookies using its URL
    for (const code of Array.from(discoveredCodes)) {
      try {
        const reelData = await InstagramReelController.fetchReelByUrl(code);
        if (!reelData) continue;

        const isNew = await InstagramReelController.upsertReel(
          reelData.code,
          reelData.heading,
          reelData.thumbnail,
          reelData.createdAt
        );
        if (isNew) newCount++;
      } catch (err: any) {
        console.warn(`[Instagram Sync] Failed to sync reel ${code}:`, err?.message || err);
      }
    }

    const totalInDb = await prisma.reel.count();
    console.log(`[Instagram Sync] Completed. New: ${newCount}, Total in DB: ${totalInDb}`);
    return { newCount, totalInDb };
  }

  // Admin route handler for manual full auto-sync
  static async syncReelsRoute(req: Request, res: Response, next: NextFunction) {
    try {
      const { newCount, totalInDb } = await InstagramReelController.syncFromInstagram();
      const msg =
        newCount > 0
          ? `✅ ${newCount} new reel${newCount > 1 ? 's' : ''} added from Instagram!`
          : `ℹ️ All ${totalInDb} reels are up to date!`;
      return sendSuccess(res, { newCount, totalInDb }, msg);
    } catch (error) {
      next(error);
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

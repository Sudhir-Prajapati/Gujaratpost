import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { sendSuccess } from '../utils/response.js';
import { randomUUID } from 'crypto';

let tableEnsured = false;
let tableEnsuringPromise: Promise<void> | null = null;

// In-memory ads cache to prevent hitting MySQL on every ad banner render
const adsCache = new Map<string, { timestamp: number; data: any }>();
const ADS_CACHE_TTL_MS = 10 * 1000; // 10 seconds

export function invalidateAdsCache() {
  adsCache.clear();
}

async function ensureAdsTableExists() {
  if (tableEnsured) return;
  if (tableEnsuringPromise) return tableEnsuringPromise;

  tableEnsuringPromise = (async () => {
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS \`advertisements\` (
          \`id\` VARCHAR(191) NOT NULL,
          \`section\` VARCHAR(255) NOT NULL,
          \`title\` VARCHAR(255) NULL,
          \`isActive\` TINYINT(1) NOT NULL DEFAULT 1,
          \`includeInRandom\` TINYINT(1) NOT NULL DEFAULT 0,
          \`mediaType\` VARCHAR(50) NOT NULL DEFAULT 'IMAGE',
          \`image1\` TEXT NULL,
          \`link1\` TEXT NULL,
          \`image2\` TEXT NULL,
          \`link2\` TEXT NULL,
          \`image3\` TEXT NULL,
          \`link3\` TEXT NULL,
          \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`advertisements_section_unique\` (\`section\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `).catch(() => null);

      const cols: any[] = (await prisma.$queryRawUnsafe(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'advertisements' AND COLUMN_NAME = 'mediaType'`
      ).catch(() => [])) as any[];
      if (!cols || cols.length === 0) {
        await prisma.$executeRawUnsafe(
          `ALTER TABLE \`advertisements\` ADD COLUMN \`mediaType\` VARCHAR(50) NOT NULL DEFAULT 'IMAGE'`
        ).catch(() => null);
      }

      const randomCols: any[] = (await prisma.$queryRawUnsafe(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'advertisements' AND COLUMN_NAME = 'includeInRandom'`
      ).catch(() => [])) as any[];
      if (!randomCols || randomCols.length === 0) {
        await prisma.$executeRawUnsafe(
          `ALTER TABLE \`advertisements\` ADD COLUMN \`includeInRandom\` TINYINT(1) NOT NULL DEFAULT 0`
        ).catch(() => null);
      }
      tableEnsured = true;
    } catch (_) {}
  })();

  return tableEnsuringPromise;
}

function getAdDelegate() {
  return (prisma as any).advertisement || (prisma as any).Advertisement || (prisma as any).advertisements;
}

export class AdController {
  // Get all advertisements (admin & public)
  static async getAllAds(req: Request, res: Response, next: NextFunction) {
    try {
      const cacheKey = 'ALL_ADS';
      const cached = adsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < ADS_CACHE_TTL_MS) {
        return sendSuccess(res, { ads: cached.data }, 'Advertisements retrieved successfully');
      }

      await ensureAdsTableExists();
      const delegate = getAdDelegate();
      let ads: any[] = [];

      if (delegate && typeof delegate.findMany === 'function') {
        try {
          ads = await delegate.findMany({ orderBy: { createdAt: 'desc' } });
        } catch (_) {}
      }

      if (!ads || ads.length === 0) {
        try {
          ads = await prisma.$queryRawUnsafe(`SELECT * FROM \`advertisements\` ORDER BY \`createdAt\` DESC`);
        } catch (_) {
          ads = [];
        }
      }

      adsCache.set(cacheKey, { timestamp: Date.now(), data: ads });
      return sendSuccess(res, { ads }, 'Advertisements retrieved successfully');
    } catch (error: any) {
      return sendSuccess(res, { ads: [] }, 'Advertisements retrieved fallback');
    }
  }

  // Get active advertisement by section (public)
  static async getAdBySection(req: Request, res: Response, next: NextFunction) {
    try {
      const { section } = req.params;
      const formattedSection = (section || '').toUpperCase().trim();
      const cacheKey = `AD_${formattedSection}`;

      const cached = adsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < ADS_CACHE_TTL_MS) {
        return sendSuccess(res, { ad: cached.data }, 'Section advertisement retrieved successfully');
      }

      await ensureAdsTableExists();
      const delegate = getAdDelegate();
      let ad: any = null;

      if (delegate && typeof delegate.findFirst === 'function') {
        try {
          ad = await delegate.findFirst({
            where: { section: formattedSection, isActive: true },
          });
        } catch (_) {}
      }

      if (!ad) {
        try {
          const rows: any[] = await prisma.$queryRawUnsafe(
            `SELECT * FROM \`advertisements\` WHERE \`section\` = ? AND \`isActive\` = 1 LIMIT 1`,
            formattedSection
          );
          if (rows && rows.length > 0) ad = rows[0];
        } catch (_) {}
      }

      adsCache.set(cacheKey, { timestamp: Date.now(), data: ad });
      return sendSuccess(res, { ad }, 'Section advertisement retrieved successfully');
    } catch (error: any) {
      return sendSuccess(res, { ad: null }, 'Section advertisement fallback');
    }
  }

  // Create or update advertisement for a section (admin)
  static async createOrUpdateAd(req: Request, res: Response, next: NextFunction) {
    try {
      await ensureAdsTableExists();
      const { section, title, isActive, mediaType, image1, link1, image2, link2, image3, link3 } = req.body;

      if (!section) {
        return res.status(400).json({ success: false, error: 'Section is required' });
      }

      const formattedSection = section.toUpperCase().trim();
      const parsedMediaType = (mediaType || 'IMAGE').toUpperCase().trim();
      const adTitle = title || `Banner for ${formattedSection}`;
      const activeVal = isActive !== false ? 1 : 0;

      await prisma.$executeRawUnsafe(
        `INSERT INTO \`advertisements\` (\`id\`, \`section\`, \`title\`, \`isActive\`, \`mediaType\`, \`image1\`, \`link1\`, \`image2\`, \`link2\`, \`image3\`, \`link3\`, \`createdAt\`, \`updatedAt\`)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE \`title\`=?, \`isActive\`=?, \`mediaType\`=?, \`image1\`=?, \`link1\`=?, \`image2\`=?, \`link2\`=?, \`image3\`=?, \`link3\`=?, \`updatedAt\`=NOW()`,
        randomUUID(), formattedSection, adTitle, activeVal, parsedMediaType, image1 || null, link1 || null, image2 || null, link2 || null, image3 || null, link3 || null,
        adTitle, activeVal, parsedMediaType, image1 || null, link1 || null, image2 || null, link2 || null, image3 || null, link3 || null
      );

      const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM \`advertisements\` WHERE \`section\` = ? LIMIT 1`, formattedSection);
      const ad = rows && rows.length > 0 ? rows[0] : null;

      invalidateAdsCache();
      return sendSuccess(res, { ad }, 'Advertisement saved successfully');
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error?.message || 'Failed to save advertisement' });
    }
  }

  // Delete advertisement
  static async deleteAd(req: Request, res: Response, next: NextFunction) {
    try {
      await ensureAdsTableExists();
      const { id } = req.params;
      await prisma.$executeRawUnsafe(`DELETE FROM \`advertisements\` WHERE \`id\` = ?`, id).catch(() => null);
      invalidateAdsCache();
      return sendSuccess(res, null, 'Advertisement deleted successfully');
    } catch (error) {
      return sendSuccess(res, null, 'Advertisement removed');
    }
  }

  // Toggle active status
  static async toggleActive(req: Request, res: Response, next: NextFunction) {
    try {
      await ensureAdsTableExists();
      const { id } = req.params;
      const { isActive } = req.body;
      const val = isActive ? 1 : 0;

      await prisma.$executeRawUnsafe(`UPDATE \`advertisements\` SET \`isActive\` = ? WHERE \`id\` = ?`, val, id);
      const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM \`advertisements\` WHERE \`id\` = ? LIMIT 1`, id);

      invalidateAdsCache();
      return sendSuccess(res, { ad: rows[0] || null }, 'Advertisement status updated');
    } catch (error) {
      return sendSuccess(res, { ad: null }, 'Status updated fallback');
    }
  }

  // Toggle random pool status
  static async toggleIncludeInRandom(req: Request, res: Response, next: NextFunction) {
    try {
      await ensureAdsTableExists();
      const { id } = req.params;
      const { includeInRandom } = req.body;
      const val = includeInRandom ? 1 : 0;

      await prisma.$executeRawUnsafe(`UPDATE \`advertisements\` SET \`includeInRandom\` = ? WHERE \`id\` = ?`, val, id);
      const adList: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM \`advertisements\` WHERE \`id\` = ? LIMIT 1`, id);

      invalidateAdsCache();
      return sendSuccess(res, { ad: adList[0] || null }, 'Random pool status updated');
    } catch (error) {
      return sendSuccess(res, { ad: null }, 'Random pool status updated fallback');
    }
  }
}

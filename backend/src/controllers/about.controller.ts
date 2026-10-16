import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { clearPublicRoutesCache } from '../utils/publicCache.js';

let cachedAboutSetting: any = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 30 * 1000; // 30s cache

function parseJsonField(val: any, fallback: any = []) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function formatAboutSetting(row: any) {
  if (!row) return null;
  const values = parseJsonField(row.valuesJson, []);
  const stats = parseJsonField(row.statsJson, []);
  const team = parseJsonField(row.teamJson, []);
  const defaultRules = [
    '૧૦૦% તથ્ય ચકાસણી (Fact Checked)',
    'કોઈપણ ફેક ન્યૂઝ સામે શૂન્ય સહિષ્ણુતા',
    'ગ્રાઉન્ડ રિયાલિટી રિપોર્ટિંગ',
    'વાચકોની પ્રાઈવસીનું સંપૂર્ણ સન્માન',
  ];
  const rules = parseJsonField(row.rulesJson, defaultRules);
  const rulesArray = Array.isArray(rules) && rules.length > 0 ? rules.slice(0, 4) : defaultRules;

  return {
    ...row,
    title: row.titleGu || row.titleEn || row.titleHi || '',
    subtitle: row.subtitleGu || row.subtitleEn || row.subtitleHi || '',
    description: row.descriptionGu || row.descriptionEn || row.descriptionHi || '',
    mission: row.missionGu || row.missionEn || row.missionHi || '',
    vision: row.visionGu || row.visionEn || row.visionHi || '',
    rulesTitle: row.rulesTitle || 'અમારા અડગ નિયમો',
    rulesJson: rulesArray,
    valuesJson: values,
    statsJson: stats,
    teamJson: team,
  };
}

export class AboutController {
  /**
   * Get About page settings (Public & Admin)
   */
  static async getAboutSettings(req: Request, res: Response) {
    if (cachedAboutSetting && Date.now() - lastCacheTime < CACHE_TTL_MS) {
      return sendSuccess(res, cachedAboutSetting, 'About settings retrieved successfully.');
    }

    try {
      const rows: any[] = await prisma.$queryRawUnsafe('SELECT * FROM about_settings WHERE id = "default" LIMIT 1');
      if (rows && rows.length > 0) {
        cachedAboutSetting = formatAboutSetting(rows[0]);
        lastCacheTime = Date.now();
        return sendSuccess(res, cachedAboutSetting, 'About settings retrieved successfully.');
      }

      // If empty row, return fallback
      return sendSuccess(res, null, 'No about settings found.');
    } catch (error: any) {
      console.error('Error fetching about settings:', error);
      if (cachedAboutSetting) {
        return sendSuccess(res, cachedAboutSetting, 'About settings retrieved (cached).');
      }
      return sendError(res, 'Failed to fetch about settings', 500, error?.message || error);
    }
  }

  /**
   * Update About page settings (SUPER_ADMIN & EDITOR)
   */
  static async updateAboutSettings(req: Request, res: Response) {
    try {
      const body = req.body || {};

      const title = body.title !== undefined ? body.title : (body.titleGu || body.titleEn || '');
      const subtitle = body.subtitle !== undefined ? body.subtitle : (body.subtitleGu || body.subtitleEn || '');
      const description = body.description !== undefined ? body.description : (body.descriptionGu || body.descriptionEn || '');
      const mission = body.mission !== undefined ? body.mission : (body.missionGu || body.missionEn || '');
      const vision = body.vision !== undefined ? body.vision : (body.visionGu || body.visionEn || '');

      const titleGu = body.titleGu ?? title;
      const titleEn = body.titleEn ?? title;
      const titleHi = body.titleHi ?? title;
      const subtitleGu = body.subtitleGu ?? subtitle;
      const subtitleEn = body.subtitleEn ?? subtitle;
      const subtitleHi = body.subtitleHi ?? subtitle;
      const descriptionGu = body.descriptionGu ?? description;
      const descriptionEn = body.descriptionEn ?? description;
      const descriptionHi = body.descriptionHi ?? description;
      const missionGu = body.missionGu ?? mission;
      const missionEn = body.missionEn ?? mission;
      const missionHi = body.missionHi ?? mission;
      const visionGu = body.visionGu ?? vision;
      const visionEn = body.visionEn ?? vision;
      const visionHi = body.visionHi ?? vision;

      const bannerImage = body.bannerImage ?? '';

      // Rules - Enforce Maximum 4
      const rulesTitle = body.rulesTitle || 'અમારા અડગ નિયમો';
      let rawRules = body.rulesJson;
      if (typeof rawRules === 'string') {
        try {
          rawRules = JSON.parse(rawRules);
        } catch {
          rawRules = [];
        }
      }
      const rulesList = Array.isArray(rawRules)
        ? rawRules.filter((r: any) => typeof r === 'string' && r.trim() !== '').slice(0, 4)
        : [];
      const rulesStr = JSON.stringify(rulesList);

      const valuesStr = typeof body.valuesJson === 'string' ? body.valuesJson : JSON.stringify(body.valuesJson || []);
      const statsStr = typeof body.statsJson === 'string' ? body.statsJson : JSON.stringify(body.statsJson || []);
      const teamStr = typeof body.teamJson === 'string' ? body.teamJson : JSON.stringify(body.teamJson || []);

      const contactEmail = body.contactEmail ?? '';
      const contactPhone = body.contactPhone ?? '';
      const contactAddress = body.contactAddress ?? '';
      const whatsappNumber = body.whatsappNumber ?? '';

      // Check if row exists
      const existing: any[] = await prisma.$queryRawUnsafe('SELECT id FROM about_settings WHERE id = "default" LIMIT 1');

      if (existing && existing.length > 0) {
        await prisma.$executeRawUnsafe(
          `UPDATE about_settings SET
            titleGu = ?,
            titleEn = ?,
            titleHi = ?,
            subtitleGu = ?,
            subtitleEn = ?,
            subtitleHi = ?,
            descriptionGu = ?,
            descriptionEn = ?,
            descriptionHi = ?,
            bannerImage = ?,
            missionGu = ?,
            missionEn = ?,
            missionHi = ?,
            visionGu = ?,
            visionEn = ?,
            visionHi = ?,
            rulesTitle = ?,
            rulesJson = ?,
            valuesJson = ?,
            statsJson = ?,
            teamJson = ?,
            contactEmail = ?,
            contactPhone = ?,
            contactAddress = ?,
            whatsappNumber = ?,
            updatedAt = NOW(3)
          WHERE id = 'default'`,
          titleGu ?? '',
          titleEn ?? '',
          titleHi ?? '',
          subtitleGu ?? '',
          subtitleEn ?? '',
          subtitleHi ?? '',
          descriptionGu ?? '',
          descriptionEn ?? '',
          descriptionHi ?? '',
          bannerImage ?? '',
          missionGu ?? '',
          missionEn ?? '',
          missionHi ?? '',
          visionGu ?? '',
          visionEn ?? '',
          visionHi ?? '',
          rulesTitle,
          rulesStr,
          valuesStr,
          statsStr,
          teamStr,
          contactEmail ?? '',
          contactPhone ?? '',
          contactAddress ?? '',
          whatsappNumber ?? ''
        );
      } else {
        await prisma.$executeRawUnsafe(
          `INSERT INTO about_settings (
            id, titleGu, titleEn, titleHi, subtitleGu, subtitleEn, subtitleHi,
            descriptionGu, descriptionEn, descriptionHi, bannerImage,
            missionGu, missionEn, missionHi, visionGu, visionEn, visionHi,
            rulesTitle, rulesJson,
            valuesJson, statsJson, teamJson, contactEmail, contactPhone,
            contactAddress, whatsappNumber, updatedAt
          ) VALUES (
            'default', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3)
          )`,
          titleGu ?? '',
          titleEn ?? '',
          titleHi ?? '',
          subtitleGu ?? '',
          subtitleEn ?? '',
          subtitleHi ?? '',
          descriptionGu ?? '',
          descriptionEn ?? '',
          descriptionHi ?? '',
          bannerImage ?? '',
          missionGu ?? '',
          missionEn ?? '',
          missionHi ?? '',
          visionGu ?? '',
          visionEn ?? '',
          visionHi ?? '',
          rulesTitle,
          rulesStr,
          valuesStr,
          statsStr,
          teamStr,
          contactEmail ?? '',
          contactPhone ?? '',
          contactAddress ?? '',
          whatsappNumber ?? ''
        );
      }

      // Fetch fresh updated row
      const rows: any[] = await prisma.$queryRawUnsafe('SELECT * FROM about_settings WHERE id = "default" LIMIT 1');
      cachedAboutSetting = rows && rows.length > 0 ? formatAboutSetting(rows[0]) : null;
      lastCacheTime = Date.now();

      clearPublicRoutesCache();

      return sendSuccess(res, cachedAboutSetting, 'About settings updated successfully.');
    } catch (error: any) {
      console.error('Error updating about settings:', error);
      return sendError(res, 'Failed to update about settings', 500, error?.message || error);
    }
  }
}

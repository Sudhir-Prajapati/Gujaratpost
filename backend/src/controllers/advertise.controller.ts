import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { clearPublicRoutesCache } from '../utils/publicCache.js';

let cachedAdvertiseSetting: any = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 30 * 1000; // 30s cache

const DEFAULT_DESCRIPTION =
  'Gujarat Post is one of the premier digital media networks in Gujarat, delivering sharp, authentic, and credible journalism catering to millions of Gujarati readers across the globe. Started with a mission to bring truth and unbiased news, Gujarat Post has made a special place in the hearts of Gujarati-speaking readers. We are committed to empowering citizens by providing verified news, investigative reporting, analytical editorials, and hyperlocal updates across all 33 districts of Gujarat. We have established a commanding digital presence across Web, E-Paper, Video, and Social Platforms.';

const DEFAULT_SOCIALS = {
  whatsapp: 'https://api.whatsapp.com/send/?phone=919909907237&text&type=phone_number&app_absent=0',
  facebook: 'https://www.facebook.com/gujpost.in',
  twitter: 'https://x.com/maheshrpat59606',
  instagram: 'https://instagram.com/gujaratpost',
  telegram: 'https://t.me/gujaratpost',
  youtube: 'https://youtube.com/@gujaratpost',
};

const DEFAULT_APP_LINKS = {
  playStore: 'https://play.google.com/store/apps/details?id=com.gujaratpost.app',
  appStore: 'https://apps.apple.com/app/gujarat-post/id123456789',
};

const DEFAULT_ADVERTISE_SETTING = {
  id: 'default',
  pageTitle: 'Advertise With Us',
  description: DEFAULT_DESCRIPTION,
  officeAddress: 'Gujarat Post Bhavan, S.G. Highway, Prahlad Nagar, Vastrapur, Ahmedabad, Gujarat 380015',
  locationUrl: 'https://maps.google.com/?q=Gujarat+Post+Bhavan+Ahmedabad',
  contactPhone: '079 4000 4000 / +91 99099 07237',
  onlineAdsEmail: 'digital.advertising@gujaratpost.in',
  printAdsEmail: 'advt@gujaratpost.in & epaper@gujaratpost.in',
  websiteUrl: 'https://gujaratpost.in/',
  socialLinksJson: DEFAULT_SOCIALS,
  appLinksJson: DEFAULT_APP_LINKS,
};

function parseJsonField(val: any, fallback: any = {}) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function formatAdvertiseSetting(row: any) {
  if (!row) return DEFAULT_ADVERTISE_SETTING;
  return {
    ...row,
    pageTitle: row.pageTitle || DEFAULT_ADVERTISE_SETTING.pageTitle,
    description: row.description || DEFAULT_ADVERTISE_SETTING.description,
    officeAddress: row.officeAddress || DEFAULT_ADVERTISE_SETTING.officeAddress,
    locationUrl: row.locationUrl || DEFAULT_ADVERTISE_SETTING.locationUrl,
    contactPhone: row.contactPhone || DEFAULT_ADVERTISE_SETTING.contactPhone,
    onlineAdsEmail: row.onlineAdsEmail || DEFAULT_ADVERTISE_SETTING.onlineAdsEmail,
    printAdsEmail: row.printAdsEmail || DEFAULT_ADVERTISE_SETTING.printAdsEmail,
    websiteUrl: row.websiteUrl || DEFAULT_ADVERTISE_SETTING.websiteUrl,
    socialLinksJson: parseJsonField(row.socialLinksJson, DEFAULT_SOCIALS),
    appLinksJson: parseJsonField(row.appLinksJson, DEFAULT_APP_LINKS),
  };
}

export class AdvertiseController {
  /**
   * Get Advertise page settings (Public & Admin)
   */
  static async getAdvertiseSettings(req: Request, res: Response) {
    if (cachedAdvertiseSetting && Date.now() - lastCacheTime < CACHE_TTL_MS) {
      return sendSuccess(res, cachedAdvertiseSetting, 'Advertise settings retrieved successfully.');
    }

    try {
      const rows: any[] = await prisma.$queryRawUnsafe(
        'SELECT * FROM advertise_settings WHERE id = "default" LIMIT 1'
      );

      if (rows && rows.length > 0) {
        cachedAdvertiseSetting = formatAdvertiseSetting(rows[0]);
        lastCacheTime = Date.now();
        return sendSuccess(res, cachedAdvertiseSetting, 'Advertise settings retrieved successfully.');
      }

      cachedAdvertiseSetting = DEFAULT_ADVERTISE_SETTING;
      lastCacheTime = Date.now();
      return sendSuccess(res, cachedAdvertiseSetting, 'Advertise settings retrieved (defaults).');
    } catch (error: any) {
      console.error('Error fetching advertise settings:', error);
      if (cachedAdvertiseSetting) {
        return sendSuccess(res, cachedAdvertiseSetting, 'Advertise settings retrieved (cached).');
      }
      return sendSuccess(res, DEFAULT_ADVERTISE_SETTING, 'Advertise settings fallback.');
    }
  }

  /**
   * Update Advertise page settings (Admin: SUPER_ADMIN, EDITOR, ADVERTISEMENT)
   */
  static async updateAdvertiseSettings(req: Request, res: Response) {
    try {
      const b = req.body || {};

      const pageTitle = b.pageTitle !== undefined ? b.pageTitle : DEFAULT_ADVERTISE_SETTING.pageTitle;
      const description = b.description !== undefined ? b.description : DEFAULT_ADVERTISE_SETTING.description;
      const officeAddress = b.officeAddress !== undefined ? b.officeAddress : DEFAULT_ADVERTISE_SETTING.officeAddress;
      const locationUrl = b.locationUrl !== undefined ? b.locationUrl : DEFAULT_ADVERTISE_SETTING.locationUrl;
      const contactPhone = b.contactPhone !== undefined ? b.contactPhone : DEFAULT_ADVERTISE_SETTING.contactPhone;
      const onlineAdsEmail = b.onlineAdsEmail !== undefined ? b.onlineAdsEmail : DEFAULT_ADVERTISE_SETTING.onlineAdsEmail;
      const printAdsEmail = b.printAdsEmail !== undefined ? b.printAdsEmail : DEFAULT_ADVERTISE_SETTING.printAdsEmail;
      const websiteUrl = b.websiteUrl !== undefined ? b.websiteUrl : DEFAULT_ADVERTISE_SETTING.websiteUrl;

      const socialLinksStr = typeof b.socialLinksJson === 'string'
        ? b.socialLinksJson
        : JSON.stringify(b.socialLinksJson || DEFAULT_SOCIALS);

      const appLinksStr = typeof b.appLinksJson === 'string'
        ? b.appLinksJson
        : JSON.stringify(b.appLinksJson || DEFAULT_APP_LINKS);

      const existing: any[] = await prisma.$queryRawUnsafe(
        'SELECT id FROM advertise_settings WHERE id = "default" LIMIT 1'
      );

      if (existing && existing.length > 0) {
        await prisma.$executeRawUnsafe(
          `UPDATE advertise_settings SET
            pageTitle = ?,
            description = ?,
            officeAddress = ?,
            locationUrl = ?,
            contactPhone = ?,
            onlineAdsEmail = ?,
            printAdsEmail = ?,
            websiteUrl = ?,
            socialLinksJson = ?,
            appLinksJson = ?,
            updatedAt = NOW(3)
          WHERE id = 'default'`,
          pageTitle ?? '',
          description ?? '',
          officeAddress ?? '',
          locationUrl ?? '',
          contactPhone ?? '',
          onlineAdsEmail ?? '',
          printAdsEmail ?? '',
          websiteUrl ?? '',
          socialLinksStr,
          appLinksStr
        );
      } else {
        await prisma.$executeRawUnsafe(
          `INSERT INTO advertise_settings (
            id, pageTitle, description, officeAddress, locationUrl,
            contactPhone, onlineAdsEmail, printAdsEmail, websiteUrl,
            socialLinksJson, appLinksJson, updatedAt
          ) VALUES (
            'default', ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, NOW(3)
          )`,
          pageTitle ?? '',
          description ?? '',
          officeAddress ?? '',
          locationUrl ?? '',
          contactPhone ?? '',
          onlineAdsEmail ?? '',
          printAdsEmail ?? '',
          websiteUrl ?? '',
          socialLinksStr,
          appLinksStr
        );
      }

      const rows: any[] = await prisma.$queryRawUnsafe(
        'SELECT * FROM advertise_settings WHERE id = "default" LIMIT 1'
      );

      cachedAdvertiseSetting = rows && rows.length > 0 ? formatAdvertiseSetting(rows[0]) : null;
      lastCacheTime = Date.now();

      clearPublicRoutesCache();

      return sendSuccess(res, cachedAdvertiseSetting, 'Advertise settings updated successfully.');
    } catch (error: any) {
      console.error('Error updating advertise settings:', error);
      return sendError(res, 'Failed to update advertise settings', 500, error?.message || error);
    }
  }
}

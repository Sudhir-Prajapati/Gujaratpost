import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { sendSuccess } from '../utils/response.js';

import { randomUUID } from 'crypto';

function sanitizePdfUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('blob:')) return '';
  if (url.includes('res.cloudinary.com') && url.includes('/image/upload/')) {
    return url.replace('/image/upload/', '/raw/upload/').replace('/fl_attachment/', '/');
  }
  return url;
}

let epaperTablesEnsured = false;
async function ensureEPaperTablesExist() {
  if (epaperTablesEnsured) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`epaper_editions\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`title\` VARCHAR(255) NOT NULL DEFAULT 'City Edition',
        \`city\` VARCHAR(255) NOT NULL,
        \`cityGu\` VARCHAR(255) NULL,
        \`cityHi\` VARCHAR(255) NULL,
        \`date\` VARCHAR(50) NOT NULL,
        \`pages\` INT NOT NULL DEFAULT 24,
        \`fileUrl\` TEXT NOT NULL,
        \`thumbnailUrl\` TEXT NULL,
        \`status\` VARCHAR(50) NOT NULL DEFAULT 'PUBLISHED',
        \`publishTime\` VARCHAR(50) NULL DEFAULT '06:00 AM',
        \`isActive\` TINYINT(1) NOT NULL DEFAULT 1,
        \`editionType\` VARCHAR(50) NOT NULL DEFAULT 'PDF',
        \`templateData\` LONGTEXT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Safely ensure columns and indexes exist if table already created without them
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE \`epaper_editions\` ADD COLUMN \`editionType\` VARCHAR(50) NOT NULL DEFAULT 'PDF';`);
    } catch (_) {}
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE \`epaper_editions\` ADD COLUMN \`templateData\` LONGTEXT NULL;`);
    } catch (_) {}
    try {
      await prisma.$executeRawUnsafe(`CREATE INDEX \`idx_epaper_city_date\` ON \`epaper_editions\` (\`city\`(100), \`date\`, \`status\`);`);
    } catch (_) {}
    try {
      await prisma.$executeRawUnsafe(`CREATE INDEX \`idx_epaper_active_status\` ON \`epaper_editions\` (\`isActive\`, \`status\`, \`date\`);`);
    } catch (_) {}

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`epaper_cities\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`city\` VARCHAR(255) NOT NULL,
        \`cityGu\` VARCHAR(255) NULL,
        \`cityHi\` VARCHAR(255) NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    epaperTablesEnsured = true;
  } catch (err) {
    console.warn('ePaper tables ensure warning:', err);
  }
}

async function getEPaperDelegate() {
  await ensureEPaperTablesExist();
  const model = (prisma as any).ePaperEdition || (prisma as any).epaperEdition || (prisma as any).EPaperEdition;
  return model || null;
}

export class EPaperController {
  // Public: Get published epapers
  static async getPublicEditions(req: Request, res: Response, next: NextFunction) {
    try {
      await ensureEPaperTablesExist();
      const delegate = await getEPaperDelegate();
      const { city, date, search } = req.query;

      let editions: any[] = [];

      if (delegate) {
        const whereClause: any = { isActive: true, status: 'PUBLISHED' };
        if (city && city !== 'ALL') {
          const cityStr = String(city).trim();
          whereClause.OR = [
            { city: { equals: cityStr } },
            { city: { contains: cityStr } },
            { cityGu: { equals: cityStr } },
            { cityGu: { contains: cityStr } },
          ];
        }
        if (date && date !== 'ALL') whereClause.date = String(date);
        editions = await delegate.findMany({
          where: whereClause,
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        }).catch(() => []);
      }

      if (editions.length === 0) {
        let sql = `SELECT * FROM \`epaper_editions\` WHERE \`isActive\` = 1 AND \`status\` = 'PUBLISHED'`;
        const params: any[] = [];
        if (city && city !== 'ALL') {
          sql += ` AND (\`city\` LIKE ? OR \`cityGu\` LIKE ?)`;
          params.push(`%${city}%`, `%${city}%`);
        }
        if (date && date !== 'ALL') {
          sql += ` AND \`date\` = ?`;
          params.push(String(date));
        }
        sql += ` ORDER BY \`date\` DESC, \`createdAt\` DESC`;
        try {
          editions = await prisma.$queryRawUnsafe(sql, ...params);
        } catch (_) {}
      }

      const sanitized = (editions || []).map((ed: any) => ({
        ...ed,
        fileUrl: sanitizePdfUrl(ed.fileUrl),
        thumbnailUrl: sanitizePdfUrl(ed.thumbnailUrl),
      }));

      return sendSuccess(res, { editions: sanitized }, 'Public E-Papers fetched successfully');
    } catch (error) {
      console.warn('E-Paper fetch fallback:', error);
      return sendSuccess(res, { editions: [] }, 'Public E-Papers fetched fallback');
    }
  }

  // Admin: Get all epapers (Drafts & Published)
  static async getAdminEditions(req: Request, res: Response, next: NextFunction) {
    try {
      await ensureEPaperTablesExist();
      const delegate = await getEPaperDelegate();
      const { city, date, status, search } = req.query;

      let editions: any[] = [];

      if (delegate) {
        const whereClause: any = {};
        if (city && city !== 'ALL') whereClause.city = String(city);
        if (date && date !== 'ALL') whereClause.date = String(date);
        if (status && status !== 'ALL') whereClause.status = String(status);
        editions = await delegate.findMany({
          where: whereClause,
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        }).catch(() => []);
      }

      if (editions.length === 0) {
        let sql = `SELECT * FROM \`epaper_editions\` WHERE 1=1`;
        const params: any[] = [];
        if (city && city !== 'ALL') {
          sql += ` AND \`city\` = ?`;
          params.push(String(city));
        }
        if (date && date !== 'ALL') {
          sql += ` AND \`date\` = ?`;
          params.push(String(date));
        }
        if (status && status !== 'ALL') {
          sql += ` AND \`status\` = ?`;
          params.push(String(status));
        }
        sql += ` ORDER BY \`date\` DESC, \`createdAt\` DESC`;
        try {
          editions = await prisma.$queryRawUnsafe(sql, ...params);
        } catch (_) {}
      }

      const sanitized = (editions || []).map((ed: any) => ({
        ...ed,
        fileUrl: sanitizePdfUrl(ed.fileUrl),
        thumbnailUrl: sanitizePdfUrl(ed.thumbnailUrl),
      }));

      return sendSuccess(res, { editions: sanitized }, 'Admin E-Papers fetched successfully');
    } catch (error) {
      console.warn('Admin E-Paper fetch fallback:', error);
      return sendSuccess(res, { editions: [] }, 'Admin E-Papers fetched fallback');
    }
  }

  // Admin: Create or Upsert E-Paper edition
  static async createEdition(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, city, cityGu, date, pages, fileUrl, thumbnailUrl, status, publishTime, isActive, editionType, templateData } = req.body;

      if (!city || !date) {
        return res.status(400).json({ success: false, error: 'City and Date are required' });
      }

      const finalTitle = String(title || '').trim() || `${city} Edition`;
      const finalEditionType = editionType ? String(editionType) : 'PDF';
      const finalTemplateData = templateData ? (typeof templateData === 'string' ? templateData : JSON.stringify(templateData)) : null;

      const delegate = await getEPaperDelegate();

      if (delegate) {
        try {
          let existing = await delegate.findFirst({
            where: { city: String(city), date: String(date), title: finalTitle },
          });

          let edition;
          if (existing) {
            edition = await delegate.update({
              where: { id: existing.id },
              data: {
                title: finalTitle,
                city: String(city),
                cityGu: cityGu ? String(cityGu) : String(city),
                date: String(date),
                pages: Number(pages) || existing.pages || 4,
                fileUrl: fileUrl ? String(fileUrl) : existing.fileUrl,
                thumbnailUrl: thumbnailUrl ? String(thumbnailUrl) : existing.thumbnailUrl,
                status: status ? String(status) : 'PUBLISHED',
                publishTime: publishTime ? String(publishTime) : '06:00 AM',
                isActive: isActive !== undefined ? Boolean(isActive) : true,
                editionType: finalEditionType,
                templateData: finalTemplateData,
              },
            });
          } else {
            edition = await delegate.create({
              data: {
                title: finalTitle,
                city: String(city),
                cityGu: cityGu ? String(cityGu) : String(city),
                date: String(date),
                pages: Number(pages) || 4,
                fileUrl: String(fileUrl || ''),
                thumbnailUrl: String(thumbnailUrl || ''),
                status: status ? String(status) : 'PUBLISHED',
                publishTime: publishTime ? String(publishTime) : '06:00 AM',
                isActive: isActive !== undefined ? Boolean(isActive) : true,
                editionType: finalEditionType,
                templateData: finalTemplateData,
              },
            });
          }
          return sendSuccess(res, { edition }, 'E-Paper edition saved successfully');
        } catch (delegateErr) {
          console.warn('Prisma delegate save warning, falling back to raw SQL:', delegateErr);
        }
      }

      // Direct MySQL raw query fallback
      await ensureEPaperTablesExist();
      const existingRows: any[] = await prisma.$queryRawUnsafe(
        `SELECT * FROM \`epaper_editions\` WHERE \`city\` = ? AND \`date\` = ? AND \`title\` = ? LIMIT 1`,
        String(city), String(date), finalTitle
      );

      let editionId = randomUUID();
      if (existingRows && existingRows.length > 0) {
        editionId = existingRows[0].id;
        await prisma.$executeRawUnsafe(
          `UPDATE \`epaper_editions\` SET \`title\`=?, \`city\`=?, \`cityGu\`=?, \`date\`=?, \`pages\`=?, \`fileUrl\`=?, \`thumbnailUrl\`=?, \`status\`=?, \`publishTime\`=?, \`isActive\`=?, \`editionType\`=?, \`templateData\`=?, \`updatedAt\`=NOW() WHERE \`id\`=?`,
          finalTitle, String(city), String(cityGu || city), String(date), Number(pages) || 4, String(fileUrl || ''), String(thumbnailUrl || ''), String(status || 'PUBLISHED'), String(publishTime || '06:00 AM'), isActive !== false ? 1 : 0, finalEditionType, finalTemplateData, editionId
        );
      } else {
        await prisma.$executeRawUnsafe(
          `INSERT INTO \`epaper_editions\` (\`id\`, \`title\`, \`city\`, \`cityGu\`, \`date\`, \`pages\`, \`fileUrl\`, \`thumbnailUrl\`, \`status\`, \`publishTime\`, \`isActive\`, \`editionType\`, \`templateData\`, \`createdAt\`, \`updatedAt\`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          editionId, finalTitle, String(city), String(cityGu || city), String(date), Number(pages) || 4, String(fileUrl || ''), String(thumbnailUrl || ''), String(status || 'PUBLISHED'), String(publishTime || '06:00 AM'), isActive !== false ? 1 : 0, finalEditionType, finalTemplateData
        );
      }

      const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM \`epaper_editions\` WHERE \`id\` = ?`, editionId);
      return sendSuccess(res, { edition: rows[0] }, 'E-Paper edition saved successfully');
    } catch (error: any) {
      console.error('Error in createEdition:', error);
      return res.status(500).json({
        success: false,
        error: error?.message || 'Failed to create or update E-Paper edition.',
      });
    }
  }

  // Admin: Update E-Paper edition
  static async updateEdition(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { title, city, cityGu, date, pages, fileUrl, thumbnailUrl, status, publishTime, isActive, editionType, templateData } = req.body;
      const finalEditionType = editionType ? String(editionType) : undefined;
      const finalTemplateData = templateData !== undefined ? (typeof templateData === 'string' ? templateData : JSON.stringify(templateData)) : undefined;
      const delegate = await getEPaperDelegate();

      if (delegate) {
        try {
          const edition = await delegate.update({
            where: { id },
            data: {
              title,
              city,
              cityGu: cityGu || city,
              date,
              pages: pages !== undefined ? Number(pages) : undefined,
              fileUrl,
              thumbnailUrl,
              status,
              publishTime,
              isActive: isActive !== undefined ? Boolean(isActive) : undefined,
              editionType: finalEditionType,
              templateData: finalTemplateData,
            },
          });
          return sendSuccess(res, { edition }, 'E-Paper edition updated successfully');
        } catch (_) {}
      }

      await ensureEPaperTablesExist();
      await prisma.$executeRawUnsafe(
        `UPDATE \`epaper_editions\` SET \`title\`=COALESCE(?, \`title\`), \`city\`=COALESCE(?, \`city\`), \`cityGu\`=COALESCE(?, \`cityGu\`), \`date\`=COALESCE(?, \`date\`), \`pages\`=COALESCE(?, \`pages\`), \`fileUrl\`=COALESCE(?, \`fileUrl\`), \`thumbnailUrl\`=COALESCE(?, \`thumbnailUrl\`), \`status\`=COALESCE(?, \`status\`), \`publishTime\`=COALESCE(?, \`publishTime\`), \`isActive\`=COALESCE(?, \`isActive\`), \`editionType\`=COALESCE(?, \`editionType\`), \`templateData\`=COALESCE(?, \`templateData\`), \`updatedAt\`=NOW() WHERE \`id\`=?`,
        title || null, city || null, cityGu || city || null, date || null, pages !== undefined ? Number(pages) : null, fileUrl || null, thumbnailUrl || null, status || null, publishTime || null, isActive !== undefined ? (isActive ? 1 : 0) : null, finalEditionType || null, finalTemplateData || null, id
      );

      const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM \`epaper_editions\` WHERE \`id\` = ?`, id);
      return sendSuccess(res, { edition: rows[0] }, 'E-Paper edition updated successfully');
    } catch (error) {
      next(error);
    }
  }

  // Admin: Delete E-Paper edition
  static async deleteEdition(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const delegate = await getEPaperDelegate();
      if (delegate) {
        await delegate.delete({ where: { id } }).catch(() => null);
      }
      await ensureEPaperTablesExist();
      await prisma.$executeRawUnsafe(`DELETE FROM \`epaper_editions\` WHERE \`id\` = ?`, id).catch(() => null);
      return sendSuccess(res, null, 'E-Paper edition deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // Get Cities list (Only DB cities + cities from uploaded editions)
  static async getCities(req: Request, res: Response, next: NextFunction) {
    const defaults = [
      { id: 'ahmedabad', city: 'Ahmedabad', cityGu: 'અમદાવાદ' },
      { id: 'surat', city: 'Surat', cityGu: 'સુરત' },
      { id: 'rajkot', city: 'Rajkot', cityGu: 'રાજકોટ' },
      { id: 'jamnagar', city: 'Jamnagar', cityGu: 'જામનગર' },
      { id: 'vadodara', city: 'Vadodara', cityGu: 'વડોદરા' },
    ];

    try {
      await ensureEPaperTablesExist();
      let dbCities: any[] = [];
      try {
        dbCities = await prisma.$queryRawUnsafe(`SELECT * FROM \`epaper_cities\` ORDER BY \`createdAt\` ASC`);
      } catch (_) {}

      if (!dbCities || dbCities.length === 0) {
        dbCities = defaults;
      }

      return sendSuccess(res, { cities: dbCities }, 'Cities fetched successfully');
    } catch (error) {
      console.warn('Cities DB fetch fallback:', error);
      return sendSuccess(res, { cities: defaults }, 'Fallback cities fetched successfully');
    }
  }

  // Admin: Create City
  static async createCity(req: Request, res: Response, next: NextFunction) {
    try {
      const { city, cityGu } = req.body;
      if (!city) {
        return res.status(400).json({ success: false, error: 'City name is required' });
      }

      const trimCity = String(city).trim();
      const trimGu = cityGu ? String(cityGu).trim() : trimCity;
      const cityId = randomUUID();

      await ensureEPaperTablesExist();
      await prisma.$executeRawUnsafe(
        `INSERT IGNORE INTO \`epaper_cities\` (\`id\`, \`city\`, \`cityGu\`, \`createdAt\`, \`updatedAt\`) VALUES (?, ?, ?, NOW(), NOW())`,
        cityId, trimCity, trimGu
      ).catch(() => null);

      return sendSuccess(res, { city: { id: cityId, city: trimCity, cityGu: trimGu } }, 'City created successfully');
    } catch (error) {
      console.error('Error in createCity:', error);
      next(error);
    }
  }

  // Admin: Delete City by ID or City Name
  static async deleteCity(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ success: false, error: 'City ID or Name is required' });
      }

      const searchTerm = String(id).trim();

      await ensureEPaperTablesExist();
      await prisma.$executeRawUnsafe(
        `DELETE FROM \`epaper_cities\` WHERE \`id\` = ? OR \`city\` = ? OR \`cityGu\` = ?`,
        searchTerm, searchTerm, searchTerm
      ).catch(() => null);

      return sendSuccess(res, null, 'City deleted successfully');
    } catch (error) {
      console.warn('Delete city notice:', error);
      return sendSuccess(res, null, 'City removed');
    }
  }
}

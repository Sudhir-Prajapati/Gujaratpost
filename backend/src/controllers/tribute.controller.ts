import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { sendSuccess } from '../utils/response.js';
import { randomUUID } from 'crypto';

let tableEnsured = false;
let tableEnsuringPromise: Promise<void> | null = null;

// In-memory cache for public tributes to reduce DB load
const tributesCache = new Map<string, { timestamp: number; data: any }>();
const TRIBUTES_CACHE_TTL_MS = 30 * 1000; // 30 seconds

export function invalidateTributesCache() {
  tributesCache.clear();
}

export async function ensureTributesTableExists(): Promise<void> {
  if (tableEnsured) return;
  if (tableEnsuringPromise) return tableEnsuringPromise;

  tableEnsuringPromise = (async () => {
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS \`tributes\` (
          \`id\` VARCHAR(191) NOT NULL,
          \`type\` VARCHAR(50) NOT NULL DEFAULT 'BIRTHDAY',
          \`name\` VARCHAR(255) NOT NULL,
          \`photo\` TEXT NULL,
          \`date\` VARCHAR(100) NULL,
          \`info\` TEXT NULL,
          \`templateId\` VARCHAR(50) NOT NULL DEFAULT 'golden',
          \`isActive\` TINYINT(1) NOT NULL DEFAULT 1,
          \`order\` INT NOT NULL DEFAULT 0,
          \`startDate\` VARCHAR(50) NULL,
          \`endDate\` VARCHAR(50) NULL,
          \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
          PRIMARY KEY (\`id\`),
          INDEX \`tributes_type_active_idx\` (\`type\`, \`isActive\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `).catch(() => null);

      tableEnsured = true;
    } catch (err) {
      console.error('Error ensuring tributes table:', err);
    }
  })();

  return tableEnsuringPromise;
}

export class TributeController {
  /**
   * GET /api/public/tributes
   * Returns active birthdays and shradhanjalis for the homepage ad slider
   */
  static async getPublicTributes(req: Request, res: Response, next: NextFunction) {
    try {
      const cacheKey = 'PUBLIC_TRIBUTES';
      const cached = tributesCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < TRIBUTES_CACHE_TTL_MS) {
        return sendSuccess(res, cached.data, 'Active tributes retrieved');
      }

      await ensureTributesTableExists();

      let rows: any[] = [];
      try {
        rows = await prisma.$queryRawUnsafe(`
          SELECT * FROM \`tributes\`
          WHERE \`isActive\` = 1
          ORDER BY \`order\` ASC, \`createdAt\` DESC
        `);
      } catch (e) {
        console.warn('Query tributes failed:', e);
        rows = [];
      }

      // Format boolean isActive
      const tributes = rows.map((r) => ({
        ...r,
        isActive: Boolean(r.isActive),
      }));

      const birthdays = tributes.filter((t) => t.type === 'BIRTHDAY');
      const shradhanjalis = tributes.filter((t) => t.type === 'SHRADHANJALI');

      const data = {
        birthdays,
        shradhanjalis,
        all: tributes,
      };

      tributesCache.set(cacheKey, { timestamp: Date.now(), data });
      return sendSuccess(res, data, 'Active tributes retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/tributes
   * Returns all tributes for admin management
   */
  static async getAllTributes(req: Request, res: Response, next: NextFunction) {
    try {
      await ensureTributesTableExists();

      let rows: any[] = [];
      try {
        rows = await prisma.$queryRawUnsafe(`
          SELECT * FROM \`tributes\`
          ORDER BY \`order\` ASC, \`createdAt\` DESC
        `);
      } catch (e) {
        console.warn('Query admin tributes failed:', e);
        rows = [];
      }

      const tributes = rows.map((r) => ({
        ...r,
        isActive: Boolean(r.isActive),
      }));

      return sendSuccess(res, { tributes }, 'All tributes retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/tributes
   * Create a new birthday or shradhanjali entry
   */
  static async createTribute(req: Request, res: Response, next: NextFunction) {
    try {
      await ensureTributesTableExists();
      const {
        type = 'BIRTHDAY',
        name,
        photo,
        date,
        info,
        templateId = 'golden',
        isActive = true,
        order = 0,
        startDate,
        endDate,
      } = req.body;

      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Name (વ્યક્તિનું નામ) is required' });
      }

      const id = randomUUID();
      const cleanType = type === 'SHRADHANJALI' ? 'SHRADHANJALI' : 'BIRTHDAY';
      const cleanIsActive = isActive ? 1 : 0;
      const cleanOrder = Number(order) || 0;

      await prisma.$executeRawUnsafe(
        `INSERT INTO \`tributes\` 
          (\`id\`, \`type\`, \`name\`, \`photo\`, \`date\`, \`info\`, \`templateId\`, \`isActive\`, \`order\`, \`startDate\`, \`endDate\`, \`createdAt\`, \`updatedAt\`)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
        id,
        cleanType,
        name.trim(),
        photo || '',
        date || '',
        info || '',
        templateId || (cleanType === 'BIRTHDAY' ? 'golden' : 'shanti'),
        cleanIsActive,
        cleanOrder,
        startDate || null,
        endDate || null
      );

      invalidateTributesCache();

      const created = {
        id,
        type: cleanType,
        name: name.trim(),
        photo: photo || '',
        date: date || '',
        info: info || '',
        templateId: templateId || (cleanType === 'BIRTHDAY' ? 'golden' : 'shanti'),
        isActive: Boolean(cleanIsActive),
        order: cleanOrder,
        startDate: startDate || null,
        endDate: endDate || null,
      };

      return sendSuccess(res, { tribute: created }, 'Tribute created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/admin/tributes/:id
   * Update an existing birthday or shradhanjali entry
   */
  static async updateTribute(req: Request, res: Response, next: NextFunction) {
    try {
      await ensureTributesTableExists();
      const { id } = req.params;
      const {
        type,
        name,
        photo,
        date,
        info,
        templateId,
        isActive,
        order,
        startDate,
        endDate,
      } = req.body;

      const existing: any[] = await prisma.$queryRawUnsafe(
        `SELECT * FROM \`tributes\` WHERE \`id\` = ? LIMIT 1`,
        id
      );

      if (!existing || existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Tribute not found' });
      }

      const prev = existing[0];
      const newType = type !== undefined ? (type === 'SHRADHANJALI' ? 'SHRADHANJALI' : 'BIRTHDAY') : prev.type;
      const newName = name !== undefined ? String(name).trim() : prev.name;
      const newPhoto = photo !== undefined ? photo : prev.photo;
      const newDate = date !== undefined ? date : prev.date;
      const newInfo = info !== undefined ? info : prev.info;
      const newTemplateId = templateId !== undefined ? templateId : prev.templateId;
      const newIsActive = isActive !== undefined ? (isActive ? 1 : 0) : prev.isActive;
      const newOrder = order !== undefined ? Number(order) : prev.order;
      const newStartDate = startDate !== undefined ? startDate : prev.startDate;
      const newEndDate = endDate !== undefined ? endDate : prev.endDate;

      await prisma.$executeRawUnsafe(
        `UPDATE \`tributes\`
         SET \`type\` = ?, \`name\` = ?, \`photo\` = ?, \`date\` = ?, \`info\` = ?, \`templateId\` = ?, 
             \`isActive\` = ?, \`order\` = ?, \`startDate\` = ?, \`endDate\` = ?, \`updatedAt\` = NOW(3)
         WHERE \`id\` = ?`,
        newType,
        newName,
        newPhoto,
        newDate,
        newInfo,
        newTemplateId,
        newIsActive,
        newOrder,
        newStartDate,
        newEndDate,
        id
      );

      invalidateTributesCache();

      const updated = {
        id,
        type: newType,
        name: newName,
        photo: newPhoto,
        date: newDate,
        info: newInfo,
        templateId: newTemplateId,
        isActive: Boolean(newIsActive),
        order: newOrder,
        startDate: newStartDate,
        endDate: newEndDate,
      };

      return sendSuccess(res, { tribute: updated }, 'Tribute updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/admin/tributes/:id/toggle
   * Toggle active state
   */
  static async toggleActive(req: Request, res: Response, next: NextFunction) {
    try {
      await ensureTributesTableExists();
      const { id } = req.params;

      const existing: any[] = await prisma.$queryRawUnsafe(
        `SELECT \`isActive\` FROM \`tributes\` WHERE \`id\` = ? LIMIT 1`,
        id
      );

      if (!existing || existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Tribute not found' });
      }

      const nextVal = existing[0].isActive ? 0 : 1;
      await prisma.$executeRawUnsafe(
        `UPDATE \`tributes\` SET \`isActive\` = ?, \`updatedAt\` = NOW(3) WHERE \`id\` = ?`,
        nextVal,
        id
      );

      invalidateTributesCache();
      return sendSuccess(res, { id, isActive: Boolean(nextVal) }, 'Tribute status updated');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/tributes/:id
   * Delete a tribute entry
   */
  static async deleteTribute(req: Request, res: Response, next: NextFunction) {
    try {
      await ensureTributesTableExists();
      const { id } = req.params;

      await prisma.$executeRawUnsafe(`DELETE FROM \`tributes\` WHERE \`id\` = ?`, id);

      invalidateTributesCache();
      return sendSuccess(res, { id }, 'Tribute deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { clearPublicRoutesCache } from '../utils/publicCache.js';

function normalizeSlug(slug: string): string {
  const s = (slug || '').trim().toLowerCase();
  if (s === 'privacy' || s === 'privacy-policy') return 'privacy-policy';
  if (s === 'terms' || s === 'terms-of-use' || s === 'terms-and-conditions') return 'terms-of-use';
  if (s === 'disclaimer') return 'disclaimer';
  return s;
}

function parseJsonField(val: any, fallback: any = []) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function formatLegalPage(row: any) {
  if (!row) return null;
  const sections = parseJsonField(row.sectionsJson, []);
  return {
    id: row.id,
    slug: row.id,
    pageTitle: row.pageTitle || '',
    lastUpdated: row.lastUpdated || '',
    introText: row.introText || '',
    sections: Array.isArray(sections) ? sections : [],
    contentHtml: row.contentHtml || '',
    updatedAt: row.updatedAt,
  };
}

export class LegalController {
  /**
   * Get single legal page by slug (Public & Admin)
   * GET /api/public/legal/:slug or /api/admin/legal/:slug
   */
  static async getLegalPage(req: Request, res: Response) {
    try {
      const slug = normalizeSlug(req.params.slug);
      if (!slug) {
        return sendError(res, 'Invalid page slug provided', 400);
      }

      const rows: any[] = await prisma.$queryRawUnsafe(
        'SELECT * FROM legal_pages WHERE id = ? LIMIT 1',
        slug
      );

      if (rows && rows.length > 0) {
        const page = formatLegalPage(rows[0]);
        return sendSuccess(res, page, 'Legal page retrieved successfully.');
      }

      return sendError(res, `Legal page "${slug}" not found`, 404);
    } catch (error: any) {
      console.error('Error fetching legal page:', error);
      return sendError(res, 'Failed to fetch legal page', 500, error?.message || error);
    }
  }

  /**
   * Get all legal pages (Admin)
   * GET /api/admin/legal
   */
  static async getAllLegalPages(req: Request, res: Response) {
    try {
      const rows: any[] = await prisma.$queryRawUnsafe(
        'SELECT * FROM legal_pages ORDER BY id ASC'
      );

      const pages = (rows || []).map(formatLegalPage);
      return sendSuccess(res, pages, 'All legal pages retrieved successfully.');
    } catch (error: any) {
      console.error('Error fetching all legal pages:', error);
      return sendError(res, 'Failed to fetch legal pages', 500, error?.message || error);
    }
  }

  /**
   * Update legal page (Admin: SUPER_ADMIN, EDITOR)
   * PUT /api/admin/legal/:slug
   */
  static async updateLegalPage(req: Request, res: Response) {
    try {
      const slug = normalizeSlug(req.params.slug);
      if (!slug) {
        return sendError(res, 'Invalid page slug provided', 400);
      }

      const body = req.body || {};
      const pageTitle = (body.pageTitle || '').trim();
      const lastUpdated = body.lastUpdated !== undefined ? body.lastUpdated : '';
      const introText = body.introText !== undefined ? body.introText : '';
      const contentHtml = body.contentHtml !== undefined ? body.contentHtml : '';

      let sectionsJson = '[]';
      if (body.sections && Array.isArray(body.sections)) {
        sectionsJson = JSON.stringify(body.sections);
      } else if (body.sectionsJson && typeof body.sectionsJson === 'string') {
        sectionsJson = body.sectionsJson;
      }

      if (!pageTitle) {
        return sendError(res, 'Page Title is required', 400);
      }

      const existing: any[] = await prisma.$queryRawUnsafe(
        'SELECT id FROM legal_pages WHERE id = ? LIMIT 1',
        slug
      );

      if (existing && existing.length > 0) {
        await prisma.$executeRawUnsafe(
          `UPDATE legal_pages
           SET pageTitle = ?, lastUpdated = ?, introText = ?, sectionsJson = ?, contentHtml = ?, updatedAt = CURRENT_TIMESTAMP(3)
           WHERE id = ?`,
          pageTitle,
          lastUpdated,
          introText,
          sectionsJson,
          contentHtml,
          slug
        );
      } else {
        await prisma.$executeRawUnsafe(
          `INSERT INTO legal_pages (id, pageTitle, lastUpdated, introText, sectionsJson, contentHtml)
           VALUES (?, ?, ?, ?, ?, ?)`,
          slug,
          pageTitle,
          lastUpdated,
          introText,
          sectionsJson,
          contentHtml
        );
      }

      clearPublicRoutesCache();

      const updatedRows: any[] = await prisma.$queryRawUnsafe(
        'SELECT * FROM legal_pages WHERE id = ? LIMIT 1',
        slug
      );

      const formatted = formatLegalPage(updatedRows[0]);
      return sendSuccess(res, formatted, `${pageTitle} saved successfully.`);
    } catch (error: any) {
      console.error('Error updating legal page:', error);
      return sendError(res, 'Failed to update legal page', 500, error?.message || error);
    }
  }
}

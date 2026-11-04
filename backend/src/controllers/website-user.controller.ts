import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import crypto from 'crypto';

export class WebsiteUserController {
  /**
   * Get all website login users with search, filter, pagination & statistics (Admin)
   */
  static async getWebsiteUsers(req: Request, res: Response) {
    try {
      const { status, search, page = '1', limit = '20', sort = 'lastLoginAt', order = 'DESC' } = req.query as Record<string, string>;

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, Math.min(200, parseInt(limit, 10) || 20));
      const offset = (pageNum - 1) * limitNum;

      // Safe sorting column
      const allowedSortCols: Record<string, string> = {
        lastLoginAt: 'lastLoginAt',
        createdAt: 'createdAt',
        loginCount: 'loginCount',
        email: 'email',
        name: 'name',
      };
      const sortCol = allowedSortCols[sort] || 'lastLoginAt';
      const sortDir = (order && order.toUpperCase() === 'ASC') ? 'ASC' : 'DESC';

      // Build WHERE conditions
      const conditions: string[] = [];
      const params: any[] = [];

      if (status && status !== 'ALL') {
        conditions.push('status = ?');
        params.push(status.toUpperCase());
      }

      if (search && search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        conditions.push('(email LIKE ? OR name LIKE ? OR phone LIKE ? OR lastIp LIKE ?)');
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Query list
      const listSql = `
        SELECT id, email, name, phone, status, isVerified, loginCount, lastLoginAt, lastIp, userAgent, notes, createdAt, updatedAt
        FROM website_users
        ${whereClause}
        ORDER BY ${sortCol} ${sortDir}
        LIMIT ? OFFSET ?
      `;

      const rows: any[] = await prisma.$queryRawUnsafe(listSql, ...params, limitNum, offset);

      // Query total count
      const countSql = `SELECT COUNT(*) as total FROM website_users ${whereClause}`;
      const totalResult: any[] = await prisma.$queryRawUnsafe(countSql, ...params);
      const total = Number(totalResult?.[0]?.total || 0);

      // Query summary statistics
      const statsRows: any[] = await prisma.$queryRawUnsafe(`
        SELECT 
          COUNT(*) as totalUsers,
          SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as activeUsers,
          SUM(CASE WHEN status = 'BLOCKED' THEN 1 ELSE 0 END) as blockedUsers,
          SUM(CASE WHEN DATE(lastLoginAt) = CURDATE() THEN 1 ELSE 0 END) as loginsToday,
          COALESCE(SUM(loginCount), 0) as totalLogins
        FROM website_users
      `);

      const s = statsRows?.[0] || {};
      const stats = {
        totalUsers: Number(s.totalUsers || 0),
        activeUsers: Number(s.activeUsers || 0),
        blockedUsers: Number(s.blockedUsers || 0),
        loginsToday: Number(s.loginsToday || 0),
        totalLogins: Number(s.totalLogins || 0),
      };

      return sendSuccess(res, {
        items: rows || [],
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        stats,
      }, 'Website users retrieved successfully');
    } catch (error: any) {
      console.error('Error fetching website users for admin:', error);
      return sendError(res, 'Failed to fetch website users', 500, error?.message || error);
    }
  }

  /**
   * Create or manually add a website user (Admin)
   */
  static async createWebsiteUser(req: Request, res: Response) {
    try {
      const { email, name, phone, status = 'ACTIVE', notes } = req.body || {};

      if (!email || !email.trim() || !email.includes('@')) {
        return sendError(res, 'A valid email address is required', 400);
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanName = (name || cleanEmail.split('@')[0]).trim();
      const cleanPhone = (phone || '').trim();
      const cleanStatus = (status && status.toUpperCase() === 'BLOCKED') ? 'BLOCKED' : 'ACTIVE';
      const cleanNotes = (notes || '').trim();
      const id = crypto.randomUUID();

      await prisma.$executeRawUnsafe(
        `INSERT INTO website_users (
          id, email, name, phone, status, isVerified, loginCount, lastLoginAt, notes, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, 1, 1, NOW(), ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          name = COALESCE(VALUES(name), name),
          phone = COALESCE(VALUES(phone), phone),
          status = VALUES(status),
          notes = VALUES(notes),
          updatedAt = NOW()`,
        id,
        cleanEmail,
        cleanName,
        cleanPhone || null,
        cleanStatus,
        cleanNotes || null
      );

      return sendSuccess(res, { id, email: cleanEmail }, 'User added successfully');
    } catch (error: any) {
      console.error('Error creating website user:', error);
      return sendError(res, 'Failed to create website user', 500, error?.message || error);
    }
  }

  /**
   * Update status or notes of a website user (Admin)
   */
  static async updateWebsiteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, name, phone, notes } = req.body;

      const updates: string[] = [];
      const params: any[] = [];

      if (status) {
        const validStatuses = ['ACTIVE', 'BLOCKED'];
        if (!validStatuses.includes(status.toUpperCase())) {
          return sendError(res, 'Invalid status. Must be ACTIVE or BLOCKED.', 400);
        }
        updates.push('status = ?');
        params.push(status.toUpperCase());
      }

      if (name !== undefined) {
        updates.push('name = ?');
        params.push(name ? String(name).trim() : null);
      }

      if (phone !== undefined) {
        updates.push('phone = ?');
        params.push(phone ? String(phone).trim() : null);
      }

      if (notes !== undefined) {
        updates.push('notes = ?');
        params.push(notes ? String(notes).trim() : null);
      }

      updates.push('updatedAt = NOW()');

      if (updates.length === 1) {
        return sendError(res, 'No changes provided.', 400);
      }

      params.push(id);

      await prisma.$executeRawUnsafe(
        `UPDATE website_users SET ${updates.join(', ')} WHERE id = ?`,
        ...params
      );

      return sendSuccess(res, { id }, 'Website user updated successfully');
    } catch (error: any) {
      console.error('Error updating website user:', error);
      return sendError(res, 'Failed to update website user', 500, error?.message || error);
    }
  }

  /**
   * Delete a website user (Admin)
   */
  static async deleteWebsiteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.$executeRawUnsafe('DELETE FROM website_users WHERE id = ?', id);
      return sendSuccess(res, { id }, 'Website user removed successfully');
    } catch (error: any) {
      console.error('Error deleting website user:', error);
      return sendError(res, 'Failed to delete website user', 500, error?.message || error);
    }
  }
}


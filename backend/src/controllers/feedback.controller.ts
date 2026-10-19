import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import crypto from 'crypto';

export class FeedbackController {
  /**
   * Submit Feedback or Complaint (Public)
   * Handles both Feedback (પ્રતિસાદ) and Complaint Redressal (ફરિયાદ / તકરાર નિવારણ)
   */
  static async submitFeedback(req: Request, res: Response) {
    try {
      const { type, name, email, phone, category, subject, message, articleUrl } = req.body || {};

      const cleanType = (type && String(type).toUpperCase() === 'COMPLAINT') ? 'COMPLAINT' : 'FEEDBACK';

      if (!name || !name.trim()) {
        return sendError(res, 'કૃપા કરીને તમારું પૂરું નામ લખો. (Full Name is required)', 400);
      }
      if (!email || !email.trim() || !email.includes('@')) {
        return sendError(res, 'કૃપા કરીને માન્ય ઇમેઇલ એડ્રેસ લખો. (Valid Email is required)', 400);
      }
      if (!subject || !subject.trim()) {
        return sendError(res, 'કૃપા કરીને વિષય લખો. (Subject is required)', 400);
      }
      if (!message || !message.trim()) {
        return sendError(res, 'કૃપા કરીને વિગતવાર સંદેશ લખો. (Message is required)', 400);
      }

      const id = crypto.randomUUID();
      const cleanPhone = (phone || '').trim();
      const cleanCategory = (category || (cleanType === 'COMPLAINT' ? 'Content Grievance' : 'General Feedback')).trim();
      const cleanArticleUrl = (articleUrl || '').trim();

      await prisma.$executeRawUnsafe(
        `INSERT INTO feedback_complaints (
          id, type, name, email, phone, category, subject, message, articleUrl, status, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', NOW(), NOW())`,
        id,
        cleanType,
        name.trim(),
        email.trim(),
        cleanPhone || null,
        cleanCategory,
        subject.trim(),
        message.trim(),
        cleanArticleUrl || null
      );

      const successMessage = cleanType === 'COMPLAINT'
        ? 'તમારી ફરિયાદ સફળતાપૂર્વક નોંધાઈ ગઈ છે. સંદર્ભ નંબર: ' + id.slice(0, 8).toUpperCase() + '. અમારા તકરાર નિવારણ અધિકારી (Grievance Officer) નિયમ અનુસાર તપાસ કરીને તમને ઇમેઇલ દ્વારા જાણ કરશે.'
        : 'તમારો મૂલ્યવાન પ્રતિસાદ સફળતાપૂર્વક મળ્યો છે. ગુજરાત પોસ્ટને શ્રેષ્ઠ બનાવવામાં સહયોગ આપવા બદલ આભાર.';

      return sendSuccess(
        res,
        { id, type: cleanType, referenceId: id.slice(0, 8).toUpperCase() },
        successMessage
      );
    } catch (error: any) {
      console.error('Error submitting feedback/complaint:', error);
      return sendError(res, 'સંદેશ મોકલવામાં સમસ્યા આવી. કૃપા કરીને ફરી પ્રયાસ કરો.', 500, error?.message || error);
    }
  }

  /**
   * Get Feedbacks and Complaints with Filtering, Search & Statistics (Admin)
   */
  static async getAdminFeedbacks(req: Request, res: Response) {
    try {
      const { type, status, search, page = '1', limit = '100' } = req.query as Record<string, string>;

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, Math.min(200, parseInt(limit, 10) || 100));
      const offset = (pageNum - 1) * limitNum;

      // Build WHERE conditions
      const conditions: string[] = [];
      const params: any[] = [];

      if (type && type !== 'ALL') {
        conditions.push('type = ?');
        params.push(type.toUpperCase());
      }

      if (status && status !== 'ALL') {
        conditions.push('status = ?');
        params.push(status.toUpperCase());
      }

      if (search && search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        conditions.push('(name LIKE ? OR email LIKE ? OR phone LIKE ? OR subject LIKE ? OR category LIKE ?)');
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Query list
      const listSql = `
        SELECT id, type, name, email, phone, category, subject, message, articleUrl, status, adminNotes, createdAt, updatedAt
        FROM feedback_complaints
        ${whereClause}
        ORDER BY createdAt DESC
        LIMIT ? OFFSET ?
      `;

      const rows: any[] = await prisma.$queryRawUnsafe(listSql, ...params, limitNum, offset);

      // Query total count
      const countSql = `SELECT COUNT(*) as total FROM feedback_complaints ${whereClause}`;
      const totalResult: any[] = await prisma.$queryRawUnsafe(countSql, ...params);
      const total = Number(totalResult?.[0]?.total || 0);

      // Query summary stats for tabs & badges
      const statsRows: any[] = await prisma.$queryRawUnsafe(`
        SELECT 
          COUNT(*) as totalCount,
          SUM(CASE WHEN type = 'FEEDBACK' THEN 1 ELSE 0 END) as feedbackCount,
          SUM(CASE WHEN type = 'COMPLAINT' THEN 1 ELSE 0 END) as complaintCount,
          SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pendingCount,
          SUM(CASE WHEN status = 'IN_REVIEW' THEN 1 ELSE 0 END) as inReviewCount,
          SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END) as resolvedCount
        FROM feedback_complaints
      `);

      const s = statsRows?.[0] || {};
      const stats = {
        all: Number(s.totalCount || 0),
        feedback: Number(s.feedbackCount || 0),
        complaint: Number(s.complaintCount || 0),
        pending: Number(s.pendingCount || 0),
        inReview: Number(s.inReviewCount || 0),
        resolved: Number(s.resolvedCount || 0),
      };

      return sendSuccess(res, {
        items: rows || [],
        total,
        page: pageNum,
        limit: limitNum,
        stats,
      }, 'Data fetched successfully');
    } catch (error: any) {
      console.error('Error fetching feedbacks/complaints for admin:', error);
      return sendError(res, 'Failed to fetch feedback and complaints', 500, error?.message || error);
    }
  }

  /**
   * Update Status and Admin Notes (Admin)
   */
  static async updateFeedbackStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      const validStatuses = ['PENDING', 'IN_REVIEW', 'RESOLVED'];
      const newStatus = status && validStatuses.includes(status.toUpperCase()) ? status.toUpperCase() : undefined;

      const updates: string[] = [];
      const params: any[] = [];

      if (newStatus) {
        updates.push('status = ?');
        params.push(newStatus);
      }

      if (adminNotes !== undefined) {
        updates.push('adminNotes = ?');
        params.push(adminNotes ? String(adminNotes).trim() : null);
      }

      updates.push('updatedAt = NOW()');

      if (updates.length === 1) {
        return sendError(res, 'No changes provided.', 400);
      }

      params.push(id);

      await prisma.$executeRawUnsafe(
        `UPDATE feedback_complaints SET ${updates.join(', ')} WHERE id = ?`,
        ...params
      );

      return sendSuccess(res, { id, status: newStatus }, 'સ્ટેટસ સફળતાપૂર્વક અપડેટ થયું. (Status updated successfully)');
    } catch (error: any) {
      console.error('Error updating feedback status:', error);
      return sendError(res, 'Failed to update feedback status', 500, error?.message || error);
    }
  }

  /**
   * Delete Feedback or Complaint (Admin)
   */
  static async deleteFeedback(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.$executeRawUnsafe('DELETE FROM feedback_complaints WHERE id = ?', id);
      return sendSuccess(res, { id }, 'રેકોર્ડ સફળતાપૂર્વક ડિલીટ થયો. (Record deleted successfully)');
    } catch (error: any) {
      console.error('Error deleting feedback:', error);
      return sendError(res, 'Failed to delete record', 500, error?.message || error);
    }
  }
}

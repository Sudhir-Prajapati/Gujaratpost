import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { clearPublicRoutesCache } from '../utils/publicCache.js';
import crypto from 'crypto';

let cachedContactSetting: any = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 30 * 1000; // 30s cache

const DEFAULT_BUREAUS: any[] = [];

const DEFAULT_SOCIALS = {
  whatsapp: 'https://api.whatsapp.com/send/?phone=919909907237&text&type=phone_number&app_absent=0',
  facebook: 'https://www.facebook.com/gujpost.in',
  twitter: 'https://x.com/maheshrpat59606',
  instagram: 'https://instagram.com/gujaratpost',
  youtube: 'https://youtube.com/@gujaratpost'
};

const DEFAULT_CONTACT_SETTING = {
  id: 'default',
  pageTitle: 'સંપર્ક કરો (Contact Us)',
  pageSubtitle: 'કોઈપણ સમાચાર, પ્રેસ નોટ, જાહેરાત કે માહિતી માટે અમારા પત્રકાર મિત્રો અને સંપાદકીય ટીમનો સંપર્ક સાધો.',
  headOfficeAddress: 'ગુજરાત પોસ્ટ ભવન, એસ.જી. હાઈવે, પ્રહલાદ નગર, અમદાવાદ - 380015, ગુજરાત.',
  primaryPhone: '+91 99099 07237',
  whatsappNumber: '+91 99099 07237',
  primaryEmail: 'contact@gujaratpost.in',
  workingHours: 'સોમવાર - શનિવાર: સવારે 9:00 થી રાત્રે 9:00 | 24x7 ન્યૂઝ ડેસ્ક',
  mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d117506.44754760882!2d72.43965561026046!3d23.02015809244018!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e848aba5bd449%3A0x4fcedd11614f6516!2sAhmedabad%2C%20Gujarat!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin',
  editorialEmail: 'editorial@gujaratpost.in',
  editorialPhone: '+91 99099 07237',
  adsEmail: 'ads@gujaratpost.in',
  adsPhone: '+91 99099 07237',
  grievanceName: 'મહેશ પટેલ (Mahesh Patel)',
  grievanceDesignation: 'તકરાર નિવારણ અધિકારી (Grievance Redressal Officer)',
  grievanceEmail: 'grievance@gujaratpost.in',
  grievanceAddress: 'ગુજરાત પોસ્ટ મુખ્ય કાર્યાલય, અમદાવાદ, ગુજરાત - 380015',
  bureauOfficesJson: DEFAULT_BUREAUS,
  socialLinksJson: DEFAULT_SOCIALS
};

function parseJsonField(val: any, fallback: any) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function sanitizeMapEmbedUrl(val: any): string {
  if (!val || typeof val !== 'string') return '';
  const trimmed = val.trim();
  const match = trimmed.match(/src=["'](https?:\/\/[^"']+)["']/i);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

function formatContactSetting(row: any) {
  if (!row) return DEFAULT_CONTACT_SETTING;
  return {
    id: row.id || 'default',
    pageTitle: row.pageTitle || DEFAULT_CONTACT_SETTING.pageTitle,
    pageSubtitle: row.pageSubtitle || DEFAULT_CONTACT_SETTING.pageSubtitle,
    headOfficeAddress: row.headOfficeAddress || DEFAULT_CONTACT_SETTING.headOfficeAddress,
    primaryPhone: row.primaryPhone || DEFAULT_CONTACT_SETTING.primaryPhone,
    whatsappNumber: row.whatsappNumber || DEFAULT_CONTACT_SETTING.whatsappNumber,
    primaryEmail: row.primaryEmail || DEFAULT_CONTACT_SETTING.primaryEmail,
    workingHours: row.workingHours || DEFAULT_CONTACT_SETTING.workingHours,
    mapEmbedUrl: sanitizeMapEmbedUrl(row.mapEmbedUrl || DEFAULT_CONTACT_SETTING.mapEmbedUrl),
    editorialEmail: row.editorialEmail || DEFAULT_CONTACT_SETTING.editorialEmail,
    editorialPhone: row.editorialPhone || DEFAULT_CONTACT_SETTING.editorialPhone,
    adsEmail: row.adsEmail || DEFAULT_CONTACT_SETTING.adsEmail,
    adsPhone: row.adsPhone || DEFAULT_CONTACT_SETTING.adsPhone,
    grievanceName: row.grievanceName || DEFAULT_CONTACT_SETTING.grievanceName,
    grievanceDesignation: row.grievanceDesignation || DEFAULT_CONTACT_SETTING.grievanceDesignation,
    grievanceEmail: row.grievanceEmail || DEFAULT_CONTACT_SETTING.grievanceEmail,
    grievanceAddress: row.grievanceAddress || DEFAULT_CONTACT_SETTING.grievanceAddress,
    bureauOfficesJson: parseJsonField(row.bureauOfficesJson, DEFAULT_BUREAUS),
    socialLinksJson: parseJsonField(row.socialLinksJson, DEFAULT_SOCIALS),
    updatedAt: row.updatedAt || new Date()
  };
}

export class ContactController {
  /**
   * Get Contact page settings (Public & Admin)
   */
  static async getContactSettings(req: Request, res: Response) {
    if (cachedContactSetting && Date.now() - lastCacheTime < CACHE_TTL_MS) {
      return sendSuccess(res, cachedContactSetting, 'Contact settings retrieved successfully.');
    }

    try {
      const rows: any[] = await prisma.$queryRawUnsafe(
        'SELECT * FROM contact_settings WHERE id = "default" LIMIT 1'
      );
      if (rows && rows.length > 0) {
        cachedContactSetting = formatContactSetting(rows[0]);
        lastCacheTime = Date.now();
        return sendSuccess(res, cachedContactSetting, 'Contact settings retrieved successfully.');
      }

      cachedContactSetting = DEFAULT_CONTACT_SETTING;
      lastCacheTime = Date.now();
      return sendSuccess(res, cachedContactSetting, 'Contact settings retrieved (defaults).');
    } catch (error: any) {
      console.error('Error fetching contact settings:', error);
      if (cachedContactSetting) {
        return sendSuccess(res, cachedContactSetting, 'Contact settings retrieved (cached).');
      }
      return sendSuccess(res, DEFAULT_CONTACT_SETTING, 'Contact settings fallback.');
    }
  }

  /**
   * Update Contact page settings (SUPER_ADMIN & EDITOR)
   */
  static async updateContactSettings(req: Request, res: Response) {
    try {
      const b = req.body || {};

      const pageTitle = b.pageTitle ?? DEFAULT_CONTACT_SETTING.pageTitle;
      const pageSubtitle = b.pageSubtitle ?? DEFAULT_CONTACT_SETTING.pageSubtitle;
      const headOfficeAddress = b.headOfficeAddress ?? DEFAULT_CONTACT_SETTING.headOfficeAddress;
      const primaryPhone = b.primaryPhone ?? DEFAULT_CONTACT_SETTING.primaryPhone;
      const whatsappNumber = b.whatsappNumber ?? DEFAULT_CONTACT_SETTING.whatsappNumber;
      const primaryEmail = b.primaryEmail ?? DEFAULT_CONTACT_SETTING.primaryEmail;
      const workingHours = b.workingHours ?? DEFAULT_CONTACT_SETTING.workingHours;
      const mapEmbedUrl = sanitizeMapEmbedUrl(b.mapEmbedUrl ?? DEFAULT_CONTACT_SETTING.mapEmbedUrl);
      const editorialEmail = b.editorialEmail ?? DEFAULT_CONTACT_SETTING.editorialEmail;
      const editorialPhone = b.editorialPhone ?? DEFAULT_CONTACT_SETTING.editorialPhone;
      const adsEmail = b.adsEmail ?? DEFAULT_CONTACT_SETTING.adsEmail;
      const adsPhone = b.adsPhone ?? DEFAULT_CONTACT_SETTING.adsPhone;
      const grievanceName = b.grievanceName ?? DEFAULT_CONTACT_SETTING.grievanceName;
      const grievanceDesignation = b.grievanceDesignation ?? DEFAULT_CONTACT_SETTING.grievanceDesignation;
      const grievanceEmail = b.grievanceEmail ?? DEFAULT_CONTACT_SETTING.grievanceEmail;
      const grievanceAddress = b.grievanceAddress ?? DEFAULT_CONTACT_SETTING.grievanceAddress;

      const bureauOfficesJson = typeof b.bureauOfficesJson === 'string'
        ? b.bureauOfficesJson
        : JSON.stringify(b.bureauOfficesJson ?? DEFAULT_BUREAUS);

      const socialLinksJson = typeof b.socialLinksJson === 'string'
        ? b.socialLinksJson
        : JSON.stringify(b.socialLinksJson ?? DEFAULT_SOCIALS);

      const existing: any[] = await prisma.$queryRawUnsafe(
        'SELECT id FROM contact_settings WHERE id = "default" LIMIT 1'
      );

      if (existing && existing.length > 0) {
        await prisma.$executeRawUnsafe(
          `UPDATE contact_settings SET
            pageTitle = ?,
            pageSubtitle = ?,
            headOfficeAddress = ?,
            primaryPhone = ?,
            whatsappNumber = ?,
            primaryEmail = ?,
            workingHours = ?,
            mapEmbedUrl = ?,
            editorialEmail = ?,
            editorialPhone = ?,
            adsEmail = ?,
            adsPhone = ?,
            grievanceName = ?,
            grievanceDesignation = ?,
            grievanceEmail = ?,
            grievanceAddress = ?,
            bureauOfficesJson = ?,
            socialLinksJson = ?,
            updatedAt = NOW()
          WHERE id = "default"`,
          pageTitle,
          pageSubtitle,
          headOfficeAddress,
          primaryPhone,
          whatsappNumber,
          primaryEmail,
          workingHours,
          mapEmbedUrl,
          editorialEmail,
          editorialPhone,
          adsEmail,
          adsPhone,
          grievanceName,
          grievanceDesignation,
          grievanceEmail,
          grievanceAddress,
          bureauOfficesJson,
          socialLinksJson
        );
      } else {
        await prisma.$executeRawUnsafe(
          `INSERT INTO contact_settings (
            id, pageTitle, pageSubtitle, headOfficeAddress, primaryPhone,
            whatsappNumber, primaryEmail, workingHours, mapEmbedUrl,
            editorialEmail, editorialPhone, adsEmail, adsPhone,
            grievanceName, grievanceDesignation, grievanceEmail, grievanceAddress,
            bureauOfficesJson, socialLinksJson, updatedAt
          ) VALUES (
            "default", ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, NOW()
          )`,
          pageTitle,
          pageSubtitle,
          headOfficeAddress,
          primaryPhone,
          whatsappNumber,
          primaryEmail,
          workingHours,
          mapEmbedUrl,
          editorialEmail,
          editorialPhone,
          adsEmail,
          adsPhone,
          grievanceName,
          grievanceDesignation,
          grievanceEmail,
          grievanceAddress,
          bureauOfficesJson,
          socialLinksJson
        );
      }

      cachedContactSetting = null;
      lastCacheTime = 0;
      clearPublicRoutesCache();

      // Fetch fresh updated row
      const updatedRows: any[] = await prisma.$queryRawUnsafe(
        'SELECT * FROM contact_settings WHERE id = "default" LIMIT 1'
      );
      const formatted = formatContactSetting(updatedRows?.[0]);
      cachedContactSetting = formatted;
      lastCacheTime = Date.now();

      return sendSuccess(res, formatted, 'Contact settings updated successfully.');
    } catch (error: any) {
      console.error('Error updating contact settings:', error);
      return sendError(res, 'Failed to update contact settings', 500, error?.message || error);
    }
  }

  /**
   * Submit Contact Form Message (Public)
   */
  static async submitContactMessage(req: Request, res: Response) {
    try {
      const { name, email, phone, department, subject, message } = req.body || {};

      if (!name || !name.trim()) {
        return sendError(res, 'Full Name is required.', 400);
      }
      if (!email || !email.trim() || !email.includes('@')) {
        return sendError(res, 'Please provide a valid email address.', 400);
      }
      if (!subject || !subject.trim()) {
        return sendError(res, 'Subject is required.', 400);
      }
      if (!message || !message.trim()) {
        return sendError(res, 'Message is required.', 400);
      }

      const id = crypto.randomUUID();
      const cleanDept = (department || 'General').trim();
      const cleanPhone = (phone || '').trim();

      await prisma.$executeRawUnsafe(
        `INSERT INTO contact_messages (
          id, name, email, phone, department, subject, message, isRead, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, FALSE, NOW())`,
        id,
        name.trim(),
        email.trim(),
        cleanPhone,
        cleanDept,
        subject.trim(),
        message.trim()
      );

      return sendSuccess(
        res,
        { id },
        'તમારો સંદેશ સફળતાપૂર્વક મોકલવામાં આવ્યો છે. અમારી ટીમ ટૂંક સમયમાં તમારો સંપર્ક કરશે. (Message sent successfully)'
      );
    } catch (error: any) {
      console.error('Error submitting contact message:', error);
      return sendError(res, 'સંદેશ મોકલવામાં સમસ્યા આવી. કૃપા કરીને થોડીવાર પછી પ્રયાસ કરો.', 500, error?.message || error);
    }
  }

  /**
   * Get Contact Messages / Inquiries (Admin)
   */
  static async getContactMessages(req: Request, res: Response) {
    try {
      const rows: any[] = await prisma.$queryRawUnsafe(
        'SELECT * FROM contact_messages ORDER BY createdAt DESC LIMIT 200'
      );
      return sendSuccess(res, rows || [], 'Messages retrieved successfully.');
    } catch (error: any) {
      console.error('Error fetching contact messages:', error);
      return sendError(res, 'Failed to fetch contact messages', 500, error?.message || error);
    }
  }

  /**
   * Mark Message Read / Unread (Admin)
   */
  static async toggleMessageRead(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { isRead } = req.body;

      await prisma.$executeRawUnsafe(
        'UPDATE contact_messages SET isRead = ? WHERE id = ?',
        isRead ? 1 : 0,
        id
      );

      return sendSuccess(res, { id, isRead }, 'Message status updated.');
    } catch (error: any) {
      console.error('Error toggling message read status:', error);
      return sendError(res, 'Failed to update message status', 500, error?.message || error);
    }
  }

  /**
   * Mark All Messages As Read (Admin)
   */
  static async markAllMessagesRead(req: Request, res: Response) {
    try {
      await prisma.$executeRawUnsafe('UPDATE contact_messages SET isRead = 1 WHERE isRead = 0');
      return sendSuccess(res, null, 'બધા સંદેશાઓ વંચાઈ ગયા તરીકે માર્ક કરવામાં આવ્યા છે.');
    } catch (error: any) {
      console.error('Error marking all messages as read:', error);
      return sendError(res, 'Failed to mark messages as read', 500, error?.message || error);
    }
  }

  /**
   * Delete Contact Message (Admin)
   */
  static async deleteContactMessage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.$executeRawUnsafe('DELETE FROM contact_messages WHERE id = ?', id);
      return sendSuccess(res, { id }, 'Message deleted successfully.');
    } catch (error: any) {
      console.error('Error deleting contact message:', error);
      return sendError(res, 'Failed to delete message', 500, error?.message || error);
    }
  }
}

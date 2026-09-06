import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';

const DEFAULT_SUPPORT_SETTING = {
  id: 'default',
  qrCodeImage: '',
  upiId: 'gujaratpost@upi',
  accountName: 'Gujarat Post Media Pvt Ltd',
  accountNumber: '9924038640',
  ifscCode: 'HDFC0001234',
  bankName: 'BOB Bank',
  branchName: 'Main Branch, SG Highway, Ahmedabad',
  noteGu: 'GPay, PhonePe, Paytm અથવા કોઈપણ UPI એપ વડે સ્કેન કરી સપોર્ટ આપી શકો છો.',
  noteEn: 'Scan the QR Code via GPay, PhonePe, Paytm or any UPI app to support.',
  noteHi: 'GPay, PhonePe, Paytm या किसी भी UPI ऐप से स्कैन करके सपोर्ट कर सकते हैं।',
};

export class SupportController {
  /**
   * Get Support details (Public & Admin)
   */
  static async getSupportSettings(req: Request, res: Response) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    try {
      let setting = await (prisma as any).supportSetting.findUnique({
        where: { id: 'default' },
      });

      if (!setting) {
        setting = await (prisma as any).supportSetting.create({
          data: DEFAULT_SUPPORT_SETTING,
        });
      }

      return sendSuccess(res, setting, 'Support settings retrieved successfully.');
    } catch (error: any) {
      console.error('Error fetching support settings:', error);
      // Return default configuration gracefully
      return sendSuccess(res, DEFAULT_SUPPORT_SETTING, 'Support settings fallback.');
    }
  }

  /**
   * Update Support details (SUPER_ADMIN only)
   */
  static async updateSupportSettings(req: Request, res: Response) {
    try {
      const {
        qrCodeImage,
        upiId,
        accountName,
        accountNumber,
        ifscCode,
        bankName,
        branchName,
        noteGu,
        noteEn,
        noteHi,
      } = req.body;

      const updated = await (prisma as any).supportSetting.upsert({
        where: { id: 'default' },
        update: {
          qrCodeImage: qrCodeImage ?? '',
          upiId: upiId ?? '',
          accountName: accountName ?? '',
          accountNumber: accountNumber ?? '',
          ifscCode: ifscCode ?? '',
          bankName: bankName ?? '',
          branchName: branchName ?? '',
          noteGu: noteGu ?? '',
          noteEn: noteEn ?? '',
          noteHi: noteHi ?? '',
        },
        create: {
          id: 'default',
          qrCodeImage: qrCodeImage ?? '',
          upiId: upiId ?? 'gujaratpost@upi',
          accountName: accountName ?? 'Gujarat Post Media Pvt Ltd',
          accountNumber: accountNumber ?? '',
          ifscCode: ifscCode ?? '',
          bankName: bankName ?? '',
          branchName: branchName ?? '',
          noteGu: noteGu ?? '',
          noteEn: noteEn ?? '',
          noteHi: noteHi ?? '',
        },
      });

      return sendSuccess(res, updated, 'Support settings updated successfully.');
    } catch (error: any) {
      console.error('Error updating support settings:', error);
      return sendError(res, 'Failed to update support settings', 500, error?.message || error);
    }
  }
}

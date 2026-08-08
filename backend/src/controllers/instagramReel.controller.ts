import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { sendSuccess } from '../utils/response.js';

export class InstagramReelController {
  // Get all reels (for admin or public)
  static async getAllReels(req: Request, res: Response, next: NextFunction) {
    try {
      const { isActive } = req.query;
      
      const whereClause: any = {};
      if (isActive !== undefined) {
        whereClause.isActive = isActive === 'true';
      }

      const reels = await prisma.reel.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return sendSuccess(res, { reels }, 'Reels retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  // Create a new reel
  static async createReel(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, heading, headingGu, headingHi, videoUrl, instaUrl, isActive } = req.body;

      const newReel = await prisma.reel.create({
        data: {
          type: type || 'INSTAGRAM',
          heading,
          headingGu,
          headingHi,
          videoUrl,
          instaUrl,
          isActive: isActive !== undefined ? isActive : true,
        },
      });

      return sendSuccess(res, { reel: newReel }, 'Reel created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  // Update a reel
  static async updateReel(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { type, heading, headingGu, headingHi, videoUrl, instaUrl, isActive } = req.body;

      const updatedReel = await prisma.reel.update({
        where: { id },
        data: {
          type,
          heading,
          headingGu,
          headingHi,
          videoUrl,
          instaUrl,
          isActive,
        },
      });

      return sendSuccess(res, { reel: updatedReel }, 'Reel updated successfully');
    } catch (error) {
      next(error);
    }
  }

  // Delete a reel
  static async deleteReel(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await prisma.reel.delete({
        where: { id },
      });

      return sendSuccess(res, null, 'Reel deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

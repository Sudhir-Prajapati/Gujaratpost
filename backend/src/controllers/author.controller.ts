import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { sendSuccess } from '../utils/response.js';

export class AuthorController {
  /**
   * Fetch all author profiles.
   */
  static async getAllAuthors(req: Request, res: Response, next: NextFunction) {
    try {
      const authors = await prisma.author.findMany({
        orderBy: {
          name: 'asc',
        },
      });
      return sendSuccess(res, authors, 'Authors list retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create or find an author by name.
   */
  static async createAuthor(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, nameGu, nameHi, designation, image } = req.body;
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ success: false, error: 'Author name is required.' });
      }
      const trimmedName = name.trim();

      const existing = await prisma.author.findFirst({
        where: {
          OR: [
            { name: trimmedName },
            { nameGu: trimmedName },
            { nameHi: trimmedName },
          ],
        },
      });

      if (existing) {
        return sendSuccess(res, existing, 'Author already exists.');
      }

      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const safeSlug = (trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'reporter');
      const shadowUser = await prisma.user.create({
        data: {
          email: `${safeSlug}-${randomSuffix}@gujaratpost.in`,
          passwordHash: 'CUSTOM_AUTHOR_NO_LOGIN',
          role: 'REPORTER',
          status: 'ACTIVE',
        },
      });

      const author = await prisma.author.create({
        data: {
          userId: shadowUser.id,
          name: trimmedName,
          nameGu: nameGu || trimmedName,
          nameHi: nameHi || trimmedName,
          image: image || '/assets/demo/1.jpg',
          designation: designation || 'Reporter',
          designationGu: designation || 'રિપોર્ટર',
          designationHi: designation || 'रिपोर्टर',
          bio: `Reporter at Gujarat Post`,
          bioGu: `ગુજરાત પોસ્ટ રિપોર્ટર`,
          bioHi: `गुजरात पोस्ट रिपोर्टर`,
        },
      });

      return sendSuccess(res, author, 'Author profile created successfully.');
    } catch (error) {
      next(error);
    }
  }
}

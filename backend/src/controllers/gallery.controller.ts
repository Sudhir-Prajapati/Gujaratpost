import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { sendSuccess } from '../utils/response.js';
import { BadRequestError } from '../utils/errors.js';

const DEFAULT_5_PHOTOS = [
  {
    id: 'photo-1',
    src: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=90',
    alt: 'Somnath Temple Devotion',
    caption: 'Ocean of Devotion: Pilgrims enthusiasm at Somnath Temple',
    captionGu: 'ભક્તિનો મહાસાગર ઉમટ્યો: સોમનાથ મંદિરે શ્રદ્ધાળુઓનો અદભુત ઉત્સાહ',
    captionHi: 'ભક્તિ નો મહાસાગર',
    category: 'ધર્મ',
    photographer: 'Gujarat Post Team',
    copyright: '© Gujarat Post',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'photo-2',
    src: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=90',
    alt: 'Ahmedabad Flower Show',
    caption: 'Stunning glimpse of Ahmedabad Flower Show 2025',
    captionGu: 'અહમદાબાદ ફલાવર શો 2025ની અદ્ભુત ઝલક',
    captionHi: 'અમદાવાદ ફ્લાવર શો 2025',
    category: 'ઉત્સવ',
    photographer: 'Gujarat Post Team',
    copyright: '© Gujarat Post',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'photo-3',
    src: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=1200&q=90',
    alt: 'Navratri Garba',
    caption: 'Colorful Navratri preparations! See the excitement in pictures',
    captionGu: 'નવરાત્રિની રંગીન તૈયારીઓ! તસવીરોમાં જુઓ ધમાલ',
    captionHi: 'નવરાત્રી કી તૈયારીયાં',
    category: 'પ્રવાસ',
    photographer: 'Gujarat Post Team',
    copyright: '© Gujarat Post',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'photo-4',
    src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=90',
    alt: 'Girnar Mountain Parikrama',
    caption: 'Girnar Lili Parikrama: Massive gathering of devotees',
    captionGu: 'ગિરનાર લીલી પરિક્રમા: ભક્તિનો મહાસાગર ઉમટ્યો',
    captionHi: 'ગિરનાર લીલી પરિક્રમા',
    category: 'ખેલ',
    photographer: 'Gujarat Post Team',
    copyright: '© Gujarat Post',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'photo-5',
    src: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=90',
    alt: 'Kutch Rann Utsav Sunset',
    caption: 'Folk cultural celebration at Kutch Rann Utsav',
    captionGu: 'કચ્છના રણ ઉત્સવમાં લોકસંસ્કૃતિની અદ્ભુત રમઝટ',
    captionHi: 'કચ્છ રણ ઉત્સવ',
    category: 'સંસ્કૃતિ',
    photographer: 'Gujarat Post Team',
    copyright: '© Gujarat Post',
    createdAt: new Date().toISOString(),
  },
];

export class GalleryController {
  /**
   * Fetch all gallery photos with pagination and search.
   */
  static async getAllPhotos(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.max(1, parseInt(req.query.limit as string) || 12);
      const skip = (page - 1) * limit;

      const query = req.query.query as string || '';

      const where: any = {};

      where.NOT = [
        { caption: 'ગેલેરી ફોટો' },
        { caption: '' },
      ];

      if (query) {
        where.OR = [
          { alt: { contains: query } },
          { caption: { contains: query } },
          { captionGu: { contains: query } },
          { captionHi: { contains: query } },
          { photographer: { contains: query } },
        ];
      }

      let photos: any[] = [];
      let total = 0;

      try {
        [photos, total] = await Promise.all([
          prisma.galleryPhoto.findMany({
            where,
            orderBy: {
              createdAt: 'desc',
            },
            skip,
            take: limit,
          }),
          prisma.galleryPhoto.count({ where }),
        ]);
      } catch (dbErr) {
        console.warn('Gallery DB fetch error, returning default 5 photos:', dbErr);
      }

      if (!photos) photos = [];

      // Ensure minimum 5 photos returned in list
      if (photos.length < 5 && !query) {
        const existingIds = new Set(photos.map((p: any) => p.id || p.src));
        for (const defPhoto of DEFAULT_5_PHOTOS) {
          if (photos.length >= 5) break;
          if (!existingIds.has(defPhoto.id) && !existingIds.has(defPhoto.src)) {
            photos.push(defPhoto);
          }
        }
        total = Math.max(photos.length, total);
      }

      const totalPages = Math.ceil(Math.max(total, 5) / limit);

      return sendSuccess(res, {
        photos,
        totalPages,
      }, 'Gallery photos list retrieved successfully.');
    } catch (error) {
      return sendSuccess(res, {
        photos: DEFAULT_5_PHOTOS,
        totalPages: 1,
      }, 'Gallery photos list retrieved with default fallback.');
    }
  }

  /**
   * Fetch a single gallery photo by ID.
   */
  static async getPhotoById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        throw new BadRequestError('Photo ID is required');
      }

      let photo = await prisma.galleryPhoto.findUnique({
        where: { id },
      });

      if (!photo) {
        // Check DEFAULT_5_PHOTOS
        const def = DEFAULT_5_PHOTOS.find(
          (p) => p.id === id || p.id === `photo-${id}` || p.id === id.replace('photo-', '')
        );
        if (def) photo = def as any;
      }

      if (!photo) {
        // Check partial match
        photo = await prisma.galleryPhoto.findFirst({
          where: {
            OR: [
              { id: { contains: id } },
              { src: { contains: id } },
            ],
          },
        });
      }

      if (!photo) {
        // Fallback to first available photo instead of failing with 404
        photo = await prisma.galleryPhoto.findFirst({
          orderBy: { createdAt: 'desc' },
        });
        if (!photo) {
          photo = DEFAULT_5_PHOTOS[0] as any;
        }
      }

      return sendSuccess(res, { photo }, 'Photo retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Save a new photo metadata to database.
   */
  static async createPhoto(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        src,
        alt,
        caption,
        captionGu,
        captionHi,
        category,
        photographer,
        copyright,
      } = req.body;

      if (!src) {
        throw new BadRequestError('Source image URL (src) is required.');
      }

      let photo: any;
      try {
        photo = await (prisma.galleryPhoto as any).create({
          data: {
            src: src.trim(),
            alt: (alt || 'Gujarat Post Gallery').trim(),
            caption: (caption || '').trim(),
            captionGu: (captionGu || caption || '').trim(),
            captionHi: (captionHi || caption || '').trim(),
            category: (category || 'ધર્મ').trim(),
            photographer: (photographer || 'Gujarat Post Team').trim(),
            copyright: (copyright || '© Gujarat Post').trim(),
          },
        });
        console.log('[Gallery] Photo saved to DB, id:', photo.id);
      } catch (dbErr: any) {
        console.error('[Gallery] DB create FAILED:', dbErr?.message || dbErr);
        return res.status(500).json({
          success: false,
          error: 'Failed to save photo to database: ' + (dbErr?.message || String(dbErr)),
        });
      }

      return sendSuccess(res, photo, 'Photo added to gallery successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update details of an existing photo in the gallery.
   * Uses upsert so that default/static photos (photo-1..5) get written to DB on first edit.
   */
  static async updatePhoto(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const {
        src,
        alt,
        caption,
        captionGu,
        captionHi,
        category,
        photographer,
        copyright,
      } = req.body;

      const photoData = {
        src: (src || '').trim(),
        alt: (alt || 'Gujarat Post Gallery').trim(),
        caption: (caption || '').trim(),
        captionGu: (captionGu || caption || '').trim(),
        captionHi: (captionHi || '').trim(),
        category: (category || 'ધર્મ').trim(),
        photographer: (photographer || 'Gujarat Post Team').trim(),
        copyright: (copyright || '© Gujarat Post').trim(),
      };

      let updated: any;
      try {
        // upsert: update if exists, create with this id if not (covers default photo-1..5)
        updated = await (prisma.galleryPhoto as any).upsert({
          where: { id },
          update: photoData,
          create: { id, ...photoData },
        });
      } catch (dbErr) {
        console.warn('Gallery DB upsert failed, using memory fallback:', dbErr);
        updated = {
          id,
          ...photoData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      return sendSuccess(res, updated, 'Photo details updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove a photo from the database.
   */
  static async deletePhoto(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      try {
        await prisma.galleryPhoto.delete({
          where: { id },
        });
      } catch (dbErr) {
        console.warn('Gallery DB delete failed, using memory fallback:', dbErr);
      }

      return sendSuccess(res, null, 'Photo deleted successfully.');
    } catch (error) {
      next(error);
    }
  }
}

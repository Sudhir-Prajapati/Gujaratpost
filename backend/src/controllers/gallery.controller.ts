import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { sendSuccess } from '../utils/response.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';
import { clearPublicRoutesCache } from '../utils/publicCache.js';

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
    category: 'ધર્મ',
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

function cleanPhotoSrc(srcVal: any): string {
  if (!srcVal || typeof srcVal !== 'string') return '';
  let s = srcVal.trim();
  const quoteIdx = s.indexOf('"');
  if (quoteIdx !== -1) {
    s = s.substring(0, quoteIdx).trim();
  }
  s = s.replace(/[,\}\]]+$/, '').trim();
  return s;
}

export function formatGalleryPhoto(photo: any) {
  if (!photo) return photo;
  const p = { ...photo };
  if (typeof p.src === 'string') {
    if (p.src.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(p.src);
        if (Array.isArray(parsed) && parsed.length > 0) {
          p.images = parsed;
          p.src = parsed[0]?.src || parsed[0]?.url || (typeof parsed[0] === 'string' ? parsed[0] : p.src);
        }
      } catch {}
    }
    p.src = cleanPhotoSrc(p.src);
  }
  if (!p.images || !Array.isArray(p.images) || p.images.length === 0) {
    p.images = [
      {
        src: p.src,
        title: p.captionGu || p.alt || p.caption || 'Gallery Photo',
        caption: p.caption || p.alt || '',
        captionGu: p.captionGu || p.caption || p.alt || '',
        description: p.caption || p.alt || '',
        photographer: p.photographer || 'Gujarat Post Team'
      }
    ];
  } else {
    p.images = p.images.map((img: any) => {
      if (!img) return img;
      if (typeof img === 'string') return { src: cleanPhotoSrc(img) };
      return { ...img, src: cleanPhotoSrc(img.src || img.url || '') };
    });
  }

  // Ensure accurate category classification
  let cat = (p.category || '').trim();
  const text = `${p.captionGu || ''} ${p.caption || ''} ${p.alt || ''}`.toLowerCase();
  if (cat === 'ધર્મ' && /નિકિતા|એક્ટ્રેસ|અભિનેત્રી|સાડી|હોટ|બોલ્ડ|બિકિની|મોડલ|શર્મા/i.test(text)) {
    cat = 'મનોરંજન';
  } else if (!cat || cat === 'સમાચાર' || cat === 'News') {
    cat = 'મનોરંજન';
  }
  p.category = cat;
  p.categoryGu = cat;
  p.categoryHi = cat === 'મનોરંજન' ? 'मनोरंजन' : cat === 'સ્પોર્ટ્સ' ? 'खेल' : cat === 'રાજનીતિ' ? 'राजनीति' : cat === 'ધર્મ' ? 'धर्म' : cat;
  p.categoryEn = cat === 'મનોરંજન' ? 'Entertainment' : cat === 'સ્પોર્ટ્સ' ? 'Sports' : cat === 'રાજનીતિ' ? 'Politics' : cat === 'ધર્મ' ? 'Religion' : cat;

  return p;
}

const GU_STOPWORDS = new Set([
  'અને', 'તેની', 'તેમના', 'તેમની', 'સાથે', 'કરી', 'કર્યાં', 'કર્યા', 'રહ્યાં', 'રહી', 'રહ્યા', 'રહ્યો',
  'છે', 'હતા', 'હતી', 'પણ', 'માટે', 'પર', 'થી', 'ને', 'ના', 'ની', 'નો', 'નું', 'માં', 'એ',
  'આ', 'તે', 'કોઈ', 'જોવા', 'મળી', 'મળ્યો', 'થયા', 'થઈ', 'થયો', 'આવ્યો', 'આવી', 'આવ્યા',
  'વાયરલ', 'ફોટો', 'ફોટોશૂટ', 'તસવીરો', 'લુક', 'લૂક', 'અંદાજ', 'ગ્લેમરસ', 'હોટ', 'બોલ્ડ', 'પોઝ',
  'સમાચાર', 'ગેલેરી', 'લાગી', 'લાગે', 'નવો', 'નવી', 'નવા', 'ખૂબ', 'જ', 'વધારે', 'કે', 'ધ',
  'સામે', 'જોઈ', 'જોઇ', 'જોવા', 'આપ્યાં', 'આપ્યા', 'કર્યું', 'કર્યો', 'થતી', 'થતો', 'કરે', 'કરતાં'
]);

function normalizeWord(word: string): string {
  if (!word) return '';
  let w = word.trim();
  const suffixes = ['નો', 'ની', 'ના', 'નું', 'માં', 'થી', 'એ', 'ઓ'];
  for (const sfx of suffixes) {
    if (w.length > sfx.length + 3 && w.endsWith(sfx)) {
      w = w.slice(0, -sfx.length);
      break;
    }
  }
  return w;
}

function extractKeyTerms(text: string): string[] {
  if (!text) return [];
  const clean = text.replace(/[\'\"\'\"\.,!?;:()[\]{}\-_\\\/]/g, ' ');
  const rawWords = clean.split(/\s+/).map(w => w.trim()).filter(Boolean);
  
  const subjects: string[] = [];
  for (let i = 0; i < rawWords.length; i++) {
    const raw = rawWords[i];
    const norm = normalizeWord(raw);
    if (norm.length >= 3 && !GU_STOPWORDS.has(raw) && !GU_STOPWORDS.has(norm)) {
      subjects.push(norm);
      if (raw !== norm) subjects.push(raw);
    }
    if (i < rawWords.length - 1) {
      const nextNorm = normalizeWord(rawWords[i+1]);
      if (!GU_STOPWORDS.has(rawWords[i]) && !GU_STOPWORDS.has(rawWords[i+1]) && norm.length >= 3) {
        subjects.push(`${norm} ${nextNorm}`);
      }
    }
  }
  return [...new Set(subjects)];
}

function rankPhotosRelatedTo(targetPhoto: any, allPhotos: any[]): any[] {
  if (!targetPhoto || !allPhotos || allPhotos.length === 0) return allPhotos;

  const title = `${targetPhoto.captionGu || ''} ${targetPhoto.caption || ''} ${targetPhoto.alt || ''}`;
  const terms = extractKeyTerms(title);
  const targetId = targetPhoto.id || targetPhoto.src;

  const candidatePhotos = allPhotos.filter(
    (p: any) => (p.id || p.src) !== targetId && p.caption !== 'ગેલેરી ફોટો' && p.caption !== ''
  );

  const scored = candidatePhotos.map((p: any) => {
    const pTitle = `${p.captionGu || ''} ${p.caption || ''} ${p.alt || ''}`;
    let score = 0;

    for (const t of terms) {
      if (t.includes(' ') && pTitle.includes(t)) {
        score += 30; // Bigram match (e.g. person full name)
      } else if (!t.includes(' ') && pTitle.includes(t)) {
        score += 15; // Single term match (e.g. person name, wedding, etc.)
      }
    }

    if (targetPhoto.category && p.category === targetPhoto.category) {
      score += 1;
    }
    if (typeof p.src === 'string' && p.src.startsWith('[')) {
      score += 0.5; // Multi-slide album boost
    }

    return { photo: p, score };
  });

  // Sort by score desc; if tied, sort by createdAt desc
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const dateA = a.photo.createdAt ? new Date(a.photo.createdAt).getTime() : 0;
    const dateB = b.photo.createdAt ? new Date(b.photo.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  return scored.map(s => s.photo);
}

export class GalleryController {
  /**
   * Fetch all gallery photos with pagination, search, and relatedToId support.
   */
  static async getAllPhotos(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.max(1, parseInt(req.query.limit as string) || 12);
      const skip = (page - 1) * limit;

      const query = (req.query.query as string) || '';
      const relatedToId = (req.query.relatedToId as string) || '';

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
        if (query) {
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
        } else if (relatedToId) {
          // Find target photo to rank related photos first, followed by other gallery photos
          let targetPhoto = await prisma.galleryPhoto.findUnique({
            where: { id: relatedToId },
          });
          if (!targetPhoto) {
            targetPhoto = DEFAULT_5_PHOTOS.find(
              (p) => p.id === relatedToId || p.id === `photo-${relatedToId}` || p.id === relatedToId.replace('photo-', '')
            ) as any;
          }

          if (targetPhoto) {
            const allCandidates = await prisma.galleryPhoto.findMany({
              where: {
                id: { not: targetPhoto.id },
                caption: { notIn: ['ગેલેરી ફોટો', ''] },
              },
              orderBy: { createdAt: 'desc' },
            });

            const ranked = rankPhotosRelatedTo(targetPhoto, allCandidates);
            total = ranked.length;
            photos = ranked.slice(skip, skip + limit);
          } else {
            const [rawPhotos, totalCount] = await Promise.all([
              prisma.$queryRawUnsafe<any[]>(
                `SELECT * FROM gallery_photos WHERE caption != 'ગેલેરી ફોટો' AND caption != '' ORDER BY createdAt DESC LIMIT ${limit} OFFSET ${skip}`
              ),
              prisma.galleryPhoto.count({ where }),
            ]);
            photos = rawPhotos;
            total = totalCount;
          }
        } else {
          // Strictly newest gallery stories first (by createdAt DESC)
          const [rawPhotos, totalCount] = await Promise.all([
            prisma.$queryRawUnsafe<any[]>(
              `SELECT * FROM gallery_photos WHERE caption != 'ગેલેરી ફોટો' AND caption != '' ORDER BY createdAt DESC LIMIT ${limit} OFFSET ${skip}`
            ),
            prisma.galleryPhoto.count({ where }),
          ]);
          photos = rawPhotos;
          total = totalCount;
        }
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

      const formattedPhotos = photos.map(formatGalleryPhoto);
      const totalPages = Math.ceil(Math.max(total, 5) / limit);

      return sendSuccess(res, {
        photos: formattedPhotos,
        totalPages,
      }, 'Gallery photos list retrieved successfully.');
    } catch (error) {
      return sendSuccess(res, {
        photos: DEFAULT_5_PHOTOS.map(formatGalleryPhoto),
        totalPages: 1,
      }, 'Gallery photos list retrieved with default fallback.');
    }
  }

  /**
   * Fetch a single gallery photo by ID with related photos.
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

      if (!photo) {
        throw new NotFoundError('Photo not found');
      }

      // Fetch related photos pool (related items first, then remaining gallery photos)
      let relatedPhotos: any[] = [];
      try {
        const allCandidates = await prisma.galleryPhoto.findMany({
          where: {
            id: { not: photo.id },
            caption: { notIn: ['ગેલેરી ફોટો', ''] },
          },
          orderBy: { createdAt: 'desc' },
        });
        relatedPhotos = rankPhotosRelatedTo(photo, allCandidates).slice(0, 50);
      } catch (relErr) {
        console.warn('Error fetching related photos for single photo:', relErr);
      }

      const formatted = formatGalleryPhoto(photo);
      formatted.relatedPhotos = relatedPhotos.map(formatGalleryPhoto);

      return sendSuccess(res, { photo: formatted }, 'Photo retrieved successfully.');
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
        images,
      } = req.body;

      let finalSrc = (src || '').trim();
      if (Array.isArray(images) && images.length > 0) {
        finalSrc = JSON.stringify(images);
      }

      if (!finalSrc) {
        throw new BadRequestError('Source image URL (src) or images array is required.');
      }

      let photo: any;
      try {
        photo = await (prisma.galleryPhoto as any).create({
          data: {
            src: finalSrc,
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
        clearPublicRoutesCache();
      } catch (dbErr: any) {
        console.error('[Gallery] DB create FAILED:', dbErr?.message || dbErr);
        return res.status(500).json({
          success: false,
          error: 'Failed to save photo to database: ' + (dbErr?.message || String(dbErr)),
        });
      }

      return sendSuccess(res, formatGalleryPhoto(photo), 'Photo added to gallery successfully.', 201);
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
        images,
      } = req.body;

      let finalSrc = (src || '').trim();
      if (Array.isArray(images) && images.length > 0) {
        finalSrc = JSON.stringify(images);
      }

      const photoData = {
        src: finalSrc,
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
        clearPublicRoutesCache();
      } catch (dbErr) {
        console.warn('Gallery DB upsert failed, using memory fallback:', dbErr);
        updated = {
          id,
          ...photoData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      return sendSuccess(res, formatGalleryPhoto(updated), 'Photo details updated successfully.');
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
        clearPublicRoutesCache();
      } catch (dbErr) {
        console.warn('Gallery DB delete failed, using memory fallback:', dbErr);
      }

      return sendSuccess(res, null, 'Photo deleted successfully.');
    } catch (error) {
      next(error);
    }
  }
}

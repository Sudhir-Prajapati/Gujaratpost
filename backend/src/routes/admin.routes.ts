import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { CategoryController } from '../controllers/category.controller.js';
import { AuthorController } from '../controllers/author.controller.js';
import { ArticleController } from '../controllers/article.controller.js';
import { VideoController } from '../controllers/video.controller.js';
import { GalleryController } from '../controllers/gallery.controller.js';
import { StatsController } from '../controllers/stats.controller.js';
import { HeroController } from '../controllers/hero.controller.js';
import { InstagramReelController } from '../controllers/instagramReel.controller.js';
import { WebStoryController } from '../controllers/webStory.controller.js';
import { EPaperController } from '../controllers/epaper.controller.js';
import { AdController } from '../controllers/ad.controller.js';
import { AiController } from '../controllers/ai.controller.js';
import { SupportController } from '../controllers/support.controller.js';
import uploadRoutes from './upload.routes.js';

import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { sendSuccess } from '../utils/response.js';

const router = Router();

// ==========================================
// 1. User Management (SUPER_ADMIN only)
// ==========================================
router.post('/users', requireAuth, requireRole(Role.SUPER_ADMIN), UserController.createUser);
router.get('/users', requireAuth, requireRole(Role.SUPER_ADMIN), UserController.getAllUsers);
router.get('/users/:id', requireAuth, requireRole(Role.SUPER_ADMIN), UserController.getUserById);
router.put('/users/:id', requireAuth, requireRole(Role.SUPER_ADMIN), UserController.updateUser);
router.delete('/users/:id', requireAuth, requireRole(Role.SUPER_ADMIN), UserController.deleteUser);

// ==========================================
// 2. Categories (SUPER_ADMIN, EDITOR, SEO)
// ==========================================
const categoryRoles = [Role.SUPER_ADMIN, Role.EDITOR, Role.SEO];
router.get('/categories', requireAuth, requireRole(categoryRoles), CategoryController.getAllCategories);
router.post('/categories', requireAuth, requireRole(categoryRoles), CategoryController.createCategory);
router.put('/categories/reorder', requireAuth, requireRole(categoryRoles), CategoryController.reorderCategories);
router.put('/categories/:id', requireAuth, requireRole(categoryRoles), CategoryController.updateCategory);
router.delete('/categories/:id', requireAuth, requireRole(categoryRoles), CategoryController.deleteCategory);

// ==========================================
// 3. Authors (SUPER_ADMIN, EDITOR)
// ==========================================
const authorRoles = [Role.SUPER_ADMIN, Role.EDITOR];
router.get('/authors', requireAuth, requireRole(authorRoles), AuthorController.getAllAuthors);

// ==========================================
// 4. Articles / Posts (SUPER_ADMIN, EDITOR, REPORTER, SEO, ADVERTISEMENT)
// ==========================================
const articleRoles = [Role.SUPER_ADMIN, Role.EDITOR, Role.REPORTER, Role.SEO, Role.ADVERTISEMENT];
router.get('/articles', requireAuth, requireRole(articleRoles), ArticleController.getAllArticles);
router.get('/articles/:id', requireAuth, requireRole(articleRoles), ArticleController.getArticleById);
router.post('/articles', requireAuth, requireRole(articleRoles), ArticleController.createArticle);
router.put('/articles/:id', requireAuth, requireRole(articleRoles), ArticleController.updateArticle);
router.delete('/articles/:id', requireAuth, requireRole([Role.SUPER_ADMIN, Role.EDITOR]), ArticleController.deleteArticle);
router.post('/ai/generate-seo', requireAuth, requireRole(articleRoles), AiController.generateSeo);

// ==========================================
// 5. Videos (SUPER_ADMIN, EDITOR)
// ==========================================
const videoRoles = [Role.SUPER_ADMIN, Role.EDITOR];
router.get('/videos', requireAuth, requireRole(videoRoles), VideoController.getAllVideos);
router.post('/videos', requireAuth, requireRole(videoRoles), VideoController.createVideo);
router.post('/videos/sync-youtube', requireAuth, requireRole(videoRoles), VideoController.syncYouTubeVideos);
router.post('/videos/sync-youtube-shorts', requireAuth, requireRole(videoRoles), VideoController.syncYouTubeShorts);
router.delete('/videos/all-shorts', requireAuth, requireRole(videoRoles), VideoController.deleteAllShorts);
router.put('/videos/:id', requireAuth, requireRole(videoRoles), VideoController.updateVideo);
router.delete('/videos/:id', requireAuth, requireRole(videoRoles), VideoController.deleteVideo);

// ==========================================
// 6. Gallery / Photos (SUPER_ADMIN, EDITOR, PHOTOGRAPHER)
// ==========================================
const galleryRoles = [Role.SUPER_ADMIN, Role.EDITOR, Role.PHOTOGRAPHER];
router.get('/gallery', requireAuth, requireRole(galleryRoles), GalleryController.getAllPhotos);
router.post('/gallery', requireAuth, requireRole(galleryRoles), GalleryController.createPhoto);
router.put('/gallery/:id', requireAuth, requireRole(galleryRoles), GalleryController.updatePhoto);
router.delete('/gallery/:id', requireAuth, requireRole(galleryRoles), GalleryController.deletePhoto);

// ==========================================
// 7. Local File Uploads (Authenticated users)
// ==========================================
router.use('/upload', requireAuth, uploadRoutes);

// ==========================================
// 8. Stats / Analytics (SUPER_ADMIN, EDITOR)
// ==========================================
router.get('/stats', requireAuth, requireRole([Role.SUPER_ADMIN, Role.EDITOR]), StatsController.getStats);

// ==========================================
// 9. Hero Section Settings (SUPER_ADMIN, EDITOR)
// ==========================================
const heroRoles = [Role.SUPER_ADMIN, Role.EDITOR];
router.get('/hero-settings', requireAuth, requireRole(heroRoles), HeroController.getHeroSettings);
router.put('/hero-settings', requireAuth, requireRole(heroRoles), HeroController.updateHeroSettings);

// ==========================================
// 10. Instagram Reels Settings (SUPER_ADMIN, EDITOR)
// ==========================================
const reelRoles = [Role.SUPER_ADMIN, Role.EDITOR];
router.get('/reels', requireAuth, requireRole(reelRoles), InstagramReelController.getAllReels);
router.post('/reels/sync', requireAuth, requireRole(reelRoles), InstagramReelController.syncReelsRoute);
router.post('/reels', requireAuth, requireRole(reelRoles), InstagramReelController.createReel);
router.put('/reels/:id', requireAuth, requireRole(reelRoles), InstagramReelController.updateReel);
router.delete('/reels/:id', requireAuth, requireRole(reelRoles), InstagramReelController.deleteReel);

// ==========================================
// 11. Web Stories (SUPER_ADMIN, EDITOR)
// ==========================================
router.get('/web-stories', requireAuth, WebStoryController.getAll);
router.post('/web-stories', requireAuth, WebStoryController.create);
router.put('/web-stories/:id', requireAuth, WebStoryController.update);
// ==========================================
// 12. Astrology Signs Management
// ==========================================
router.get('/astrology', requireAuth, async (req, res, next) => {
  try {
    const signs = await prisma.astrologySign.findMany({ orderBy: { createdAt: 'asc' } });
    return sendSuccess(res, { signs }, 'Astrology signs retrieved');
  } catch (error) {
    next(error);
  }
});

router.put('/astrology/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { prediction, predictionGu, nameGu, nameHi, details, detailsJson } = req.body;

    const existing = await prisma.astrologySign.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Astrology sign not found' });
    }

    const payloadJson = detailsJson || (details ? JSON.stringify(details) : undefined);

    const updated = await (prisma.astrologySign as any).update({
      where: { id: existing.id },
      data: {
        ...(prediction !== undefined && { prediction }),
        ...(predictionGu !== undefined && { predictionGu }),
        ...(nameGu !== undefined && { nameGu }),
        ...(nameHi !== undefined && { nameHi }),
        ...(payloadJson !== undefined && { detailsJson: payloadJson }),
      },
    });

    return sendSuccess(res, { sign: updated }, 'Astrology sign updated successfully');
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 13. E-Paper Management
// ==========================================
router.get('/epaper', requireAuth, EPaperController.getAdminEditions);
router.post('/epaper', requireAuth, EPaperController.createEdition);
router.put('/epaper/:id', requireAuth, EPaperController.updateEdition);
router.delete('/epaper/:id', requireAuth, EPaperController.deleteEdition);
router.get('/epaper/cities', requireAuth, EPaperController.getCities);
router.post('/epaper/cities', requireAuth, EPaperController.createCity);
router.delete('/epaper/cities/:id', requireAuth, EPaperController.deleteCity);

// ==========================================
// 14. Section Advertisements
// ==========================================
router.get('/ads', requireAuth, AdController.getAllAds);
router.post('/ads', requireAuth, AdController.createOrUpdateAd);
router.put('/ads/:id', requireAuth, AdController.createOrUpdateAd);
router.put('/ads/:id/toggle', requireAuth, AdController.toggleActive);
router.put('/ads/:id/toggle-random', requireAuth, AdController.toggleIncludeInRandom);
router.delete('/ads/:id', requireAuth, AdController.deleteAd);

// ==========================================
// 15. Support Details Management (SUPER_ADMIN only)
// ==========================================
router.get('/support', requireAuth, requireRole(Role.SUPER_ADMIN), SupportController.getSupportSettings);
router.put('/support', requireAuth, requireRole(Role.SUPER_ADMIN), SupportController.updateSupportSettings);

export default router;


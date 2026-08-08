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
// 2. Categories (Authenticated users)
// ==========================================
router.get('/categories', requireAuth, CategoryController.getAllCategories);
router.post('/categories', requireAuth, CategoryController.createCategory);
router.put('/categories/reorder', requireAuth, CategoryController.reorderCategories);
router.put('/categories/:id', requireAuth, CategoryController.updateCategory);
router.delete('/categories/:id', requireAuth, CategoryController.deleteCategory);

// ==========================================
// 3. Authors (Authenticated users)
// ==========================================
router.get('/authors', requireAuth, AuthorController.getAllAuthors);

// ==========================================
// 4. Articles / Posts (Authenticated users)
// ==========================================
router.get('/articles', requireAuth, ArticleController.getAllArticles);
router.get('/articles/:id', requireAuth, ArticleController.getArticleById);
router.post('/articles', requireAuth, ArticleController.createArticle);
router.put('/articles/:id', requireAuth, ArticleController.updateArticle);
router.delete('/articles/:id', requireAuth, ArticleController.deleteArticle);

// ==========================================
// 5. Videos (Authenticated users)
// ==========================================
router.get('/videos', requireAuth, VideoController.getAllVideos);
router.post('/videos', requireAuth, VideoController.createVideo);
router.delete('/videos/all-shorts', requireAuth, VideoController.deleteAllShorts);
router.put('/videos/:id', requireAuth, VideoController.updateVideo);
router.delete('/videos/:id', requireAuth, VideoController.deleteVideo);

// ==========================================
// 6. Gallery / Photos (Authenticated users)
// ==========================================
router.get('/gallery', requireAuth, GalleryController.getAllPhotos);
router.post('/gallery', requireAuth, GalleryController.createPhoto);
router.put('/gallery/:id', requireAuth, GalleryController.updatePhoto);
router.delete('/gallery/:id', requireAuth, GalleryController.deletePhoto);

// ==========================================
// 7. Local File Uploads (Authenticated users)
// ==========================================
router.use('/upload', requireAuth, uploadRoutes);

// ==========================================
// 8. Stats / Analytics (Authenticated users)
// ==========================================
router.get('/stats', requireAuth, StatsController.getStats);

// ==========================================
// 9. Hero Section Settings
// ==========================================
router.get('/hero-settings', requireAuth, HeroController.getHeroSettings);
router.put('/hero-settings', requireAuth, HeroController.updateHeroSettings);

// ==========================================
// 10. Instagram Reels Settings
// ==========================================
router.get('/reels', requireAuth, InstagramReelController.getAllReels);
router.post('/reels', requireAuth, InstagramReelController.createReel);
router.put('/reels/:id', requireAuth, InstagramReelController.updateReel);
router.delete('/reels/:id', requireAuth, InstagramReelController.deleteReel);

// ==========================================
// 11. Web Stories
// ==========================================
router.get('/web-stories', requireAuth, WebStoryController.getAll);
router.post('/web-stories', requireAuth, WebStoryController.create);
router.put('/web-stories/:id', requireAuth, WebStoryController.update);
router.delete('/web-stories/:id', requireAuth, WebStoryController.delete);

export default router;


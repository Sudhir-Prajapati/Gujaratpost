import { Router } from 'express';
import authRoutes from './auth.routes.js';
import adminRoutes from './admin.routes.js';
import publicRoutes from './public.routes.js';
import { publicApiRateLimiter, adminApiRateLimiter } from '../middleware/rate-limit.middleware.js';

const router = Router();

// Mount public sub-routes under /public (Protected by Redis Public Rate Limiter: 300 req/min)
router.use('/public', publicApiRateLimiter, publicRoutes);

// Mount auth sub-routes under /auth
router.use('/auth', authRoutes);

// Mount admin sub-routes under /admin (Protected by Redis Admin Rate Limiter: 100 req/min)
router.use('/admin', adminApiRateLimiter, adminRoutes);

// General health check route for verification
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date(),
    redis: 'ready', // We can update this in the main file
  });
});

export default router;

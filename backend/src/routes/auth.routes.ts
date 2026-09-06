import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { loginRateLimiter, otpRateLimiter, otpVerifyRateLimiter } from '../middleware/rate-limit.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/login', loginRateLimiter, AuthController.login);
router.post('/check-email', AuthController.checkEmail);
router.post('/send-otp', otpRateLimiter, AuthController.sendOtp);
router.post('/verify-otp', otpVerifyRateLimiter, AuthController.verifyOtp);
   router.post('/refresh', AuthController.refresh);
   router.post('/logout', AuthController.logout);
   router.get('/me', requireAuth, AuthController.me);
   router.post('/profile/setup', requireAuth, AuthController.setupProfile);

   export default router;

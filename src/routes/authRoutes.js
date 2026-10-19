import express from 'express';
import {
  requestOtp,
  verifyOtp,
  refreshToken,
  updateProfile,
  getMe
} from '../controllers/authController.js';
import { authenticateJwt } from '../middlewares/auth.js';

const router = express.Router();

router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/refresh-token', refreshToken);
router.get('/me', authenticateJwt, getMe);
router.put('/profile', authenticateJwt, updateProfile);

export default router;

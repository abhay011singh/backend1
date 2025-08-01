import { Router } from 'express';
import { signup, login, verifyOtp, refreshToken, logout, getProfile, updateProfile, deleteAccount, selectMode } from '../controllers/authController.js';
import { sendSOS } from '../controllers/sosController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.post('/send-sos', sendSOS);

// Profile routes (protected)
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.delete('/account', authMiddleware, deleteAccount);
router.post('/select-mode', authMiddleware, selectMode);

export default router; 
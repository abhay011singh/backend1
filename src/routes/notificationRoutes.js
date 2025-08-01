import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { sendNotification, getNotifications, markAllSeen } from '../controllers/notificationController.js';

const router = Router();

router.post('/send', sendNotification); // Optional: admin use only
router.get('/', authMiddleware, getNotifications);
router.put('/mark-seen', authMiddleware, markAllSeen);

export default router;

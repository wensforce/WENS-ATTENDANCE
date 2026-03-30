import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import * as notificationController from '../controllers/notififcation.controller.js';

const router = Router();


// /api/v1/notifications
router.post('/save-token', authMiddleware, notificationController.saveDeviceToken);

export default router;
import { Router } from 'express';
import notificationController from './controller.js';

const router = Router();

router.get('/', (req, res) => notificationController.index(req, res));
router.post('/:id/mark-read', (req, res) => notificationController.markAsRead(req, res));
router.post('/:id/delete', (req, res) => notificationController.delete(req, res));
router.get('/unread-count', (req, res) => notificationController.getUnreadCount(req, res));

export default router;

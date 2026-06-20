import express from 'express';
import { sendMessage, getMessages, markAsRead } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, sendMessage);
router.get('/:userId', protect, getMessages);
router.put('/:userId/read', protect, markAsRead);

export default router;
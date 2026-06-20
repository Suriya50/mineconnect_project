import express from 'express';
import { generateInvite, getInvites, deleteInvite } from '../controllers/inviteController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, admin, generateInvite);
router.get('/', protect, admin, getInvites);
router.delete('/:id', protect, admin, deleteInvite);

export default router;
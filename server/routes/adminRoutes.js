import express from 'express';
import { 
  getAdminStats, 
  getAllUsers, 
  blockUser, 
  unblockUser, 
  deleteUser 
} from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', protect, admin, getAdminStats);
router.get('/users', protect, admin, getAllUsers);
router.put('/users/:id/block', protect, admin, blockUser);
router.put('/users/:id/unblock', protect, admin, unblockUser);
router.delete('/users/:id', protect, admin, deleteUser);

export default router;
// routes/uploadRoutes.js
import express from 'express';
import { uploadProfilePhoto } from '../controllers/uploadController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadProfilePhoto as upload, handleUploadError } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// ✅ Upload profile photo
router.post(
  '/profile', 
  protect, 
  upload, 
  handleUploadError, 
  uploadProfilePhoto
);

// ✅ Delete profile photo (optional)
router.delete(
  '/profile',
  protect,
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user || !user.avatar) {
        return res.status(400).json({
          success: false,
          message: 'No profile photo to delete'
        });
      }
      
      // Delete file
      const filePath = path.join(process.cwd(), user.avatar);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      user.avatar = null;
      await user.save();
      
      res.json({
        success: true,
        message: 'Profile photo deleted',
        user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

export default router;
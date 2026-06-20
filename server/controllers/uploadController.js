import User from '../models/User.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Ensure upload directory exists
const ensureUploadDir = () => {
  const uploadDir = path.join(__dirname, '../uploads/profiles');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('📁 Created upload directory:', uploadDir);
  }
  return uploadDir;
};

export const uploadProfilePhoto = async (req, res) => {
  try {
    console.log('📸 Upload request received');
    console.log('📸 File:', req.file);
    console.log('📸 User:', req.user);

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded. Please select an image.' 
      });
    }

    // ✅ Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(req.file.mimetype)) {
      // Delete invalid file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Please upload JPEG, PNG, GIF, or WEBP.'
      });
    }

    // ✅ Validate file size (5MB)
    if (req.file.size > 5 * 1024 * 1024) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB.'
      });
    }

    // ✅ Save file URL
    const fileUrl = `/uploads/profiles/${req.file.filename}`;
    console.log('📸 File saved at:', fileUrl);

    // ✅ Update user with new avatar
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: fileUrl },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ Profile photo updated for user:', user.name);

    res.json({
      success: true,
      avatar: fileUrl,
      user: user,
      message: 'Profile photo uploaded successfully! 🎉'
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    
    // ✅ Delete uploaded file if error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('🧹 Deleted uploaded file due to error');
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    }

    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to upload photo'
    });
  }
};

// ✅ Get user with avatar
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
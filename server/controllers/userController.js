// controllers/userController.js
import User from '../models/User.js';

// ✅ Get users based on role
export const getUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const currentUser = req.user;
    
    console.log('📋 === GET USERS ===');
    console.log('📋 Current user ID:', currentUserId);
    console.log('📋 Current user name:', currentUser.name);
    console.log('📋 Current user isAdmin:', currentUser.isAdmin);

    let users = [];

    // ✅ Check if current user is admin
    const isAdmin = currentUser.isAdmin === true || currentUser.name === 'Surya';
    console.log('📋 Is user admin?', isAdmin);

    if (isAdmin) {
      // ✅ Admin sees ALL users except self
      users = await User.find({
        _id: { $ne: currentUserId }
      }).select('-password').sort({ createdAt: -1 });
      
      console.log('📋 Admin view - showing all users (excluding self):', users.length);
    } else {
      // ✅ Normal users see the admin (Surya)
      // First try to find by isAdmin flag
      let admin = await User.findOne({ 
        isAdmin: true 
      }).select('-password');
      
      // If no admin found by flag, find by name "Surya"
      if (!admin) {
        admin = await User.findOne({ 
          name: "Surya" 
        }).select('-password');
        console.log('📋 Found admin by name Surya');
      }
      
      if (admin) {
        // ✅ Only show admin if they are not the current user
        if (admin._id.toString() !== currentUserId.toString()) {
          users = [admin];
          console.log('📋 User view - showing admin:', admin.name);
        } else {
          console.log('📋 User is admin themselves, showing no users');
          users = [];
        }
      } else {
        console.log('📋 No admin found');
        users = [];
      }
    }

    console.log('📋 Final users count:', users.length);
    users.forEach(u => {
      console.log('📋 User:', u.name, 'ID:', u._id, 'isAdmin:', u.isAdmin);
    });

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ Get single user
export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');

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
    console.error('❌ Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, bio, location } = req.body;

    // ✅ Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // ✅ Check if user is updating themselves
    if (req.user.id !== id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own profile'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { 
        name: name || user.name,
        bio: bio || user.bio,
        location: location || user.location
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // ✅ Check if user is deleting themselves or is admin
    if (req.user.id !== id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own account'
      });
    }

    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ Make user admin (Admin only)
export const makeAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Check if current user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can make other users admin'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isAdmin: true },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user,
      message: `${user.name} is now an admin`
    });
  } catch (error) {
    console.error('❌ Error making admin:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ Remove admin status (Admin only)
export const removeAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Check if current user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can remove admin status'
      });
    }

    // ✅ Prevent removing own admin status
    if (req.user.id === id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot remove your own admin status'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isAdmin: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user,
      message: `${user.name} is no longer an admin`
    });
  } catch (error) {
    console.error('❌ Error removing admin:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ Get all admins (Admin only)
export const getAdmins = async (req, res) => {
  try {
    // ✅ Check if current user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can view admin list'
      });
    }

    const admins = await User.find({ isAdmin: true }).select('-password');

    res.json({
      success: true,
      admins
    });
  } catch (error) {
    console.error('❌ Error fetching admins:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
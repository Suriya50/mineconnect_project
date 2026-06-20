// pages/Profile.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, MapPin, Calendar, Settings, LogOut, Trash2, Edit2, User, Mail, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5009';

  const getImageUrl = (avatar) => {
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar;
    if (avatar.startsWith('/uploads')) return `${API_URL}${avatar}`;
    return `${API_URL}/uploads/profiles/${avatar}`;
  };

  useEffect(() => {
    if (user?.avatar) {
      const url = getImageUrl(user.avatar);
      setAvatarUrl(url);
    } else {
      setAvatarUrl(null);
    }
    setImageError(false);
  }, [user?.avatar]);

  const handleImageError = () => {
    console.log('❌ Image failed to load:', avatarUrl);
    setImageError(true);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  const userName = user?.name || 'User';
  const userEmail = user?.email || 'user@email.com';
  const userLocation = user?.location || 'India';
  const userBio = user?.bio || 'Proud to be part of CloseConnect';
  
  const joinDate = user?.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      })
    : 'May 2024';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>
          <h1 className="text-base sm:text-lg font-bold text-gray-800">Profile</h1>
        </div>
        <button 
          onClick={() => navigate('/edit-profile')} 
          className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />
        </button>
      </div>

      {/* Profile Card */}
      <div className="max-w-md mx-auto p-3 sm:p-4 pb-20 sm:pb-24">
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
          {/* Profile Photo */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto">
            {avatarUrl && !imageError ? (
              <img
                src={avatarUrl}
                alt={userName}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-purple-500 shadow-xl"
                onError={handleImageError}
                onLoad={() => console.log('✅ Image loaded successfully')}
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-3xl sm:text-4xl shadow-xl">
                {getInitials(userName)}
              </div>
            )}
            
            <button 
              onClick={() => navigate('/edit-profile')} 
              className="absolute bottom-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 p-1.5 sm:p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
            >
              <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
            </button>
          </div>

          {/* User Info */}
          <div className="text-center mt-3 sm:mt-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">{userName}</h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] sm:text-xs text-gray-500 font-medium">Online</span>
              <span className="text-[8px] sm:text-xs text-gray-300">•</span>
              <span className="text-[10px] sm:text-xs text-gray-400 font-medium truncate max-w-[120px] sm:max-w-none">{userEmail}</span>
            </div>
          </div>

          {/* Bio */}
          {userBio && (
            <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
              <p className="text-[10px] sm:text-xs text-purple-600 font-medium">📝 Bio</p>
              <p className="text-xs sm:text-sm text-gray-700 mt-0.5">{userBio}</p>
            </div>
          )}

          {/* Details */}
          <div className="mt-4 sm:mt-5 space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 rounded-xl">
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
              <div>
                <p className="text-[8px] sm:text-[10px] text-gray-400 font-medium">Full Name</p>
                <p className="font-medium text-xs sm:text-sm text-gray-800">{userName}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 rounded-xl">
              <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
              <div>
                <p className="text-[8px] sm:text-[10px] text-gray-400 font-medium">Email</p>
                <p className="font-medium text-xs sm:text-sm text-gray-800">{userEmail}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 rounded-xl">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
              <div>
                <p className="text-[8px] sm:text-[10px] text-gray-400 font-medium">Location</p>
                <p className="font-medium text-xs sm:text-sm text-gray-800">{userLocation}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 rounded-xl">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
              <div>
                <p className="text-[8px] sm:text-[10px] text-gray-400 font-medium">Joined</p>
                <p className="font-medium text-xs sm:text-sm text-gray-800">{joinDate}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-2.5">
            <button 
              onClick={() => navigate('/settings')}
              className="w-full py-2.5 sm:py-3 bg-gray-50 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Settings
            </button>
            
            <button 
              onClick={() => {
                if (window.confirm('Are you sure you want to logout?')) {
                  logout();
                  navigate('/login');
                }
              }} 
              className="w-full py-2.5 sm:py-3 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Logout
            </button>
            
            <button 
              className="w-full py-2.5 sm:py-3 bg-gray-50 text-red-500 font-semibold rounded-xl hover:bg-red-50 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete your account? This action cannot be undone!')) {
                  toast.error('Account deletion feature coming soon');
                }
              }}
            >
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
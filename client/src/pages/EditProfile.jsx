// pages/EditProfile.jsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, User, MapPin, Save, X, Loader, Upload, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import axios from 'axios';

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, setUser, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || 'Proud to be part of CloseConnect',
    location: user?.location || 'India'
  });

  const userId = user?._id || user?.id;
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5009';

  const getImageUrl = (avatar) => {
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar;
    if (avatar.startsWith('/uploads')) return `${API_URL}${avatar}`;
    return `${API_URL}/uploads/profiles/${avatar}`;
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target.result);
    };
    reader.readAsDataURL(file);

    const uploadFormData = new FormData();
    uploadFormData.append('profilePhoto', file);

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login again');
        return;
      }

      const response = await axios.post(
        `${API_URL}/api/upload/profile`,
        uploadFormData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        const updatedUser = response.data.user || response.data;
        if (setUser) {
          setUser(updatedUser);
        }
        if (updateUser) {
          updateUser(updatedUser);
        }
        localStorage.setItem('user', JSON.stringify(updatedUser));
        toast.success('Profile photo updated! 🎉');
        setPreviewImage(null);
      } else {
        toast.error(response.data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload photo');
      setPreviewImage(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userId) {
      toast.error('User ID not found. Please logout and login again.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login again');
        return;
      }

      const response = await axios.put(
        `${API_URL}/api/users/${userId}`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      const updatedUser = response.data.user || response.data;
      if (setUser) {
        setUser(updatedUser);
      }
      if (updateUser) {
        updateUser(updatedUser);
      }
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast.success('Profile updated successfully! 🎉');
      navigate('/profile');
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const currentAvatar = previewImage || getImageUrl(user?.avatar);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={() => navigate('/profile')} 
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>
          <h1 className="text-base sm:text-lg font-bold text-gray-800">Edit Profile</h1>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading || uploading}
          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm disabled:opacity-50"
        >
          {loading ? (
            <Loader className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
          ) : (
            <>
              <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Save
            </>
          )}
        </button>
      </div>

      {/* Form */}
      <div className="max-w-md mx-auto p-3 sm:p-4 pb-20">
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
          {/* Profile Photo Upload */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto">
            {currentAvatar ? (
              <img
                src={currentAvatar}
                alt="Profile"
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-purple-500 shadow-xl"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const parent = e.target.parentElement;
                  const initials = user?.name?.[0] || 'U';
                  parent.innerHTML = `
                    <div class="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-3xl sm:text-4xl shadow-xl">
                      ${initials}
                    </div>
                  `;
                }}
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-3xl sm:text-4xl shadow-xl">
                {user?.name?.[0] || 'U'}
              </div>
            )}
            
            <label 
              className={`absolute bottom-0 right-0 ${uploading ? 'bg-gray-400' : 'bg-gradient-to-r from-purple-500 to-pink-500'} p-2 sm:p-2.5 rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform`}
            >
              {uploading ? (
                <Loader className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>

            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full backdrop-blur-sm">
                <div className="text-center">
                  <Loader className="w-6 h-6 sm:w-8 sm:h-8 text-white animate-spin mx-auto" />
                  <p className="text-white text-[8px] sm:text-xs mt-1">Uploading...</p>
                </div>
              </div>
            )}
          </div>

          {previewImage && (
            <div className="mt-2 text-center">
              <span className="text-[10px] sm:text-xs text-green-600 font-medium">✓ New photo ready</span>
            </div>
          )}

          <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
            {/* Name */}
            <div>
              <label className="text-[10px] sm:text-xs font-semibold text-gray-700 block mb-1 sm:mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-2 sm:py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="text-[10px] sm:text-xs font-semibold text-gray-700 block mb-1 sm:mb-1.5">
                Bio
              </label>
              <div className="relative">
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="3"
                  maxLength="100"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-xs sm:text-sm resize-none"
                  placeholder="Write something about yourself..."
                />
                <span className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 text-[8px] sm:text-[10px] text-gray-400 font-medium">
                  {formData.bio.length}/100
                </span>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="text-[10px] sm:text-xs font-semibold text-gray-700 block mb-1 sm:mb-1.5">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Enter your location"
                  className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-2 sm:py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
            <button 
              className="w-full py-2 sm:py-3 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
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

export default EditProfile;
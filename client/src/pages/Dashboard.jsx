// pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, MessageCircle, Phone, User, Bell, 
  MoreVertical, LogOut, Menu, X, Settings, 
  Star, Archive, HelpCircle, Info, ChevronRight,
  Plus, Users, Heart, Sparkles, Clock,
  Filter, Shield, Crown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState({});
  const [activeTab, setActiveTab] = useState('chats');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5009';

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  const getImageUrl = (avatar) => {
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar;
    if (avatar.startsWith('/uploads')) return `${API_URL}${avatar}`;
    return `${API_URL}/uploads/profiles/${avatar}`;
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/api/users`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const allUsers = response.data.users || [];
      const currentUserId = user?._id || user?.id;
      const filteredUsers = allUsers.filter(u => {
        const userId = u._id?.toString() || u.id?.toString();
        const currentId = currentUserId?.toString();
        return userId !== currentId;
      });

      setUsers(filteredUsers);
      const online = filteredUsers.filter(u => u.isOnline).length;
      setOnlineCount(online);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
      toast.error('Failed to load contacts');
    }
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChatClick = (userId) => {
    const currentUserId = user?._id || user?.id;
    if (userId?.toString() === currentUserId?.toString()) {
      toast.error('⚠️ You cannot chat with yourself!');
      return;
    }
    navigate(`/chat/${userId}`);
  };

  const handleImageError = (userId) => {
    setImageErrors(prev => ({ ...prev, [userId]: true }));
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const getGradientColor = (name) => {
    const colors = [
      'from-blue-400 to-purple-500',
      'from-pink-400 to-rose-500',
      'from-green-400 to-emerald-500',
      'from-orange-400 to-red-500',
      'from-purple-400 to-indigo-500',
      'from-teal-400 to-cyan-500',
      'from-yellow-400 to-amber-500'
    ];
    const index = name?.length % colors.length || 0;
    return colors[index];
  };

  const getCurrentUserAvatar = () => {
    if (user?.avatar) {
      return getImageUrl(user.avatar);
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-400">Loading chats...</p>
        </div>
      </div>
    );
  }

  const currentUserAvatar = getCurrentUserAvatar();

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 flex flex-col">
      
      {/* Sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <div className={`fixed top-0 left-0 h-full w-[280px] sm:w-72 bg-white z-50 transform transition-transform duration-300 ease-in-out shadow-xl ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-3 sm:p-4 bg-gradient-to-r from-purple-500 to-pink-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white overflow-hidden">
                {currentUserAvatar ? (
                  <img
                    src={currentUserAvatar}
                    alt={user?.name || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-white/20 flex items-center justify-center text-white font-bold text-lg sm:text-xl">
                    {user?.name?.[0] || 'U'}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-white font-semibold text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{user?.name || 'User'}</h3>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-white/70 text-[10px] sm:text-xs">Online</span>
                  {user?.isAdmin && (
                    <span className="flex items-center gap-0.5 bg-yellow-400/20 px-1 sm:px-1.5 py-0.5 rounded-full">
                      <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-300" />
                      <span className="text-[6px] sm:text-[8px] text-yellow-300 font-medium">Admin</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="text-white/80 hover:text-white">
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        <div className="p-2 sm:p-3 space-y-0.5 sm:space-y-1">
          <button 
            onClick={() => { setSidebarOpen(false); navigate('/profile'); }}
            className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl hover:bg-purple-50 transition-all"
          >
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
            <span className="text-xs sm:text-sm text-gray-700 font-medium">My Profile</span>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 ml-auto" />
          </button>
          <button className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl hover:bg-yellow-50 transition-all">
            <Star className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
            <span className="text-xs sm:text-sm text-gray-700 font-medium">Starred Messages</span>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 ml-auto" />
          </button>
          <button className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl hover:bg-blue-50 transition-all">
            <Archive className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
            <span className="text-xs sm:text-sm text-gray-700 font-medium">Archived Chats</span>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 ml-auto" />
          </button>
          
          <div className="border-t border-gray-100 my-1.5 sm:my-2"></div>
          
          <button className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl hover:bg-gray-50 transition-all">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
            <span className="text-xs sm:text-sm text-gray-700 font-medium">Settings</span>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 ml-auto" />
          </button>
          <button className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl hover:bg-purple-50 transition-all">
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
            <span className="text-xs sm:text-sm text-gray-700 font-medium">Help & Support</span>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 ml-auto" />
          </button>
          <button className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl hover:bg-indigo-50 transition-all">
            <Info className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
            <span className="text-xs sm:text-sm text-gray-700 font-medium">About CloseConnect</span>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 ml-auto" />
          </button>
          
          <button 
            onClick={logout}
            className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl hover:bg-red-50 transition-all mt-1 sm:mt-2"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
            <span className="text-xs sm:text-sm text-red-500 font-medium">Logout</span>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-red-400 ml-auto" />
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white shadow-sm px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-100 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-md cursor-pointer overflow-hidden"
                onClick={() => navigate('/profile')}
              >
                {currentUserAvatar ? (
                  <img
                    src={currentUserAvatar}
                    alt={user?.name || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs sm:text-base">
                    {user?.name?.[0] || 'U'}
                  </div>
                )}
              </div>
              <div className="hidden xs:block">
                <h1 className="text-sm sm:text-base font-semibold text-gray-800 truncate max-w-[100px] sm:max-w-none">{user?.name || 'User'}</h1>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></span>
                  <span className="text-[8px] sm:text-[10px] text-gray-500 font-medium">Online</span>
                  {user?.isAdmin && (
                    <span className="flex items-center gap-0.5 bg-purple-100 px-1 sm:px-1.5 py-0.5 rounded-full">
                      <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-600" />
                      <span className="text-[6px] sm:text-[8px] text-purple-600 font-medium">Admin</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <button className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors relative">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors">
              <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 sm:px-4 py-1.5 sm:py-2.5 bg-white border-b border-gray-100 sticky top-[52px] sm:top-[61px] z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-1.5 sm:py-2 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all text-xs sm:text-sm"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-3 sm:px-4 py-2 sm:py-3 bg-white border-b border-gray-100 flex items-center justify-between overflow-x-auto">
        <div className="flex items-center gap-2 sm:gap-4">
          <button className="flex items-center gap-1 sm:gap-1.5 text-purple-600 hover:text-purple-500 transition-colors whitespace-nowrap">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-[10px] sm:text-xs font-medium">Contacts</span>
          </button>
          <button className="flex items-center gap-1 sm:gap-1.5 text-gray-600 hover:text-purple-500 transition-colors whitespace-nowrap">
            <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-[10px] sm:text-xs font-medium">Direct</span>
          </button>
          <button className="flex items-center gap-1 sm:gap-1.5 text-gray-600 hover:text-purple-500 transition-colors whitespace-nowrap">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-[10px] sm:text-xs font-medium">Groups</span>
          </button>
        </div>
        <button className="flex items-center gap-0.5 sm:gap-1 text-gray-400 hover:text-gray-600 transition-colors">
          <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="text-[10px] sm:text-xs">Filter</span>
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-2 pb-24 sm:pb-28">
        <div className="flex items-center justify-between mb-2 sm:mb-2.5">
          <h2 className="text-xs sm:text-sm font-semibold text-gray-700">Chats</h2>
          <span className="text-[8px] sm:text-[10px] text-gray-400 bg-gray-100 px-1.5 sm:px-2 py-0.5 rounded-full">
            {users.length} contacts
          </span>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300" />
            </div>
            <p className="text-xs sm:text-sm text-gray-400 font-medium">No chats available</p>
            <p className="text-[10px] sm:text-xs text-gray-300 mt-1">Start connecting with people!</p>
          </div>
        ) : (
          filteredUsers.map((chat) => {
            const avatarUrl = getImageUrl(chat.avatar);
            const hasError = imageErrors[chat._id || chat.id];
            const isAdmin = chat.isAdmin;
            
            return (
              <div
                key={chat._id || chat.id}
                onClick={() => handleChatClick(chat._id || chat.id)}
                className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 mb-1 bg-white rounded-xl hover:bg-gray-50 cursor-pointer transition-all hover:shadow-sm active:scale-[0.98] border border-transparent hover:border-gray-100"
              >
                <div className="relative flex-shrink-0">
                  {avatarUrl && !hasError ? (
                    <img
                      src={avatarUrl}
                      alt={chat.name || 'User'}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover shadow-sm"
                      onError={() => handleImageError(chat._id || chat.id)}
                    />
                  ) : (
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${getGradientColor(chat.name)} rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-sm`}>
                      {getInitials(chat.name)}
                    </div>
                  )}
                  {chat.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 border-2 border-white rounded-full"></span>
                  )}
                  {isAdmin && (
                    <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1">
                      <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500 fill-purple-500/20" />
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 truncate text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5">
                      {chat.name}
                      {isAdmin && (
                        <span className="text-[6px] sm:text-[8px] text-purple-500 font-medium bg-purple-50 px-1 sm:px-1.5 py-0.5 rounded-full">
                          Admin
                        </span>
                      )}
                    </h3>
                    <span className="text-[8px] sm:text-[10px] text-gray-400 flex-shrink-0 ml-1 sm:ml-2">
                      {chat.lastMessageTime || 'Now'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                      {chat.lastMessage || 'Start chatting'}
                    </p>
                    {!chat.lastMessage && (
                      <span className="text-[7px] sm:text-[9px] text-purple-500 font-medium bg-purple-50 px-1 sm:px-1.5 py-0.5 rounded-full">
                        New
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-10 hover:scale-105">
        <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-1 sm:px-2 py-1 sm:py-1.5 z-20">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <button 
            onClick={() => setActiveTab('chats')}
            className={`flex flex-col items-center gap-0.5 p-1.5 sm:p-2 px-3 sm:px-4 rounded-xl transition-all ${
              activeTab === 'chats' 
                ? 'text-purple-600 bg-purple-50' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <MessageCircle className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'chats' ? 'fill-purple-600' : ''}`} />
            <span className={`text-[8px] sm:text-[10px] font-medium ${activeTab === 'chats' ? 'text-purple-600' : ''}`}>
              Chats
            </span>
          </button>
          <button 
            onClick={() => setActiveTab('calls')}
            className={`flex flex-col items-center gap-0.5 p-1.5 sm:p-2 px-3 sm:px-4 rounded-xl transition-all ${
              activeTab === 'calls' 
                ? 'text-purple-600 bg-purple-50' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className={`text-[8px] sm:text-[10px] font-medium ${activeTab === 'calls' ? 'text-purple-600' : ''}`}>
              Calls
            </span>
          </button>
          <button 
            onClick={() => { setActiveTab('profile'); navigate('/profile'); }}
            className={`flex flex-col items-center gap-0.5 p-1.5 sm:p-2 px-3 sm:px-4 rounded-xl transition-all ${
              activeTab === 'profile' 
                ? 'text-purple-600 bg-purple-50' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className={`text-[8px] sm:text-[10px] font-medium ${activeTab === 'profile' ? 'text-purple-600' : ''}`}>
              Profile
            </span>
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="fixed bottom-[49px] sm:bottom-[61px] left-0 right-0 bg-gray-50 border-t border-gray-100 px-3 sm:px-4 py-1 sm:py-1.5 z-10 flex items-center justify-between">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex -space-x-1 sm:-space-x-1.5">
            {users.slice(0, 3).map((u, i) => (
              <div key={i} className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-white overflow-hidden">
                {getImageUrl(u.avatar) ? (
                  <img src={getImageUrl(u.avatar)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${getGradientColor(u.name)} flex items-center justify-center text-[5px] sm:text-[6px] text-white font-bold`}>
                    {getInitials(u.name)}
                  </div>
                )}
              </div>
            ))}
          </div>
          <span className="text-[8px] sm:text-[10px] text-gray-500 font-medium">
            {onlineCount} friends online
          </span>
        </div>
        <span className="text-[7px] sm:text-[9px] text-gray-400">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

export default Dashboard;
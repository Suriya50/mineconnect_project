// context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { socketService } from '../services/socket';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5009';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        connectSocket(token, parsedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      setLoading(false);
    } else if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = response.data.user;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      connectSocket(token, userData);
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const connectSocket = (token, userData) => {
    const userId = userData?._id || userData?.id;
    if (token && userId) {
      console.log('🔌 Connecting socket for user:', userId);
      const socket = socketService.connect(token, userId);
      
      if (socket) {
        socket.on('connect', () => {
          console.log('✅ Socket connected in AuthContext');
          setIsSocketConnected(true);
        });
        
        socket.on('disconnect', () => {
          console.log('❌ Socket disconnected in AuthContext');
          setIsSocketConnected(false);
        });
      }
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email: email.trim(),
        password: password.trim()
      });

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      connectSocket(token, user);
      toast.success('Welcome back! 👋');
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Login failed');
      return { success: false };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        name: userData.name.trim(),
        email: userData.email.trim(),
        password: userData.password,
        inviteCode: userData.inviteCode?.trim() || ''
      });

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      connectSocket(token, user);
      toast.success('Registration successful! 🎉');
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Registration failed');
      return { success: false };
    }
  };

  const logout = () => {
    console.log('🚪 Logging out, cleaning up...');
    socketService.clearAllCallbacks();
    socketService.disconnect();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsSocketConnected(false);
    toast.success('Logged out successfully');
  };

  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    setUser,
    updateUser,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isSocketConnected,
    reconnectSocket: () => {
      const token = localStorage.getItem('token');
      if (token && user) {
        connectSocket(token, user);
      }
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
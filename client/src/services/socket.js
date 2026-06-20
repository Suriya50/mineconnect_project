// services/socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5009';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.messageCallbacks = [];
    this.userId = null;
    this.typingCallbacks = [];
    this.stopTypingCallbacks = [];
    this.userOnlineCallbacks = [];
    this.userOfflineCallbacks = [];
    this.messageQueue = [];
    this.isProcessingQueue = false;
  }

  connect(token, userId) {
    this.userId = userId;
    
    if (this.socket && this.isConnected) {
      console.log('🔌 Socket already connected:', this.socket.id);
      this.processMessageQueue();
      return this.socket;
    }

    if (this.socket) {
      this.disconnect();
    }

    console.log('🔌 Connecting to Socket.IO with userId:', userId);

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      forceNew: true
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected:', this.socket.id);
      this.isConnected = true;
      this.socket.emit('user_online');
      this.processMessageQueue();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error.message);
      this.isConnected = false;
    });

    this.socket.on('reconnect', (attempt) => {
      console.log('🔌 Socket reconnected after', attempt, 'attempts');
      this.isConnected = true;
      this.socket.emit('user_online');
      this.processMessageQueue();
    });

    this.socket.on('new_message', (data) => {
      const senderId = data.senderId?._id || data.senderId;
      const receiverId = data.receiverId?._id || data.receiverId;
      
      if (senderId === receiverId) {
        console.error('❌ SELF-MESSAGING BLOCKED at socket level!');
        return;
      }
      
      this.messageCallbacks.forEach(cb => {
        try {
          cb(data);
        } catch (err) {
          console.error('❌ Callback error:', err);
        }
      });
    });

    this.socket.on('typing', (data) => {
      const senderId = data.senderId?._id || data.senderId;
      if (senderId === this.userId) return;
      this.typingCallbacks.forEach(cb => {
        try { cb(data); } catch (err) { console.error('❌ Typing callback error:', err); }
      });
    });

    this.socket.on('stop_typing', (data) => {
      const senderId = data.senderId?._id || data.senderId;
      if (senderId === this.userId) return;
      this.stopTypingCallbacks.forEach(cb => {
        try { cb(data); } catch (err) { console.error('❌ Stop typing callback error:', err); }
      });
    });

    this.socket.on('user_online', (userId) => {
      if (userId === this.userId) return;
      this.userOnlineCallbacks.forEach(cb => {
        try { cb(userId); } catch (err) { console.error('❌ User online callback error:', err); }
      });
    });

    this.socket.on('user_offline', (userId) => {
      if (userId === this.userId) return;
      this.userOfflineCallbacks.forEach(cb => {
        try { cb(userId); } catch (err) { console.error('❌ User offline callback error:', err); }
      });
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('🔌 Socket disconnected');
    }
  }

  clearAllCallbacks() {
    this.messageCallbacks = [];
    this.typingCallbacks = [];
    this.stopTypingCallbacks = [];
    this.userOnlineCallbacks = [];
    this.userOfflineCallbacks = [];
    this.messageQueue = [];
    console.log('🧹 All callbacks cleared');
  }

  getSocket() {
    return this.socket;
  }

  isConnectedToSocket() {
    return this.isConnected && this.socket && this.socket.connected;
  }

  sendMessage(data) {
    const currentUserId = this.userId;
    const receiverId = data.receiverId;
    
    if (receiverId === currentUserId) {
      console.error('❌ SELF-MESSAGING BLOCKED! Cannot send message to yourself.');
      return false;
    }

    if (this.isConnectedToSocket()) {
      console.log('📤 Sending message to:', receiverId);
      this.socket.emit('send_message', data);
      return true;
    } else {
      console.warn('⚠️ Socket not connected, queueing message');
      this.messageQueue.push(data);
      return false;
    }
  }

  processMessageQueue() {
    if (this.isProcessingQueue || !this.isConnectedToSocket()) return;
    
    this.isProcessingQueue = true;
    while (this.messageQueue.length > 0) {
      const data = this.messageQueue.shift();
      if (data.receiverId === this.userId) {
        console.error('❌ Self-message in queue blocked!');
        continue;
      }
      this.socket.emit('send_message', data);
    }
    this.isProcessingQueue = false;
  }

  typing(receiverId) {
    if (this.isConnectedToSocket() && receiverId !== this.userId) {
      this.socket.emit('typing', { receiverId });
    }
  }

  stopTyping(receiverId) {
    if (this.isConnectedToSocket() && receiverId !== this.userId) {
      this.socket.emit('stop_typing', { receiverId });
    }
  }

  onNewMessage(callback) {
    if (typeof callback === 'function' && !this.messageCallbacks.includes(callback)) {
      this.messageCallbacks.push(callback);
    }
  }

  offNewMessage(callback) {
    if (callback) {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    }
  }

  onTyping(callback) {
    if (typeof callback === 'function' && !this.typingCallbacks.includes(callback)) {
      this.typingCallbacks.push(callback);
    }
  }

  offTyping(callback) {
    if (callback) {
      this.typingCallbacks = this.typingCallbacks.filter(cb => cb !== callback);
    }
  }

  onStopTyping(callback) {
    if (typeof callback === 'function' && !this.stopTypingCallbacks.includes(callback)) {
      this.stopTypingCallbacks.push(callback);
    }
  }

  offStopTyping(callback) {
    if (callback) {
      this.stopTypingCallbacks = this.stopTypingCallbacks.filter(cb => cb !== callback);
    }
  }

  onUserOnline(callback) {
    if (typeof callback === 'function' && !this.userOnlineCallbacks.includes(callback)) {
      this.userOnlineCallbacks.push(callback);
    }
  }

  offUserOnline(callback) {
    if (callback) {
      this.userOnlineCallbacks = this.userOnlineCallbacks.filter(cb => cb !== callback);
    }
  }

  onUserOffline(callback) {
    if (typeof callback === 'function' && !this.userOfflineCallbacks.includes(callback)) {
      this.userOfflineCallbacks.push(callback);
    }
  }

  offUserOffline(callback) {
    if (callback) {
      this.userOfflineCallbacks = this.userOfflineCallbacks.filter(cb => cb !== callback);
    }
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.off('new_message');
      this.socket.off('typing');
      this.socket.off('stop_typing');
      this.socket.off('user_online');
      this.socket.off('user_offline');
    }
    console.log('🧹 Socket event listeners removed');
  }
}

export const socketService = new SocketService();
export default socketService;
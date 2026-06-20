// pages/Chat.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Send, Phone, Video, MoreVertical, 
  Smile, Paperclip, Mic, Heart, Sparkles, 
  Clock, Check, CheckCheck, Users, Image, File,
  Camera, MapPin, Play, Volume2, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { socketService } from '../services/socket';
import axios from 'axios';
import toast from 'react-hot-toast';

const Chat = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [receiver, setReceiver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const processedIds = useRef(new Map());
  const isMounted = useRef(true);
  const pendingMessagesRef = useRef(new Map());
  const messageCallbackRef = useRef(null);
  const typingCallbackRef = useRef(null);
  const stopTypingCallbackRef = useRef(null);

  const currentUserId = user?._id || user?.id;
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5009';

  const getImageUrl = (avatar) => {
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar;
    if (avatar.startsWith('/uploads')) return `${API_URL}${avatar}`;
    return `${API_URL}/uploads/profiles/${avatar}`;
  };

  // Self-chat prevention
  useEffect(() => {
    if (!id) {
      toast.error('Invalid chat ID');
      navigate('/dashboard');
      return;
    }
    if (id === currentUserId) {
      toast.error('⚠️ You cannot chat with yourself!');
      navigate('/dashboard');
      return;
    }
  }, [id, currentUserId, navigate]);

  // Socket listener
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = user?.id || user?._id;
    
    if (token && userId) {
      socketService.connect(token, userId);
    }

    const handleNewMessage = (messageData) => {
      if (!isMounted.current) return;
      
      const msgId = messageData._id;
      const senderId = messageData.senderId?._id || messageData.senderId;
      const receiverId = messageData.receiverId?._id || messageData.receiverId;
      
      if (senderId === receiverId) return;
      
      const isForThisChat = senderId === id || receiverId === id || 
                           senderId === currentUserId || receiverId === currentUserId;
      
      if (!isForThisChat) return;

      const isFromMe = senderId === currentUserId;
      
      if (isFromMe) {
        let tempIdToReplace = null;
        for (let [tempId, tempData] of pendingMessagesRef.current) {
          if (tempData.text === messageData.text && tempData.receiverId === id) {
            tempIdToReplace = tempId;
            break;
          }
        }
        
        if (tempIdToReplace) {
          setMessages(prev => {
            const filtered = prev.filter(m => m._id !== tempIdToReplace);
            const newMsg = {
              ...messageData,
              isTemp: false,
              _id: msgId
            };
            return [...filtered, newMsg];
          });
          pendingMessagesRef.current.delete(tempIdToReplace);
          setTimeout(scrollToBottom, 100);
          return;
        }
      }

      if (processedIds.current.has(msgId)) {
        const existingTime = processedIds.current.get(msgId);
        if (Date.now() - existingTime < 3000) return;
      }
      
      processedIds.current.set(msgId, Date.now());

      setMessages(prev => {
        const exists = prev.some(m => m._id === msgId);
        if (exists) return prev;
        return [...prev, { ...messageData, isTemp: false }];
      });
      
      setTimeout(scrollToBottom, 100);
    };

    const handleTyping = (data) => {
      if (!isMounted.current) return;
      const senderId = data.senderId?._id || data.senderId;
      if (senderId === id) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = (data) => {
      if (!isMounted.current) return;
      const senderId = data.senderId?._id || data.senderId;
      if (senderId === id) {
        setIsTyping(false);
      }
    };

    messageCallbackRef.current = handleNewMessage;
    typingCallbackRef.current = handleTyping;
    stopTypingCallbackRef.current = handleStopTyping;

    socketService.onNewMessage(handleNewMessage);
    socketService.onTyping(handleTyping);
    socketService.onStopTyping(handleStopTyping);

    return () => {
      isMounted.current = false;
      
      if (messageCallbackRef.current) {
        socketService.offNewMessage(messageCallbackRef.current);
      }
      if (typingCallbackRef.current) {
        socketService.offTyping(typingCallbackRef.current);
      }
      if (stopTypingCallbackRef.current) {
        socketService.offStopTyping(stopTypingCallbackRef.current);
      }
      
      setTimeout(() => {
        processedIds.current.clear();
        pendingMessagesRef.current.clear();
      }, 500);
    };
  }, [id, currentUserId, user]);

  // Fetch messages
  useEffect(() => {
    if (id === currentUserId) {
      navigate('/dashboard');
      return;
    }

    isMounted.current = true;
    processedIds.current.clear();
    pendingMessagesRef.current.clear();
    fetchMessages();
    fetchReceiver();
    markMessagesAsRead();

    return () => {
      isMounted.current = false;
    };
  }, [id, currentUserId, navigate]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/messages/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const msgs = response.data.messages || [];
      msgs.forEach(msg => {
        if (msg._id) {
          processedIds.current.set(msg._id, Date.now());
        }
      });
      
      if (isMounted.current) {
        setMessages(msgs);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const markMessagesAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/messages/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const fetchReceiver = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (isMounted.current) {
        setReceiver(response.data.user);
      }
    } catch (error) {
      console.error('Error fetching receiver:', error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesEndRef.current && isMounted.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;

    const text = message.trim();
    const receiverId = id;
    
    if (receiverId === currentUserId) {
      toast.error('⚠️ You cannot send a message to yourself!');
      setMessage('');
      return;
    }

    const tempId = 'temp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    const tempMsg = {
      _id: tempId,
      text: text,
      senderId: { _id: currentUserId, name: user?.name },
      receiverId: { _id: receiverId },
      createdAt: new Date().toISOString(),
      read: false,
      delivered: false,
      isTemp: true
    };

    pendingMessagesRef.current.set(tempId, { 
      tempId, 
      text: text, 
      receiverId: receiverId 
    });

    setMessages(prev => [...prev, tempMsg]);
    setMessage('');
    scrollToBottom();

    const success = socketService.sendMessage({
      receiverId: receiverId,
      text: text
    });

    if (!success) {
      toast.error('⚠️ Message queued (reconnecting...)');
    }

    socketService.stopTyping(receiverId);
    clearTimeout(typingTimeoutRef.current);
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    if (socketService.isConnectedToSocket() && id !== currentUserId) {
      socketService.typing(id);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketService.stopTyping(id);
      }, 1000);
    }
  };

  const formatTime = (date) => {
    if (!date) return 'Now';
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  };

  const recordingIntervalRef = useRef(null);

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    const interval = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    recordingIntervalRef.current = interval;
  };

  const stopRecording = () => {
    setIsRecording(false);
    clearInterval(recordingIntervalRef.current);
    if (recordingTime > 1) {
      toast.success('Voice note sent! 🎤');
    }
    setRecordingTime(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-400">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (id === currentUserId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 flex items-center justify-center p-3 sm:p-4">
        <div className="text-center p-6 sm:p-8 bg-white rounded-2xl sm:rounded-3xl shadow-xl max-w-xs sm:max-w-sm">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <span className="text-3xl sm:text-4xl">🚫</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Cannot Chat with Yourself</h2>
          <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">You cannot send messages to yourself.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all text-sm"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const receiverAvatar = getImageUrl(receiver?.avatar);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 flex flex-col">
      
      {/* Header */}
      <div className="bg-white shadow-sm px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-100 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-gray-200">
                  {receiverAvatar ? (
                    <img
                      src={receiverAvatar}
                      alt={receiver?.name || 'User'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs sm:text-base">
                      {receiver?.name?.[0] || '?'}
                    </div>
                  )}
                </div>
                {receiver?.isOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 border-2 border-white rounded-full"></span>
                )}
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-gray-800 truncate max-w-[80px] sm:max-w-none">{receiver?.name || 'User'}</h2>
                <span className="text-[8px] sm:text-[10px] text-gray-500 font-medium">
                  {receiver?.isOnline ? '🟢 Online' : '⚪ Offline'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <button className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
              <Phone className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
            </button>
            <button className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
              <Video className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
            </button>
            <button className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
              <MoreVertical className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-2 sm:py-3 space-y-1.5 sm:space-y-2 pb-4">
        {messages.length > 0 && (
          <div className="flex justify-center mb-3 sm:mb-4">
            <span className="text-[8px] sm:text-[10px] text-gray-400 bg-white px-2 sm:px-3 py-1 rounded-full shadow-sm border border-gray-100">
              {formatDate(messages[0]?.createdAt)}
            </span>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" />
            </div>
            <p className="text-xs sm:text-sm text-gray-400 font-medium">No messages yet</p>
            <p className="text-[10px] sm:text-xs text-gray-300 mt-1">Start chatting with {receiver?.name || 'this user'}</p>
          </div>
        ) : (
          [...new Map(messages.map(msg => [msg._id, msg])).values()].map((msg, index) => {
            const senderId = msg.senderId?._id || msg.senderId;
            const isSender = senderId === currentUserId;
            const isTemp = msg.isTemp || msg._id?.toString().startsWith('temp-');
            const showDate = index === 0 || formatDate(msg.createdAt) !== formatDate(messages[index - 1]?.createdAt);
            
            return (
              <React.Fragment key={msg._id}>
                {showDate && index > 0 && (
                  <div className="flex justify-center my-2 sm:my-3">
                    <span className="text-[8px] sm:text-[10px] text-gray-400 bg-white px-2 sm:px-3 py-1 rounded-full shadow-sm border border-gray-100">
                      {formatDate(msg.createdAt)}
                    </span>
                  </div>
                )}
                <div className={`flex ${isSender ? 'justify-end' : 'justify-start'} animate-fadeInUp`}>
                  <div className={`max-w-[85%] sm:max-w-[80%] px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-sm ${
                    isSender 
                      ? 'bg-purple-500 text-white rounded-br-sm' 
                      : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    <div className={`flex items-center justify-end gap-1 mt-0.5 sm:mt-1`}>
                      <span className={`text-[8px] sm:text-[9px] ${isSender ? 'text-white/60' : 'text-gray-400'}`}>
                        {formatTime(msg.createdAt)}
                      </span>
                      {isSender && (
                        <span className="text-[8px] sm:text-[9px] text-white/60">
                          {isTemp ? '⌛' : (msg.read ? '✓✓' : '✓')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        
        {isTyping && (
          <div className="flex justify-start animate-fadeInUp">
            <div className="bg-white px-3 sm:px-4 py-2 sm:py-3 rounded-2xl rounded-bl-sm border border-gray-100 shadow-sm">
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Voice Recording Indicator */}
      {isRecording && (
        <div className="fixed bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 bg-white px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-lg border border-gray-200 z-30 flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs sm:text-sm text-gray-700 font-medium">
              {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <button 
            onClick={stopRecording}
            className="bg-gray-100 p-1.5 sm:p-2 rounded-full hover:bg-gray-200 transition-all"
          >
            <span className="text-[10px] sm:text-sm text-gray-700 font-medium">Stop</span>
          </button>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-2 sm:px-4 py-1.5 sm:py-2.5 sticky bottom-0 z-20">
        <form onSubmit={handleSend} className="flex items-center gap-1 sm:gap-2">
          <button 
            type="button" 
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button 
            type="button" 
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hidden xs:inline-flex"
          >
            <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <input
            type="text"
            value={message}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="flex-1 py-1.5 sm:py-2.5 px-2 sm:px-4 bg-gray-100 text-gray-800 placeholder-gray-400 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all text-xs sm:text-sm"
          />
          {message.trim() ? (
            <button
              type="submit"
              className="p-1.5 sm:p-2.5 bg-purple-500 text-white rounded-full hover:bg-purple-600 hover:shadow-md transition-all"
            >
              <Send className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
            </button>
          ) : (
            <button
              type="button"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              className="p-1.5 sm:p-2.5 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
            >
              <Mic className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
            </button>
          )}
        </form>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.3s ease-out forwards;
        }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-8px); }
        }
        .animate-bounce {
          animation: bounce 1.4s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        .animate-pulse {
          animation: pulse 1s ease-in-out infinite;
        }
        @media (max-width: 400px) {
          .xs\\:inline-flex {
            display: inline-flex !important;
          }
          .xs\\:block {
            display: block !important;
          }
        }
        @media (min-width: 401px) {
          .xs\\:inline-flex {
            display: inline-flex !important;
          }
          .xs\\:block {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Chat;
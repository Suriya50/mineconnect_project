// socket/socketHandler.js
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Chat from '../models/Chat.js';

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177', 'https://your-frontend-url.com'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // ✅ Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        console.error('❌ No token provided');
        return next(new Error('Authentication error: No token'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        console.error('❌ User not found');
        return next(new Error('User not found'));
      }
      
      socket.user = user;
      socket.userId = user._id.toString();
      console.log(`✅ Socket authenticated: ${user.name} (${socket.userId})`);
      next();
    } catch (error) {
      console.error('❌ Socket auth error:', error.message);
      next(new Error('Authentication error: ' + error.message));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    const userName = socket.user.name;
    
    console.log(`🟢 User connected: ${userId} - ${userName}`);

    // ✅ Join user's personal room
    socket.join(userId);
    console.log(`📌 ${userName} joined room: ${userId}`);

    // ✅ Handle user online status
    socket.on('user_online', async () => {
      try {
        await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
        socket.broadcast.emit('user_online', userId);
        console.log(`🟢 ${userName} is now online`);
      } catch (error) {
        console.error('Error updating online status:', error);
      }
    });

    // ✅ SEND MESSAGE - FIXED with self-message blocking
    socket.on('send_message', async (data) => {
      try {
        const { receiverId, text, voiceNote, duration, isVoice } = data;
        
        console.log('📨 Socket received:');
        console.log('📨 Sender:', userId);
        console.log('📨 Receiver:', receiverId);
        console.log('📨 Text:', text);
        
        // ✅ BLOCK SELF-MESSAGES at server level
        if (userId === receiverId) {
          console.error(`❌ SELF-MESSAGING BLOCKED on server!`);
          console.error(`📨 Sender: ${userId}`);
          console.error(`📨 Receiver: ${receiverId}`);
          console.error(`📨 Text: ${text}`);
          socket.emit('message_error', { 
            error: 'Cannot send message to yourself',
            code: 'SELF_MESSAGE_BLOCKED'
          });
          return;
        }

        // ✅ Validate receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
          console.error(`❌ Receiver not found: ${receiverId}`);
          socket.emit('message_error', { 
            error: 'Receiver not found',
            code: 'RECEIVER_NOT_FOUND'
          });
          return;
        }

        console.log(`📨 ${userName} (${userId}) → ${receiver.name} (${receiverId}): ${text}`);

        // ✅ Find or create chat
        let chat = await Chat.findOne({
          participants: { $all: [userId, receiverId] }
        });

        if (!chat) {
          chat = await Chat.create({
            participants: [userId, receiverId]
          });
          console.log(`📁 Created new chat for ${userName} and ${receiver.name}`);
        }

        // ✅ Create message
        const messageData = {
          chatId: chat._id,
          senderId: userId,
          receiverId,
          text: text || '',
          read: false,
          delivered: true
        };

        // ✅ Handle voice note
        if (isVoice && voiceNote) {
          messageData.isVoice = true;
          messageData.duration = duration || 0;
          messageData.voiceNote = voiceNote;
        }

        const message = await Message.create(messageData);

        // ✅ Update chat
        chat.lastMessage = message._id;
        chat.lastMessageTime = new Date();
        await chat.save();

        // ✅ Populate message
        const populatedMessage = await Message.findById(message._id)
          .populate('senderId', 'name avatar')
          .populate('receiverId', 'name avatar');

        console.log(`✅ Message saved: ${message._id}`);

        // ✅ Send to receiver (if online)
        const receiverSockets = await io.in(receiverId).fetchSockets();
        if (receiverSockets.length > 0) {
          io.to(receiverId).emit('new_message', populatedMessage);
          console.log(`✅ Message sent to receiver: ${receiverId}`);
        } else {
          console.log(`⚠️ Receiver ${receiverId} is offline, message saved`);
        }
        
        // ✅ Send back to sender
        io.to(userId).emit('new_message', populatedMessage);
        console.log(`✅ Message sent to sender: ${userId}`);

      } catch (error) {
        console.error('❌ Socket error:', error);
        socket.emit('message_error', { 
          error: error.message,
          code: 'MESSAGE_SEND_ERROR'
        });
      }
    });

    // ✅ Typing indicator
    socket.on('typing', (data) => {
      const { receiverId } = data;
      if (userId !== receiverId) {
        io.to(receiverId).emit('typing', {
          senderId: userId,
          name: userName
        });
      }
    });

    // ✅ Stop typing
    socket.on('stop_typing', (data) => {
      const { receiverId } = data;
      if (userId !== receiverId) {
        io.to(receiverId).emit('stop_typing', { senderId: userId });
      }
    });

    // ✅ Mark messages as read
    socket.on('mark_read', async (data) => {
      try {
        const { chatId } = data;
        await Message.updateMany(
          { chatId, receiverId: userId, read: false },
          { read: true }
        );
        io.to(chatId).emit('messages_read', { chatId, userId });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // ✅ Handle disconnect
    socket.on('disconnect', async () => {
      try {
        await User.findByIdAndUpdate(userId, { 
          isOnline: false, 
          lastSeen: new Date() 
        });
        socket.broadcast.emit('user_offline', userId);
        console.log(`🔴 User disconnected: ${userName} (${userId})`);
      } catch (error) {
        console.error('Error updating offline status:', error);
      }
    });

    // ✅ Handle errors
    socket.on('error', (error) => {
      console.error(`❌ Socket error for ${userName}:`, error);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized!');
  }
  return io;
};
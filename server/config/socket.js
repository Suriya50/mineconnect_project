import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Message from '../models/Message.js';

export let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      socket.userId = user._id.toString();
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🟢 User connected: ${socket.userId}`);
    socket.join(socket.userId);

    socket.on('user_online', async () => {
      await User.findByIdAndUpdate(socket.userId, { isOnline: true });
      socket.broadcast.emit('user_online', socket.userId);
    });

    socket.on('send_message', async (data) => {
      try {
        const { receiverId, text, media } = data;
        const message = await Message.create({
          senderId: socket.userId,
          receiverId,
          text: text || '',
          media: media || null
        });
        const populatedMessage = await Message.findById(message._id)
          .populate('senderId', 'name avatar')
          .populate('receiverId', 'name avatar');
        io.to(receiverId).emit('new_message', populatedMessage);
        io.to(socket.userId).emit('new_message', populatedMessage);
      } catch (error) {
        socket.emit('message_error', { error: error.message });
      }
    });

    socket.on('typing', (data) => {
      io.to(data.receiverId).emit('typing', { 
        senderId: socket.userId, 
        name: socket.user.name 
      });
    });

    socket.on('stop_typing', (data) => {
      io.to(data.receiverId).emit('stop_typing', { senderId: socket.userId });
    });

    socket.on('disconnect', async () => {
      await User.findByIdAndUpdate(socket.userId, { isOnline: false });
      socket.broadcast.emit('user_offline', socket.userId);
      console.log(`🔴 User disconnected: ${socket.userId}`);
    });
  });

  return io;
};
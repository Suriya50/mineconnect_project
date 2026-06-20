import Message from '../models/Message.js';
import Chat from '../models/Chat.js';
import User from '../models/User.js';
import { getIO } from '../socket/socketHandler.js';

// ✅ SEND MESSAGE
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, text } = req.body;
    const senderId = req.user.id;

    console.log('📨 API send_message from:', senderId, 'to:', receiverId);

    // ✅ Block self-messaging
    if (senderId === receiverId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot send message to yourself' 
      });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ success: false, message: 'Receiver not found' });
    }

    let chat = await Chat.findOne({
      participants: { $all: [senderId, receiverId] }
    });

    if (!chat) {
      chat = await Chat.create({
        participants: [senderId, receiverId]
      });
    }

    const message = await Message.create({
      chatId: chat._id,
      senderId,
      receiverId,
      text: text || '',
      read: false,
      delivered: true
    });

    chat.lastMessage = message._id;
    chat.lastMessageTime = new Date();
    await chat.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name avatar')
      .populate('receiverId', 'name avatar');

    const io = getIO();
    if (io) {
      io.to(receiverId).emit('new_message', populatedMessage);
      io.to(senderId).emit('new_message', populatedMessage);
      console.log('✅ Socket.IO emitted to:', receiverId, 'and', senderId);
    }

    res.status(201).json({ success: true, message: populatedMessage });
  } catch (error) {
    console.error('❌ API send message error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ GET MESSAGES - FIXED: Prevent self-chat
export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    console.log('📥 Getting messages between:', currentUserId, 'and:', userId);

    // ✅ BLOCK self-chat
    if (currentUserId === userId) {
      console.log('⚠️ Self-chat blocked!');
      return res.json({ success: true, messages: [] });
    }

    const chat = await Chat.findOne({
      participants: { $all: [currentUserId, userId] }
    });

    if (!chat) {
      return res.json({ success: true, messages: [] });
    }

    const messages = await Message.find({ chatId: chat._id })
      .populate('senderId', 'name avatar')
      .populate('receiverId', 'name avatar')
      .sort({ createdAt: 1 });

    console.log('📥 Found', messages.length, 'messages');

    await Message.updateMany(
      { 
        chatId: chat._id,
        senderId: userId, 
        receiverId: currentUserId, 
        read: false 
      },
      { read: true }
    );

    await Chat.findByIdAndUpdate(chat._id, { 
      unreadCount: 0 
    });

    res.json({ success: true, messages });
  } catch (error) {
    console.error('❌ Get messages error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ MARK MESSAGES AS READ
export const markAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    console.log('📖 Marking messages as read from:', userId, 'to:', currentUserId);

    // ✅ BLOCK self-chat
    if (currentUserId === userId) {
      console.log('⚠️ Self-chat blocked!');
      return res.json({ success: true, message: 'Self-chat blocked' });
    }

    const chat = await Chat.findOne({
      participants: { $all: [currentUserId, userId] }
    });

    if (!chat) {
      return res.json({ success: true, message: 'No chat found' });
    }

    await Message.updateMany(
      { 
        chatId: chat._id,
        senderId: userId, 
        receiverId: currentUserId, 
        read: false 
      },
      { read: true }
    );

    await Chat.findByIdAndUpdate(chat._id, { 
      unreadCount: 0 
    });

    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    console.error('❌ Mark as read error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
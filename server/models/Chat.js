import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  participants: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  }],
  lastMessage: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Message',
    default: null
  },
  lastMessageTime: { 
    type: Date, 
    default: Date.now 
  },
  unreadCount: { 
    type: Number, 
    default: 0,
    min: 0
  }
}, { 
  timestamps: true 
});

// ✅ Add index for faster queries
chatSchema.index({ participants: 1 });
chatSchema.index({ lastMessageTime: -1 });

// ✅ Disable versioning to prevent VersionError
chatSchema.set('versionKey', false);

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
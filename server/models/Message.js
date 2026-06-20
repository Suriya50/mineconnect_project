import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  chatId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Chat', 
    required: true 
  },
  senderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  receiverId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  text: { 
    type: String, 
    default: '' 
  },
  media: {
    type: { 
      type: String, 
      enum: ['image', 'video', 'audio', 'document', null] 
    },
    url: String,
    name: String,
    size: Number
  },
  read: { 
    type: Boolean, 
    default: false 
  },
  delivered: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
export default Message;
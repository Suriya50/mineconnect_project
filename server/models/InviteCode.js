import mongoose from 'mongoose';

const inviteCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  assignedTo: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  used: { type: Boolean, default: false },
  usedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  expiresAt: { type: Date, default: () => new Date(+new Date() + 7 * 24 * 60 * 60 * 1000) }
}, { timestamps: true });

const InviteCode = mongoose.model('InviteCode', inviteCodeSchema);
export default InviteCode;
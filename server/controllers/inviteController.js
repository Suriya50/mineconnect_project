import InviteCode from '../models/InviteCode.js';
import crypto from 'crypto';

export const generateInvite = async (req, res) => {
  try {
    const { assignedTo } = req.body;

    if (!assignedTo) {
      return res.status(400).json({ success: false, message: 'Please provide a name' });
    }

    const code = `${assignedTo.toUpperCase()}${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const inviteCode = await InviteCode.create({
      code,
      assignedTo,
      createdBy: req.user.id
    });

    res.status(201).json({ success: true, inviteCode });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInvites = async (req, res) => {
  try {
    const invites = await InviteCode.find({ createdBy: req.user.id })
      .populate('usedBy', 'name email');
    res.json({ success: true, invites });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteInvite = async (req, res) => {
  try {
    const invite = await InviteCode.findById(req.params.id);
    if (!invite) {
      return res.status(404).json({ success: false, message: 'Invite not found' });
    }
    await invite.deleteOne();
    res.json({ success: true, message: 'Invite deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
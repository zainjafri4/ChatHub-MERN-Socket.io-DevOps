import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const memberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'moderator', 'member'],
    default: 'member',
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    minlength: [3, 'Group name must be at least 3 characters'],
    maxlength: [50, 'Group name cannot exceed 50 characters'],
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: '',
  },
  avatar: {
    type: String,
    default: null,
  },
  avatarPublicId: {
    type: String,
    default: null,
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [memberSchema],
  privacy: {
    type: String,
    enum: ['public', 'private'],
    default: 'public',
  },
  inviteCode: {
    type: String,
    unique: true,
    sparse: true,
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null,
  },
  lastMessageAt: {
    type: Date,
    default: null,
  },
  settings: {
    onlyAdminCanMessage: { type: Boolean, default: false },
    onlyAdminCanAddMembers: { type: Boolean, default: false },
  },
}, {
  timestamps: true,
});

groupSchema.index({ admin: 1 });
groupSchema.index({ 'members.user': 1 });
// inviteCode already has unique+sparse index from the field definition above.
groupSchema.index({ privacy: 1 });
groupSchema.index({ name: 'text', description: 'text' });
groupSchema.index({ lastMessageAt: -1 });

// Auto-generate invite code for private groups
groupSchema.pre('save', function (next) {
  if (this.isNew && this.privacy === 'private' && !this.inviteCode) {
    this.inviteCode = uuidv4().replace(/-/g, '').substring(0, 12);
  }
  next();
});

// Virtual for member count
groupSchema.virtual('memberCount').get(function () {
  return this.members.length;
});

groupSchema.set('toJSON', { virtuals: true });

const Group = mongoose.model('Group', groupSchema);
export default Group;

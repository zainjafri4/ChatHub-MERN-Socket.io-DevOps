import mongoose from 'mongoose';

const reactionSchema = new mongoose.Schema({
  emoji: { type: String, required: true },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { _id: false });

const readBySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  readAt: { type: Date, default: Date.now },
}, { _id: false });

const deliveredToSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deliveredAt: { type: Date, default: Date.now },
}, { _id: false });

const linkPreviewSchema = new mongoose.Schema({
  url: String,
  title: String,
  description: String,
  image: String,
  favicon: String,
  siteName: String,
}, { _id: false });

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    default: null,
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    maxlength: [5000, 'Message cannot exceed 5000 characters'],
    default: '',
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'file', 'system'],
    default: 'text',
  },
  fileUrl: { type: String, default: null },
  filePublicId: { type: String, default: null },
  fileName: { type: String, default: null },
  fileSize: { type: Number, default: null },
  mimeType: { type: String, default: null },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null,
  },
  readBy: [readBySchema],
  deliveredTo: [deliveredToSchema],
  reactions: [reactionSchema],
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date, default: null },
  deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isDeletedForEveryone: { type: Boolean, default: false },
  deletedForEveryoneAt: { type: Date, default: null },
  linkPreview: { type: linkPreviewSchema, default: null },
}, {
  timestamps: true,
});

// Indexes for performance
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ groupId: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ content: 'text' });

// Validation: must belong to either conversation or group, not both
messageSchema.pre('save', function (next) {
  if (!this.conversationId && !this.groupId) {
    return next(new Error('Message must belong to a conversation or group'));
  }
  if (this.conversationId && this.groupId) {
    return next(new Error('Message cannot belong to both a conversation and a group'));
  }
  next();
});

const Message = mongoose.model('Message', messageSchema);
export default Message;

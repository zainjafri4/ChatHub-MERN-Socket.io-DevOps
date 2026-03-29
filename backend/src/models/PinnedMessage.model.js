import mongoose from 'mongoose';

const pinnedMessageSchema = new mongoose.Schema({
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    required: true,
  },
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
  pinnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

pinnedMessageSchema.index({ conversationId: 1 });
pinnedMessageSchema.index({ groupId: 1 });

const PinnedMessage = mongoose.model('PinnedMessage', pinnedMessageSchema);
export default PinnedMessage;

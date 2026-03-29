import Conversation from '../models/Conversation.model.js';
import Message from '../models/Message.model.js';
import User from '../models/User.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

export const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
      isActive: true,
    })
      .populate('participants', 'username name email avatar isOnline lastSeen')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'username avatar' },
      })
      .sort({ lastMessageAt: -1 });

    // For each conversation, compute unread count
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          sender: { $ne: req.user._id },
          'readBy.user': { $ne: req.user._id },
          isDeletedForEveryone: false,
          deletedFor: { $ne: req.user._id },
        });
        return { ...conv.toJSON(), unreadCount };
      })
    );

    res.json(new ApiResponse(200, { conversations: conversationsWithUnread }));
  } catch (error) {
    next(error);
  }
};

export const getOrCreateConversation = async (req, res, next) => {
  try {
    const { recipientId } = req.body;
    if (!recipientId) throw new ApiError(400, 'Recipient ID required');
    if (recipientId === req.user._id.toString()) throw new ApiError(400, 'Cannot start conversation with yourself');

    const recipient = await User.findById(recipientId);
    if (!recipient) throw new ApiError(404, 'User not found');

    // Sort participant IDs for consistent querying
    const participantIds = [req.user._id, recipientId].sort();

    let conversation = await Conversation.findOne({
      participants: { $all: participantIds, $size: 2 },
    })
      .populate('participants', 'username name email avatar isOnline lastSeen')
      .populate('lastMessage');

    if (!conversation) {
      conversation = await Conversation.create({ participants: participantIds });
      conversation = await conversation.populate('participants', 'username name email avatar isOnline lastSeen');
    }

    res.json(new ApiResponse(200, { conversation }));
  } catch (error) {
    next(error);
  }
};

export const deleteConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id,
    });
    if (!conversation) throw new ApiError(404, 'Conversation not found');

    // Soft delete - mark as inactive for this user
    conversation.isActive = false;
    await conversation.save();

    res.json(new ApiResponse(200, null, 'Conversation deleted'));
  } catch (error) {
    next(error);
  }
};

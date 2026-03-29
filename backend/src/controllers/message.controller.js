import Message from '../models/Message.model.js';
import Conversation from '../models/Conversation.model.js';
import Group from '../models/Group.model.js';
import PinnedMessage from '../models/PinnedMessage.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { fetchLinkPreview } from '../utils/linkPreview.utils.js';
import { deleteFromCloudinary } from '../config/cloudinary.js';
import { PAGINATION, DELETE_FOR_EVERYONE_WINDOW_MINUTES } from '../config/constants.js';
import { getIO, getOnlineUsers } from '../socket/socket.js';
import { SOCKET_EVENTS } from '../config/constants.js';

const extractUrls = (text) => {
  const urlPattern = /https?:\/\/[^\s]+/g;
  return text?.match(urlPattern) || [];
};

export const sendMessage = async (req, res, next) => {
  try {
    const { conversationId, groupId, content, type = 'text', replyTo, tempId } = req.body;

    if (!conversationId && !groupId) throw new ApiError(400, 'conversationId or groupId required');
    if (!content && !req.file) throw new ApiError(400, 'Message content or file required');

    // Verify access
    if (conversationId) {
      const conv = await Conversation.findOne({ _id: conversationId, participants: req.user._id });
      if (!conv) throw new ApiError(403, 'Access denied');
    }
    if (groupId) {
      const group = await Group.findOne({ _id: groupId, 'members.user': req.user._id });
      if (!group) throw new ApiError(403, 'You are not a member of this group');
      if (group.settings.onlyAdminCanMessage && group.admin.toString() !== req.user._id.toString()) {
        const member = group.members.find(m => m.user.toString() === req.user._id.toString());
        if (!member || member.role === 'member') throw new ApiError(403, 'Only admins can send messages');
      }
    }

    const messageData = {
      conversationId: conversationId || null,
      groupId: groupId || null,
      sender: req.user._id,
      content: content || '',
      type,
      replyTo: replyTo || null,
    };

    if (req.file) {
      messageData.fileUrl = req.file.path;
      messageData.filePublicId = req.file.filename;
      messageData.fileName = req.file.originalname;
      messageData.fileSize = req.file.size;
      messageData.mimeType = req.file.mimetype;
      messageData.type = req.file.mimetype.startsWith('image/') ? 'image'
        : req.file.mimetype.startsWith('video/') ? 'video'
        : req.file.mimetype.startsWith('audio/') ? 'audio'
        : 'file';
    }

    const message = await Message.create(messageData);

    // Fetch link preview asynchronously
    if (type === 'text' && content) {
      const urls = extractUrls(content);
      if (urls.length > 0) {
        fetchLinkPreview(urls[0]).then(async (preview) => {
          if (preview) {
            await Message.findByIdAndUpdate(message._id, { linkPreview: preview });
            const io = getIO();
            if (io) {
              const populated = await Message.findById(message._id)
                .populate('sender', 'username avatar')
                .populate('replyTo');
              io.to(conversationId || groupId).emit(SOCKET_EVENTS.MESSAGE_EDITED, populated);
            }
          }
        }).catch(() => {});
      }
    }

    const populated = await message.populate([
      { path: 'sender', select: 'username name avatar isOnline' },
      { path: 'replyTo', populate: { path: 'sender', select: 'username name avatar' } },
    ]);

    // Update conversation/group last message
    if (conversationId) {
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: message._id,
        lastMessageAt: new Date(),
        isActive: true,
      });
    }
    if (groupId) {
      await Group.findByIdAndUpdate(groupId, {
        lastMessage: message._id,
        lastMessageAt: new Date(),
      });
    }

    res.status(201).json(new ApiResponse(201, { message: populated, tempId }, 'Message sent'));
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { cursor, limit = PAGINATION.MESSAGES_PER_PAGE, groupId } = req.query;

    const targetId = conversationId !== 'group' ? conversationId : groupId;
    const isGroup = conversationId === 'group' || !!groupId;

    const filter = {
      ...(isGroup ? { groupId: targetId } : { conversationId: targetId }),
      deletedFor: { $ne: req.user._id },
      isDeletedForEveryone: false,
    };

    if (cursor) {
      filter._id = { $lt: cursor };
    }

    // Verify access
    if (!isGroup) {
      const conv = await Conversation.findOne({ _id: targetId, participants: req.user._id });
      if (!conv) throw new ApiError(403, 'Access denied');
    } else {
      const group = await Group.findOne({ _id: targetId, 'members.user': req.user._id });
      if (!group) throw new ApiError(403, 'Access denied');
    }

    const messages = await Message.find(filter)
      .populate('sender', 'username avatar isOnline')
      .populate({ path: 'replyTo', populate: { path: 'sender', select: 'username name avatar' } })
      .sort({ _id: -1 })
      .limit(parseInt(limit) + 1);

    const hasMore = messages.length > parseInt(limit);
    const result = hasMore ? messages.slice(0, -1) : messages;
    const nextCursor = hasMore ? result[result.length - 1]._id : null;

    res.json(new ApiResponse(200, {
      messages: result.reverse(),
      hasMore,
      nextCursor,
    }));
  } catch (error) {
    next(error);
  }
};

export const editMessage = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) throw new ApiError(400, 'Content required');

    const message = await Message.findById(req.params.id);
    if (!message) throw new ApiError(404, 'Message not found');
    if (message.sender.toString() !== req.user._id.toString()) throw new ApiError(403, 'Cannot edit another user\'s message');
    if (message.type !== 'text') throw new ApiError(400, 'Can only edit text messages');
    if (message.isDeletedForEveryone) throw new ApiError(400, 'Message has been deleted');

    message.content = content.trim();
    message.isEdited = true;
    message.editedAt = new Date();

    // Re-fetch link preview
    const urls = extractUrls(content);
    if (urls.length > 0) {
      fetchLinkPreview(urls[0]).then(async (preview) => {
        if (preview) await Message.findByIdAndUpdate(message._id, { linkPreview: preview });
      }).catch(() => {});
    } else {
      message.linkPreview = null;
    }

    await message.save();
    const populated = await message.populate('sender', 'username avatar');

    res.json(new ApiResponse(200, { message: populated }, 'Message edited'));
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req, res, next) => {
  try {
    const { deleteForEveryone = false } = req.body;

    const message = await Message.findById(req.params.id);
    if (!message) throw new ApiError(404, 'Message not found');

    if (deleteForEveryone) {
      if (message.sender.toString() !== req.user._id.toString()) {
        throw new ApiError(403, 'Cannot delete another user\'s message for everyone');
      }
      const minutesSinceSent = (new Date() - message.createdAt) / 60000;
      if (minutesSinceSent > DELETE_FOR_EVERYONE_WINDOW_MINUTES) {
        throw new ApiError(400, `Can only delete for everyone within ${DELETE_FOR_EVERYONE_WINDOW_MINUTES} minutes`);
      }

      message.isDeletedForEveryone = true;
      message.deletedForEveryoneAt = new Date();
      message.content = '';
      message.fileUrl = null;
      message.linkPreview = null;

      // Delete file from Cloudinary
      if (message.filePublicId) {
        await deleteFromCloudinary(message.filePublicId, message.type === 'video' ? 'video' : 'image');
      }
    } else {
      if (!message.deletedFor.includes(req.user._id)) {
        message.deletedFor.push(req.user._id);
      }
    }

    await message.save();
    res.json(new ApiResponse(200, { messageId: message._id, deleteForEveryone }, 'Message deleted'));
  } catch (error) {
    next(error);
  }
};

export const addReaction = async (req, res, next) => {
  try {
    const { emoji } = req.body;
    if (!emoji) throw new ApiError(400, 'Emoji required');

    const message = await Message.findById(req.params.id);
    if (!message) throw new ApiError(404, 'Message not found');
    if (message.isDeletedForEveryone) throw new ApiError(400, 'Cannot react to deleted message');

    const existingReaction = message.reactions.find(r => r.emoji === emoji);
    if (existingReaction) {
      const userIndex = existingReaction.users.indexOf(req.user._id.toString());
      if (userIndex > -1) {
        existingReaction.users.splice(userIndex, 1);
        if (existingReaction.users.length === 0) {
          message.reactions = message.reactions.filter(r => r.emoji !== emoji);
        }
      } else {
        existingReaction.users.push(req.user._id);
      }
    } else {
      message.reactions.push({ emoji, users: [req.user._id] });
    }

    await message.save();
    res.json(new ApiResponse(200, { reactions: message.reactions }, 'Reaction updated'));
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { conversationId, groupId } = req.body;
    const filter = {
      ...(groupId ? { groupId } : { conversationId }),
      sender: { $ne: req.user._id },
      'readBy.user': { $ne: req.user._id },
    };

    await Message.updateMany(filter, {
      $push: { readBy: { user: req.user._id, readAt: new Date() } },
    });

    res.json(new ApiResponse(200, null, 'Messages marked as read'));
  } catch (error) {
    next(error);
  }
};

export const pinMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) throw new ApiError(404, 'Message not found');

    const filter = {
      messageId: message._id,
      ...(message.conversationId ? { conversationId: message.conversationId } : { groupId: message.groupId }),
    };

    const existing = await PinnedMessage.findOne(filter);
    if (existing) {
      await existing.deleteOne();
      return res.json(new ApiResponse(200, { pinned: false }, 'Message unpinned'));
    }

    await PinnedMessage.create({ ...filter, pinnedBy: req.user._id });
    res.json(new ApiResponse(200, { pinned: true }, 'Message pinned'));
  } catch (error) {
    next(error);
  }
};

export const getPinnedMessages = async (req, res, next) => {
  try {
    const { conversationId, groupId } = req.query;
    const filter = conversationId ? { conversationId } : { groupId };

    const pinned = await PinnedMessage.find(filter)
      .populate({
        path: 'messageId',
        populate: { path: 'sender', select: 'username name avatar' },
      })
      .populate('pinnedBy', 'username avatar')
      .sort({ createdAt: -1 });

    res.json(new ApiResponse(200, { pinnedMessages: pinned }));
  } catch (error) {
    next(error);
  }
};

export const searchMessages = async (req, res, next) => {
  try {
    const { q, conversationId, groupId } = req.query;
    if (!q || q.trim().length < 1) return res.json(new ApiResponse(200, { messages: [] }));

    const filter = {
      $text: { $search: q },
      type: 'text',
      isDeletedForEveryone: false,
      deletedFor: { $ne: req.user._id },
      ...(groupId ? { groupId } : { conversationId }),
    };

    const messages = await Message.find(filter)
      .populate('sender', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(new ApiResponse(200, { messages }));
  } catch (error) {
    next(error);
  }
};

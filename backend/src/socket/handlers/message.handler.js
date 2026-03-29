import Message from '../../models/Message.model.js';
import Conversation from '../../models/Conversation.model.js';
import Group from '../../models/Group.model.js';
import { SOCKET_EVENTS } from '../../config/constants.js';
import { emitToUser } from '../socket.js';

export const handleMessageEvents = (io, socket, onlineUsers) => {
  // Send message via socket (alternative to REST for real-time feel)
  socket.on(SOCKET_EVENTS.SEND_MESSAGE, async (data) => {
    try {
      const { conversationId, groupId, content, type = 'text', replyTo, tempId } = data;

      if (!content?.trim() && type === 'text') return;
      if (!conversationId && !groupId) return;

      // Verify membership
      if (conversationId) {
        const conv = await Conversation.findOne({ _id: conversationId, participants: socket.userId });
        if (!conv) return socket.emit(SOCKET_EVENTS.ERROR, { message: 'Access denied' });
      }

      if (groupId) {
        const group = await Group.findOne({ _id: groupId, 'members.user': socket.userId });
        if (!group) return socket.emit(SOCKET_EVENTS.ERROR, { message: 'Access denied' });
      }

      const message = await Message.create({
        conversationId: conversationId || null,
        groupId: groupId || null,
        sender: socket.userId,
        content: content?.trim() || '',
        type,
        replyTo: replyTo || null,
      });

      const populated = await message.populate([
        { path: 'sender', select: 'username name avatar isOnline' },
        { path: 'replyTo', populate: { path: 'sender', select: 'username name avatar' } },
      ]);

      // Update last message
      const roomId = conversationId || groupId;
      if (conversationId) {
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: message._id,
          lastMessageAt: new Date(),
          isActive: true,
        });
      } else {
        await Group.findByIdAndUpdate(groupId, {
          lastMessage: message._id,
          lastMessageAt: new Date(),
        });
      }

      // Emit to all in room
      io.to(roomId).emit(SOCKET_EVENTS.NEW_MESSAGE, {
        message: populated,
        tempId,
        roomId,
      });

      // Mark as delivered to online users
      const recipientIds = conversationId
        ? (await Conversation.findById(conversationId)).participants
            .filter(p => p.toString() !== socket.userId)
        : (await Group.findById(groupId)).members
            .filter(m => m.user.toString() !== socket.userId)
            .map(m => m.user);

      const deliveries = [];
      for (const recipientId of recipientIds) {
        if (onlineUsers.has(recipientId.toString())) {
          deliveries.push({ user: recipientId, deliveredAt: new Date() });
        }
      }

      if (deliveries.length > 0) {
        await Message.findByIdAndUpdate(message._id, { $push: { deliveredTo: { $each: deliveries } } });
        socket.emit(SOCKET_EVENTS.MESSAGE_DELIVERED, { messageId: message._id, deliveredTo: deliveries });
      }

    } catch (err) {
      console.error('Send message socket error:', err);
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Failed to send message' });
    }
  });

  // Mark messages as read
  socket.on(SOCKET_EVENTS.MESSAGE_READ, async ({ conversationId, groupId, messageId }) => {
    try {
      const roomId = conversationId || groupId;
      const filter = {
        ...(groupId ? { groupId } : { conversationId }),
        sender: { $ne: socket.userId },
        'readBy.user': { $ne: socket.userId },
      };

      if (messageId) filter._id = { $lte: messageId };

      await Message.updateMany(filter, {
        $push: { readBy: { user: socket.userId, readAt: new Date() } },
      });

      // Notify sender(s) of read receipt
      io.to(roomId).emit(SOCKET_EVENTS.MESSAGE_READ, {
        readBy: socket.userId,
        roomId,
        messageId,
        readAt: new Date(),
      });
    } catch (err) {
      console.error('Mark read socket error:', err);
    }
  });

  // React to message
  socket.on(SOCKET_EVENTS.MESSAGE_REACTION, async ({ messageId, emoji }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message || message.isDeletedForEveryone) return;

      const existing = message.reactions.find(r => r.emoji === emoji);
      if (existing) {
        const idx = existing.users.findIndex(u => u.toString() === socket.userId);
        if (idx > -1) {
          existing.users.splice(idx, 1);
          if (existing.users.length === 0) {
            message.reactions = message.reactions.filter(r => r.emoji !== emoji);
          }
        } else {
          existing.users.push(socket.userId);
        }
      } else {
        message.reactions.push({ emoji, users: [socket.userId] });
      }

      await message.save();

      const roomId = (message.conversationId || message.groupId).toString();
      io.to(roomId).emit(SOCKET_EVENTS.REACTION_UPDATED, {
        messageId,
        reactions: message.reactions,
      });
    } catch (err) {
      console.error('Reaction socket error:', err);
    }
  });
};

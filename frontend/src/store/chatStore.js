import { create } from 'zustand';
import { conversationService } from '@services/conversation.service';
import { messageService } from '@services/message.service';
import { groupService } from '@services/group.service';
import toast from 'react-hot-toast';

export const useChatStore = create((set, get) => ({
  conversations: [],
  groups: [],
  activeConversationId: null,
  activeGroupId: null,
  messages: {}, // { [roomId]: Message[] }
  hasMore: {}, // { [roomId]: boolean }
  nextCursor: {}, // { [roomId]: string | null }
  unreadCounts: {}, // { [roomId]: number }
  typingUsers: {}, // { [roomId]: { userId, username, avatar }[] }
  pinnedMessages: {}, // { [roomId]: PinnedMessage[] }
  isLoadingMessages: false,

  fetchConversations: async () => {
    try {
      const res = await conversationService.getAll();
      const convs = res.data.data.conversations;
      const unreadCounts = {};
      convs.forEach(c => { unreadCounts[c._id] = c.unreadCount || 0; });
      set({ conversations: convs, unreadCounts: { ...get().unreadCounts, ...unreadCounts } });
    } catch (err) {
      toast.error('Failed to load conversations');
    }
  },

  fetchGroups: async () => {
    try {
      const res = await groupService.getAll();
      const groups = res.data.data.groups;
      const unreadCounts = {};
      groups.forEach(g => { unreadCounts[g._id] = g.unreadCount || 0; });
      set({ groups, unreadCounts: { ...get().unreadCounts, ...unreadCounts } });
    } catch {}
  },

  setActiveConversation: (conversationId) => {
    set({ activeConversationId: conversationId, activeGroupId: null });
  },

  setActiveGroup: (groupId) => {
    set({ activeGroupId: groupId, activeConversationId: null });
  },

  fetchMessages: async (roomId, isGroup = false, cursor = null) => {
    const { isLoadingMessages } = get();
    if (isLoadingMessages) return;
    set({ isLoadingMessages: true });
    try {
      const params = { limit: 50 };
      if (cursor) params.cursor = cursor;
      if (isGroup) params.groupId = roomId;

      const endpoint = isGroup ? 'group' : roomId;
      const res = await messageService.getMessages(endpoint, params);
      const { messages, hasMore, nextCursor } = res.data.data;

      set(state => ({
        messages: {
          ...state.messages,
          [roomId]: cursor
            ? [...messages, ...(state.messages[roomId] || [])]
            : messages,
        },
        hasMore: { ...state.hasMore, [roomId]: hasMore },
        nextCursor: { ...state.nextCursor, [roomId]: nextCursor },
        isLoadingMessages: false,
      }));
    } catch {
      set({ isLoadingMessages: false });
    }
  },

  addMessage: (message) => {
    const roomId = (message.conversationId || message.groupId)?._id || message.conversationId || message.groupId;
    if (!roomId) return;
    set(state => ({
      messages: {
        ...state.messages,
        [roomId]: [...(state.messages[roomId] || []), message],
      },
    }));
    // Update last message in conversation/group list
    get().updateLastMessage(roomId, message);
  },

  updateLastMessage: (roomId, message) => {
    set(state => ({
      conversations: state.conversations.map(c =>
        c._id === roomId ? { ...c, lastMessage: message, lastMessageAt: message.createdAt } : c
      ),
      groups: state.groups.map(g =>
        g._id === roomId ? { ...g, lastMessage: message, lastMessageAt: message.createdAt } : g
      ),
    }));
  },

  updateMessage: (messageId, updates) => {
    set(state => {
      const newMessages = { ...state.messages };
      for (const roomId of Object.keys(newMessages)) {
        newMessages[roomId] = newMessages[roomId].map(m =>
          m._id === messageId ? { ...m, ...updates } : m
        );
      }
      return { messages: newMessages };
    });
  },

  removeMessage: (messageId, roomId) => {
    set(state => ({
      messages: {
        ...state.messages,
        [roomId]: (state.messages[roomId] || []).filter(m => m._id !== messageId),
      },
    }));
  },

  incrementUnread: (roomId) => {
    const { activeConversationId, activeGroupId } = get();
    if (roomId === activeConversationId || roomId === activeGroupId) return;
    set(state => ({
      unreadCounts: {
        ...state.unreadCounts,
        [roomId]: (state.unreadCounts[roomId] || 0) + 1,
      },
    }));
  },

  clearUnread: (roomId) => {
    set(state => ({
      unreadCounts: { ...state.unreadCounts, [roomId]: 0 },
    }));
  },

  setTyping: (roomId, user, isTyping) => {
    set(state => {
      const current = state.typingUsers[roomId] || [];
      const updated = isTyping
        ? current.some(u => u.userId === user.userId) ? current : [...current, user]
        : current.filter(u => u.userId !== user.userId);
      return { typingUsers: { ...state.typingUsers, [roomId]: updated } };
    });
  },

  setPinnedMessages: (roomId, messages) => {
    set(state => ({ pinnedMessages: { ...state.pinnedMessages, [roomId]: messages } }));
  },

  getOrCreateConversation: async (recipientId) => {
    const res = await conversationService.getOrCreate(recipientId);
    const conversation = res.data.data.conversation;
    set(state => {
      const exists = state.conversations.find(c => c._id === conversation._id);
      return exists
        ? state
        : { conversations: [conversation, ...state.conversations] };
    });
    return conversation;
  },

  deleteConversation: async (conversationId) => {
    await conversationService.delete(conversationId);
    set(state => ({
      conversations: state.conversations.filter(c => c._id !== conversationId),
      messages: Object.fromEntries(Object.entries(state.messages).filter(([k]) => k !== conversationId)),
    }));
  },

  leaveGroup: async (groupId) => {
    await groupService.leave(groupId);
    set(state => ({
      groups: state.groups.filter(g => g._id !== groupId),
      messages: Object.fromEntries(Object.entries(state.messages).filter(([k]) => k !== groupId)),
    }));
  },
}));

import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '@store/authStore';
import { useChatStore } from '@store/chatStore';
import { SOCKET_EVENTS } from '@constants/socketEvents';
import toast from 'react-hot-toast';

let socket = null;

export const getSocket = () => socket;

export const useSocket = () => {
  const { user, isAuthenticated } = useAuthStore();
  const {
    addMessage, updateMessage, clearUnread,
    incrementUnread, setTyping, fetchConversations, fetchGroups,
  } = useChatStore();

  const connectedRef = useRef(false);

  const connect = useCallback(() => {
    if (socket?.connected || connectedRef.current) return;

    socket = io(import.meta.env.VITE_SOCKET_URL || '/', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      connectedRef.current = true;
      console.log('Socket connected:', socket.id);

      // Join all rooms
      const { conversations, groups } = useChatStore.getState();
      const rooms = [
        ...conversations.map(c => c._id),
        ...groups.map(g => g._id),
      ];
      if (rooms.length > 0) socket.emit(SOCKET_EVENTS.JOIN_ROOMS, rooms);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      connectedRef.current = false;
      console.log('Socket disconnected:', reason);
    });

    socket.on(SOCKET_EVENTS.NEW_MESSAGE, ({ message, tempId, roomId }) => {
      const { activeConversationId, activeGroupId } = useChatStore.getState();
      const msgRoomId = roomId || message.conversationId || message.groupId;

      // Replace temp message or add new
      const state = useChatStore.getState();
      const roomMessages = state.messages[msgRoomId] || [];
      const tempIdx = roomMessages.findIndex(m => m._id === tempId || m.tempId === tempId);

      if (tempIdx > -1) {
        useChatStore.setState(s => ({
          messages: {
            ...s.messages,
            [msgRoomId]: s.messages[msgRoomId].map((m, i) =>
              i === tempIdx ? { ...message, confirmed: true } : m
            ),
          },
        }));
      } else {
        addMessage(message);
      }

      if (msgRoomId !== activeConversationId && msgRoomId !== activeGroupId) {
        if (message.sender?._id !== user?._id) {
          incrementUnread(msgRoomId);
          if (Notification.permission === 'granted') {
            new Notification(message.sender?.username || 'New message', {
              body: message.content || '📎 File',
              icon: message.sender?.avatar || '/favicon.ico',
            });
          }
        }
      } else {
        // Auto-read if in active room
        socket.emit(SOCKET_EVENTS.MESSAGE_READ, { conversationId: activeConversationId, groupId: activeGroupId });
      }
    });

    socket.on(SOCKET_EVENTS.MESSAGE_EDITED, (updatedMessage) => {
      updateMessage(updatedMessage._id, updatedMessage);
    });

    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, ({ messageId, deleteForEveryone }) => {
      if (deleteForEveryone) {
        updateMessage(messageId, { isDeletedForEveryone: true, content: '', fileUrl: null });
      }
    });

    socket.on(SOCKET_EVENTS.MESSAGE_READ, ({ readBy, roomId, readAt }) => {
      // Update read status for our messages
      const state = useChatStore.getState();
      if (!state.messages[roomId]) return;
      useChatStore.setState(s => ({
        messages: {
          ...s.messages,
          [roomId]: s.messages[roomId].map(m => {
            if (m.sender?._id === user?._id || m.sender === user?._id) {
              const alreadyRead = m.readBy?.some(r => r.user === readBy || r.user?._id === readBy);
              if (!alreadyRead) {
                return { ...m, readBy: [...(m.readBy || []), { user: readBy, readAt }] };
              }
            }
            return m;
          }),
        },
      }));
    });

    socket.on(SOCKET_EVENTS.REACTION_UPDATED, ({ messageId, reactions }) => {
      updateMessage(messageId, { reactions });
    });

    socket.on(SOCKET_EVENTS.TYPING_STARTED, ({ userId, username, avatar, roomId }) => {
      if (userId !== user?._id) {
        setTyping(roomId, { userId, username, avatar }, true);
      }
    });

    socket.on(SOCKET_EVENTS.TYPING_STOPPED, ({ userId, roomId }) => {
      setTyping(roomId, { userId }, false);
    });

    socket.on(SOCKET_EVENTS.USER_ONLINE, ({ userId }) => {
      useChatStore.setState(s => ({
        conversations: s.conversations.map(c => ({
          ...c,
          participants: c.participants?.map(p =>
            (p._id || p) === userId ? { ...p, isOnline: true } : p
          ),
        })),
      }));
    });

    socket.on(SOCKET_EVENTS.USER_OFFLINE, ({ userId, lastSeen }) => {
      useChatStore.setState(s => ({
        conversations: s.conversations.map(c => ({
          ...c,
          participants: c.participants?.map(p =>
            (p._id || p) === userId ? { ...p, isOnline: false, lastSeen } : p
          ),
        })),
      }));
    });

    socket.on(SOCKET_EVENTS.ERROR, ({ message }) => {
      toast.error(message || 'Socket error');
    });

  }, [user, addMessage, updateMessage, clearUnread, incrementUnread, setTyping]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      socket = null;
      connectedRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      connect();
    } else {
      disconnect();
    }
    return () => {};
  }, [isAuthenticated, user, connect, disconnect]);

  return { socket, connect, disconnect };
};

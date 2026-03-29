import { SOCKET_EVENTS } from '../../config/constants.js';

const typingUsers = new Map(); // roomId -> Map<userId, timeout>

export const handleUserEvents = (io, socket, onlineUsers) => {
  // Typing start
  socket.on(SOCKET_EVENTS.TYPING_START, ({ conversationId, groupId }) => {
    const roomId = conversationId || groupId;
    if (!roomId) return;

    if (!typingUsers.has(roomId)) {
      typingUsers.set(roomId, new Map());
    }

    const roomTyping = typingUsers.get(roomId);

    // Clear existing timeout
    if (roomTyping.has(socket.userId)) {
      clearTimeout(roomTyping.get(socket.userId));
    }

    // Auto-stop typing after 5 seconds
    const timeout = setTimeout(() => {
      roomTyping.delete(socket.userId);
      socket.to(roomId).emit(SOCKET_EVENTS.TYPING_STOPPED, {
        userId: socket.userId,
        roomId,
      });
    }, 5000);

    roomTyping.set(socket.userId, timeout);

    socket.to(roomId).emit(SOCKET_EVENTS.TYPING_STARTED, {
      userId: socket.userId,
      username: socket.user.username,
      avatar: socket.user.avatar,
      roomId,
    });
  });

  // Typing stop
  socket.on(SOCKET_EVENTS.TYPING_STOP, ({ conversationId, groupId }) => {
    const roomId = conversationId || groupId;
    if (!roomId) return;

    const roomTyping = typingUsers.get(roomId);
    if (roomTyping?.has(socket.userId)) {
      clearTimeout(roomTyping.get(socket.userId));
      roomTyping.delete(socket.userId);
    }

    socket.to(roomId).emit(SOCKET_EVENTS.TYPING_STOPPED, {
      userId: socket.userId,
      roomId,
    });
  });

  // Clean up typing on disconnect
  socket.on('disconnect', () => {
    typingUsers.forEach((roomTyping, roomId) => {
      if (roomTyping.has(socket.userId)) {
        clearTimeout(roomTyping.get(socket.userId));
        roomTyping.delete(socket.userId);
        socket.to(roomId).emit(SOCKET_EVENTS.TYPING_STOPPED, {
          userId: socket.userId,
          roomId,
        });
      }
    });
  });
};

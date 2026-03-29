import Group from '../../models/Group.model.js';
import { SOCKET_EVENTS } from '../../config/constants.js';

export const handleGroupEvents = (io, socket, onlineUsers) => {
  // Join a specific room (used when entering a chat)
  socket.on(SOCKET_EVENTS.JOIN_ROOM, async ({ roomId, type }) => {
    try {
      if (type === 'group') {
        const group = await Group.findOne({ _id: roomId, 'members.user': socket.userId });
        if (!group) return socket.emit(SOCKET_EVENTS.ERROR, { message: 'Access denied' });
      }
      socket.join(roomId);
    } catch (err) {
      console.error('Join room error:', err);
    }
  });

  socket.on(SOCKET_EVENTS.LEAVE_ROOM, ({ roomId }) => {
    socket.leave(roomId);
  });
};

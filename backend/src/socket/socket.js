import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import { SOCKET_EVENTS } from '../config/constants.js';
import { handleMessageEvents } from './handlers/message.handler.js';
import { handleUserEvents } from './handlers/user.handler.js';
import { handleGroupEvents } from './handlers/group.handler.js';
import { activeSocketConnections } from '../config/metrics.js';

let io;
const onlineUsers = new Map(); // userId -> Set of socketIds

export const getIO = () => io;
export const getOnlineUsers = () => onlineUsers;

export const getUserSocketIds = (userId) => {
  return onlineUsers.get(userId.toString()) || new Set();
};

export const emitToUser = (userId, event, data) => {
  const socketIds = getUserSocketIds(userId);
  socketIds.forEach(socketId => {
    io.to(socketId).emit(event, data);
  });
};

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.cookie
        ?.split(';')
        .find(c => c.trim().startsWith('accessToken='))
        ?.split('=')[1];

      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) return next(new Error('User not found'));

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`🔌 Socket connected: ${userId} (${socket.id})`);

    // Track socket
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);
    activeSocketConnections.inc();

    // Update user online status
    await User.findByIdAndUpdate(userId, { isOnline: true });

    // Broadcast online status to all connected clients
    socket.broadcast.emit(SOCKET_EVENTS.USER_ONLINE, { userId });

    // Register event handlers
    handleMessageEvents(io, socket, onlineUsers);
    handleUserEvents(io, socket, onlineUsers);
    handleGroupEvents(io, socket, onlineUsers);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Handle join rooms request (join all conversation/group rooms)
    socket.on(SOCKET_EVENTS.JOIN_ROOMS, async (rooms) => {
      if (Array.isArray(rooms)) {
        rooms.forEach(roomId => {
          if (typeof roomId === 'string') socket.join(roomId);
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', async (reason) => {
      console.log(`🔌 Socket disconnected: ${userId} (${socket.id}) - ${reason}`);

      activeSocketConnections.dec();
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          // User is fully offline
          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen: new Date(),
          });
          socket.broadcast.emit(SOCKET_EVENTS.USER_OFFLINE, {
            userId,
            lastSeen: new Date(),
          });
        }
      }
    });

    socket.on('error', (err) => {
      console.error(`Socket error for ${userId}:`, err);
    });
  });

  console.log('✅ Socket.io initialized');
  return io;
};

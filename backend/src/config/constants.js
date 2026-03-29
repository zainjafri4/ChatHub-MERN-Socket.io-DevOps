export const SOCKET_EVENTS = {
  // Messages
  SEND_MESSAGE: 'message:send',
  NEW_MESSAGE: 'message:new',
  MESSAGE_DELIVERED: 'message:delivered',
  MESSAGE_READ: 'message:read',
  MESSAGE_EDITED: 'message:edited',
  MESSAGE_DELETED: 'message:deleted',
  // Typing
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  TYPING_STARTED: 'typing:started',
  TYPING_STOPPED: 'typing:stopped',
  // User status
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  // Rooms
  JOIN_ROOMS: 'join:rooms',
  JOIN_ROOM: 'room:join',
  LEAVE_ROOM: 'room:leave',
  // Reactions
  MESSAGE_REACTION: 'message:reaction',
  REACTION_UPDATED: 'reaction:updated',
  // Groups
  GROUP_UPDATED: 'group:updated',
  MEMBER_ADDED: 'member:added',
  MEMBER_REMOVED: 'member:removed',
  // Errors
  ERROR: 'error',
};

export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  FILE: 'file',
  SYSTEM: 'system',
};

export const DELETE_FOR_EVERYONE_WINDOW_MINUTES = 60;

export const PAGINATION = {
  MESSAGES_PER_PAGE: 50,
  USERS_PER_PAGE: 20,
  GROUPS_PER_PAGE: 20,
};

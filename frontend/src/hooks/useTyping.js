import { useCallback, useRef } from 'react';
import { getSocket } from './useSocket';
import { SOCKET_EVENTS } from '@constants/socketEvents';

export const useTyping = (conversationId, groupId) => {
  const typingRef = useRef(false);
  const timeoutRef = useRef(null);

  const startTyping = useCallback(() => {
    const socket = getSocket();
    if (!socket) return;
    if (!typingRef.current) {
      typingRef.current = true;
      socket.emit(SOCKET_EVENTS.TYPING_START, { conversationId, groupId });
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [conversationId, groupId]);

  const stopTyping = useCallback(() => {
    const socket = getSocket();
    if (!socket) return;
    if (typingRef.current) {
      typingRef.current = false;
      socket.emit(SOCKET_EVENTS.TYPING_STOP, { conversationId, groupId });
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [conversationId, groupId]);

  return { startTyping, stopTyping };
};

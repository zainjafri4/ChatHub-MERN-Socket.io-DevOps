import { useEffect, useCallback } from 'react';
import { useChatStore } from '@store/chatStore';

export const useInfiniteMessages = (roomId, isGroup = false) => {
  const { fetchMessages, messages, hasMore, nextCursor, isLoadingMessages } = useChatStore();

  useEffect(() => {
    if (roomId && !messages[roomId]) {
      fetchMessages(roomId, isGroup);
    }
  }, [roomId, isGroup]);

  const loadMore = useCallback(() => {
    if (!isLoadingMessages && hasMore[roomId] && nextCursor[roomId]) {
      fetchMessages(roomId, isGroup, nextCursor[roomId]);
    }
  }, [roomId, isGroup, isLoadingMessages, hasMore, nextCursor]);

  return {
    messages: messages[roomId] || [],
    hasMore: hasMore[roomId] || false,
    isLoading: isLoadingMessages,
    loadMore,
  };
};

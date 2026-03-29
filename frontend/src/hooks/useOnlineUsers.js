import { useChatStore } from '@store/chatStore';

export const useOnlineUsers = (participants) => {
  const conversations = useChatStore(s => s.conversations);

  const getIsOnline = (userId) => {
    for (const conv of conversations) {
      const participant = conv.participants?.find(p => (p._id || p) === userId);
      if (participant) return participant.isOnline || false;
    }
    return false;
  };

  return { getIsOnline };
};

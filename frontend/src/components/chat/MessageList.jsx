import { useEffect, useRef, memo, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import MessageItem from './MessageItem';
import TypingIndicator from './TypingIndicator';
import Loader from '@components/common/Loader';
import { formatMessageDate, isSameDay } from '@utils/formatDate';
import { useChatStore } from '@store/chatStore';
import { useAuthStore } from '@store/authStore';
import { messageService } from '@services/message.service';
import { getSocket } from '@hooks/useSocket';
import { SOCKET_EVENTS } from '@constants/socketEvents';

function MessageList({ roomId, isGroup, onReply }) {
  const { user } = useAuthStore();
  const { messages: allMessages, hasMore, isLoadingMessages, fetchMessages, typingUsers, nextCursor, clearUnread } = useChatStore();
  const messages = allMessages[roomId] || [];
  const typing = typingUsers[roomId] || [];
  const bottomRef = useRef(null);
  const prevHeightRef = useRef(0);
  const containerRef = useRef(null);

  const { ref: topRef } = useInView({
    threshold: 0.1,
    onChange: (inView) => {
      if (inView && hasMore[roomId] && !isLoadingMessages && nextCursor[roomId]) {
        const container = containerRef.current;
        prevHeightRef.current = container?.scrollHeight || 0;
        fetchMessages(roomId, isGroup, nextCursor[roomId]);
      }
    },
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
    if (isNearBottom || messages.length <= 50) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Restore scroll position after loading more
  useEffect(() => {
    const container = containerRef.current;
    if (container && prevHeightRef.current > 0) {
      container.scrollTop = container.scrollHeight - prevHeightRef.current;
      prevHeightRef.current = 0;
    }
  }, [isLoadingMessages]);

  // Mark as read when visible
  useEffect(() => {
    if (!roomId) return;
    const socket = getSocket();
    if (socket) {
      socket.emit(SOCKET_EVENTS.MESSAGE_READ, isGroup ? { groupId: roomId } : { conversationId: roomId });
    }
    clearUnread(roomId);
  }, [roomId, messages.length]);

  // Group messages by day
  const grouped = [];
  let lastDate = null;
  messages.forEach((msg, i) => {
    const msgDate = new Date(msg.createdAt);
    if (!lastDate || !isSameDay(lastDate, msgDate)) {
      grouped.push({ type: 'date', date: msgDate, id: `date-${i}` });
      lastDate = msgDate;
    }
    grouped.push({ type: 'message', message: msg, id: msg._id });
  });

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto py-4">
      {/* Load more trigger */}
      <div ref={topRef} className="h-4" />
      {isLoadingMessages && messages.length === 0 && (
        <div className="flex justify-center py-8"><Loader /></div>
      )}
      {hasMore[roomId] && isLoadingMessages && messages.length > 0 && (
        <div className="flex justify-center py-2"><Loader size="sm" /></div>
      )}

      {grouped.map(item => {
        if (item.type === 'date') return (
          <div key={item.id} className="flex items-center gap-3 px-4 my-4">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-gray-500 dark:text-gray-400 px-2 font-medium">{formatMessageDate(item.date)}</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>
        );

        const msg = item.message;
        const isOwn = msg.sender?._id === user?._id || msg.sender === user?._id;
        const prevMsg = messages[messages.indexOf(msg) - 1];
        const showAvatar = !isOwn && (!prevMsg || prevMsg.sender?._id !== msg.sender?._id);

        return (
          <MessageItem key={item.id} message={msg} isOwn={isOwn} showAvatar={showAvatar} isGroupChat={isGroup} onReply={onReply} />
        );
      })}

      <TypingIndicator typingUsers={typing} />
      <div ref={bottomRef} />
    </div>
  );
}
export default memo(MessageList);

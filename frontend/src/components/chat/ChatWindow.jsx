import { useState, useEffect } from 'react';
import { useAuthStore } from '@store/authStore';
import { useChatStore } from '@store/chatStore';
import { useUIStore } from '@store/uiStore';
import Avatar from '@components/common/Avatar';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import PinnedMessageBanner from './PinnedMessageBanner';
import EmptyState from '@components/common/EmptyState';
import Loader from '@components/common/Loader';
import { messageService } from '@services/message.service';
import { formatLastSeen } from '@utils/formatDate';
import { getSocket } from '@hooks/useSocket';
import { SOCKET_EVENTS } from '@constants/socketEvents';
import Button from '@components/common/Button';

export default function ChatWindow({ conversationId, groupId }) {
  const { user } = useAuthStore();
  const { conversations, groups, fetchMessages, setPinnedMessages } = useChatStore();
  const { toggleRightSidebar } = useUIStore();
  const [replyTo, setReplyTo] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isGroup = !!groupId;
  const roomId = conversationId || groupId;

  const conversation = conversationId ? conversations.find(c => c._id === conversationId) : null;
  const group = groupId ? groups.find(g => g._id === groupId) : null;

  const otherParticipant = conversation?.participants?.find(p => p._id !== user?._id);
  const hasName = !!(otherParticipant?.name?.firstName);
  const chatDisplayName = isGroup
    ? group?.name
    : hasName
      ? `${otherParticipant.name.firstName} ${otherParticipant.name.lastName}`.trim()
      : otherParticipant?.username;
  const chatUsername = !isGroup && hasName ? otherParticipant?.username : null;
  const chatAvatar = isGroup ? group?.avatar : otherParticipant?.avatar;
  const isOnline = !isGroup && otherParticipant?.isOnline;
  const lastSeen = !isGroup && otherParticipant?.lastSeen;

  useEffect(() => {
    if (!roomId) return;
    fetchMessages(roomId, isGroup);

    // Load pinned messages
    const params = isGroup ? { groupId: roomId } : { conversationId: roomId };
    messageService.getPinned(params).then(res => {
      setPinnedMessages(roomId, res.data.data.pinnedMessages || []);
    }).catch(() => {});

    // Join socket room
    const socket = getSocket();
    if (socket) {
      socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId, type: isGroup ? 'group' : 'conversation' });
    }
    return () => {
      socket?.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomId });
    };
  }, [roomId, isGroup]);

  if (!roomId) {
    return (
      <EmptyState
        icon="💬"
        title="Select a conversation"
        description="Choose from your existing conversations or start a new one to begin chatting"
      />
    );
  }

  if (!conversation && !group) {
    return <div className="flex-1 flex items-center justify-center"><Loader /></div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar
            src={chatAvatar}
            username={chatDisplayName}
            size="md"
            isOnline={!isGroup ? isOnline : undefined}
          />
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{chatDisplayName}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {isGroup
                ? `${group?.members?.length || 0} members`
                : chatUsername
                  ? `@${chatUsername} · ${isOnline ? 'Online' : formatLastSeen(lastSeen)}`
                  : isOnline ? 'Online' : formatLastSeen(lastSeen)
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(!isSearchOpen)} title="Search messages">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleRightSidebar} title="Chat info">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </Button>
        </div>
      </div>

      {/* Search bar */}
      {isSearchOpen && (
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <input
            type="search"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input-field text-sm"
            autoFocus
          />
        </div>
      )}

      {/* Pinned message banner */}
      <PinnedMessageBanner roomId={roomId} />

      {/* Messages */}
      <MessageList roomId={roomId} isGroup={isGroup} onReply={setReplyTo} />

      {/* Input */}
      <MessageInput
        conversationId={conversationId}
        groupId={groupId}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
}

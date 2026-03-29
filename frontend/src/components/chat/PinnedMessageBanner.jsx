import { useState } from 'react';
import { useChatStore } from '@store/chatStore';
import { messageService } from '@services/message.service';
import toast from 'react-hot-toast';

export default function PinnedMessageBanner({ roomId }) {
  const { pinnedMessages } = useChatStore();
  const [expanded, setExpanded] = useState(false);
  const pinned = pinnedMessages[roomId] || [];
  if (!pinned.length) return null;
  const latest = pinned[0];

  return (
    <div className="bg-primary-50 dark:bg-primary-900/20 border-b border-primary-200 dark:border-primary-800 px-4 py-2 flex items-center gap-3">
      <svg className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-primary-700 dark:text-primary-300">Pinned Message</p>
        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
          {latest.messageId?.content || latest.messageId?.fileName || '📎 File'}
        </p>
      </div>
      {pinned.length > 1 && (
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex-shrink-0">
          {expanded ? 'Show less' : `+${pinned.length - 1} more`}
        </button>
      )}
    </div>
  );
}

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { useAuthStore } from '@store/authStore';
import Avatar from '@components/common/Avatar';
import { formatMessageTime } from '@utils/formatDate';
import { messageService } from '@services/message.service';
import { useChatStore } from '@store/chatStore';
import { getSocket } from '@hooks/useSocket';
import { SOCKET_EVENTS } from '@constants/socketEvents';
import toast from 'react-hot-toast';

// ── Dropdown menu that appears when ⋮ is clicked ──────────────────────────────
// Rendered inside the action bar so it opens downward from the button.
function MessageMenu({ message, isOwn, onEdit, onDelete, onPin, onReply, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const item = (label, onClick, danger = false) => (
    <button
      onClick={() => { onClick(); onClose(); }}
      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${danger ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-200'}`}
    >
      {label}
    </button>
  );

  return (
    <div
      ref={ref}
      className={`absolute top-full mt-1 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1 min-w-[150px] ${isOwn ? 'right-0' : 'left-0'}`}
    >
      {item('↩ Reply', onReply)}
      {isOwn && item('✏️ Edit', onEdit)}
      {item('📌 Pin', onPin)}
      {item('🗑 Delete for me', () => onDelete(false))}
      {isOwn && item('🗑 Unsend', () => onDelete(true), true)}
    </div>
  );
}

function MessageItem({ message, isOwn, showAvatar, onReply, isGroupChat }) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const { updateMessage } = useChatStore();

  const handleEdit = async () => {
    if (!editContent.trim() || editContent === message.content) { setIsEditing(false); return; }
    try {
      const res = await messageService.edit(message._id, editContent.trim());
      updateMessage(message._id, res.data.data.message);
      setIsEditing(false);
    } catch { toast.error('Failed to edit message'); }
  };

  const handleDelete = async (forEveryone) => {
    try {
      await messageService.delete(message._id, forEveryone);
      if (forEveryone) updateMessage(message._id, { isDeletedForEveryone: true, content: '' });
      else {
        const roomId = message.conversationId || message.groupId;
        useChatStore.getState().removeMessage(message._id, roomId);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete message');
    }
  };

  const handlePin = async () => {
    try {
      const res = await messageService.pin(message._id);
      toast.success(res.data.data.pinned ? 'Message pinned' : 'Message unpinned');
    } catch { toast.error('Failed to pin message'); }
  };

  const handleReaction = useCallback((emoji) => {
    const socket = getSocket();
    if (socket) socket.emit(SOCKET_EVENTS.MESSAGE_REACTION, { messageId: message._id, emoji });
  }, [message._id]);

  const senderName = message.sender?.name?.firstName
    ? `${message.sender.name.firstName} ${message.sender.name.lastName}`.trim()
    : message.sender?.username;

  const replyName = message.replyTo?.sender?.name?.firstName
    ? `${message.replyTo.sender.name.firstName} ${message.replyTo.sender.name.lastName}`.trim()
    : message.replyTo?.sender?.username;

  if (message.isDeletedForEveryone) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1 px-4`}>
        <div className="text-xs text-gray-400 dark:text-gray-500 italic px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
          🗑 Message deleted
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 mb-1 px-4 group`}>
      {/* Avatar */}
      {!isOwn && showAvatar ? (
        <Avatar src={message.sender?.avatar} username={senderName} size="sm" className="mb-1 flex-shrink-0" />
      ) : !isOwn ? (
        <div className="w-8 flex-shrink-0" />
      ) : null}

      <div className={`max-w-xs lg:max-w-md xl:max-w-lg flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender name in group chats */}
        {isGroupChat && !isOwn && showAvatar && (
          <span className="text-xs text-primary-600 dark:text-primary-400 font-medium mb-1 px-1">
            {senderName}
          </span>
        )}

        {/* Reply preview */}
        {message.replyTo && (
          <div className="mb-1 px-3 py-1.5 rounded-t-lg border-l-2 border-primary-400 bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400 max-w-full">
            <span className="font-medium text-primary-600 dark:text-primary-400">{replyName}</span>
            <p className="truncate">{message.replyTo.content || '📎 File'}</p>
          </div>
        )}

        {/* Message bubble + hover action bar */}
        <div className={`flex items-center gap-1.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>

          {/* Bubble / edit mode */}
          <div>
            {isEditing ? (
              <div className="flex gap-2 items-end">
                <textarea
                  className="input-field text-sm resize-none min-w-[200px]"
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  rows={2}
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEdit(); }
                    if (e.key === 'Escape') setIsEditing(false);
                  }}
                />
                <div className="flex gap-1">
                  <button onClick={handleEdit} className="p-1 rounded bg-primary-600 text-white text-xs hover:bg-primary-700">✓</button>
                  <button onClick={() => setIsEditing(false)} className="p-1 rounded bg-gray-200 dark:bg-gray-600 text-xs">✕</button>
                </div>
              </div>
            ) : (
              <div className={isOwn ? 'message-bubble-sent' : 'message-bubble-received'}>
                {message.type === 'image' && message.fileUrl && (
                  <img src={message.fileUrl} alt="Image" className="rounded-lg max-w-full max-h-64 object-cover mb-1 cursor-pointer" onClick={() => window.open(message.fileUrl)} />
                )}
                {message.type === 'video' && message.fileUrl && (
                  <video src={message.fileUrl} controls className="rounded-lg max-w-full max-h-48 mb-1" />
                )}
                {message.type === 'audio' && message.fileUrl && (
                  <audio src={message.fileUrl} controls className="mb-1 max-w-full" />
                )}
                {message.type === 'file' && message.fileUrl && (
                  <a href={message.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm underline opacity-90 hover:opacity-100 mb-1">
                    📎 {message.fileName || 'File'}
                  </a>
                )}
                {message.content && (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                )}
                {message.linkPreview && (
                  <a href={message.linkPreview.url} target="_blank" rel="noreferrer"
                    className={`block mt-2 rounded-lg overflow-hidden border ${isOwn ? 'border-white/20 bg-white/10' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800'}`}>
                    {message.linkPreview.image && (
                      <img src={message.linkPreview.image} alt="" className="w-full h-32 object-cover" onError={e => e.target.style.display = 'none'} />
                    )}
                    <div className="p-2">
                      <p className={`text-xs font-medium truncate ${isOwn ? 'text-white/80' : 'text-gray-700 dark:text-gray-200'}`}>{message.linkPreview.title}</p>
                      <p className={`text-xs truncate ${isOwn ? 'text-white/60' : 'text-gray-500 dark:text-gray-400'}`}>{message.linkPreview.siteName}</p>
                    </div>
                  </a>
                )}
                <div className={`flex items-center gap-1.5 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  {message.isEdited && <span className="text-[10px] opacity-60">edited</span>}
                  <span className="text-[10px] opacity-60">{formatMessageTime(message.createdAt)}</span>
                  {isOwn && (
                    <span className="text-[10px] opacity-70">
                      {message.readBy?.length > 0 ? '✓✓' : message.deliveredTo?.length > 0 ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Hover action bar — emoji reactions + three-dots */}
          {/* relative so the dropdown is positioned from here, opening downward */}
          <div className={`relative flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-800 rounded-full shadow-md border border-gray-100 dark:border-gray-700 px-1.5 py-1`}>
            {['👍', '❤️', '😂', '😮', '😢'].map(emoji => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="text-base hover:scale-125 transition-transform px-0.5"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
            <div className="w-px h-4 bg-gray-200 dark:bg-gray-600 mx-0.5" />
            <button
              onClick={() => setShowMenu(m => !m)}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
              title="More options"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
              </svg>
            </button>

            {/* Dropdown opens downward from the action bar */}
            {showMenu && (
              <MessageMenu
                message={message}
                isOwn={isOwn}
                onEdit={() => setIsEditing(true)}
                onDelete={handleDelete}
                onPin={handlePin}
                onReply={() => onReply?.(message)}
                onClose={() => setShowMenu(false)}
              />
            )}
          </div>
        </div>

        {/* Reactions display */}
        {message.reactions?.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {message.reactions.map(r => (
              <button key={r.emoji} onClick={() => handleReaction(r.emoji)}
                className="inline-flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full px-2 py-0.5 transition-colors">
                {r.emoji} <span>{r.users.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export default memo(MessageItem);

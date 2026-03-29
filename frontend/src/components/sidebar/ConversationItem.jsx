import { memo, useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@store/authStore';
import { useChatStore } from '@store/chatStore';
import Avatar from '@components/common/Avatar';
import { formatConversationTime } from '@utils/formatDate';
import toast from 'react-hot-toast';

function ConversationItem({ conversation, isGroup = false }) {
  const { user } = useAuthStore();
  const { conversationId, groupId } = useParams();
  const navigate = useNavigate();
  const { deleteConversation, leaveGroup } = useChatStore();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const currentId = isGroup ? groupId : conversationId;
  const isActive = currentId === conversation._id;

  let displayName, username, avatar, isOnline, lastMessage, lastTime, hasName;

  if (isGroup) {
    displayName = conversation.name;
    avatar = conversation.avatar;
    lastMessage = conversation.lastMessage;
    lastTime = conversation.lastMessageAt;
  } else {
    const other = conversation.participants?.find(p => p._id !== user?._id);
    hasName = !!(other?.name?.firstName);
    displayName = hasName
      ? `${other.name.firstName} ${other.name.lastName}`.trim()
      : other?.username || 'Unknown';
    username = other?.username;
    avatar = other?.avatar;
    isOnline = other?.isOnline;
    lastMessage = conversation.lastMessage;
    lastTime = conversation.lastMessageAt;
  }

  const lastMessageText = lastMessage
    ? lastMessage.isDeletedForEveryone ? '🗑 Message deleted'
      : lastMessage.type !== 'text' ? `📎 ${lastMessage.fileName || lastMessage.type}`
      : lastMessage.content?.substring(0, 50) || ''
    : 'Start a conversation';

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClick = () => {
    if (isGroup) navigate(`/groups/${conversation._id}`);
    else navigate(`/chat/${conversation._id}`);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setShowMenu(false);
    try {
      if (isGroup) {
        await leaveGroup(conversation._id);
        toast.success('Left group');
        if (groupId === conversation._id) navigate('/chat');
      } else {
        await deleteConversation(conversation._id);
        toast.success('Conversation deleted');
        if (conversationId === conversation._id) navigate('/chat');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div className={`relative group/item ${showMenu ? 'z-20' : 'z-0'}`} style={showMenu ? { isolation: 'isolate' } : {}}>
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left ${isActive ? 'bg-primary-50 dark:bg-primary-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
      >
        <Avatar src={avatar} username={displayName} size="md" isOnline={!isGroup ? isOnline : undefined} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <div className="min-w-0">
              <span className={`block text-sm font-medium truncate ${isActive ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-gray-100'}`}>
                {displayName}
              </span>
              {!isGroup && hasName && username && (
                <span className="block text-xs text-gray-400 dark:text-gray-500 truncate">
                  @{username}
                </span>
              )}
            </div>
            {lastTime && (
              <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0 self-start mt-0.5">
                {formatConversationTime(lastTime)}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-1 mt-0.5">
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{lastMessageText}</p>
          </div>
        </div>
      </button>

      {/* Three-dots menu button — visible on hover */}
      <div ref={menuRef} className="absolute right-2 top-1/2 -translate-y-1/2">
        <button
          onClick={(e) => { e.stopPropagation(); setShowMenu(m => !m); }}
          className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 dark:text-gray-500 transition-opacity ${showMenu ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-100'}`}
          title="Options"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
          </svg>
        </button>

        {showMenu && (
          <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1 min-w-[170px]" style={{ zIndex: 9999 }}>
            <button
              onClick={handleDelete}
              className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {isGroup ? '🚪 Leave Group' : '🗑 Delete Conversation'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
export default memo(ConversationItem);

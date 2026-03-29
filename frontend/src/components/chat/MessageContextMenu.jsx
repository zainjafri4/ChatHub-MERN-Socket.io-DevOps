import { useEffect, useRef } from 'react';
import { useAuthStore } from '@store/authStore';

export default function MessageContextMenu({ message, position, onClose, onEdit, onDelete, onPin, onReply }) {
  const { user } = useAuthStore();
  const menuRef = useRef(null);
  const isOwn = message?.sender?._id === user?._id || message?.sender === user?._id;

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const actions = [
    { label: 'Reply', icon: '↩️', action: onReply, show: true },
    { label: 'Edit', icon: '✏️', action: onEdit, show: isOwn && message?.type === 'text' },
    { label: 'Pin', icon: '📌', action: onPin, show: true },
    { label: 'Delete', icon: '🗑️', action: onDelete, show: isOwn, danger: true },
  ].filter(a => a.show);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[150px]"
      style={{ top: Math.min(position.y, window.innerHeight - 200), left: Math.min(position.x, window.innerWidth - 160) }}
    >
      {actions.map(a => (
        <button key={a.label} onClick={() => { a.action?.(); onClose(); }}
          className={`flex items-center gap-3 w-full px-4 py-2 text-sm transition-colors ${a.danger ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
          <span>{a.icon}</span>{a.label}
        </button>
      ))}
    </div>
  );
}

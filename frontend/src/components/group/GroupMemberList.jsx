import { useState } from 'react';
import Avatar from '@components/common/Avatar';
import Button from '@components/common/Button';
import { useAuthStore } from '@store/authStore';
import { groupService } from '@services/group.service';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '@store/chatStore';
import toast from 'react-hot-toast';

export default function GroupMemberList({ group, onUpdate }) {
  const { user } = useAuthStore();
  const [loadingId, setLoadingId] = useState(null);
  const navigate = useNavigate();

  const isAdmin = group?.admin?._id === user?._id || group?.admin === user?._id;

  const handleRemove = async (memberId) => {
    if (!confirm('Remove this member?')) return;
    setLoadingId(memberId);
    try {
      await groupService.removeMember(group._id, memberId);
      toast.success('Member removed');
      onUpdate?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    } finally { setLoadingId(null); }
  };

  const handleMessage = async (memberId) => {
    const { getOrCreateConversation } = useChatStore.getState();
    try {
      const conv = await getOrCreateConversation(memberId);
      navigate(`/chat/${conv._id}`);
    } catch { toast.error('Failed to open chat'); }
  };

  const members = group?.members || [];

  return (
    <div className="space-y-1">
      {members.map(m => {
        const memberUser = m.user || m;
        const role = m.role || 'member';
        const isCurrentUser = memberUser._id === user?._id;
        return (
          <div key={memberUser._id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 group">
            <Avatar src={memberUser.avatar} username={memberUser.username} size="sm" isOnline={memberUser.isOnline} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{memberUser.username} {isCurrentUser && <span className="text-xs text-gray-400">(You)</span>}</span>
                {role !== 'member' && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${role === 'admin' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'}`}>{role}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!isCurrentUser && (
                <Button variant="ghost" size="sm" onClick={() => handleMessage(memberUser._id)} title="Message">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </Button>
              )}
              {isAdmin && !isCurrentUser && (
                <Button variant="ghost" size="sm" onClick={() => handleRemove(memberUser._id)} isLoading={loadingId === memberUser._id} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" /></svg>
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

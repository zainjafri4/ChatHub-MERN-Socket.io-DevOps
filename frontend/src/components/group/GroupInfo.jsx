import { useState } from 'react';
import Avatar from '@components/common/Avatar';
import Button from '@components/common/Button';
import GroupMemberList from './GroupMemberList';
import SearchUsers from '@components/sidebar/SearchUsers';
import { useAuthStore } from '@store/authStore';
import { groupService } from '@services/group.service';
import { useChatStore } from '@store/chatStore';
import toast from 'react-hot-toast';

export default function GroupInfo({ group, onUpdate }) {
  const { user } = useAuthStore();
  const { fetchGroups } = useChatStore();
  const [showAddMember, setShowAddMember] = useState(false);
  const [showInviteLink, setShowInviteLink] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  const isAdmin = group?.admin?._id === user?._id || group?.admin === user?._id;

  const handleAddMember = async (selectedUser) => {
    try {
      await groupService.addMembers(group._id, [selectedUser._id]);
      toast.success(`${selectedUser.username} added to group`);
      onUpdate?.();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add member'); }
  };

  const handleLeave = async () => {
    if (!confirm('Leave this group?')) return;
    try {
      await groupService.leave(group._id);
      await fetchGroups();
      toast.success('Left group');
      window.location.href = '/chat';
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to leave group'); }
  };

  const generateInviteLink = async () => {
    try {
      const res = await groupService.generateInvite(group._id);
      setInviteLink(res.data.data.inviteLink);
      setShowInviteLink(true);
    } catch { toast.error('Failed to generate invite link'); }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invite link copied!');
  };

  if (!group) return null;

  const memberCount = group.members?.length || 0;

  return (
    <div className="space-y-6">
      {/* Group header */}
      <div className="flex flex-col items-center text-center gap-3">
        <Avatar src={group.avatar} username={group.name} size="2xl" />
        <div>
          <h2 className="font-bold text-gray-900 dark:text-gray-100 text-xl">{group.name}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{group.privacy === 'public' ? '🌍 Public' : '🔒 Private'} · {memberCount} members</p>
          {group.description && <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{group.description}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        {isAdmin && (
          <Button variant="outline" size="sm" onClick={() => setShowAddMember(!showAddMember)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            Add Member
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={generateInviteLink}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
          Invite Link
        </Button>
      </div>

      {showAddMember && (
        <div>
          <SearchUsers onSelect={handleAddMember} placeholder="Search users to add..." excludeIds={group.members?.map(m => m.user?._id || m.user) || []} />
        </div>
      )}

      {showInviteLink && inviteLink && (
        <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Share this link:</p>
          <div className="flex gap-2">
            <input value={inviteLink} readOnly className="flex-1 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded px-2 py-1" />
            <Button size="sm" onClick={copyInviteLink}>Copy</Button>
          </div>
        </div>
      )}

      {/* Members */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{memberCount} Members</h3>
        <GroupMemberList group={group} onUpdate={onUpdate} />
      </div>

      {/* Danger zone */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="danger" size="sm" className="w-full" onClick={handleLeave}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Leave Group
        </Button>
      </div>
    </div>
  );
}

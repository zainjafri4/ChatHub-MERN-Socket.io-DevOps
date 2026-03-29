import { useState } from 'react';
import Avatar from '@components/common/Avatar';
import AvatarUpload from './AvatarUpload';
import EditProfileModal from './EditProfileModal';
import Button from '@components/common/Button';
import { useAuthStore } from '@store/authStore';
import { useChatStore } from '@store/chatStore';
import { useNavigate } from 'react-router-dom';
import { formatLastSeen } from '@utils/formatDate';
import toast from 'react-hot-toast';

export default function ProfileView({ user: profileUser, isOwnProfile }) {
  const { user: currentUser } = useAuthStore();
  const { getOrCreateConversation } = useChatStore();
  const [showEditModal, setShowEditModal] = useState(false);
  const navigate = useNavigate();

  const handleMessage = async () => {
    try {
      const conv = await getOrCreateConversation(profileUser._id);
      navigate(`/chat/${conv._id}`);
    } catch { toast.error('Failed to open conversation'); }
  };

  const displayUser = isOwnProfile ? currentUser : profileUser;
  if (!displayUser) return null;

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <div className="card p-8">
        {isOwnProfile ? (
          <AvatarUpload user={displayUser} />
        ) : (
          <div className="flex justify-center">
            <Avatar src={displayUser.avatar} username={displayUser.username} size="2xl" isOnline={displayUser.isOnline} />
          </div>
        )}

        <div className="text-center mt-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{displayUser.username}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{displayUser.email}</p>
          {displayUser.bio && <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 max-w-sm mx-auto">{displayUser.bio}</p>}
          {!isOwnProfile && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              {displayUser.isOnline ? '🟢 Online' : `🔘 ${formatLastSeen(displayUser.lastSeen)}`}
            </p>
          )}
        </div>

        <div className="flex justify-center gap-3 mt-6">
          {isOwnProfile ? (
            <Button variant="outline" onClick={() => setShowEditModal(true)}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Edit Profile
            </Button>
          ) : (
            <Button onClick={handleMessage}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              Message
            </Button>
          )}
        </div>
      </div>

      <EditProfileModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} />
    </div>
  );
}

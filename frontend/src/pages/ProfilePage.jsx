import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '@components/layout/MainLayout';
import ProfileView from '@components/profile/ProfileView';
import Loader from '@components/common/Loader';
import { useAuthStore } from '@store/authStore';
import { userService } from '@services/user.service';

export default function ProfilePage() {
  const { userId } = useParams();
  const { user: currentUser } = useAuthStore();
  const [profileUser, setProfileUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const isOwn = currentUser?._id === userId;

  useEffect(() => {
    if (isOwn) { setProfileUser(currentUser); setIsLoading(false); return; }
    setIsLoading(true);
    userService.getById(userId).then(res => setProfileUser(res.data.data.user)).catch(() => {}).finally(() => setIsLoading(false));
  }, [userId, isOwn]);

  return (
    <MainLayout>
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center"><Loader /></div>
      ) : (
        <ProfileView user={profileUser} isOwnProfile={isOwn} />
      )}
    </MainLayout>
  );
}

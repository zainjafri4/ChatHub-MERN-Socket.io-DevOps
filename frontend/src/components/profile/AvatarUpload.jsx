import { useState, useRef } from 'react';
import Avatar from '@components/common/Avatar';
import Button from '@components/common/Button';
import { userService } from '@services/user.service';
import { useAuthStore } from '@store/authStore';
import toast from 'react-hot-toast';

export default function AvatarUpload({ user }) {
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileRef = useRef(null);
  const { updateUser } = useAuthStore();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image too large (max 5MB)'); return; }
    setPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleUpload = async () => {
    if (!preview) return;
    setIsLoading(true);
    try {
      const file = await fetch(preview).then(r => r.blob());
      const fd = new FormData();
      fd.append('avatar', file, 'avatar.jpg');
      const res = await userService.uploadAvatar(fd);
      updateUser({ avatar: res.data.data.avatarUrl });
      URL.revokeObjectURL(preview);
      setPreview(null);
      toast.success('Avatar updated!');
    } catch { toast.error('Failed to upload avatar'); } finally { setIsLoading(false); }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
        <Avatar src={preview || user?.avatar} username={user?.username} size="2xl" />
        <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </div>
      </div>
      <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={handleFile} />
      {preview && (
        <div className="flex gap-2">
          <Button size="sm" onClick={handleUpload} isLoading={isLoading}>Save Photo</Button>
          <Button size="sm" variant="secondary" onClick={() => { URL.revokeObjectURL(preview); setPreview(null); }}>Cancel</Button>
        </div>
      )}
      {!preview && <Button size="sm" variant="ghost" onClick={() => fileRef.current?.click()}>Change Photo</Button>}
    </div>
  );
}

import { useState } from 'react';
import Modal from '@components/common/Modal';
import Input from '@components/common/Input';
import Button from '@components/common/Button';
import { userService } from '@services/user.service';
import { useAuthStore } from '@store/authStore';
import toast from 'react-hot-toast';

export default function EditProfileModal({ isOpen, onClose }) {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({
    firstName: user?.name?.firstName || '',
    lastName: user?.name?.lastName || '',
    username: user?.username || '',
    bio: user?.bio || '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (form.username && !/^[a-zA-Z0-9_]{3,30}$/.test(form.username)) e.username = 'Invalid username format';
    if (form.bio.length > 200) e.bio = 'Bio too long (max 200 chars)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      const res = await userService.updateProfile({
        name: { firstName: form.firstName, lastName: form.lastName },
        username: form.username,
        bio: form.bio,
      });
      updateUser(res.data.data.user);
      toast.success('Profile updated!');
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Update failed';
      toast.error(msg);
      if (msg.includes('username')) setErrors({ username: msg });
    } finally { setIsLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile" size="sm">
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="First Name" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="John" />
          <Input label="Last Name" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Doe" />
        </div>
        <Input label="Username" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} error={errors.username} placeholder="johndoe123" />
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
          <textarea className="input-field resize-none" rows={3} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Tell us about yourself..." maxLength={200} />
          <p className="text-xs text-gray-400 dark:text-gray-500 text-right mt-1">{form.bio.length}/200</p>
          {errors.bio && <p className="text-xs text-red-600 dark:text-red-400">{errors.bio}</p>}
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1" isLoading={isLoading}>Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
}

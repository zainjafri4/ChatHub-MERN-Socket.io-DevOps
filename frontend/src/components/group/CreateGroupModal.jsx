import { useState } from 'react';
import Modal from '@components/common/Modal';
import Button from '@components/common/Button';
import Input from '@components/common/Input';
import Avatar from '@components/common/Avatar';
import SearchUsers from '@components/sidebar/SearchUsers';
import { groupService } from '@services/group.service';
import { useChatStore } from '@store/chatStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function CreateGroupModal({ isOpen, onClose }) {
  const [form, setForm] = useState({ name: '', description: '', privacy: 'public' });
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { fetchGroups } = useChatStore();
  const navigate = useNavigate();

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleAddMember = (user) => {
    if (!selectedMembers.find(m => m._id === user._id)) {
      setSelectedMembers(prev => [...prev, user]);
    }
  };

  const handleRemoveMember = (userId) => {
    setSelectedMembers(prev => prev.filter(m => m._id !== userId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Group name required'); return; }
    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('description', form.description.trim());
      fd.append('privacy', form.privacy);
      selectedMembers.forEach(m => fd.append('memberIds[]', m._id));
      if (avatarFile) fd.append('avatar', avatarFile);

      const res = await groupService.create(fd);
      const group = res.data.data.group;
      await fetchGroups();
      toast.success('Group created!');
      navigate(`/groups/${group._id}`);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create group');
    } finally { setIsLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Group" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Avatar upload */}
        <div className="flex justify-center">
          <label className="cursor-pointer group">
            <div className="relative">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Group avatar" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-3xl">👥</div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </label>
        </div>

        <Input label="Group Name *" placeholder="e.g. Team Alpha" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} maxLength={50} />
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <textarea className="input-field resize-none" rows={2} placeholder="What's this group about?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} maxLength={500} />
        </div>

        {/* Privacy */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Privacy</label>
          <div className="grid grid-cols-2 gap-2">
            {[{ value: 'public', label: 'Public', desc: 'Anyone can join', icon: '🌍' }, { value: 'private', label: 'Private', desc: 'Invite only', icon: '🔒' }].map(opt => (
              <button key={opt.value} type="button" onClick={() => setForm(f => ({ ...f, privacy: opt.value }))}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${form.privacy === opt.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'}`}>
                <span className="text-xl">{opt.icon}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{opt.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Add members */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Add Members</label>
          <SearchUsers onSelect={handleAddMember} placeholder="Search users to add..." excludeIds={selectedMembers.map(m => m._id)} />
          {selectedMembers.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedMembers.map(m => (
                <div key={m._id} className="flex items-center gap-1.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full pl-1 pr-2 py-0.5">
                  <Avatar src={m.avatar} username={m.username} size="xs" />
                  <span className="text-xs font-medium">{m.username}</span>
                  <button type="button" onClick={() => handleRemoveMember(m._id)} className="text-primary-400 hover:text-primary-600 ml-0.5">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1" isLoading={isLoading}>Create Group</Button>
        </div>
      </form>
    </Modal>
  );
}

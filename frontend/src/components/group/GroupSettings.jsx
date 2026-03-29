import { useState } from 'react';
import Button from '@components/common/Button';
import { groupService } from '@services/group.service';
import { useAuthStore } from '@store/authStore';
import toast from 'react-hot-toast';

export default function GroupSettings({ group, onUpdate }) {
  const { user } = useAuthStore();
  const [settings, setSettings] = useState(group?.settings || {});
  const [isLoading, setIsLoading] = useState(false);
  const isAdmin = group?.admin?._id === user?._id;
  if (!isAdmin) return null;

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await groupService.updateSettings(group._id, settings);
      toast.success('Settings saved');
      onUpdate?.();
    } catch { toast.error('Failed to save settings'); } finally { setIsLoading(false); }
  };

  const toggles = [
    { key: 'onlyAdminCanMessage', label: 'Only admins can send messages' },
    { key: 'onlyAdminCanAddMembers', label: 'Only admins can add members' },
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100">Group Settings</h3>
      {toggles.map(t => (
        <div key={t.key} className="flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300">{t.label}</span>
          <button
            onClick={() => setSettings(s => ({ ...s, [t.key]: !s[t.key] }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings[t.key] ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings[t.key] ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      ))}
      <Button onClick={handleSave} isLoading={isLoading} className="w-full">Save Settings</Button>
    </div>
  );
}

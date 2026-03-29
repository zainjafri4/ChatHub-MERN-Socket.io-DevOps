import { useState } from 'react';
import MainLayout from '@components/layout/MainLayout';
import Button from '@components/common/Button';
import { useAuthStore } from '@store/authStore';
import { useUIStore } from '@store/uiStore';
import { userService } from '@services/user.service';
import toast from 'react-hot-toast';

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'system', label: 'System', icon: '💻' },
];

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const { theme, setTheme } = useUIStore();
  const [settings, setSettings] = useState(user?.settings || {});
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const res = await userService.updateSettings(settings);
      updateUser(res.data.data.user);
      toast.success('Settings saved!');
    } catch { toast.error('Failed to save settings'); } finally { setIsLoading(false); }
  };

  const toggles = [
    { key: 'notifications', label: 'Push Notifications', desc: 'Receive notifications for new messages' },
    { key: 'soundEnabled', label: 'Sound Effects', desc: 'Play sounds for messages and notifications' },
    { key: 'showOnlineStatus', label: 'Show Online Status', desc: 'Let others see when you\'re online' },
    { key: 'showLastSeen', label: 'Show Last Seen', desc: 'Let others see your last active time' },
  ];

  return (
    <MainLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>

          {/* Appearance */}
          <section className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Appearance</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Theme</label>
              <div className="grid grid-cols-3 gap-3">
                {THEME_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setTheme(opt.value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${theme === opt.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'}`}>
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Notifications & Privacy */}
          <section className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Notifications & Privacy</h2>
            <div className="space-y-4">
              {toggles.map(t => (
                <div key={t.key} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.desc}</p>
                  </div>
                  <button
                    onClick={() => setSettings(s => ({ ...s, [t.key]: !s[t.key] }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${settings[t.key] !== false ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings[t.key] !== false ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
            <Button onClick={handleSave} isLoading={isLoading} className="mt-6 w-full">Save Settings</Button>
          </section>

          {/* Account info */}
          <section className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Account</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Username</span><span className="font-medium text-gray-900 dark:text-gray-100">{user?.username}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Email</span><span className="font-medium text-gray-900 dark:text-gray-100">{user?.email}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Member since</span><span className="font-medium text-gray-900 dark:text-gray-100">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span></div>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}

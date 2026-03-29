import { useUIStore } from '@store/uiStore';
import Button from '@components/common/Button';

export default function RightSidebar({ title, onClose, children }) {
  const { toggleRightSidebar } = useUIStore();
  const handleClose = () => { if (onClose) onClose(); else toggleRightSidebar(); };
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title || 'Info'}</h3>
        <Button variant="ghost" size="icon" onClick={handleClose}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">{children}</div>
    </div>
  );
}

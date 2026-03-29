import { useEffect } from 'react';
import Navbar from './Navbar';
import Sidebar from '@components/sidebar/Sidebar';
import RightSidebar from './RightSidebar';
import { useUIStore } from '@store/uiStore';
import { useChatStore } from '@store/chatStore';
import { useSocket } from '@hooks/useSocket';
import ErrorBoundary from '@components/common/ErrorBoundary';

export default function MainLayout({ children, rightSidebarContent }) {
  const { sidebarOpen, rightSidebarOpen } = useUIStore();
  const { fetchConversations, fetchGroups } = useChatStore();
  useSocket();

  useEffect(() => {
    fetchConversations();
    fetchGroups();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Navbar />
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-72 xl:w-80' : 'w-0'} transition-all duration-300 flex-shrink-0 overflow-hidden border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800`}>
          <ErrorBoundary><Sidebar /></ErrorBoundary>
        </div>
        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col">
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>
        {/* Right sidebar */}
        {rightSidebarOpen && rightSidebarContent && (
          <div className="w-72 xl:w-80 flex-shrink-0 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
            <ErrorBoundary>{rightSidebarContent}</ErrorBoundary>
          </div>
        )}
      </div>
    </div>
  );
}

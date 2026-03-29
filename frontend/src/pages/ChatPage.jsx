import { useParams } from 'react-router-dom';
import MainLayout from '@components/layout/MainLayout';
import ChatWindow from '@components/chat/ChatWindow';
import RightSidebar from '@components/layout/RightSidebar';
import EmptyState from '@components/common/EmptyState';
import { useUIStore } from '@store/uiStore';
import { useChatStore } from '@store/chatStore';

export default function ChatPage() {
  const { conversationId } = useParams();
  const { rightSidebarOpen } = useUIStore();
  const { conversations } = useChatStore();

  const conversation = conversationId ? conversations.find(c => c._id === conversationId) : null;

  const rightContent = rightSidebarOpen && conversationId ? (
    <RightSidebar title="Chat Info">
      {conversation ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Conversation details coming soon</p>
        </div>
      ) : null}
    </RightSidebar>
  ) : null;

  return (
    <MainLayout rightSidebarContent={rightContent}>
      {conversationId ? (
        <ChatWindow conversationId={conversationId} />
      ) : (
        <EmptyState
          icon="💬"
          title="Welcome to ChatHub"
          description="Select a conversation from the sidebar to start messaging, or click the compose icon to start a new chat."
          action={
            <div className="flex flex-col gap-2 text-sm text-gray-400 dark:text-gray-500 text-center">
              <p>✍️ Click <strong>compose</strong> to start a new conversation</p>
              <p>🔍 Use <strong>search</strong> to find people</p>
              <p>👥 Join <strong>groups</strong> to chat with communities</p>
            </div>
          }
        />
      )}
    </MainLayout>
  );
}

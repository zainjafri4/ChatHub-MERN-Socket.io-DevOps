import ConversationItem from './ConversationItem';
import EmptyState from '@components/common/EmptyState';
import Loader from '@components/common/Loader';

export default function ConversationList({ conversations = [], groups = [], activeTab = 'Chats', isLoading }) {
  if (isLoading) return <div className="flex justify-center py-8"><Loader /></div>;

  const items = activeTab === 'Groups'
    ? groups.map(g => ({ ...g, _type: 'group' }))
    : conversations.map(c => ({ ...c, _type: 'dm' }));

  items.sort((a, b) => new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt));

  if (items.length === 0) return (
    <EmptyState
      icon={activeTab === 'Groups' ? '👥' : '💬'}
      title={activeTab === 'Groups' ? 'No groups yet' : 'No conversations yet'}
      description={activeTab === 'Groups' ? 'Create or join a group to start group chats' : 'Start a new chat to begin messaging'}
    />
  );

  return (
    <div className="space-y-0.5 px-2">
      {items.map(item => (
        <ConversationItem key={item._id} conversation={item} isGroup={item._type === 'group'} />
      ))}
    </div>
  );
}

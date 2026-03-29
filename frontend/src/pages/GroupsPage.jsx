import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '@components/layout/MainLayout';
import ChatWindow from '@components/chat/ChatWindow';
import GroupInfo from '@components/group/GroupInfo';
import GroupDiscovery from '@components/group/GroupDiscovery';
import GroupSettings from '@components/group/GroupSettings';
import CreateGroupModal from '@components/group/CreateGroupModal';
import RightSidebar from '@components/layout/RightSidebar';
import Button from '@components/common/Button';
import EmptyState from '@components/common/EmptyState';
import { useUIStore } from '@store/uiStore';
import { useChatStore } from '@store/chatStore';
import { groupService } from '@services/group.service';

export default function GroupsPage() {
  const { groupId } = useParams();
  const { rightSidebarOpen } = useUIStore();
  const { groups, fetchGroups } = useChatStore();
  const [showCreate, setShowCreate] = useState(false);
  const [showDiscover, setShowDiscover] = useState(false);
  const [activeGroup, setActiveGroup] = useState(null);

  useEffect(() => {
    if (groupId && groups.length > 0) {
      const g = groups.find(g => g._id === groupId);
      if (g) setActiveGroup(g);
      else {
        groupService.getById(groupId).then(res => setActiveGroup(res.data.data.group)).catch(() => {});
      }
    }
  }, [groupId, groups]);

  const rightContent = rightSidebarOpen && activeGroup ? (
    <RightSidebar title="Group Info">
      <div className="space-y-6">
        <GroupInfo group={activeGroup} onUpdate={fetchGroups} />
        <GroupSettings group={activeGroup} onUpdate={fetchGroups} />
      </div>
    </RightSidebar>
  ) : null;

  return (
    <MainLayout rightSidebarContent={rightContent}>
      {groupId ? (
        <ChatWindow groupId={groupId} />
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Groups</h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowDiscover(!showDiscover)}>
                🔍 Discover
              </Button>
              <Button size="sm" onClick={() => setShowCreate(true)}>
                ➕ Create Group
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {showDiscover ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100">Discover Public Groups</h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowDiscover(false)}>✕ Close</Button>
                </div>
                <GroupDiscovery onGroupJoined={() => setShowDiscover(false)} />
              </div>
            ) : (
              <EmptyState
                icon="👥"
                title="Your Groups"
                description="Create a new group or discover public groups to join communities and chat with multiple people."
                action={
                  <div className="flex gap-3">
                    <Button onClick={() => setShowCreate(true)}>Create Group</Button>
                    <Button variant="outline" onClick={() => setShowDiscover(true)}>Discover Groups</Button>
                  </div>
                }
              />
            )}
          </div>
        </div>
      )}
      <CreateGroupModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
    </MainLayout>
  );
}

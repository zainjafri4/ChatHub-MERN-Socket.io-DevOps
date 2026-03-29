import { useState, useEffect } from 'react';
import { groupService } from '@services/group.service';
import Avatar from '@components/common/Avatar';
import Button from '@components/common/Button';
import Loader from '@components/common/Loader';
import EmptyState from '@components/common/EmptyState';
import { useChatStore } from '@store/chatStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function GroupDiscovery({ onGroupJoined }) {
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [joiningId, setJoiningId] = useState(null);
  const { fetchGroups } = useChatStore();
  const navigate = useNavigate();

  const load = async (q = '') => {
    setIsLoading(true);
    try {
      const res = await groupService.discover({ q });
      setGroups(res.data.data.groups);
    } catch {} finally { setIsLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleJoin = async (group) => {
    setJoiningId(group._id);
    try {
      await groupService.join(group._id);
      await fetchGroups();
      toast.success(`Joined ${group.name}!`);
      navigate(`/groups/${group._id}`);
      onGroupJoined?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join group');
    } finally { setJoiningId(null); }
  };

  return (
    <div>
      <div className="mb-4">
        <input
          type="search"
          placeholder="Search public groups..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field"
        />
      </div>

      {isLoading ? <div className="flex justify-center py-8"><Loader /></div> : groups.length === 0 ? (
        <EmptyState icon="🔍" title="No groups found" description={search ? `No results for "${search}"` : 'No public groups available yet'} />
      ) : (
        <div className="space-y-3">
          {groups.map(group => (
            <div key={group._id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
              <Avatar src={group.avatar} username={group.name} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{group.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{group.description || 'No description'}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{group.members?.length || 0} members</p>
              </div>
              <Button size="sm" onClick={() => handleJoin(group)} isLoading={joiningId === group._id}>Join</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

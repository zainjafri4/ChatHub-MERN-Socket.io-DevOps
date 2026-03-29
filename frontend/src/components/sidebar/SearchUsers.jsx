import { useState, useCallback } from 'react';
import { userService } from '@services/user.service';
import Avatar from '@components/common/Avatar';
import Input from '@components/common/Input';

export default function SearchUsers({ onSelect, placeholder = 'Search users...', excludeIds = [] }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);

  const search = useCallback((q) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (!q.trim()) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await userService.search(q.trim());
        setResults(res.data.data.users.filter(u => !excludeIds.includes(u._id)));
      } catch {} finally { setIsLoading(false); }
    }, 400);
    setDebounceTimer(timer);
  }, [excludeIds]);

  const handleChange = (e) => { setQuery(e.target.value); search(e.target.value); };

  return (
    <div className="relative">
      <Input
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        leftIcon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
      />
      {results.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-20 max-h-64 overflow-y-auto">
          {results.map(user => (
            <button key={user._id} onClick={() => { onSelect(user); setQuery(''); setResults([]); }}
              className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
              <Avatar src={user.avatar} username={user.username} size="sm" isOnline={user.isOnline} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user.username}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      {isLoading && <div className="absolute top-full mt-1 w-full text-center py-3 text-sm text-gray-400">Searching...</div>}
      {query.length > 0 && !isLoading && results.length === 0 && (
        <div className="absolute top-full mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-20 py-4 text-center text-sm text-gray-400">No users found</div>
      )}
    </div>
  );
}

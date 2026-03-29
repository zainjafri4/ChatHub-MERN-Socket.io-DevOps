const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-20 h-20 text-xl',
};

export default function Avatar({ src, username, size = 'md', isOnline, className = '' }) {
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(username || '?')}&background=6366f1&color=fff&size=200`;

  return (
    <div className={`relative inline-flex flex-shrink-0 ${className}`}>
      <img
        src={src || fallbackUrl}
        alt={username || 'User'}
        className={`${sizes[size]} rounded-full object-cover bg-primary-100 dark:bg-primary-900`}
        onError={(e) => { e.target.src = fallbackUrl; }}
      />
      {isOnline !== undefined && (
        <span className={`absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-gray-900 ${isOnline ? 'bg-green-400' : 'bg-gray-400'} ${size === 'xs' || size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'}`} />
      )}
    </div>
  );
}

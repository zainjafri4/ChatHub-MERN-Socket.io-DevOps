export default function TypingIndicator({ typingUsers }) {
  if (!typingUsers?.length) return null;
  const names = typingUsers.slice(0, 3).map(u => u.username).join(', ');
  const label = typingUsers.length === 1 ? `${names} is typing` : typingUsers.length <= 3 ? `${names} are typing` : `${typingUsers.length} people are typing`;
  return (
    <div className="flex items-center gap-2 px-4 py-1 text-xs text-gray-500 dark:text-gray-400">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 inline-block" style={{ animation: `bounceDots 1.4s ${i * 0.16}s infinite ease-in-out` }} />
        ))}
      </div>
      <span>{label}</span>
    </div>
  );
}

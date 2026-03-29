export default function Badge({ count, max = 99, className = '' }) {
  if (!count || count === 0) return null;
  const display = count > max ? `${max}+` : count;
  return (
    <span className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-xs font-bold text-white bg-primary-600 rounded-full ${className}`}>
      {display}
    </span>
  );
}

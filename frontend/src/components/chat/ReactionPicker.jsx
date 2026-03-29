import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export default function ReactionPicker({ onSelect, onClose }) {
  return (
    <div className="absolute bottom-full mb-2 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 flex items-center gap-1">
        {QUICK_REACTIONS.map(emoji => (
          <button key={emoji} onClick={() => { onSelect(emoji); onClose?.(); }}
            className="text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-1 transition-colors hover:scale-110 transform duration-100">
            {emoji}
          </button>
        ))}
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
        <div className="relative">
          <Picker data={data} onEmojiSelect={(e) => { onSelect(e.native); onClose?.(); }} theme="auto" previewPosition="none" skinTonePosition="none" maxFrequentRows={1} />
        </div>
      </div>
    </div>
  );
}

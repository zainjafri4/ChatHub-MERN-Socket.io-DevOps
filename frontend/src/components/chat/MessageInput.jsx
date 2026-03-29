import { useState, useRef, useCallback } from 'react';
import { useAuthStore } from '@store/authStore';
import { useChatStore } from '@store/chatStore';
import { messageService } from '@services/message.service';
import { getSocket } from '@hooks/useSocket';
import { useTyping } from '@hooks/useTyping';
import { SOCKET_EVENTS } from '@constants/socketEvents';
import Button from '@components/common/Button';
import { compressImage, formatFileSize } from '@utils/fileUtils';
import toast from 'react-hot-toast';

export default function MessageInput({ conversationId, groupId, replyTo, onCancelReply }) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const { user } = useAuthStore();
  const { addMessage } = useChatStore();
  const { startTyping, stopTyping } = useTyping(conversationId, groupId);
  const roomId = conversationId || groupId;

  const handleInput = (e) => {
    setContent(e.target.value);
    startTyping();
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { toast.error('File too large (max 50MB)'); return; }

    let processedFile = file;
    if (file.type.startsWith('image/') && file.type !== 'image/gif') {
      processedFile = await compressImage(file);
    }
    setSelectedFile(processedFile);
    if (file.type.startsWith('image/')) {
      setFilePreview(URL.createObjectURL(processedFile));
    }
    e.target.value = '';
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (filePreview) { URL.revokeObjectURL(filePreview); setFilePreview(null); }
  };

  const handleSend = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed && !selectedFile) return;
    if (isLoading) return;
    stopTyping();
    setIsLoading(true);

    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      _id: tempId, tempId, content: trimmed, sender: user, createdAt: new Date().toISOString(),
      conversationId, groupId, type: selectedFile ? 'file' : 'text', status: 'sending',
      replyTo,
    };
    addMessage(tempMessage);
    setContent('');
    if (textareaRef.current) { textareaRef.current.style.height = 'auto'; }
    if (onCancelReply) onCancelReply();

    try {
      if (selectedFile) {
        const fd = new FormData();
        fd.append('file', selectedFile);
        if (conversationId) fd.append('conversationId', conversationId);
        if (groupId) fd.append('groupId', groupId);
        if (replyTo) fd.append('replyTo', replyTo._id);
        if (tempId) fd.append('tempId', tempId);
        clearFile();
        await messageService.sendFile(fd);
      } else {
        // Use socket for text messages
        const socket = getSocket();
        if (socket?.connected) {
          socket.emit(SOCKET_EVENTS.SEND_MESSAGE, { conversationId, groupId, content: trimmed, replyTo: replyTo?._id, tempId });
        } else {
          await messageService.send({ conversationId, groupId, content: trimmed, replyTo: replyTo?._id, tempId });
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  }, [content, selectedFile, conversationId, groupId, replyTo, user, isLoading]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 pb-4 pt-2">
      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center justify-between mb-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">
          <div className="flex-1 min-w-0">
            <span className="text-primary-600 dark:text-primary-400 font-medium">Replying to {replyTo.sender?.username}</span>
            <p className="text-gray-600 dark:text-gray-400 truncate">{replyTo.content || '📎 File'}</p>
          </div>
          <button onClick={onCancelReply} className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
        </div>
      )}

      {/* File preview */}
      {selectedFile && (
        <div className="flex items-center gap-3 mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
          {filePreview ? (
            <img src={filePreview} alt="Preview" className="w-12 h-12 rounded object-cover flex-shrink-0" />
          ) : (
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center text-xl flex-shrink-0">📎</div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{selectedFile.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(selectedFile.size)}</p>
          </div>
          <button onClick={clearFile} className="text-gray-400 hover:text-red-500 p-1">✕</button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* File attach */}
        <input ref={fileInputRef} type="file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt" className="hidden" onChange={handleFileSelect} />
        <Button variant="ghost" size="icon" type="button" onClick={() => fileInputRef.current?.click()} title="Attach file">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
        </Button>

        {/* Text area */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
            className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-2xl resize-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            rows={1}
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
        </div>

        {/* Send button */}
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!content.trim() && !selectedFile}
          isLoading={isLoading}
          className={`rounded-full w-10 h-10 flex-shrink-0 transition-all ${content.trim() || selectedFile ? 'bg-primary-600 hover:bg-primary-700 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}`}
        >
          {!isLoading && (
            <svg className="w-5 h-5 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          )}
        </Button>
      </div>
    </div>
  );
}

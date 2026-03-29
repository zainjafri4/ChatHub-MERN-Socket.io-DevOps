import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '@store/chatStore';
import Modal from '@components/common/Modal';
import SearchUsers from './SearchUsers';
import Avatar from '@components/common/Avatar';
import toast from 'react-hot-toast';

export default function NewChatModal({ isOpen, onClose }) {
  const { getOrCreateConversation } = useChatStore();
  const navigate = useNavigate();

  const handleSelect = async (user) => {
    try {
      const conversation = await getOrCreateConversation(user._id);
      navigate(`/chat/${conversation._id}`);
      onClose();
    } catch { toast.error('Failed to start conversation'); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Message" size="sm">
      <SearchUsers onSelect={handleSelect} placeholder="Search by username or email..." />
      <p className="mt-4 text-xs text-gray-400 dark:text-gray-500 text-center">Select a person to start a new conversation</p>
    </Modal>
  );
}

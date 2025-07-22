import React, { useState } from 'react';
import { PlusIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { generateId } from '../utils/helpers';
import { Note } from '../types';

const FloatingActionButtons: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const addNote = useStore(state => state.addNote);

  // Don't show FAB on certain pages
  const hideFAB = ['/settings', '/labels'].includes(location.pathname);
  
  if (hideFAB) return null;

  const handleCreateNote = () => {
    const newNote: Note = {
      id: generateId(),
      title: '',
      content: '',
      color: '#ffffff',
      isPinned: false,
      labels: [],
      images: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isArchived: false,
      isDeleted: false,
    };

    addNote(newNote);
    
    // Navigate to edit mode (in a real app, this would open a modal)
    // For now, we'll use URL state to indicate editing
    navigate(`/?edit=${newNote.id}`);
  };

  const handleOpenChat = () => {
    navigate('/chat');
  };

  return (
    <div className="fixed bottom-6 right-6 z-30">
      <div className="flex flex-col items-end gap-3">
        {/* AI Chat Button */}
        <button
          onClick={handleOpenChat}
          className={`w-12 h-12 bg-keep-surface border border-keep-border text-keep-text rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center ${
            isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
          style={{
            transitionDelay: isExpanded ? '50ms' : '0ms',
          }}
          aria-label="Open AI Chat"
        >
          <SparklesIcon className="w-6 h-6" />
        </button>

        {/* Primary Create Note Button */}
        <button
          onClick={handleCreateNote}
          onMouseEnter={() => setIsExpanded(true)}
          onMouseLeave={() => setIsExpanded(false)}
          className="w-14 h-14 bg-keep-primary text-keep-bg rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center group"
          aria-label="Create new note"
        >
          <PlusIcon className="w-7 h-7 transition-transform duration-200 group-hover:rotate-90" />
        </button>
      </div>
    </div>
  );
};

export default FloatingActionButtons;
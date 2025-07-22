import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  XMarkIcon,
  BookmarkIcon,
  ArchiveBoxIcon,
  TrashIcon,
  PaintBrushIcon,
  TagIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { useStore } from '../store/useStore';
import { KEEP_COLORS } from '../types';
import { getColorClassName } from '../utils/helpers';

const NoteEditModal: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const editingNoteId = searchParams.get('edit');
  
  const { notes, updateNote, deleteNote, archiveNote, togglePinNote } = useStore();
  const note = notes.find(n => n.id === editingNoteId);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [labels, setLabels] = useState<string[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setLabels([...note.labels]);
    }
  }, [note]);

  const handleClose = () => {
    if (note && (title !== note.title || content !== note.content || JSON.stringify(labels) !== JSON.stringify(note.labels))) {
      // Save changes
      updateNote(note.id, {
        title: title.trim(),
        content: content.trim(),
        labels: labels.filter(label => label.trim() !== ''),
      });
    }
    
    // Remove edit parameter from URL
    searchParams.delete('edit');
    setSearchParams(searchParams);
  };

  const handleColorChange = (color: string) => {
    if (note) {
      updateNote(note.id, { color });
      setShowColorPicker(false);
    }
  };

  const handlePin = () => {
    if (note) {
      togglePinNote(note.id);
    }
  };

  const handleArchive = () => {
    if (note) {
      archiveNote(note.id);
      handleClose();
    }
  };

  const handleDelete = () => {
    if (note) {
      deleteNote(note.id);
      handleClose();
    }
  };

  const handleAddLabel = () => {
    if (newLabel.trim() && !labels.includes(newLabel.trim())) {
      setLabels([...labels, newLabel.trim()]);
      setNewLabel('');
    }
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    setLabels(labels.filter(label => label !== labelToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!note) return null;

  const colorClass = getColorClassName(note.color);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div 
        className={`${colorClass} rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyPress}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-black border-opacity-10">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePin}
              className="p-2 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
              title={note.isPinned ? 'Unpin note' : 'Pin note'}
            >
              {note.isPinned ? (
                <BookmarkSolidIcon className="w-5 h-5 text-gray-700" />
              ) : (
                <BookmarkIcon className="w-5 h-5 text-gray-700" />
              )}
            </button>
          </div>
          
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
            title="Close"
          >
            <XMarkIcon className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Title */}
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xl font-medium bg-transparent border-none outline-none text-gray-800 placeholder-gray-500 mb-4"
            autoFocus
          />

          {/* Content */}
          <textarea
            placeholder="Take a note..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-40 bg-transparent border-none outline-none text-gray-700 placeholder-gray-500 resize-none"
          />

          {/* Labels */}
          <div className="mt-4">
            <div className="flex flex-wrap gap-2 mb-2">
              {labels.map((label, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 text-sm bg-black bg-opacity-10 rounded-full"
                >
                  <TagIcon className="w-3 h-3 mr-1" />
                  {label}
                  <button
                    onClick={() => handleRemoveLabel(label)}
                    className="ml-2 text-gray-600 hover:text-gray-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add label"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddLabel()}
                className="flex-1 px-3 py-1 text-sm bg-black bg-opacity-5 border border-black border-opacity-20 rounded-lg outline-none focus:border-keep-primary"
              />
              <button
                onClick={handleAddLabel}
                className="px-3 py-1 text-sm bg-keep-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-black border-opacity-10">
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-2 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
                title="Change color"
              >
                <PaintBrushIcon className="w-5 h-5 text-gray-700" />
              </button>

              {showColorPicker && (
                <div className="absolute bottom-12 left-0 bg-white rounded-lg shadow-lg border p-3 z-10">
                  <div className="grid grid-cols-6 gap-2">
                    {KEEP_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => handleColorChange(color.value)}
                        className={`w-8 h-8 rounded-full border-2 ${
                          note.color === color.value ? 'border-gray-600' : 'border-gray-300'
                        } hover:border-gray-600 transition-colors`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleArchive}
              className="p-2 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
              title="Archive"
            >
              <ArchiveBoxIcon className="w-5 h-5 text-gray-700" />
            </button>

            <button
              onClick={handleDelete}
              className="p-2 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
              title="Delete"
            >
              <TrashIcon className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          <button
            onClick={() => navigate('/chat')}
            className="flex items-center gap-2 px-4 py-2 bg-keep-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
          >
            <SparklesIcon className="w-4 h-4" />
            Ask AI
          </button>
        </div>

        {/* Color picker overlay */}
        {showColorPicker && (
          <div
            className="fixed inset-0 z-5"
            onClick={() => setShowColorPicker(false)}
          />
        )}
      </div>
    </div>
  );
};

export default NoteEditModal;
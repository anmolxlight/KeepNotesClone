import React, { useState } from 'react';
import { 
  EllipsisVerticalIcon,
  ArchiveBoxIcon,
  TrashIcon,
  BookmarkIcon,
  PaintBrushIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { Note, KEEP_COLORS } from '../types';
import { useStore } from '../store/useStore';
import { getColorClassName, formatDate, truncateText } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';

interface NoteCardProps {
  note: Note;
  isEditing?: boolean;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, isEditing = false }) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  const { updateNote, deleteNote, archiveNote, togglePinNote } = useStore();

  const handleCardClick = () => {
    if (!isEditing) {
      navigate(`/?edit=${note.id}`);
    }
  };

  const handlePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePinNote(note.id);
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    archiveNote(note.id);
    setShowMenu(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNote(note.id);
    setShowMenu(false);
  };

  const handleColorChange = (color: string) => {
    updateNote(note.id, { color });
    setShowColorPicker(false);
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleColorPickerToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowColorPicker(!showColorPicker);
    setShowMenu(false);
  };

  const colorClass = getColorClassName(note.color);
  const textColorClass = note.color === '#ffffff' ? 'text-gray-800' : 'text-gray-800';

  return (
    <div className="relative">
      <div
        onClick={handleCardClick}
        className={`
          ${colorClass} 
          rounded-lg border border-gray-300 
          note-shadow
          cursor-pointer transition-all duration-200 
          hover:shadow-lg transform hover:-translate-y-0.5
          p-4 relative overflow-hidden
          ${isEditing ? 'ring-2 ring-keep-primary' : ''}
        `}
      >
        {/* Pin Button */}
        <button
          onClick={handlePin}
          className={`absolute top-2 right-2 p-1 rounded-full transition-opacity ${
            note.isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          } hover:bg-black hover:bg-opacity-10`}
        >
          {note.isPinned ? (
            <BookmarkSolidIcon className={`w-4 h-4 ${textColorClass}`} />
          ) : (
            <BookmarkIcon className={`w-4 h-4 ${textColorClass}`} />
          )}
        </button>

        {/* Note Content */}
        <div className={`${textColorClass} ${note.isPinned ? 'pr-6' : ''}`}>
          {/* Title */}
          {note.title && (
            <h3 className="font-medium text-base mb-2 leading-tight break-words">
              {truncateText(note.title, 100)}
            </h3>
          )}

          {/* Content */}
          {note.content && (
            <div className="text-sm leading-relaxed mb-3 break-words whitespace-pre-wrap">
              {truncateText(note.content, 300)}
            </div>
          )}

          {/* Images */}
          {note.images.length > 0 && (
            <div className="mb-3">
              <div className="grid grid-cols-2 gap-2">
                {note.images.slice(0, 4).map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Note attachment ${index + 1}`}
                    className="w-full h-20 object-cover rounded"
                  />
                ))}
              </div>
              {note.images.length > 4 && (
                <p className="text-xs text-gray-600 mt-1">
                  +{note.images.length - 4} more
                </p>
              )}
            </div>
          )}

          {/* Labels */}
          {note.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {note.labels.map((label, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 text-xs bg-black bg-opacity-10 rounded-full"
                >
                  <TagIcon className="w-3 h-3 mr-1" />
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className={`flex items-center justify-between mt-3 pt-2 border-t border-black border-opacity-10 ${textColorClass}`}>
          <div className="flex items-center gap-1">
            <button
              onClick={handleColorPickerToggle}
              className="p-1.5 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
              title="Change color"
            >
              <PaintBrushIcon className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleArchive}
              className="p-1.5 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
              title="Archive"
            >
              <ArchiveBoxIcon className="w-4 h-4" />
            </button>

            <button
              onClick={handleMenuToggle}
              className="p-1.5 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
              title="More options"
            >
              <EllipsisVerticalIcon className="w-4 h-4" />
            </button>
          </div>

          <span className="text-xs opacity-70">
            {formatDate(note.updatedAt)}
          </span>
        </div>

        {/* Color Picker */}
        {showColorPicker && (
          <div className="absolute bottom-16 left-2 bg-white rounded-lg shadow-lg border p-2 z-20">
            <div className="grid grid-cols-6 gap-1">
              {KEEP_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleColorChange(color.value)}
                  className={`w-6 h-6 rounded-full border-2 ${
                    note.color === color.value ? 'border-gray-600' : 'border-gray-300'
                  } hover:border-gray-600 transition-colors`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        )}

        {/* Menu */}
        {showMenu && (
          <div className="absolute bottom-16 left-2 bg-white rounded-lg shadow-lg border py-1 z-20 min-w-[120px]">
            <button
              onClick={handleDelete}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <TrashIcon className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Click overlay to close menus */}
      {(showMenu || showColorPicker) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setShowMenu(false);
            setShowColorPicker(false);
          }}
        />
      )}
    </div>
  );
};

export default NoteCard; 
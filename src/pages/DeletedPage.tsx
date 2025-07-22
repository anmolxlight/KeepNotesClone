import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import NotesGrid from '../components/NotesGrid';
import NotesList from '../components/NotesList';
import { sortNotes, searchNotes } from '../utils/helpers';
import { TrashIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import { Note } from '../types';

const DeletedPage: React.FC = () => {
  const {
    getDeletedNotes,
    searchQuery,
    viewMode,
    restoreNote,
    permanentlyDeleteNote
  } = useStore();

  const notes = useMemo(() => {
    let baseNotes = getDeletedNotes();
    
    // Apply search filter
    if (searchQuery) {
      baseNotes = searchNotes(baseNotes, searchQuery);
    }
    
    // Sort notes
    return sortNotes(baseNotes);
  }, [getDeletedNotes, searchQuery]);

  const handleRestoreAll = () => {
    if (window.confirm('Restore all notes from trash?')) {
      notes.forEach((note: Note) => restoreNote(note.id));
    }
  };

  const handleEmptyTrash = () => {
    if (window.confirm('Permanently delete all notes in trash? This action cannot be undone.')) {
      notes.forEach((note: Note) => permanentlyDeleteNote(note.id));
    }
  };

  const renderEmptyState = () => {
    if (searchQuery) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <div className="w-16 h-16 bg-keep-border rounded-full flex items-center justify-center mb-4">
            <span className="text-keep-text-secondary text-2xl">🔍</span>
          </div>
          <h3 className="text-xl font-medium text-keep-text mb-2">No deleted notes found</h3>
          <p className="text-keep-text-secondary max-w-md">
            Try adjusting your search terms.
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="w-16 h-16 bg-keep-border rounded-full flex items-center justify-center mb-4">
          <span className="text-keep-text-secondary text-2xl">🗑️</span>
        </div>
        <h3 className="text-xl font-medium text-keep-text mb-2">Trash is empty</h3>
        <p className="text-keep-text-secondary max-w-md">
          Deleted notes will appear here. Notes in trash are automatically deleted after 7 days.
        </p>
      </div>
    );
  };

  if (notes.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          {renderEmptyState()}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-keep-text-secondary">
            {notes.length} deleted {notes.length === 1 ? 'note' : 'notes'}
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={handleRestoreAll}
              className="flex items-center gap-2 px-4 py-2 bg-keep-surface border border-keep-border text-keep-text rounded-lg hover:bg-keep-border transition-colors"
            >
              <ArrowUturnLeftIcon className="w-4 h-4" />
              Restore All
            </button>
            
            <button
              onClick={handleEmptyTrash}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
              Empty Trash
            </button>
          </div>
        </div>

        <div className="mb-4 p-4 bg-amber-100 border border-amber-300 rounded-lg">
          <p className="text-amber-800 text-sm">
            <strong>Note:</strong> Items in trash are automatically deleted after 7 days. 
            Click on any note to restore it or use the actions above.
          </p>
        </div>

        {viewMode === 'grid' ? (
          <NotesGrid notes={notes} />
        ) : (
          <NotesList notes={notes} />
        )}
      </div>
    </div>
  );
};

export default DeletedPage;
import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import NotesGrid from '../components/NotesGrid';
import NotesList from '../components/NotesList';
import { sortNotes, searchNotes } from '../utils/helpers';

const ArchivePage: React.FC = () => {
  const {
    getArchivedNotes,
    searchQuery,
    viewMode
  } = useStore();

  const notes = useMemo(() => {
    let baseNotes = getArchivedNotes();
    
    // Apply search filter
    if (searchQuery) {
      baseNotes = searchNotes(baseNotes, searchQuery);
    }
    
    // Sort notes
    return sortNotes(baseNotes);
  }, [getArchivedNotes, searchQuery]);

  const renderEmptyState = () => {
    if (searchQuery) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <div className="w-16 h-16 bg-keep-border rounded-full flex items-center justify-center mb-4">
            <span className="text-keep-text-secondary text-2xl">🔍</span>
          </div>
          <h3 className="text-xl font-medium text-keep-text mb-2">No archived notes found</h3>
          <p className="text-keep-text-secondary max-w-md">
            Try adjusting your search terms.
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="w-16 h-16 bg-keep-border rounded-full flex items-center justify-center mb-4">
          <span className="text-keep-text-secondary text-2xl">📦</span>
        </div>
        <h3 className="text-xl font-medium text-keep-text mb-2">No archived notes</h3>
        <p className="text-keep-text-secondary max-w-md">
          Notes you archive will appear here. Archive notes to declutter your main view while keeping them accessible.
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
        <div className="mb-6">
          <p className="text-keep-text-secondary">
            {notes.length} archived {notes.length === 1 ? 'note' : 'notes'}
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

export default ArchivePage;
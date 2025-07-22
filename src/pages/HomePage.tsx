import React, { useMemo } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import NotesGrid from '../components/NotesGrid';
import NotesList from '../components/NotesList';
import { sortNotes, searchNotes } from '../utils/helpers';
import { Note } from '../types';

const HomePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { labelName } = useParams();
  const editingNoteId = searchParams.get('edit');

  const {
    getActiveNotes,
    searchQuery,
    viewMode
  } = useStore();

  const notes = useMemo(() => {
    let baseNotes = getActiveNotes();
    
    // If we're viewing a specific label, filter by that label
    if (labelName) {
      const decodedLabelName = decodeURIComponent(labelName);
      baseNotes = baseNotes.filter(note => 
        note.labels.some(label => 
          label.toLowerCase() === decodedLabelName.toLowerCase()
        )
      );
    }
    
    // Apply search filter
    if (searchQuery) {
      baseNotes = searchNotes(baseNotes, searchQuery);
    }
    
    // Sort notes (pinned first, then by update date)
    return sortNotes(baseNotes);
  }, [getActiveNotes, labelName, searchQuery]);

  const pinnedNotes = notes.filter((note: Note) => note.isPinned);
  const regularNotes = notes.filter((note: Note) => !note.isPinned);

  const getPageTitle = () => {
    if (labelName) {
      return `#${decodeURIComponent(labelName)}`;
    }
    if (searchQuery) {
      return `Search results for "${searchQuery}"`;
    }
    return null;
  };

  const renderEmptyState = () => {
    if (searchQuery) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <div className="w-16 h-16 bg-keep-border rounded-full flex items-center justify-center mb-4">
            <span className="text-keep-text-secondary text-2xl">🔍</span>
          </div>
          <h3 className="text-xl font-medium text-keep-text mb-2">No notes found</h3>
          <p className="text-keep-text-secondary max-w-md">
            Try adjusting your search terms or browse your notes by label.
          </p>
        </div>
      );
    }

    if (labelName) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <div className="w-16 h-16 bg-keep-border rounded-full flex items-center justify-center mb-4">
            <span className="text-keep-text-secondary text-2xl">🏷️</span>
          </div>
          <h3 className="text-xl font-medium text-keep-text mb-2">
            No notes with label "{decodeURIComponent(labelName)}"
          </h3>
          <p className="text-keep-text-secondary max-w-md">
            Create a new note and add this label to get started.
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="w-16 h-16 bg-keep-border rounded-full flex items-center justify-center mb-4">
          <span className="text-keep-text-secondary text-2xl">📝</span>
        </div>
        <h3 className="text-xl font-medium text-keep-text mb-2">Your notes will appear here</h3>
        <p className="text-keep-text-secondary max-w-md">
          Click the + button to create your first note, or try the AI chat feature to get started.
        </p>
      </div>
    );
  };

  if (notes.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          {getPageTitle() && (
            <div className="mb-6">
              <h2 className="text-2xl font-medium text-keep-text">{getPageTitle()}</h2>
            </div>
          )}
          {renderEmptyState()}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6">
        {getPageTitle() && (
          <div className="mb-6">
            <h2 className="text-2xl font-medium text-keep-text">{getPageTitle()}</h2>
            <p className="text-keep-text-secondary mt-1">
              {notes.length} {notes.length === 1 ? 'note' : 'notes'}
            </p>
          </div>
        )}

        {/* Pinned Notes */}
        {pinnedNotes.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-keep-text-secondary uppercase tracking-wider mb-4 px-2">
              Pinned
            </h3>
            {viewMode === 'grid' ? (
              <NotesGrid notes={pinnedNotes} editingNoteId={editingNoteId} />
            ) : (
              <NotesList notes={pinnedNotes} editingNoteId={editingNoteId} />
            )}
          </div>
        )}

        {/* Regular Notes */}
        {regularNotes.length > 0 && (
          <div>
            {pinnedNotes.length > 0 && (
              <h3 className="text-sm font-medium text-keep-text-secondary uppercase tracking-wider mb-4 px-2">
                Others
              </h3>
            )}
            {viewMode === 'grid' ? (
              <NotesGrid notes={regularNotes} editingNoteId={editingNoteId} />
            ) : (
              <NotesList notes={regularNotes} editingNoteId={editingNoteId} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
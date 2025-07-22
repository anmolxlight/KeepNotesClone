import React from 'react';
import { Note } from '../types';
import NoteCard from './NoteCard';

interface NotesListProps {
  notes: Note[];
  editingNoteId?: string | null;
}

const NotesList: React.FC<NotesListProps> = ({ notes, editingNoteId }) => {
  if (notes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {notes.map((note, index) => (
        <div 
          key={note.id}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <NoteCard 
            note={note} 
            isEditing={editingNoteId === note.id}
          />
        </div>
      ))}
    </div>
  );
};

export default NotesList;
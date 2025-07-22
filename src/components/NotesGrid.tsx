import React, { useEffect, useState, useRef } from 'react';
import { Note } from '../types';
import NoteCard from './NoteCard';
import { calculateMasonryColumns } from '../utils/helpers';

interface NotesGridProps {
  notes: Note[];
  editingNoteId?: string | null;
}

const NotesGrid: React.FC<NotesGridProps> = ({ notes, editingNoteId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(3);
  const [, setColumnHeights] = useState<number[]>([]);

  // Calculate columns based on container width
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const newColumns = calculateMasonryColumns(width);
        setColumns(newColumns);
        setColumnHeights(new Array(newColumns).fill(0));
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset column heights when notes or columns change
  useEffect(() => {
    setColumnHeights(new Array(columns).fill(0));
  }, [notes, columns]);

  // Distribute notes across columns
  const distributeNotes = () => {
    const noteColumns: Note[][] = Array.from({ length: columns }, () => []);
    const heights = new Array(columns).fill(0);

    notes.forEach((note) => {
      // Find the column with the least height
      const shortestColumnIndex = heights.indexOf(Math.min(...heights));
      noteColumns[shortestColumnIndex].push(note);
      
      // Estimate note height based on content
      const estimatedHeight = estimateNoteHeight(note);
      heights[shortestColumnIndex] += estimatedHeight;
    });

    return noteColumns;
  };

  // Estimate note height for masonry layout
  const estimateNoteHeight = (note: Note): number => {
    const baseHeight = 120; // Base card height
    const titleHeight = note.title ? Math.ceil(note.title.length / 30) * 20 : 0;
    const contentHeight = note.content ? Math.ceil(note.content.length / 50) * 16 : 0;
    const labelsHeight = note.labels.length > 0 ? 32 : 0;
    const imagesHeight = note.images.length > 0 ? 200 : 0;
    
    return baseHeight + titleHeight + contentHeight + labelsHeight + imagesHeight;
  };

  const noteColumns = distributeNotes();

  if (notes.length === 0) {
    return null;
  }

  return (
    <div ref={containerRef} className="w-full">
      <div 
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
        }}
      >
        {noteColumns.map((columnNotes, columnIndex) => (
          <div key={columnIndex} className="flex flex-col gap-4">
            {columnNotes.map((note, noteIndex) => (
              <div 
                key={note.id}
                className="masonry-item"
                style={{
                  animationDelay: `${(columnIndex * 50) + (noteIndex * 100)}ms`,
                }}
              >
                <NoteCard 
                  note={note} 
                  isEditing={editingNoteId === note.id}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotesGrid;
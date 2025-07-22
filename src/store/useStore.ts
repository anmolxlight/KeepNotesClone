import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Note, ChatThread, Label, User, ViewMode, AppState } from '../types';
import { generateSampleNotes } from '../utils/helpers';

interface NotesStore extends AppState {
  // Actions
  setNotes: (notes: Note[]) => void;
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  togglePinNote: (id: string) => void;
  archiveNote: (id: string) => void;
  restoreNote: (id: string) => void;
  permanentlyDeleteNote: (id: string) => void;
  
  // Search and filter
  setSearchQuery: (query: string) => void;
  setSelectedLabels: (labels: string[]) => void;
  
  // UI state
  setViewMode: (mode: ViewMode) => void;
  setSidebarOpen: (open: boolean) => void;
  setCurrentPage: (page: AppState['currentPage']) => void;
  
  // User
  setCurrentUser: (user: User | null) => void;
  
  // Labels
  addLabel: (label: Label) => void;
  updateLabel: (id: string, updates: Partial<Label>) => void;
  deleteLabel: (id: string) => void;
  
  // Chat
  addChatThread: (thread: ChatThread) => void;
  updateChatThread: (id: string, updates: Partial<ChatThread>) => void;
  deleteChatThread: (id: string) => void;
  
  // Computed getters
  getFilteredNotes: () => Note[];
  getArchivedNotes: () => Note[];
  getDeletedNotes: () => Note[];
  getActiveNotes: () => Note[];
}

export const useStore = create<NotesStore>()(
  persist(
    (set, get) => ({
      // Initial state
      notes: generateSampleNotes(),
      chatThreads: [],
      labels: [
        { id: '1', name: 'Personal', color: '#f28b82' },
        { id: '2', name: 'Work', color: '#fbbc04' },
        { id: '3', name: 'Ideas', color: '#ccff90' },
      ],
      currentUser: {
        id: '1',
        email: 'user@example.com',
        name: 'Demo User',
      },
      viewMode: 'grid',
      searchQuery: '',
      selectedLabels: [],
      sidebarOpen: false,
      currentPage: 'notes',

      // Actions
      setNotes: (notes) => set({ notes }),
      
      addNote: (note) => set((state) => ({ 
        notes: [note, ...state.notes] 
      })),
      
      updateNote: (id, updates) => set((state) => ({
        notes: state.notes.map(note => 
          note.id === id 
            ? { ...note, ...updates, updatedAt: new Date() }
            : note
        )
      })),
      
      deleteNote: (id) => set((state) => ({
        notes: state.notes.map(note => 
          note.id === id 
            ? { ...note, isDeleted: true, updatedAt: new Date() }
            : note
        )
      })),
      
      togglePinNote: (id) => set((state) => ({
        notes: state.notes.map(note => 
          note.id === id 
            ? { ...note, isPinned: !note.isPinned, updatedAt: new Date() }
            : note
        )
      })),
      
      archiveNote: (id) => set((state) => ({
        notes: state.notes.map(note => 
          note.id === id 
            ? { ...note, isArchived: true, updatedAt: new Date() }
            : note
        )
      })),
      
      restoreNote: (id) => set((state) => ({
        notes: state.notes.map(note => 
          note.id === id 
            ? { ...note, isArchived: false, isDeleted: false, updatedAt: new Date() }
            : note
        )
      })),
      
      permanentlyDeleteNote: (id) => set((state) => ({
        notes: state.notes.filter(note => note.id !== id)
      })),
      
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSelectedLabels: (selectedLabels) => set({ selectedLabels }),
      setViewMode: (viewMode) => set({ viewMode }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setCurrentPage: (currentPage) => set({ currentPage }),
      setCurrentUser: (currentUser) => set({ currentUser }),
      
      addLabel: (label) => set((state) => ({
        labels: [...state.labels, label]
      })),
      
      updateLabel: (id, updates) => set((state) => ({
        labels: state.labels.map(label => 
          label.id === id ? { ...label, ...updates } : label
        )
      })),
      
      deleteLabel: (id) => set((state) => ({
        labels: state.labels.filter(label => label.id !== id)
      })),
      
      addChatThread: (thread) => set((state) => ({
        chatThreads: [thread, ...state.chatThreads]
      })),
      
      updateChatThread: (id, updates) => set((state) => ({
        chatThreads: state.chatThreads.map(thread => 
          thread.id === id ? { ...thread, ...updates } : thread
        )
      })),
      
      deleteChatThread: (id) => set((state) => ({
        chatThreads: state.chatThreads.filter(thread => thread.id !== id)
      })),
      
      // Computed getters
      getFilteredNotes: () => {
        const state = get();
        const { notes, searchQuery, selectedLabels } = state;
        
        return notes.filter(note => {
          // Filter out deleted and archived notes for main view
          if (note.isDeleted || note.isArchived) return false;
          
          // Search filter
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesSearch = 
              note.title.toLowerCase().includes(query) ||
              note.content.toLowerCase().includes(query) ||
              note.labels.some(label => label.toLowerCase().includes(query));
            if (!matchesSearch) return false;
          }
          
          // Label filter
          if (selectedLabels.length > 0) {
            const hasSelectedLabel = selectedLabels.some(label => 
              note.labels.includes(label)
            );
            if (!hasSelectedLabel) return false;
          }
          
          return true;
        });
      },
      
      getArchivedNotes: () => {
        const state = get();
        return state.notes.filter(note => note.isArchived && !note.isDeleted);
      },
      
      getDeletedNotes: () => {
        const state = get();
        return state.notes.filter(note => note.isDeleted);
      },
      
      getActiveNotes: () => {
        const state = get();
        return state.notes.filter(note => !note.isDeleted && !note.isArchived);
      },
    }),
    {
      name: 'keep-notes-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        notes: state.notes,
        labels: state.labels,
        currentUser: state.currentUser,
        viewMode: state.viewMode,
      }),
    }
  )
);
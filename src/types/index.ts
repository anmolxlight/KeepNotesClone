export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  isPinned: boolean;
  labels: string[];
  images: string[];
  audioUri?: string;
  audioTranscription?: string;
  backgroundColor?: string;
  createdAt: Date;
  updatedAt: Date;
  isArchived?: boolean;
  isDeleted?: boolean;
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export interface ChatThread {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export const KEEP_COLORS = [
  { name: 'Default', value: '#ffffff', className: 'bg-white text-gray-800' },
  { name: 'Red', value: '#f28b82', className: 'bg-notes-red text-gray-800' },
  { name: 'Orange', value: '#fbbc04', className: 'bg-notes-orange text-gray-800' },
  { name: 'Yellow', value: '#fff475', className: 'bg-notes-yellow text-gray-800' },
  { name: 'Green', value: '#ccff90', className: 'bg-notes-green text-gray-800' },
  { name: 'Teal', value: '#a7ffeb', className: 'bg-notes-teal text-gray-800' },
  { name: 'Blue', value: '#cbf0f8', className: 'bg-notes-blue text-gray-800' },
  { name: 'Dark Blue', value: '#aecbfa', className: 'bg-notes-dark-blue text-gray-800' },
  { name: 'Purple', value: '#d7aefb', className: 'bg-notes-purple text-gray-800' },
  { name: 'Pink', value: '#fdcfe8', className: 'bg-notes-pink text-gray-800' },
  { name: 'Brown', value: '#e6c9a8', className: 'bg-notes-brown text-gray-800' },
  { name: 'Gray', value: '#e8eaed', className: 'bg-notes-gray text-gray-800' },
] as const;

export const BACKGROUND_THEMES = [
  { name: 'None', value: null },
  { name: 'Celebration', value: 'celebration' },
  { name: 'Places', value: 'places' },
  { name: 'Recipes', value: 'recipes' },
  { name: 'Music', value: 'music' },
  { name: 'Grocery', value: 'grocery' },
  { name: 'Notes', value: 'notes' },
  { name: 'Travel', value: 'travel' },
  { name: 'Video', value: 'video' },
] as const;

export interface Label {
  id: string;
  name: string;
  color?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export type ViewMode = 'grid' | 'list';

export interface AppState {
  notes: Note[];
  chatThreads: ChatThread[];
  labels: Label[];
  currentUser: User | null;
  viewMode: ViewMode;
  searchQuery: string;
  selectedLabels: string[];
  sidebarOpen: boolean;
  currentPage: 'notes' | 'archive' | 'deleted' | 'labels' | 'settings' | 'chat';
}

// Web-specific types
export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  count?: number;
}

export interface FloatingActionButton {
  icon: string;
  action: () => void;
  primary?: boolean;
  className?: string;
} 
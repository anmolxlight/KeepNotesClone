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
  { name: 'Default', value: '#ffffff' },
  { name: 'Red', value: '#f28b82' },
  { name: 'Orange', value: '#fbbc04' },
  { name: 'Yellow', value: '#fff475' },
  { name: 'Green', value: '#ccff90' },
  { name: 'Teal', value: '#a7ffeb' },
  { name: 'Blue', value: '#cbf0f8' },
  { name: 'Dark Blue', value: '#aecbfa' },
  { name: 'Purple', value: '#d7aefb' },
  { name: 'Pink', value: '#fdcfe8' },
  { name: 'Brown', value: '#e6c9a8' },
  { name: 'Gray', value: '#e8eaed' },
];

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
];

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
} 
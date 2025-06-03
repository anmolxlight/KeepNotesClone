import { Note } from '../types';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export const generateId = (): string => {
  return uuidv4();
};

export const formatDate = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes <= 1 ? 'Just now' : `${minutes} minutes ago`;
    }
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return `${days} days ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export const sampleNotes: Note[] = [
  {
    id: generateId(),
    title: 'title',
    content: 'hello',
    color: '#ffffff',
    isPinned: false,
    labels: [],
    images: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: generateId(),
    title: 'title 2',
    content: 'hello 2',
    color: '#ffffff',
    isPinned: false,
    labels: [],
    images: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
  },
  {
    id: generateId(),
    title: 'Shopping List',
    content: 'Milk\nBread\nEggs\nApples\nBananas',
    color: '#ccff90',
    isPinned: true,
    labels: ['Shopping', 'Important'],
    images: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
  },
  {
    id: generateId(),
    title: 'Meeting Notes',
    content: 'Discussed project timeline\nDeadline: Next Friday\nAssign tasks to team members\nFollow up on budget approval',
    color: '#aecbfa',
    isPinned: false,
    labels: ['Work', 'Meetings'],
    images: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: generateId(),
    title: 'Weekend Plans',
    content: 'Visit the park\nMovie night with friends\nTry that new restaurant\nGrocery shopping',
    color: '#fdcfe8',
    isPinned: false,
    labels: ['Personal', 'Weekend'],
    images: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
  },
];

export const createNewNote = (): Note => {
  const now = new Date();
  return {
    id: generateId(),
    title: '',
    content: '',
    color: '#ffffff',
    isPinned: false,
    labels: [],
    images: [],
    createdAt: now,
    updatedAt: now,
  };
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

export const getContrastColor = (backgroundColor: string): string => {
  // Convert hex to RGB
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black for light backgrounds, white for dark backgrounds
  return luminance > 0.6 ? '#000000' : '#ffffff';
};

export const isLightColor = (color: string): boolean => {
  const lightColors = [
    '#ffffff', // Default
    '#fff475', // Yellow
    '#ccff90', // Green
    '#a7ffeb', // Teal
    '#cbf0f8', // Blue
    '#e6c9a8', // Brown
  ];
  return lightColors.includes(color);
}; 
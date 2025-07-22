import { v4 as uuidv4 } from 'uuid';
import { Note, KEEP_COLORS } from '../types';

export const generateId = (): string => uuidv4();

export const formatDate = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  
  return date.toLocaleDateString();
};

export const getColorClassName = (colorValue: string): string => {
  const color = KEEP_COLORS.find(c => c.value === colorValue);
  return color?.className || 'bg-white text-gray-800';
};

export const generateSampleNotes = (): Note[] => {
  const sampleData = [
    {
      title: 'Welcome to Keep Notes Clone',
      content: 'This is a fully functional Google Keep clone with AI features! Try creating a new note, organizing with labels, or chatting with the AI assistant.',
      color: '#cbf0f8',
      labels: ['Welcome'],
      isPinned: true,
    },
    {
      title: 'Meeting Notes - Project Alpha',
      content: 'Discussed the new feature roadmap:\n• Implement user authentication\n• Add collaborative editing\n• Integrate voice notes\n• Deploy to production',
      color: '#fff475',
      labels: ['Work', 'Meetings'],
      isPinned: false,
    },
    {
      title: 'Grocery List',
      content: '🥛 Milk\n🍞 Bread\n🥚 Eggs\n🍌 Bananas\n🥕 Carrots\n🧀 Cheese\n🍎 Apples',
      color: '#ccff90',
      labels: ['Personal', 'Shopping'],
      isPinned: false,
    },
    {
      title: 'Book Recommendations',
      content: 'Must read:\n📚 "The Pragmatic Programmer"\n📚 "Clean Code"\n📚 "Design Patterns"\n📚 "You Don\'t Know JS"',
      color: '#d7aefb',
      labels: ['Learning', 'Books'],
      isPinned: false,
    },
    {
      title: 'Weekend Plans',
      content: '🎬 Watch the new movie\n🏃‍♂️ Go for a run in the park\n👨‍🍳 Try that new recipe\n📞 Call mom and dad',
      color: '#fdcfe8',
      labels: ['Personal'],
      isPinned: false,
    },
    {
      title: 'Code Snippets',
      content: 'Useful React patterns:\n\n```jsx\nconst [state, setState] = useState(initialState);\n\nuseEffect(() => {\n  // Side effects\n}, [dependencies]);\n```',
      color: '#a7ffeb',
      labels: ['Code', 'React'],
      isPinned: false,
    },
    {
      title: 'Travel Ideas',
      content: '✈️ Japan - Cherry blossom season\n🏔️ Switzerland - Alps hiking\n🏖️ Maldives - Beach relaxation\n🏛️ Greece - Historical sites',
      color: '#f28b82',
      labels: ['Travel', 'Ideas'],
      isPinned: false,
    },
    {
      title: 'Daily Affirmations',
      content: '🌟 I am capable of achieving my goals\n💪 I embrace challenges as opportunities\n🧘‍♀️ I choose peace and positivity\n❤️ I am grateful for today\'s blessings',
      color: '#fbbc04',
      labels: ['Personal', 'Wellness'],
      isPinned: false,
    },
  ];

  return sampleData.map((data, index) => ({
    id: generateId(),
    ...data,
    images: [],
    backgroundColor: undefined,
    createdAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000), // Spread over days
    updatedAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
    isArchived: false,
    isDeleted: false,
  }));
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
  return text.substring(0, maxLength) + '...';
};

export const searchNotes = (notes: Note[], query: string): Note[] => {
  if (!query.trim()) return notes;
  
  const lowercaseQuery = query.toLowerCase();
  
  return notes.filter(note =>
    note.title.toLowerCase().includes(lowercaseQuery) ||
    note.content.toLowerCase().includes(lowercaseQuery) ||
    note.labels.some(label => label.toLowerCase().includes(lowercaseQuery))
  );
};

export const sortNotes = (notes: Note[]): Note[] => {
  return [...notes].sort((a, b) => {
    // Pinned notes first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    // Then sort by updated date (newest first)
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });
};

export const exportNotesToJSON = (notes: Note[]): string => {
  return JSON.stringify(notes, null, 2);
};

export const importNotesFromJSON = (jsonString: string): Note[] => {
  try {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) throw new Error('Invalid format');
    
    return parsed.map(note => ({
      ...note,
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt),
    }));
  } catch (error) {
    throw new Error('Failed to import notes: Invalid JSON format');
  }
};

// Masonry layout helper
export const calculateMasonryColumns = (containerWidth: number): number => {
  if (containerWidth < 600) return 1;
  if (containerWidth < 900) return 2;
  if (containerWidth < 1200) return 3;
  if (containerWidth < 1500) return 4;
  return 5;
};

// Local storage helpers for web
export const saveToLocalStorage = (key: string, data: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

export const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return defaultValue;
  }
};

export const removeFromLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove from localStorage:', error);
  }
};
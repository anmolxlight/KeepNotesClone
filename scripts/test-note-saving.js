/**
 * Test Note Auto-Save Functionality
 * 
 * This script simulates the note saving behavior to ensure it works correctly.
 */

const AsyncStorage = require('@react-native-async-storage/async-storage');

// Mock AsyncStorage for testing
const mockStorage = {};

const MockAsyncStorage = {
  getItem: async (key) => {
    return mockStorage[key] || null;
  },
  setItem: async (key, value) => {
    mockStorage[key] = value;
    console.log(`✅ Saved to storage: ${key}`);
  }
};

// Mock note creation function
function createNewNote() {
  return {
    id: `note_${Date.now()}`,
    title: '',
    content: '',
    color: '#ffffff',
    isPinned: false,
    labels: [],
    images: [],
    audioUri: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Mock save function (similar to the one in NoteEditScreen)
async function saveNote(note) {
  try {
    if (!note.title.trim() && !note.content.trim()) {
      console.log('⚠️  No content to save');
      return;
    }

    const updatedNote = { ...note, updatedAt: new Date() };
    
    const storedNotes = await MockAsyncStorage.getItem('notes');
    const notes = storedNotes ? JSON.parse(storedNotes).map((n) => ({
      ...n,
      createdAt: new Date(n.createdAt),
      updatedAt: new Date(n.updatedAt),
    })) : [];
    
    const existingIndex = notes.findIndex(n => n.id === note.id);
    
    if (existingIndex !== -1) {
      notes[existingIndex] = updatedNote;
      console.log(`📝 Updated existing note: ${note.id}`);
    } else {
      notes.unshift(updatedNote);
      console.log(`🆕 Created new note: ${note.id}`);
    }
    
    await MockAsyncStorage.setItem('notes', JSON.stringify(notes));
    console.log(`💾 Total notes in storage: ${notes.length}`);
    
  } catch (error) {
    console.error('❌ Error saving note:', error);
  }
}

// Test the functionality
async function testAutoSave() {
  console.log('🧪 Testing Auto-Save Functionality...\n');
  
  // Test 1: Create new note
  console.log('Test 1: Creating new note');
  const note1 = createNewNote();
  note1.title = 'Test Note';
  note1.content = 'This is a test note content';
  await saveNote(note1);
  
  // Test 2: Update existing note
  console.log('\nTest 2: Updating existing note');
  note1.content = 'Updated content';
  await saveNote(note1);
  
  // Test 3: Try to save empty note
  console.log('\nTest 3: Trying to save empty note');
  const emptyNote = createNewNote();
  await saveNote(emptyNote);
  
  // Test 4: Create another note
  console.log('\nTest 4: Creating second note');
  const note2 = createNewNote();
  note2.title = 'Second Note';
  note2.content = 'Another test note';
  await saveNote(note2);
  
  console.log('\n🎉 All tests completed!');
}

testAutoSave(); 
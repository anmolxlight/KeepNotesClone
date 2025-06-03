import AsyncStorage from '@react-native-async-storage/async-storage';

export const debugStorage = {
  async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      console.log('📋 All AsyncStorage keys:', keys);
      return keys;
    } catch (error) {
      console.error('❌ Error getting storage keys:', error);
      return [];
    }
  },

  async getGuestNotes(): Promise<any> {
    try {
      const notesData = await AsyncStorage.getItem('notes_guest');
      console.log('👤 Guest notes raw data:', notesData);
      if (notesData) {
        const notes = JSON.parse(notesData);
        console.log('👤 Guest notes parsed:', notes.length, 'notes');
        return notes;
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting guest notes:', error);
      return null;
    }
  },

  async createTestGuestNote(): Promise<void> {
    try {
      const testNote = {
        id: 'test-guest-note-' + Date.now(),
        title: 'Test Guest Note',
        content: 'This is a test note created in guest mode',
        color: '#ffffff',
        isPinned: false,
        labels: ['test'],
        images: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const existingNotes = await this.getGuestNotes() || [];
      const updatedNotes = [testNote, ...existingNotes];
      
      await AsyncStorage.setItem('notes_guest', JSON.stringify(updatedNotes));
      console.log('✅ Test guest note created successfully');
    } catch (error) {
      console.error('❌ Error creating test guest note:', error);
    }
  },

  async clearGuestNotes(): Promise<void> {
    try {
      await AsyncStorage.removeItem('notes_guest');
      console.log('🧹 Guest notes cleared');
    } catch (error) {
      console.error('❌ Error clearing guest notes:', error);
    }
  },

  async logCurrentUser(): Promise<void> {
    try {
      // This will help us understand what user ID is being used
      const { authService } = await import('../services/authService');
      const user = authService.getCurrentUser();
      console.log('👤 Current user:', user);
      console.log('🔑 User ID being used for storage:', user?.id || 'guest');
    } catch (error) {
      console.error('❌ Error getting current user:', error);
    }
  }
};

// Add global debug functions for easy testing in the console
if (__DEV__) {
  (global as any).debugStorage = debugStorage;
}

export default debugStorage; 
import AsyncStorage from '@react-native-async-storage/async-storage';

export const clearAllAppData = async (): Promise<void> => {
  try {
    console.log('🧹 Clearing all app data...');
    
    // Clear all keys related to the app
    const keys = await AsyncStorage.getAllKeys();
    const appKeys = keys.filter(key => 
      key.includes('notes') || 
      key.includes('chatThreads') || 
      key.includes('labels') || 
      key.includes('currentUser') ||
      key.includes('pendingOperations') ||
      key.includes('lastSyncTime')
    );
    
    if (appKeys.length > 0) {
      await AsyncStorage.multiRemove(appKeys);
      console.log(`✅ Cleared ${appKeys.length} storage keys:`, appKeys);
    } else {
      console.log('👍 No app data found to clear');
    }
    
    // Also clear specific keys that might exist
    const specificKeys = [
      'notes',
      'notes_guest',
      'notes_default',
      'currentUser',
      'pendingOperations',
      'lastSyncTime'
    ];
    
    for (const key of specificKeys) {
      try {
        await AsyncStorage.removeItem(key);
      } catch (error) {
        // Ignore errors for keys that don't exist
      }
    }
    
    console.log('✅ All app data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing app data:', error);
  }
};

export const checkStorageContents = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    console.log('📦 Current AsyncStorage keys:', keys);
    
    for (const key of keys) {
      if (key.includes('notes')) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          console.log(`📝 ${key}:`, Array.isArray(parsed) ? `${parsed.length} items` : 'object');
        }
      }
    }
  } catch (error) {
    console.error('Error checking storage:', error);
  }
}; 
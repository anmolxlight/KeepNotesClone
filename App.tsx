import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import ServiceStatusChecker from './src/utils/serviceStatus';
import { clearAllAppData } from './src/utils/storageUtils';

export default function App() {
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Only clear app data if we need to reset (can be controlled via a flag)
      const shouldClearData = false; // Set to true only when needed for debugging
      if (shouldClearData) {
        await clearAllAppData();
      }
      
      // Log service status on app start
      ServiceStatusChecker.logServiceStatus();
    } catch (error) {
      console.error('App initialization error:', error);
    }
  };

  return (
    <>
      <StatusBar style="light" backgroundColor="#202124" />
      <AppNavigator />
    </>
  );
}

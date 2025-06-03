import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen from '../screens/HomeScreen';
import NoteEditScreen from '../screens/NoteEditScreen';
import LabelsScreen from '../screens/LabelsScreen';
import LabelNotesScreen from '../screens/LabelNotesScreen';
import ArchiveScreen from '../screens/ArchiveScreen';
import DeletedScreen from '../screens/DeletedScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ChatScreen from '../screens/ChatScreen';
import LoginScreen from '../screens/LoginScreen';
import CustomDrawer from '../components/CustomDrawer';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import theme from '../styles/theme';

import { Note } from '../types';

export type RootStackParamList = {
  DrawerNavigator: undefined;
  NoteEdit: { note?: Note; isNewNote?: boolean; defaultLabel?: string };
  Chat: { threadId?: string };
  LabelNotes: { labelName: string };
};

export type DrawerParamList = {
  Notes: undefined;
  Reminders: undefined;
  Archive: undefined;
  Deleted: undefined;
  Labels: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: '#303134',
          width: 280,
        },
        drawerType: 'front',
        overlayColor: 'rgba(0, 0, 0, 0.5)',
      }}
    >
      <Drawer.Screen 
        name="Notes" 
        component={HomeScreen}
        options={{
          drawerLabel: 'Notes',
        }}
      />
      <Drawer.Screen 
        name="Reminders" 
        component={HomeScreen} // Will be replaced with actual reminder screen
        options={{
          drawerLabel: 'Reminders',
        }}
      />
      <Drawer.Screen 
        name="Labels" 
        component={LabelsScreen}
        options={{
          drawerLabel: 'Create new label',
        }}
      />
      <Drawer.Screen 
        name="Archive" 
        component={ArchiveScreen}
        options={{
          drawerLabel: 'Archive',
        }}
      />
      <Drawer.Screen 
        name="Deleted" 
        component={DeletedScreen}
        options={{
          drawerLabel: 'Deleted',
        }}
      />
      <Drawer.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          drawerLabel: 'Settings',
        }}
      />
    </Drawer.Navigator>
  );
}

function AuthenticatedNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyle: { backgroundColor: '#202124' },
      }}
    >
      <Stack.Screen 
        name="DrawerNavigator" 
        component={DrawerNavigator} 
      />
      <Stack.Screen 
        name="NoteEdit" 
        component={NoteEditScreen}
        options={{
          presentation: 'modal',
          gestureDirection: 'vertical',
        }}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{
          presentation: 'modal',
          gestureDirection: 'vertical',
        }}
      />
      <Stack.Screen 
        name="LabelNotes" 
        component={LabelNotesScreen}
        options={{
          presentation: 'card',
          gestureDirection: 'horizontal',
        }}
      />
    </Stack.Navigator>
  );
}

function AppContent() {
  const { user, isLoading, setUser } = useAuth();

  const handleAuthSuccess = React.useCallback((authUser: any) => {
    console.log('🔄 AppContent: Handling auth success for:', authUser?.name);
    setUser(authUser);
  }, [setUser]);

  if (isLoading) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <LoginScreen onAuthSuccess={handleAuthSuccess} />
    );
  }

  return <AuthenticatedNavigator />;
}

// Memoize AppContent to prevent unnecessary re-renders
const MemoizedAppContent = React.memo(AppContent);

export default function AppNavigator() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <MemoizedAppContent />
      </NavigationContainer>
    </AuthProvider>
  );
} 
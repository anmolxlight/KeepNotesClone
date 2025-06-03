import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { DrawerContentScrollView, DrawerContentComponentProps } from '@react-navigation/drawer';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

import { Note } from '../types';
import theme from '../styles/theme';
import { authService } from '../services/authService';

interface DrawerItemProps {
  icon: string;
  iconType: 'ionicons' | 'materialicons';
  label: string;
  onPress: () => void;
  isActive?: boolean;
}

function DrawerItem({ icon, iconType, label, onPress, isActive }: DrawerItemProps) {
  const IconComponent = iconType === 'ionicons' ? Ionicons : MaterialIcons;
  
  return (
    <TouchableOpacity
      style={[styles.drawerItem, isActive && styles.drawerItemActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.drawerItemContent}>
        <IconComponent
          name={icon as any}
          size={24}
          color={isActive ? theme.colors.primary : theme.colors.onSurfaceVariant}
          style={styles.drawerItemIcon}
        />
        <Text style={[
          styles.drawerItemText,
          { color: isActive ? theme.colors.primary : theme.colors.onSurface }
        ]}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function CustomDrawer(props: DrawerContentComponentProps) {
  const { state, navigation } = props;
  const currentRoute = state.routeNames[state.index];

  const [availableLabels, setAvailableLabels] = useState<string[]>([]);

  // Load labels from notes
  const loadLabels = async () => {
    try {
      // Get current user to determine storage key
      const user = authService.getCurrentUser();
      const userId = user?.id || 'guest';
      
      const storedNotes = await AsyncStorage.getItem(`notes_${userId}`);
      if (storedNotes) {
        const notes: Note[] = JSON.parse(storedNotes);
        const allLabels = notes.flatMap(note => note.labels);
        const uniqueLabels = [...new Set(allLabels)].sort();
        setAvailableLabels(uniqueLabels);
      } else {
        setAvailableLabels([]);
      }
    } catch (error) {
      console.error('Error loading labels:', error);
      setAvailableLabels([]);
    }
  };

  useEffect(() => {
    loadLabels();
  }, []);

  // Reload labels when drawer opens
  useFocusEffect(
    React.useCallback(() => {
      loadLabels();
    }, [])
  );

  const handleLabelPress = (labelName: string) => {
    navigation.navigate('LabelNotes', { labelName });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={theme.colors.menuBackground} barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Google Keep</Text>
      </View>

      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Items */}
        <View style={styles.section}>
          <DrawerItem
            icon="bulb-outline"
            iconType="ionicons"
            label="Notes"
            isActive={currentRoute === 'Notes'}
            onPress={() => navigation.navigate('Notes')}
          />
          
          <DrawerItem
            icon="notifications-outline"
            iconType="ionicons"
            label="Reminders"
            isActive={currentRoute === 'Reminders'}
            onPress={() => navigation.navigate('Reminders')}
          />
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Labels Section */}
        <View style={styles.section}>
          <DrawerItem
            icon="add"
            iconType="materialicons"
            label="Create new label"
            isActive={currentRoute === 'Labels'}
            onPress={() => navigation.navigate('Labels')}
          />
          
          {/* Display available labels */}
          {availableLabels.map((label, index) => (
            <DrawerItem
              key={index}
              icon="pricetag-outline"
              iconType="ionicons"
              label={label}
              isActive={false}
              onPress={() => handleLabelPress(label)}
            />
          ))}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Archive and Deleted */}
        <View style={styles.section}>
          <DrawerItem
            icon="archive-outline"
            iconType="ionicons"
            label="Archive"
            isActive={currentRoute === 'Archive'}
            onPress={() => navigation.navigate('Archive')}
          />
          
          <DrawerItem
            icon="trash-outline"
            iconType="ionicons"
            label="Deleted"
            isActive={currentRoute === 'Deleted'}
            onPress={() => navigation.navigate('Deleted')}
          />
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Settings and Help */}
        <View style={styles.section}>
          <DrawerItem
            icon="settings-outline"
            iconType="ionicons"
            label="Settings"
            isActive={currentRoute === 'Settings'}
            onPress={() => navigation.navigate('Settings')}
          />
          
          <DrawerItem
            icon="help-circle-outline"
            iconType="ionicons"
            label="Help & feedback"
            isActive={false}
            onPress={() => {
              // Handle help & feedback
            }}
          />
        </View>
      </DrawerContentScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.menuBackground,
  },
  
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 0,
  },
  
  headerTitle: {
    fontSize: 22,
    fontWeight: '400',
    color: theme.colors.headerText,
    marginLeft: theme.spacing.sm,
  },
  
  scrollContainer: {
    paddingVertical: theme.spacing.sm,
  },
  
  section: {
    paddingVertical: theme.spacing.xs,
  },
  
  drawerItem: {
    marginHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  
  drawerItemActive: {
    backgroundColor: 'rgba(138, 180, 248, 0.12)', // Translucent primary color
  },
  
  drawerItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    minHeight: 48,
  },
  
  drawerItemIcon: {
    marginRight: theme.spacing.lg,
    width: 24,
  },
  
  drawerItemText: {
    ...theme.typography.body1,
    flex: 1,
  },
  
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginVertical: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
  },
}); 
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { useNavigation, DrawerActions, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Note } from '../types';
import { RootStackParamList } from '../navigation/AppNavigator';
import theme from '../styles/theme';
import NoteCard from '../components/NoteCard';
import FloatingActionButton from '../components/FloatingActionButton';
import { generateId, sampleNotes } from '../utils/helpers';
import { syncService } from '../services/syncService';
import { authService } from '../services/authService';
import debugStorage from '../utils/debugStorage';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userInitial, setUserInitial] = useState('A');
  const [animatingNoteId, setAnimatingNoteId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState({ isOnline: true, inProgress: false });
  
  // Animation values - use refs to avoid state conflicts
  const animatedValue = useRef(new Animated.Value(1)).current;
  const listOpacity = useRef(new Animated.Value(1)).current;
  const isLoadingRef = useRef(false); // Use ref to track loading without causing re-renders

  // Move filterNotes before useEffect to fix declaration order
  const filterNotes = useCallback(() => {
    console.log('🔍 Filtering notes...');
    console.log('📋 Total notes:', notes.length);
    console.log('🔎 Search query:', searchQuery);
    
    if (!searchQuery.trim()) {
      console.log('✅ No search query, showing all notes');
      setFilteredNotes(notes);
      return;
    }

    try {
      // Simple local search
      const filtered = notes.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.labels.some(label => 
          label.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      console.log('✅ Filtered to', filtered.length, 'notes');
      setFilteredNotes(filtered);
    } catch (error) {
      console.error('Error searching notes:', error);
      setFilteredNotes(notes); // Fallback to showing all notes
    }
  }, [notes, searchQuery]);

  const loadNotes = useCallback(async () => {
    try {
      // Prevent multiple simultaneous loads
      if (isLoadingRef.current) return;
      
      setIsLoading(true); // Update state for UI
      isLoadingRef.current = true;
      
      // Get current user to determine storage key
      const user = authService.getCurrentUser();
      const userId = user?.id || 'guest';
      
      console.log(`📚 Loading notes for user: ${userId}`);
      
      // Load from user-specific storage
      const storedNotes = await AsyncStorage.getItem(`notes_${userId}`);
      if (storedNotes) {
        const parsedNotes = JSON.parse(storedNotes).map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
        }));
        setNotes(parsedNotes);
        console.log(`✅ Loaded ${parsedNotes.length} notes from local storage`);
      } else {
        console.log('📝 No notes found in local storage');
        setNotes([]);
      }
    } catch (error) {
      console.error('❌ Error loading notes:', error);
      setNotes([]);
    } finally {
      setIsLoading(false); // Update state for UI
      isLoadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    initializeApp();
    
    // Disable sync status monitoring to prevent state update loops
    // const statusInterval = setInterval(() => {
    //   if (syncService && syncService.getSyncStatus) {
    //     setSyncStatus(syncService.getSyncStatus());
    //   }
    // }, 2000);

    // return () => {
    //   clearInterval(statusInterval);
    // };
  }, []);

  useEffect(() => {
    filterNotes();
  }, [filterNotes]); // Use the memoized function

  // Auto-refresh notes when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Create a local stable function to avoid dependency issues
      const refreshNotes = async () => {
        try {
          // Prevent multiple simultaneous loads
          if (isLoadingRef.current) return;
          
          setIsLoading(true); // Update state for UI
          isLoadingRef.current = true;
          
          // Get current user to determine storage key
          const user = authService.getCurrentUser();
          const userId = user?.id || 'guest';
          
          console.log(`📚 Loading notes for user: ${userId}`);
          
          // Debug logging for guest mode
          if (userId === 'guest') {
            console.log('🐛 DEBUG: In guest mode, checking storage...');
            await debugStorage.logCurrentUser();
            await debugStorage.getAllKeys();
            await debugStorage.getGuestNotes();
          }
          
          // Load from user-specific storage
          const storedNotes = await AsyncStorage.getItem(`notes_${userId}`);
          console.log(`📋 Raw storage data for notes_${userId}:`, storedNotes ? 'Found data' : 'No data found');
          
          if (storedNotes) {
            const parsedNotes = JSON.parse(storedNotes).map((note: any) => ({
              ...note,
              createdAt: new Date(note.createdAt),
              updatedAt: new Date(note.updatedAt),
            }));
            setNotes(parsedNotes);
            console.log(`✅ Loaded ${parsedNotes.length} notes from local storage`);
          } else {
            console.log('📝 No notes found in local storage');
            setNotes([]);
          }
        } catch (error) {
          console.error('❌ Error loading notes:', error);
          setNotes([]);
        } finally {
          setIsLoading(false); // Update state for UI
          isLoadingRef.current = false;
        }
      };

      refreshNotes();
      
      // Trigger background sync
      if (syncService && syncService.syncAll) {
        syncService.syncAll().catch(error => {
          console.error('Background sync failed:', error);
        });
      }
    }, []) // No dependencies to prevent re-creation
  );

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      
      // Initialize sync service
      if (syncService && syncService.initializeFromStorage) {
        await syncService.initializeFromStorage();
      }
      
      // Load notes directly here instead of calling loadNotes to avoid dependency issues
      try {
        const user = authService.getCurrentUser();
        const userId = user?.id || 'guest';
        
        console.log(`📚 Initial loading notes for user: ${userId}`);
        
        const storedNotes = await AsyncStorage.getItem(`notes_${userId}`);
        if (storedNotes) {
          const parsedNotes = JSON.parse(storedNotes).map((note: any) => ({
            ...note,
            createdAt: new Date(note.createdAt),
            updatedAt: new Date(note.updatedAt),
          }));
          setNotes(parsedNotes);
          console.log(`✅ Initially loaded ${parsedNotes.length} notes`);
        } else {
          console.log('📝 No notes found during initialization');
          setNotes([]);
        }
      } catch (notesError) {
        console.error('❌ Error loading notes during initialization:', notesError);
        setNotes([]);
      }
      
      // Set user initial for demo
      setUserInitial('A');
      
      console.log('✅ App initialized successfully');
    } catch (error) {
      console.error('Error initializing app:', error);
      setNotes([]); // Ensure we have empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotePress = (note: Note) => {
    navigation.navigate('NoteEdit', { note, isNewNote: false });
  };

  const handleCreateNote = () => {
    navigation.navigate('NoteEdit', { isNewNote: true });
  };

  const handleAIChat = () => {
    navigation.navigate('Chat', {});
  };

  // Debug function for testing guest notes
  const handleTestGuestNote = async () => {
    if (__DEV__) {
      console.log('🐛 Creating test guest note...');
      await debugStorage.createTestGuestNote();
      // Reload notes to see if it appears
      loadNotes();
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Use syncService to handle both local and cloud deletion
              await syncService.deleteNote(noteId);
              
              // Update local state
              const updatedNotes = notes.filter(note => note.id !== noteId);
              setNotes(updatedNotes);
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('Error', 'Failed to delete note. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleColorChange = async (noteId: string, newColor: string) => {
    try {
      const updatedNotes = notes.map(note => 
        note.id === noteId 
          ? { ...note, color: newColor, updatedAt: new Date() }
          : note
      );
      setNotes(updatedNotes);
      
      // Save the updated note using syncService
      const updatedNote = updatedNotes.find(note => note.id === noteId);
      if (updatedNote) {
        await syncService.saveNote(updatedNote);
      }
    } catch (error) {
      console.error('Error changing note color:', error);
    }
  };

  const handlePin = async (noteId: string) => {
    try {
      // Prevent multiple animations
      if (animatingNoteId) return;
      
      // Update state first
      const updatedNotes = notes.map(note => 
        note.id === noteId 
          ? { ...note, isPinned: !note.isPinned, updatedAt: new Date() }
          : note
      );
      
      setNotes(updatedNotes);
      
      // Save the updated note using syncService
      const updatedNote = updatedNotes.find(note => note.id === noteId);
      if (updatedNote) {
        await syncService.saveNote(updatedNote);
      }
      
      // Then start animations
      setAnimatingNoteId(noteId);
      
      // Start subtle scale animation
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1.05,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        })
      ]).start(() => {
        setAnimatingNoteId(null);
      });

      // Parallel list animation to show reordering
      Animated.sequence([
        Animated.timing(listOpacity, {
          toValue: 0.7,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(listOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        })
      ]).start();
    } catch (error) {
      console.error('Error pinning note:', error);
      setAnimatingNoteId(null);
    }
  };

  const handleRefresh = async () => {
    try {
      console.log('🔄 Manual refresh triggered');
      
      // Debug guest mode in development
      if (__DEV__) {
        const user = authService.getCurrentUser();
        if (user?.id === 'guest') {
          console.log('🐛 Debug: Refreshing in guest mode');
          await debugStorage.logCurrentUser();
          await debugStorage.getAllKeys();
          await debugStorage.getGuestNotes();
        }
      }
      
      if (syncService && syncService.forcSync) {
        await syncService.forcSync();
      }
      await loadNotes();
    } catch (error) {
      console.error('Error during manual refresh:', error);
      Alert.alert('Sync Error', 'Failed to sync notes. Please check your connection.');
    }
  };

  const renderNoteCard = ({ item }: { item: Note }) => {
    const isAnimating = animatingNoteId === item.id;
    
    console.log('🎴 Rendering note card:', { 
      id: item.id.substring(0, 8), 
      title: item.title.substring(0, 20),
      hasContent: !!item.content 
    });
    
    return (
      <View style={styles.cardWrapper}>
        <Animated.View 
          style={{ 
            flex: 1,
            transform: [{ scale: isAnimating ? animatedValue : 1 }],
          }}
        >
          <NoteCard
            note={item}
            onPress={() => handleNotePress(item)}
            onDelete={() => handleDeleteNote(item.id)}
            onColorChange={(newColor) => handleColorChange(item.id, newColor)}
            onPin={() => handlePin(item.id)}
          />
        </Animated.View>
      </View>
    );
  };

  // Sort notes with pinned ones at the top
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  console.log('📊 Render state:', {
    totalNotes: notes.length,
    filteredNotes: filteredNotes.length,
    sortedNotes: sortedNotes.length,
    isLoading,
    searchQuery
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={theme.colors.background} barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Ionicons name="menu" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <Ionicons 
            name="search" 
            size={20} 
            color={theme.colors.onSurfaceVariant} 
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your notes"
            placeholderTextColor={theme.colors.placeholderText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity style={styles.profileButton} onPress={handleRefresh}>
          <View style={styles.profileCircle}>
            <Text style={styles.profileText}>{userInitial}</Text>
          </View>
          {/* Sync Status Indicator */}
          <View style={[
            styles.syncStatus, 
            { backgroundColor: syncStatus.isOnline ? theme.colors.success : theme.colors.warning }
          ]}>
            {syncStatus.inProgress && (
              <Ionicons 
                name="sync" 
                size={8} 
                color={theme.colors.onPrimary}
              />
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Notes List */}
      <Animated.View style={{ flex: 1, opacity: listOpacity }}>
        <FlatList
          style={styles.notesList}
          data={sortedNotes}
          renderItem={renderNoteCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.notesListContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshing={isLoading}
          onRefresh={handleRefresh}
          key="notesList"
        />
      </Animated.View>

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <FloatingActionButton
          icon="sparkles"
          iconType="ionicons"
          onPress={handleAIChat}
          style={styles.aiFab}
          backgroundColor={theme.colors.secondary}
        />
        <FloatingActionButton
          icon="add"
          iconType="materialicons"
          onPress={handleCreateNote}
          style={styles.fab}
          backgroundColor={theme.colors.fabBackground}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },

  menuButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },

  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.searchBackground,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },

  searchIcon: {
    marginRight: theme.spacing.sm,
  },

  searchInput: {
    flex: 1,
    color: theme.colors.onSurface,
    fontSize: 16,
    includeFontPadding: false,
  },

  profileButton: {
    padding: theme.spacing.xs,
  },

  profileCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileText: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: '500',
  },

  notesList: {
    flex: 1,
  },

  notesListContent: {
    padding: theme.spacing.sm,
    paddingBottom: 100,
  },

  row: {
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xs,
    alignItems: 'flex-start',
  },

  sectionHeader: {
    width: '100%',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },

  sectionHeaderText: {
    color: theme.colors.secondaryText,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 1,
  },

  separator: {
    height: theme.spacing.sm,
  },

  fabContainer: {
    position: 'absolute',
    bottom: theme.spacing.lg,
    right: theme.spacing.lg,
    flexDirection: 'column',
    alignItems: 'center',
  },

  fab: {
    marginVertical: theme.spacing.sm,
  },

  aiFab: {
    transform: [{ scale: 0.8 }],
  },

  cardWrapper: {
    flex: 1,
    padding: theme.spacing.xs,
  },

  syncStatus: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
}); 
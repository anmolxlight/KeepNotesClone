import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Note } from '../types';
import theme from '../styles/theme';
import NoteCard from '../components/NoteCard';
import FloatingActionButton from '../components/FloatingActionButton';
import { syncService } from '../services/syncService';
import { authService } from '../services/authService';

type LabelNotesScreenNavigationProp = StackNavigationProp<any>;
type LabelNotesScreenRouteProp = RouteProp<{ params: { labelName: string } }, 'params'>;

export default function LabelNotesScreen() {
  const navigation = useNavigation<LabelNotesScreenNavigationProp>();
  const route = useRoute<LabelNotesScreenRouteProp>();
  
  const { labelName } = route.params;
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [labeledNotes, setLabeledNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [animatingNoteId, setAnimatingNoteId] = useState<string | null>(null);
  
  // Animation values
  const animatedValue = useRef(new Animated.Value(1)).current;
  const listOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    filterNotesByLabel();
  }, [notes, labelName]);

  // Auto-refresh notes when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!isLoading) {
        loadNotes();
      }
    }, [isLoading])
  );

  const loadNotes = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get current user to determine storage key
      const user = authService.getCurrentUser();
      const userId = user?.id || 'guest';
      
      console.log(`📚 Loading notes for label "${labelName}" (user: ${userId})`);
      
      // Load from user-specific storage
      const storedNotes = await AsyncStorage.getItem(`notes_${userId}`);
      if (storedNotes) {
        const parsedNotes = JSON.parse(storedNotes).map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
        }));
        setNotes(parsedNotes);
        console.log(`✅ Loaded ${parsedNotes.length} notes for label filtering`);
      } else {
        console.log('📝 No notes found');
        setNotes([]);
      }
    } catch (error) {
      console.error('❌ Error loading notes:', error);
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  }, [labelName]);

  const filterNotesByLabel = () => {
    const filtered = notes.filter(note => 
      note.labels.some(label => 
        label.toLowerCase() === labelName.toLowerCase()
      )
    );
    setLabeledNotes(filtered);
  };

  const handleNotePress = (note: Note) => {
    navigation.navigate('NoteEdit', { note, isNewNote: false });
  };

  const handleCreateNote = () => {
    navigation.navigate('NoteEdit', { isNewNote: true, defaultLabel: labelName });
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      // Use syncService to handle both local and cloud deletion
      await syncService.deleteNote(noteId);
      
      // Update local state
      const updatedNotes = notes.filter(note => note.id !== noteId);
      setNotes(updatedNotes);
      
      console.log('✅ Note deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting note:', error);
    }
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
        console.log('✅ Note color updated successfully');
      }
    } catch (error) {
      console.error('❌ Error changing note color:', error);
    }
  };

  const handlePin = async (noteId: string) => {
    try {
      if (animatingNoteId) return;
      
      const updatedNotes = notes.map(note => 
        note.id === noteId 
          ? { ...note, isPinned: !note.isPinned, updatedAt: new Date() }
          : note
      );
      
      setNotes(updatedNotes);
      setAnimatingNoteId(noteId);
      
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

      // Save the updated note using syncService
      const updatedNote = updatedNotes.find(note => note.id === noteId);
      if (updatedNote) {
        await syncService.saveNote(updatedNote);
        console.log('✅ Note pin status updated successfully');
      }
    } catch (error) {
      console.error('❌ Error pinning note:', error);
      setAnimatingNoteId(null);
    }
  };

  const renderNoteCard = ({ item }: { item: Note }) => {
    const isAnimating = animatingNoteId === item.id;
    
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
  const sortedNotes = [...labeledNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={theme.colors.background} barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>{labelName}</Text>
          <Text style={styles.subtitle}>{sortedNotes.length} notes</Text>
        </View>

        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
      </View>

      {/* Notes List */}
      <Animated.View style={{ flex: 1, opacity: listOpacity }}>
        {sortedNotes.length > 0 ? (
          <FlatList
            style={styles.notesList}
            data={sortedNotes}
            renderItem={renderNoteCard}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.notesListContent}
            refreshing={isLoading}
            onRefresh={loadNotes}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="pricetag-outline" size={64} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.emptyTitle}>No notes with "{labelName}"</Text>
            <Text style={styles.emptySubtitle}>
              Create a note and add #{labelName} to see it here
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
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
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },

  backButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },

  titleContainer: {
    flex: 1,
  },

  title: {
    fontSize: 20,
    fontWeight: '500',
    color: theme.colors.onSurface,
  },

  subtitle: {
    fontSize: 14,
    color: theme.colors.secondaryText,
    marginTop: 2,
  },

  searchButton: {
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
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

  cardWrapper: {
    flex: 1,
    padding: theme.spacing.xs,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },

  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.secondaryText,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
    lineHeight: 20,
  },

  fabContainer: {
    position: 'absolute',
    bottom: theme.spacing.lg,
    right: theme.spacing.lg,
  },

  fab: {
    // Custom styling if needed
  },
}); 
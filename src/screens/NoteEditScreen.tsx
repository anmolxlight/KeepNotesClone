import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Note, KEEP_COLORS } from '../types';
import { RootStackParamList } from '../navigation/AppNavigator';
import theme from '../styles/theme';
import { generateId, createNewNote, isLightColor } from '../utils/helpers';
import geminiService from '../services/geminiService';
import { syncService } from '../services/syncService';
import { authService } from '../services/authService';
import audioService from '../services/audioService';

type NoteEditScreenNavigationProp = StackNavigationProp<RootStackParamList, 'NoteEdit'>;
type NoteEditScreenRouteProp = RouteProp<RootStackParamList, 'NoteEdit'>;

export default function NoteEditScreen() {
  const navigation = useNavigation<NoteEditScreenNavigationProp>();
  const route = useRoute<NoteEditScreenRouteProp>();
  
  const { note: initialNote, isNewNote = false } = route.params || {};
  
  const [note, setNote] = useState<Note>(initialNote || createNewNote());
  const [showAIInput, setShowAIInput] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const titleRef = useRef<TextInput>(null);
  const contentRef = useRef<TextInput>(null);
  const aiInputRef = useRef<TextInput>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const backgroundColor = note.color || '#ffffff';
  const isLight = isLightColor(backgroundColor);
  const textColor = isLight ? '#3c4043' : theme.colors.onSurface;
  const placeholderColor = isLight ? '#5f6368' : theme.colors.placeholderText;

  // Initialize note with default label if provided
  useEffect(() => {
    const { defaultLabel } = route.params || {};
    if (defaultLabel && isNewNote && !note.labels.includes(defaultLabel)) {
      setNote(prev => ({
        ...prev,
        labels: [...prev.labels, defaultLabel]
      }));
    }
  }, [route.params, isNewNote]);

  // Auto-focus title for new notes
  useEffect(() => {
    if (isNewNote && titleRef.current) {
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [isNewNote]);

  // Auto-save effect
  useEffect(() => {
    if (hasChanges) {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Set new timeout to save after 1 second of inactivity
      saveTimeoutRef.current = setTimeout(() => {
        saveNote();
        setHasChanges(false);
      }, 1000);
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [hasChanges]);

  const saveNote = useCallback(async () => {
    try {
      // Only save if there's actual content
      if (!note.title.trim() && !note.content.trim()) {
        return;
      }

      // Create updated note without triggering state update
      const updatedNote = { ...note, updatedAt: new Date() };
      
      // Use syncService to handle both local and cloud saving
      await syncService.saveNote(updatedNote);
      
      console.log('✅ Note saved successfully');
    } catch (error) {
      console.error('❌ Error saving note:', error);
    }
  }, [note]);

  const handleBack = async () => {
    // Clear any pending save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Save note immediately if it has content
    if (note.title.trim() || note.content.trim()) {
      await saveNote();
    }
    navigation.goBack();
  };

  const handleTitleChange = (text: string) => {
    const updatedLabels = updateLabelsFromContent(note.content, text);
    setNote(prev => ({ 
      ...prev, 
      title: text, 
      labels: updatedLabels,
      updatedAt: new Date() 
    }));
    setHasChanges(true);
  };

  const handleContentChange = (text: string) => {
    const updatedLabels = updateLabelsFromContent(text, note.title);
    setNote(prev => ({ 
      ...prev, 
      content: text, 
      labels: updatedLabels,
      updatedAt: new Date() 
    }));
    setHasChanges(true);
  };

  const handleColorChange = (color: string) => {
    setNote(prev => ({ ...prev, color }));
    setHasChanges(true);
  };

  const handlePin = () => {
    setNote(prev => ({ ...prev, isPinned: !prev.isPinned }));
    setHasChanges(true);
  };

  const handleAIToggle = () => {
    setShowAIInput(!showAIInput);
    if (!showAIInput) {
      setTimeout(() => aiInputRef.current?.focus(), 100);
    }
    setHasChanges(true);
  };

  const handleAIQuery = async () => {
    if (!aiQuery.trim()) return;
    
    setIsLoading(true);
    try {
      // Use Gemini AI to generate content based on query and existing note content
      const aiResponse = await geminiService.generateNoteText(
        aiQuery.trim(),
        `${note.title}\n${note.content}`.trim()
      );

      setNote(prev => ({
        ...prev,
        content: prev.content + (prev.content ? '\n\n' : '') + aiResponse,
        updatedAt: new Date()
      }));
      
      setAiQuery('');
      setShowAIInput(false);
      setHasChanges(true);
    } catch (error) {
      console.error('AI generation error:', error);
      Alert.alert(
        'AI Error', 
        'Failed to generate AI content. Please check your API configuration and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceRecording = async () => {
    try {
      if (isRecording) {
        // Stop recording
        setIsRecording(false);
        const recordingResult = await audioService.stopRecording();
        
        if (recordingResult && recordingResult.uri) {
          // Transcribe audio
          const transcription = await audioService.transcribeAudio(recordingResult.uri);
          
          if (transcription) {
            setNote(prev => ({
              ...prev,
              content: prev.content + (prev.content ? '\n\n' : '') + transcription,
              updatedAt: new Date()
            }));
            setHasChanges(true);
          }
        }
      } else {
        // Start recording
        const permission = await audioService.requestPermissions();
        if (permission) {
          setIsRecording(true);
          await audioService.startRecording();
        } else {
          Alert.alert(
            'Permission Required',
            'Please enable microphone permissions to record audio notes.'
          );
        }
      }
    } catch (error) {
      console.error('Voice recording error:', error);
      setIsRecording(false);
      Alert.alert(
        'Recording Error',
        'Failed to record audio. Please try again.'
      );
    }
  };

  const deleteNote = async () => {
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
              await syncService.deleteNote(note.id);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('Error', 'Failed to delete note. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Save when screen loses focus
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Screen is losing focus, save immediately
        if (note.title.trim() || note.content.trim()) {
          saveNote();
        }
      };
    }, [note, saveNote])
  );

  // Function to extract hashtags from text
  const extractHashtags = (text: string): string[] => {
    // Only match hashtags followed by space or punctuation (NOT end of string)
    // This prevents creating labels while actively typing
    const hashtagRegex = /#([a-zA-Z0-9_]+)(?=\s|[.,!?;:\n\r])/g;
    const matches = [];
    let match;
    
    while ((match = hashtagRegex.exec(text)) !== null) {
      matches.push(match[1]); // Get the captured group (without #)
    }
    
    return [...new Set(matches)]; // Remove duplicates
  };

  // Function to update labels based on content (with debouncing logic)
  const updateLabelsFromContent = (content: string, title: string) => {
    const allText = `${title} ${content}`;
    const extractedLabels = extractHashtags(allText);
    
    // Keep existing manually added labels and add new extracted ones
    const existingManualLabels = note.labels.filter(label => {
      // Check if this label exists as a hashtag in the text
      const hashtagPattern = new RegExp(`#${label}(?=\\s|[.,!?;:\\n\\r])`, 'i');
      return !hashtagPattern.test(allText);
    });
    
    // Combine manual labels with extracted ones, remove duplicates
    const combinedLabels = [...new Set([...existingManualLabels, ...extractedLabels])];
    
    return combinedLabels;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar backgroundColor={backgroundColor} barStyle={isLight ? 'dark-content' : 'light-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handlePin}>
            <Ionicons
              name={note.isPinned ? "pin" : "pin-outline"}
              size={24}
              color={textColor}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerButton} onPress={() => {}}>
            <Ionicons name="alarm-outline" size={24} color={textColor} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerButton} onPress={() => {}}>
            <Ionicons name="archive-outline" size={24} color={textColor} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerButton} onPress={deleteNote}>
            <Ionicons name="trash-outline" size={24} color={textColor} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerButton} onPress={() => {}}>
            <MaterialIcons name="more-vert" size={24} color={textColor} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Title Input */}
          <TextInput
            ref={titleRef}
            style={[styles.titleInput, { color: textColor }]}
            placeholder="Title"
            placeholderTextColor={placeholderColor}
            value={note.title}
            onChangeText={handleTitleChange}
            multiline
            textAlignVertical="top"
          />

          {/* Content Input */}
          <TextInput
            ref={contentRef}
            style={[styles.contentInput, { color: textColor }]}
            placeholder="Note"
            placeholderTextColor={placeholderColor}
            value={note.content}
            onChangeText={handleContentChange}
            multiline
            textAlignVertical="top"
          />

          {/* AI Input Section */}
          {showAIInput && (
            <View style={styles.aiInputContainer}>
              <View style={[styles.aiInputWrapper, { borderColor: placeholderColor }]}>
                <Ionicons name="sparkles" size={20} color={textColor} style={styles.aiIcon} />
                <TextInput
                  ref={aiInputRef}
                  style={[styles.aiInput, { color: textColor }]}
                  placeholder="Ask AI to help with this note..."
                  placeholderTextColor={placeholderColor}
                  value={aiQuery}
                  onChangeText={setAiQuery}
                  multiline
                  onSubmitEditing={handleAIQuery}
                />
                <TouchableOpacity onPress={handleAIQuery} disabled={isLoading}>
                  <Ionicons
                    name="send"
                    size={20}
                    color={isLoading ? placeholderColor : theme.colors.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom Toolbar */}
        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.toolbarButton} onPress={handleAIToggle}>
            <Ionicons
              name="sparkles"
              size={24}
              color={showAIInput ? theme.colors.primary : textColor}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolbarButton} onPress={() => {}}>
            <Ionicons name="image-outline" size={24} color={textColor} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolbarButton} onPress={handleVoiceRecording}>
            <Ionicons
              name={isRecording ? "mic" : "mic-outline"}
              size={24}
              color={isRecording ? theme.colors.error : textColor}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolbarButton} onPress={() => {}}>
            <MaterialIcons name="format-color-text" size={24} color={textColor} />
          </TouchableOpacity>

          {/* Color Palette */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorPalette}>
            {KEEP_COLORS.map((color, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.colorButton,
                  { backgroundColor: color.value },
                  note.color === color.value && styles.selectedColor,
                ]}
                onPress={() => handleColorChange(color.value)}
              />
            ))}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    minHeight: 56,
  },

  headerButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.round,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  keyboardAvoid: {
    flex: 1,
  },

  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },

  titleInput: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: theme.spacing.md,
    includeFontPadding: false,
    textAlignVertical: 'top',
  },

  contentInput: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
    minHeight: 200,
    includeFontPadding: false,
    textAlignVertical: 'top',
  },

  aiInputContainer: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },

  aiInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },

  aiIcon: {
    marginRight: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },

  aiInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    includeFontPadding: false,
    maxHeight: 100,
  },

  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },

  toolbarButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },

  colorPalette: {
    flexDirection: 'row',
    marginLeft: theme.spacing.sm,
  },

  colorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: theme.spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },

  selectedColor: {
    borderColor: '#000000',
    borderWidth: 3,
  },
}); 
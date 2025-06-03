import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  FlatList,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { RootStackParamList } from '../navigation/AppNavigator';
import { ChatThread, ChatMessage, Note } from '../types';
import theme from '../styles/theme';
import { generateId } from '../utils/helpers';
import geminiService from '../services/geminiService';
import { syncService } from '../services/syncService';
import { authService } from '../services/authService';

type ChatScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>;

export default function ChatScreen() {
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentThread, setCurrentThread] = useState<ChatThread | null>(null);
  const flatListRef = React.useRef<FlatList>(null);

  useEffect(() => {
    initializeChat();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const initializeChat = async () => {
    try {
      // Load user's notes for context
      await loadNotes();
      
      // Create or load chat thread
      await createNewThread();
    } catch (error) {
      console.error('Error initializing chat:', error);
    }
  };

  const loadNotes = async () => {
    try {
      // Get current user to determine storage key
      const user = authService.getCurrentUser();
      const userId = user?.id || 'guest';
      
      console.log(`📚 Loading notes for chat context (user: ${userId})`);
      
      // Load from user-specific storage
      const storedNotes = await AsyncStorage.getItem(`notes_${userId}`);
      if (storedNotes) {
        const parsedNotes = JSON.parse(storedNotes).map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
        }));
        setNotes(parsedNotes);
        console.log(`✅ Loaded ${parsedNotes.length} notes for chat context`);
      } else {
        console.log('📝 No notes found for chat context');
        setNotes([]);
      }
    } catch (error) {
      console.error('❌ Error loading notes for chat:', error);
      setNotes([]);
    }
  };

  const createNewThread = async () => {
    const welcomeMessage: ChatMessage = {
      id: generateId(),
      text: 'Hello! I\'m your AI assistant for notes. I can help you:\n\n• Search through your notes\n• Summarize note content\n• Find related notes\n• Answer questions about your notes\n• Suggest labels and organization\n\nTry asking me something like "Find notes about shopping" or "What meetings do I have scheduled?"',
      isUser: false,
      timestamp: new Date(),
    };

    const newThread: ChatThread = {
      id: generateId(),
      userId: authService.getCurrentUser()?.id || 'guest',
      title: 'New Chat',
      messages: [welcomeMessage],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setCurrentThread(newThread);
    setMessages([welcomeMessage]);

    // Save thread using syncService
    try {
      await syncService.saveChatThread(newThread);
      console.log('✅ Chat thread created and saved');
    } catch (error) {
      console.error('❌ Failed to save chat thread:', error);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    // Add user message immediately
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);

    try {
      // Generate AI response using Gemini
      const aiResponse = await geminiService.generateChatResponse(
        userMessage.text,
        messages,
        notes
      );

      const aiMessage: ChatMessage = {
        id: generateId(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);

      // Update current thread
      if (currentThread) {
        const updatedThread: ChatThread = {
          ...currentThread,
          messages: finalMessages,
          updatedAt: new Date(),
          title: currentThread.title === 'New Chat' 
            ? userMessage.text.substring(0, 30) + (userMessage.text.length > 30 ? '...' : '')
            : currentThread.title,
        };

        setCurrentThread(updatedThread);

        // Save updated thread using syncService
        try {
          await syncService.saveChatThread(updatedThread);
          console.log('✅ Chat thread updated and saved');
        } catch (error) {
          console.error('❌ Failed to save updated chat thread:', error);
        }
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      const errorMessage: ChatMessage = {
        id: generateId(),
        text: 'Sorry, I encountered an error while processing your request. Please make sure your AI services are configured properly, or try asking a different question.',
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = async () => {
    Alert.alert(
      'New Chat',
      'Start a new conversation? This will save your current chat.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'New Chat',
          style: 'default',
          onPress: async () => {
            await createNewThread();
          },
        },
      ]
    );
  };

  const handleSearchNotes = async (query: string) => {
    try {
      const user = authService.getCurrentUser();
      if (user) {
        const searchResults = await syncService.searchNotes(query, user.id);
        return searchResults;
      }
      return [];
    } catch (error) {
      console.error('Error searching notes:', error);
      return [];
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[
      styles.messageContainer,
      item.isUser ? styles.userMessage : styles.aiMessage,
    ]}>
      <Text style={[
        styles.messageText,
        { color: item.isUser ? theme.colors.onPrimary : theme.colors.onSurface }
      ]}>
        {item.text}
      </Text>
      <Text style={[
        styles.timestamp,
        { color: item.isUser ? theme.colors.onPrimary : theme.colors.secondaryText }
      ]}>
        {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  const renderTypingIndicator = () => {
    if (!isLoading) return null;

    return (
      <View style={[styles.messageContainer, styles.aiMessage]}>
        <View style={styles.typingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={[styles.messageText, { color: theme.colors.onSurface, marginLeft: 8 }]}>
            AI is thinking...
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={theme.colors.background} barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>AI Assistant</Text>
          <Text style={styles.headerSubtitle}>
            {notes.length} notes • {currentThread?.title || 'New Chat'}
          </Text>
        </View>
        <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat}>
          <Ionicons name="add" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Messages */}
        <FlatList
          data={[...messages]}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={renderTypingIndicator}
          ref={flatListRef}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10,
          }}
          onContentSizeChange={() => {
            if (flatListRef.current) {
              flatListRef.current.scrollToEnd({ animated: true });
            }
          }}
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask about your notes..."
              placeholderTextColor={theme.colors.placeholderText}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[
                styles.sendButton, 
                { opacity: (inputText.trim() && !isLoading) ? 1 : 0.5 }
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={theme.colors.onPrimary} />
              ) : (
                <Ionicons name="send" size={20} color={theme.colors.onPrimary} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },

  backButton: {
    padding: theme.spacing.sm,
  },

  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },

  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.onSurface,
  },

  headerSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.secondaryText,
    marginTop: 2,
  },

  newChatButton: {
    padding: theme.spacing.sm,
  },

  messagesList: {
    flex: 1,
  },

  messagesContainer: {
    padding: theme.spacing.md,
  },

  messageContainer: {
    marginVertical: theme.spacing.sm,
    maxWidth: '80%',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },

  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary,
  },

  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surface,
  },

  messageText: {
    ...theme.typography.body1,
    lineHeight: 20,
  },

  timestamp: {
    ...theme.typography.caption,
    marginTop: theme.spacing.xs,
    fontSize: 11,
  },

  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  inputContainer: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 48,
  },

  textInput: {
    flex: 1,
    color: theme.colors.onSurface,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: theme.spacing.xs,
  },

  sendButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
  },

  keyboardAvoidingView: {
    flex: 1,
  },
}); 
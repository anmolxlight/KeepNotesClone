import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note, ChatThread, Label } from '../types';
import { databaseService } from './databaseService';
import { authService } from './authService';
import { geminiService } from './geminiService';
import { pineconeService } from './pineconeService';
import config from './config';

interface SyncStatus {
  lastSyncTime: Date | null;
  isOnline: boolean;
  isSyncing: boolean;
  pendingChanges: number;
  conflictCount: number;
}

interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: 'notes' | 'chatThreads' | 'labels';
  data: any;
  timestamp: Date;
  retryCount: number;
}

class SyncService {
  private isInitialized = false;
  private syncStatus: SyncStatus = {
    lastSyncTime: null,
    isOnline: true,
    isSyncing: false,
    pendingChanges: 0,
    conflictCount: 0,
  };
  private pendingOperations: PendingOperation[] = [];
  private syncIntervalId: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL = 30000; // 30 seconds
  private readonly MAX_RETRY_COUNT = 3;

  constructor() {
    this.initializeNetworkListener();
    this.initializeAppStateListener();
    // Don't start periodic sync in constructor - wait for initialization
  }

  private initializeNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.syncStatus.isOnline;
      this.syncStatus.isOnline = state.isConnected ?? false;
      
      if (__DEV__) {
        console.log(`📶 Network status: ${this.syncStatus.isOnline ? 'Online' : 'Offline'}`);
      }

      // If we just came back online, trigger a sync
      if (wasOffline && this.syncStatus.isOnline) {
        console.log('🔄 Back online - triggering sync...');
        this.syncAll();
      }
    });
  }

  private initializeAppStateListener() {
    AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && this.syncStatus.isOnline) {
        // App became active and we're online - sync
        this.syncAll();
      }
    });
  }

  private startPeriodicSync() {
    // Clear any existing interval first
    this.stopPeriodicSync();
    
    // Sync every 30 seconds when online
    this.syncIntervalId = setInterval(() => {
      if (this.syncStatus.isOnline && !this.syncStatus.isSyncing) {
        this.syncAll();
      }
    }, this.SYNC_INTERVAL);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🔄 Initializing Sync Service...');

      // Initialize core services
      await authService.initialize();
      await databaseService.initialize();

      // Load pending operations from storage
      await this.loadPendingOperations();

      // Network detection is already handled by initializeNetworkListener() in constructor
      // No need for additional browser-based listeners

      // Load last sync time
      await this.loadLastSyncTime();

      // Start automatic syncing if user is authenticated
      if (authService.isAuthenticated()) {
        this.startPeriodicSync();
      }

      this.isInitialized = true;
      console.log('✅ Sync Service initialized');
    } catch (error) {
      console.error('❌ Sync Service initialization failed:', error);
      this.isInitialized = true; // Allow app to continue
    }
  }

  async initializeFromStorage(): Promise<void> {
    try {
      console.log('🔄 Initializing sync service from storage...');
      await this.initialize();
      console.log('✅ Sync service initialized from storage');
    } catch (error) {
      console.error('❌ Failed to initialize sync service from storage:', error);
    }
  }

  // Main sync operation
  async syncAll(userId?: string): Promise<boolean> {
    if (this.syncStatus.isSyncing) {
      console.log('⏳ Sync already in progress');
      return false;
    }

    const user = authService.getCurrentUser();
    if (!user) {
      console.log('👤 No authenticated user, skipping sync');
      return false;
    }

    if (!this.syncStatus.isOnline) {
      console.log('📱 Offline, skipping sync');
      return false;
    }

    try {
      this.syncStatus.isSyncing = true;
      console.log('🔄 Starting full sync...');

      // Process pending operations first
      await this.processPendingOperations();

      // Sync notes
      await this.syncNotes(user.id);

      // Sync chat threads
      await this.syncChatThreads(user.id);

      // Sync labels
      await this.syncLabels(user.id);

      // Update sync status
      this.syncStatus.lastSyncTime = new Date();
      await this.saveLastSyncTime();

      console.log('✅ Full sync completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Sync failed:', error);
      return false;
    } finally {
      this.syncStatus.isSyncing = false;
    }
  }

  // Sync individual collections
  private async syncNotes(userId: string): Promise<void> {
    try {
      // Get local notes
      const localNotes = await this.getLocalNotes(userId);
      
      // Get cloud notes
      const cloudNotes = await databaseService.getNotes(userId);

      // Merge and resolve conflicts
      const mergedNotes = await this.mergeNotes(localNotes, cloudNotes);

      // Update local storage
      await this.saveLocalNotes(userId, mergedNotes);

      // Update search index
      await this.updateSearchIndex(mergedNotes, userId);

      console.log(`📝 Synced ${mergedNotes.length} notes`);
    } catch (error) {
      console.error('❌ Notes sync failed:', error);
      throw error;
    }
  }

  private async syncChatThreads(userId: string): Promise<void> {
    try {
      const localThreads = await this.getLocalChatThreads(userId);
      const cloudThreads = await databaseService.getChatThreads(userId);
      const mergedThreads = this.mergeChatThreads(localThreads, cloudThreads);
      
      await this.saveLocalChatThreads(userId, mergedThreads);
      
      console.log(`💬 Synced ${mergedThreads.length} chat threads`);
    } catch (error) {
      console.error('❌ Chat threads sync failed:', error);
      throw error;
    }
  }

  private async syncLabels(userId: string): Promise<void> {
    try {
      const localLabels = await this.getLocalLabels(userId);
      const cloudLabels = await databaseService.getLabels(userId);
      const mergedLabels = this.mergeLabels(localLabels, cloudLabels);
      
      await this.saveLocalLabels(userId, mergedLabels);
      
      console.log(`🏷️ Synced ${mergedLabels.length} labels`);
    } catch (error) {
      console.error('❌ Labels sync failed:', error);
      throw error;
    }
  }

  // Note operations with sync
  async saveNote(note: Note): Promise<void> {
    const user = authService.getCurrentUser();
    
    try {
      // Always save locally first for immediate UI feedback
      const userId = user?.id || 'guest';
      await this.updateLocalNote(userId, note);
      console.log(`💾 Note saved locally for user: ${userId}`);

      // Try cloud sync only if user is authenticated and online
      if (user && user.id !== 'guest' && this.syncStatus.isOnline) {
        console.log('☁️ Attempting cloud sync...');
        try {
          const savedNote = await databaseService.saveNote(note, user.id);
          if (savedNote) {
            console.log('✅ Note synced to cloud successfully');
            // Update search index
            await this.indexNote(note, user.id);
          } else {
            console.log('⚠️ Cloud sync failed - note saved locally only');
            await this.addPendingOperation('update', 'notes', note);
          }
        } catch (cloudError: any) {
          console.log('❌ Cloud sync error - adding to pending operations:', cloudError.message);
          await this.addPendingOperation('update', 'notes', note);
        }
      } else if (!user || user.id === 'guest') {
        console.log('👤 Guest mode - note saved locally only');
      } else {
        console.log('📱 Offline - note will sync when online');
        await this.addPendingOperation('update', 'notes', note);
      }
    } catch (error) {
      console.error('❌ Failed to save note:', error);
      // Even if cloud sync fails, the note should be saved locally
    }
  }

  async deleteNote(noteId: string): Promise<void> {
    const user = authService.getCurrentUser();
    
    try {
      // Always delete locally first
      const userId = user?.id || 'guest';
      await this.removeLocalNote(userId, noteId);
      console.log(`🗑️ Note deleted locally for user: ${userId}`);

      // Try cloud delete only if user is authenticated and online
      if (user && user.id !== 'guest' && this.syncStatus.isOnline) {
        console.log('☁️ Attempting cloud delete...');
        try {
          const success = await databaseService.deleteNote(noteId);
          if (success) {
            console.log('✅ Note deleted from cloud successfully');
          } else {
            console.log('⚠️ Cloud delete failed - adding to pending operations');
            await this.addPendingOperation('delete', 'notes', { id: noteId });
          }
        } catch (cloudError: any) {
          console.log('❌ Cloud delete error - adding to pending operations:', cloudError.message);
          await this.addPendingOperation('delete', 'notes', { id: noteId });
        }

        // Remove from search index
        try {
          await pineconeService.deleteNote(noteId);
        } catch (searchError) {
          console.warn('⚠️ Failed to remove from search index:', searchError);
        }
      } else if (!user || user.id === 'guest') {
        console.log('👤 Guest mode - note deleted locally only');
      } else {
        console.log('📱 Offline - delete will sync when online');
        await this.addPendingOperation('delete', 'notes', { id: noteId });
      }
    } catch (error) {
      console.error('❌ Failed to delete note:', error);
    }
  }

  // Chat thread operations
  async saveChatThread(thread: ChatThread): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) {
      console.log('👤 No authenticated user - saving chat thread locally only');
      // Save locally for guest mode
      await this.updateLocalChatThread('guest', thread);
      return;
    }

    try {
      await this.updateLocalChatThread(user.id, thread);

      if (this.syncStatus.isOnline) {
        const savedThread = await databaseService.updateChatThread(thread.id, thread);
        if (!savedThread) {
          await this.addPendingOperation('update', 'chatThreads', thread);
        }
      } else {
        await this.addPendingOperation('update', 'chatThreads', thread);
      }
    } catch (error) {
      console.error('❌ Failed to save chat thread:', error);
      await this.addPendingOperation('update', 'chatThreads', thread);
    }
  }

  // Pending operations management
  private async addPendingOperation(
    type: 'create' | 'update' | 'delete',
    collection: 'notes' | 'chatThreads' | 'labels',
    data: any
  ): Promise<void> {
    const operation: PendingOperation = {
      id: data.id || `${type}_${Date.now()}`,
      type,
      collection,
      data,
      timestamp: new Date(),
      retryCount: 0,
    };

    this.pendingOperations.push(operation);
    this.syncStatus.pendingChanges = this.pendingOperations.length;
    
    await this.savePendingOperations();
    console.log(`📋 Added pending operation: ${type} ${collection}`);
  }

  private async processPendingOperations(): Promise<void> {
    if (this.pendingOperations.length === 0) return;

    console.log(`🔄 Processing ${this.pendingOperations.length} pending operations...`);

    const user = authService.getCurrentUser();
    if (!user) return;

    const successfulOperations: string[] = [];

    for (const operation of this.pendingOperations) {
      try {
        let success = false;

        switch (operation.collection) {
          case 'notes':
            success = await this.processPendingNoteOperation(operation);
            break;
          case 'chatThreads':
            success = await this.processPendingChatThreadOperation(operation);
            break;
          case 'labels':
            success = await this.processPendingLabelOperation(operation);
            break;
        }

        if (success) {
          successfulOperations.push(operation.id);
        } else {
          operation.retryCount++;
          if (operation.retryCount >= this.MAX_RETRY_COUNT) {
            console.warn(`⚠️ Max retries reached for operation ${operation.id}`);
            successfulOperations.push(operation.id); // Remove failed operation
          }
        }
      } catch (error) {
        console.error(`❌ Pending operation failed: ${operation.id}`, error);
        operation.retryCount++;
      }
    }

    // Remove successful operations
    this.pendingOperations = this.pendingOperations.filter(
      op => !successfulOperations.includes(op.id)
    );

    this.syncStatus.pendingChanges = this.pendingOperations.length;
    await this.savePendingOperations();

    console.log(`✅ Processed pending operations: ${successfulOperations.length} successful`);
  }

  private async processPendingNoteOperation(operation: PendingOperation): Promise<boolean> {
    switch (operation.type) {
      case 'create':
        const createdNote = await databaseService.createNote(operation.data);
        return !!createdNote;
      case 'update':
        const updatedNote = await databaseService.updateNote(operation.data.id, operation.data);
        return !!updatedNote;
      case 'delete':
        return await databaseService.deleteNote(operation.data.id);
      default:
        return false;
    }
  }

  private async processPendingChatThreadOperation(operation: PendingOperation): Promise<boolean> {
    switch (operation.type) {
      case 'create':
        const createdThread = await databaseService.createChatThread(operation.data);
        return !!createdThread;
      case 'update':
        const updatedThread = await databaseService.updateChatThread(operation.data.id, operation.data);
        return !!updatedThread;
      case 'delete':
        return await databaseService.deleteChatThread(operation.data.id);
      default:
        return false;
    }
  }

  private async processPendingLabelOperation(operation: PendingOperation): Promise<boolean> {
    switch (operation.type) {
      case 'create':
        const createdLabel = await databaseService.createLabel(operation.data);
        return !!createdLabel;
      case 'delete':
        return await databaseService.deleteLabel(operation.data.id);
      default:
        return false;
    }
  }

  // Data merging with conflict resolution
  private async mergeNotes(localNotes: Note[], cloudNotes: Note[]): Promise<Note[]> {
    const noteMap = new Map<string, Note>();

    // Add local notes first
    localNotes.forEach(note => noteMap.set(note.id, note));

    // Add cloud notes (cloud wins in conflicts based on timestamp)
    for (const cloudNote of cloudNotes) {
      const localNote = noteMap.get(cloudNote.id);
      if (!localNote || cloudNote.updatedAt > localNote.updatedAt) {
        noteMap.set(cloudNote.id, cloudNote);
      } else if (localNote.updatedAt > cloudNote.updatedAt) {
        // Local note is newer, keep it and mark for upload
        try {
          await this.addPendingOperation('update', 'notes', localNote);
        } catch (error) {
          console.warn('Failed to add pending operation during merge:', error);
        }
      }
    }

    return Array.from(noteMap.values()).sort((a, b) => 
      b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  private mergeChatThreads(localThreads: ChatThread[], cloudThreads: ChatThread[]): ChatThread[] {
    const threadMap = new Map<string, ChatThread>();

    localThreads.forEach(thread => threadMap.set(thread.id, thread));

    cloudThreads.forEach(cloudThread => {
      const localThread = threadMap.get(cloudThread.id);
      if (!localThread || cloudThread.updatedAt > localThread.updatedAt) {
        threadMap.set(cloudThread.id, cloudThread);
      }
    });

    return Array.from(threadMap.values()).sort((a, b) => 
      b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  private mergeLabels(localLabels: Label[], cloudLabels: Label[]): Label[] {
    const labelMap = new Map<string, Label>();

    localLabels.forEach(label => labelMap.set(label.id, label));
    cloudLabels.forEach(label => labelMap.set(label.id, label));

    return Array.from(labelMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  }

  // Local storage operations
  private async getLocalNotes(userId: string): Promise<Note[]> {
    try {
      const data = await AsyncStorage.getItem(`notes_${userId}`);
      if (!data) return [];
      
      return JSON.parse(data).map((note: any) => ({
        ...note,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt),
      }));
    } catch (error) {
      console.error('Failed to get local notes:', error);
      return [];
    }
  }

  private async saveLocalNotes(userId: string, notes: Note[]): Promise<void> {
    try {
      await AsyncStorage.setItem(`notes_${userId}`, JSON.stringify(notes));
    } catch (error) {
      console.error('Failed to save local notes:', error);
    }
  }

  private async updateLocalNote(userId: string, note: Note): Promise<void> {
    const notes = await this.getLocalNotes(userId);
    const index = notes.findIndex(n => n.id === note.id);
    
    if (index >= 0) {
      notes[index] = note;
    } else {
      notes.unshift(note);
    }
    
    await this.saveLocalNotes(userId, notes);
  }

  private async removeLocalNote(userId: string, noteId: string): Promise<void> {
    const notes = await this.getLocalNotes(userId);
    const filteredNotes = notes.filter(n => n.id !== noteId);
    await this.saveLocalNotes(userId, filteredNotes);
  }

  private async getLocalChatThreads(userId: string): Promise<ChatThread[]> {
    try {
      const data = await AsyncStorage.getItem(`chatThreads_${userId}`);
      if (!data) return [];
      
      return JSON.parse(data).map((thread: any) => ({
        ...thread,
        createdAt: new Date(thread.createdAt),
        updatedAt: new Date(thread.updatedAt),
        messages: thread.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }));
    } catch (error) {
      console.error('Failed to get local chat threads:', error);
      return [];
    }
  }

  private async saveLocalChatThreads(userId: string, threads: ChatThread[]): Promise<void> {
    try {
      await AsyncStorage.setItem(`chatThreads_${userId}`, JSON.stringify(threads));
    } catch (error) {
      console.error('Failed to save local chat threads:', error);
    }
  }

  private async updateLocalChatThread(userId: string, thread: ChatThread): Promise<void> {
    const threads = await this.getLocalChatThreads(userId);
    const index = threads.findIndex(t => t.id === thread.id);
    
    if (index >= 0) {
      threads[index] = thread;
    } else {
      threads.unshift(thread);
    }
    
    await this.saveLocalChatThreads(userId, threads);
  }

  private async getLocalLabels(userId: string): Promise<Label[]> {
    try {
      const data = await AsyncStorage.getItem(`labels_${userId}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get local labels:', error);
      return [];
    }
  }

  private async saveLocalLabels(userId: string, labels: Label[]): Promise<void> {
    try {
      await AsyncStorage.setItem(`labels_${userId}`, JSON.stringify(labels));
    } catch (error) {
      console.error('Failed to save local labels:', error);
    }
  }

  // Search index operations
  private async updateSearchIndex(notes: Note[], userId: string): Promise<void> {
    try {
      // Update search index with notes that have content
      const notesWithContent = notes.filter(note => 
        note.title.trim() || note.content.trim() || note.audioTranscript
      );

      for (const note of notesWithContent) {
        await this.indexNote(note, userId);
      }
    } catch (error) {
      console.warn('Failed to update search index:', error);
    }
  }

  private async indexNote(note: Note, userId: string): Promise<void> {
    try {
      const searchText = [
        note.title,
        note.content,
        note.audioTranscript,
        note.labels.join(' ')
      ].filter(Boolean).join(' ').trim();

      if (searchText) {
        await pineconeService.indexNote(note, userId);
      }
    } catch (error) {
      console.warn('Failed to index note:', error);
    }
  }

  // Network status monitoring - using NetInfo in constructor, browser methods not needed
  private handleOnline(): void {
    console.log('📶 Back online - resuming sync');
    this.syncStatus.isOnline = true;
    
    // Trigger sync when coming back online
    setTimeout(() => {
      this.syncAll();
    }, 1000);
  }

  private handleOffline(): void {
    console.log('📱 Gone offline - queuing operations');
    this.syncStatus.isOnline = false;
  }

  // Persistence
  private async loadPendingOperations(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('pendingOperations');
      if (data) {
        this.pendingOperations = JSON.parse(data).map((op: any) => ({
          ...op,
          timestamp: new Date(op.timestamp),
        }));
        this.syncStatus.pendingChanges = this.pendingOperations.length;
      }
    } catch (error) {
      console.error('Failed to load pending operations:', error);
    }
  }

  private async savePendingOperations(): Promise<void> {
    try {
      await AsyncStorage.setItem('pendingOperations', JSON.stringify(this.pendingOperations));
    } catch (error) {
      console.error('Failed to save pending operations:', error);
    }
  }

  private async loadLastSyncTime(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('lastSyncTime');
      if (data) {
        this.syncStatus.lastSyncTime = new Date(data);
      }
    } catch (error) {
      console.error('Failed to load last sync time:', error);
    }
  }

  private async saveLastSyncTime(): Promise<void> {
    try {
      if (this.syncStatus.lastSyncTime) {
        await AsyncStorage.setItem('lastSyncTime', this.syncStatus.lastSyncTime.toISOString());
      }
    } catch (error) {
      console.error('Failed to save last sync time:', error);
    }
  }

  // Public API
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  async forcSync(): Promise<boolean> {
    return await this.syncAll();
  }

  isOnline(): boolean {
    return this.syncStatus.isOnline;
  }

  hasPendingChanges(): boolean {
    return this.syncStatus.pendingChanges > 0;
  }

  // Cleanup
  async cleanup(): Promise<void> {
    this.stopPeriodicSync();
    console.log('🧹 Sync service cleaned up');
  }

  private stopPeriodicSync(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
      console.log('⏰ Stopped periodic sync');
    }
  }
}

export const syncService = new SyncService(); 
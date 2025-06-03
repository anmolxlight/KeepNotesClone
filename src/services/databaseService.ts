import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Note, ChatThread, Label, User } from '../types';

// Get configuration from environment
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

class DatabaseService {
  private supabase: SupabaseClient;
  private initialized = false;

  constructor() {
    // Create Supabase client with service role key for bypass RLS during testing
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false, // Disable auth persistence to reduce dependencies
        autoRefreshToken: false,
      },
      realtime: {
        enabled: false, // Completely disable realtime
      },
      global: {
        headers: {
          'X-Client-Info': 'keepnotes-rn',
        },
      },
      db: {
        schema: 'public'
      },
    });
  }

  async initialize(): Promise<void> {
    try {
      if (this.initialized) return;

      console.log('🔄 Initializing Supabase...');
      console.log('📍 Supabase URL:', SUPABASE_URL ? 'Set' : 'Not set');
      console.log('🔑 Anon Key:', SUPABASE_ANON_KEY ? 'Set' : 'Not set');

      // Test connection with a simple query that doesn't require RLS
      const { data, error } = await this.supabase
        .from('notes')
        .select('count')
        .limit(1);

      if (error) {
        console.warn('⚠️ Supabase connection warning:', error.message);
        if (error.message.includes('row-level security') || error.message.includes('RLS')) {
          console.warn('⚠️ RLS is enabled. Using offline mode for testing.');
        }
      } else {
        console.log('✅ Supabase connection successful');
      }

      this.initialized = true;
      console.log('✅ Supabase initialized successfully');
    } catch (error) {
      console.error('❌ Supabase initialization error:', error);
      // Don't throw - allow app to work offline
      this.initialized = true;
    }
  }

  // Notes operations
  async getNotes(userId: string): Promise<Note[]> {
    try {
      const { data, error } = await this.supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.transformNoteFromDb);
    } catch (error) {
      console.error('Error fetching notes:', error);
      return [];
    }
  }

  async createNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note | null> {
    try {
      const dbNote = {
        user_id: note.userId,
        title: note.title,
        content: note.content,
        color: note.color,
        pinned: note.pinned,
        archived: note.archived,
        labels: note.labels,
        image_url: note.imageUrl,
        audio_url: note.audioUrl,
        audio_transcript: note.audioTranscript,
        checklist_items: note.checklistItems,
        reminder_date: note.reminderDate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await this.supabase
        .from('notes')
        .insert([dbNote])
        .select()
        .single();

      if (error) throw error;

      return this.transformNoteFromDb(data);
    } catch (error) {
      console.error('Error creating note:', error);
      return null;
    }
  }

  async updateNote(noteId: string, updates: Partial<Note>): Promise<Note | null> {
    try {
      const dbUpdates: any = {
        updated_at: new Date().toISOString(),
      };

      // Map fields to database column names
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.content !== undefined) dbUpdates.content = updates.content;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.pinned !== undefined) dbUpdates.pinned = updates.pinned;
      if (updates.archived !== undefined) dbUpdates.archived = updates.archived;
      if (updates.labels !== undefined) dbUpdates.labels = updates.labels;
      if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
      if (updates.audioUrl !== undefined) dbUpdates.audio_url = updates.audioUrl;
      if (updates.audioTranscript !== undefined) dbUpdates.audio_transcript = updates.audioTranscript;
      if (updates.checklistItems !== undefined) dbUpdates.checklist_items = updates.checklistItems;
      if (updates.reminderDate !== undefined) dbUpdates.reminder_date = updates.reminderDate;

      const { data, error } = await this.supabase
        .from('notes')
        .update(dbUpdates)
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw error;

      return this.transformNoteFromDb(data);
    } catch (error) {
      console.error('Error updating note:', error);
      return null;
    }
  }

  async deleteNote(noteId: string, userId?: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      return false;
    }
  }

  async searchNotes(userId: string, query: string): Promise<Note[]> {
    try {
      const { data, error } = await this.supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%,audio_transcript.ilike.%${query}%`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.transformNoteFromDb);
    } catch (error) {
      console.error('Error searching notes:', error);
      return [];
    }
  }

  // Chat operations
  async getChatThreads(userId: string): Promise<ChatThread[]> {
    try {
      const { data, error } = await this.supabase
        .from('chat_threads')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.transformChatThreadFromDb);
    } catch (error) {
      console.error('Error fetching chat threads:', error);
      return [];
    }
  }

  async createChatThread(thread: Omit<ChatThread, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChatThread | null> {
    try {
      const dbThread = {
        user_id: thread.userId,
        title: thread.title,
        messages: thread.messages,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await this.supabase
        .from('chat_threads')
        .insert([dbThread])
        .select()
        .single();

      if (error) throw error;

      return this.transformChatThreadFromDb(data);
    } catch (error) {
      console.error('Error creating chat thread:', error);
      return null;
    }
  }

  async updateChatThread(threadId: string, updates: Partial<ChatThread>): Promise<ChatThread | null> {
    try {
      const dbUpdates: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.messages !== undefined) dbUpdates.messages = updates.messages;

      const { data, error } = await this.supabase
        .from('chat_threads')
        .update(dbUpdates)
        .eq('id', threadId)
        .select()
        .single();

      if (error) throw error;

      return this.transformChatThreadFromDb(data);
    } catch (error) {
      console.error('Error updating chat thread:', error);
      return null;
    }
  }

  async deleteChatThread(threadId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('chat_threads')
        .delete()
        .eq('id', threadId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting chat thread:', error);
      return false;
    }
  }

  // Labels operations
  async getLabels(userId: string): Promise<Label[]> {
    try {
      const { data, error } = await this.supabase
        .from('labels')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });

      if (error) throw error;

      return (data || []).map(this.transformLabelFromDb);
    } catch (error) {
      console.error('Error fetching labels:', error);
      return [];
    }
  }

  async createLabel(label: Omit<Label, 'id'>): Promise<Label | null> {
    try {
      const dbLabel = {
        user_id: label.userId,
        name: label.name,
        color: label.color,
      };

      const { data, error } = await this.supabase
        .from('labels')
        .insert([dbLabel])
        .select()
        .single();

      if (error) throw error;

      return this.transformLabelFromDb(data);
    } catch (error) {
      console.error('Error creating label:', error);
      return null;
    }
  }

  async deleteLabel(labelId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('labels')
        .delete()
        .eq('id', labelId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting label:', error);
      return false;
    }
  }

  // User operations
  async getUser(userId: string): Promise<User | null> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // User not found
        throw error;
      }

      return this.transformUserFromDb(data);
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  async createUser(user: User): Promise<User | null> {
    try {
      const dbUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatarUrl,
        preferences: user.preferences,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await this.supabase
        .from('users')
        .insert([dbUser])
        .select()
        .single();

      if (error) throw error;

      return this.transformUserFromDb(data);
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    try {
      const dbUpdates: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
      if (updates.preferences !== undefined) dbUpdates.preferences = updates.preferences;

      const { data, error } = await this.supabase
        .from('users')
        .update(dbUpdates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      return this.transformUserFromDb(data);
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  // Real-time subscriptions (temporarily disabled to avoid WebSocket issues)
  subscribeToNotes(userId: string, callback: (notes: Note[]) => void): () => void {
    console.warn('Real-time subscriptions temporarily disabled to avoid WebSocket bundling issues');
    
    // Return a no-op unsubscribe function
    return () => {
      console.log('No-op unsubscribe called');
    };
    
    /* TODO: Re-enable once WebSocket polyfill is working
    const subscription = this.supabase
      .channel(`notes:${userId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notes',
          filter: `user_id=eq.${userId}`
        }, 
        async () => {
          const notes = await this.getNotes(userId);
          callback(notes);
        }
      )
      .subscribe();

    return () => {
      this.supabase.removeChannel(subscription);
    };
    */
  }

  // Helper methods to transform database objects to app objects
  private transformNoteFromDb(dbNote: any): Note {
    return {
      id: dbNote.id,
      userId: dbNote.user_id,
      title: dbNote.title || '',
      content: dbNote.content || '',
      color: dbNote.color || 'default',
      pinned: dbNote.pinned || false,
      archived: dbNote.archived || false,
      labels: dbNote.labels || [],
      imageUrl: dbNote.image_url,
      audioUrl: dbNote.audio_url,
      audioTranscript: dbNote.audio_transcript,
      checklistItems: dbNote.checklist_items || [],
      reminderDate: dbNote.reminder_date,
      createdAt: new Date(dbNote.created_at),
      updatedAt: new Date(dbNote.updated_at),
    };
  }

  private transformChatThreadFromDb(dbThread: any): ChatThread {
    return {
      id: dbThread.id,
      userId: dbThread.user_id,
      title: dbThread.title,
      messages: dbThread.messages || [],
      createdAt: new Date(dbThread.created_at),
      updatedAt: new Date(dbThread.updated_at),
    };
  }

  private transformLabelFromDb(dbLabel: any): Label {
    return {
      id: dbLabel.id,
      userId: dbLabel.user_id,
      name: dbLabel.name,
      color: dbLabel.color,
    };
  }

  private transformUserFromDb(dbUser: any): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      avatarUrl: dbUser.avatar_url,
      preferences: dbUser.preferences || {},
      createdAt: new Date(dbUser.created_at),
      updatedAt: new Date(dbUser.updated_at),
    };
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('notes')
        .select('count')
        .limit(1);

      return !error;
    } catch {
      return false;
    }
  }

  // Convenience methods for backward compatibility
  async saveNote(note: Note, userId: string): Promise<Note | null> {
    try {
      console.log(`💾 Attempting to save note: ${note.title || 'Untitled'} for user: ${userId}`);
      
      // If note has an ID, try to update it; if update fails (note doesn't exist), create new
      if (note.id && note.id !== 'temp') {
        try {
          console.log(`📝 Updating existing note: ${note.id}`);
          const updatedNote = await this.updateNote(note.id, note);
          if (updatedNote) {
            console.log('✅ Note updated successfully');
            return updatedNote;
          }
        } catch (updateError: any) {
          console.log('⚠️ Update failed, will try creating new note:', updateError.message);
          // If update fails because note doesn't exist (PGRST116), create new note
          if (updateError?.code === 'PGRST116') {
            console.log('📄 Note not found in database, creating new note');
            // Fall through to create new note
          } else if (updateError?.code === '42501') {
            console.warn('🔒 RLS policy violation - operating in offline mode');
            return null; // Return null to indicate offline-only operation
          } else {
            throw updateError; // Re-throw if it's a different error
          }
        }
      }
      
      // Create new note (either because it's new or update failed)
      console.log('➕ Creating new note');
      const noteData = {
        userId,
        title: note.title,
        content: note.content,
        color: note.color,
        pinned: note.pinned || false,
        archived: note.archived || false,
        labels: note.labels || [],
        imageUrl: note.imageUrl,
        audioUrl: note.audioUrl,
        audioTranscript: note.audioTranscript,
        checklistItems: note.checklistItems || [],
        reminderDate: note.reminderDate,
      };
      
      const createdNote = await this.createNote(noteData);
      if (createdNote) {
        console.log('✅ Note created successfully');
      } else {
        console.log('⚠️ Note creation failed - operating in offline mode');
      }
      return createdNote;
    } catch (error: any) {
      if (error?.code === '42501') {
        console.warn('🔒 RLS policy violation - Supabase requires authentication. Operating in offline mode.');
        console.warn('💡 Tip: To use Supabase, you need to either:');
        console.warn('   1. Disable RLS on your tables, or');
        console.warn('   2. Set up proper authentication with row-level policies');
        return null;
      } else {
        console.error('❌ Error saving note:', error);
        return null;
      }
    }
  }

  // Test connection method for compatibility
  async testConnection(): Promise<boolean> {
    try {
      await this.initialize();
      return await this.isHealthy();
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }
}

export const databaseService = new DatabaseService(); 
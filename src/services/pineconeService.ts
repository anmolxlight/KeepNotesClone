import config from './config';
import { Note } from '../types';

interface PineconeVector {
  id: string;
  values: number[];
  metadata?: Record<string, any>;
}

interface PineconeQueryResponse {
  matches: Array<{
    id: string;
    score: number;
    metadata?: Record<string, any>;
  }>;
}

interface PineconeIndex {
  name: string;
  host: string;
  dimension: number;
  metric: string;
  status: {
    ready: boolean;
    state: string;
  };
}

class PineconeService {
  private controlPlaneUrl = 'https://api.pinecone.io';
  private indexHost: string | null = null;
  private apiKey: string;
  private indexName: string;

  constructor() {
    this.apiKey = config.pineconeApiKey;
    this.indexName = config.pineconeIndexName;
    
    if (__DEV__) {
      console.log('Pinecone Service initialized with:', {
        indexName: this.indexName,
        hasApiKey: !!this.apiKey,
        controlPlaneUrl: this.controlPlaneUrl
      });
    }
  }

  private async getIndexHost(): Promise<string> {
    if (this.indexHost) {
      return this.indexHost;
    }

    try {
      const response = await fetch(`${this.controlPlaneUrl}/indexes/${this.indexName}`, {
        method: 'GET',
        headers: {
          'Api-Key': this.apiKey,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Index "${this.indexName}" not found. Please create it in your Pinecone dashboard.`);
        }
        throw new Error(`Failed to get index details: ${response.status} ${response.statusText}`);
      }

      const indexData: PineconeIndex = await response.json();
      this.indexHost = indexData.host;
      
      if (__DEV__) {
        console.log(`Pinecone index host resolved: ${this.indexHost}`);
      }
      
      return this.indexHost;
    } catch (error) {
      console.error('Error getting Pinecone index host:', error);
      throw error;
    }
  }

  private async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'DELETE' = 'GET',
    data?: any
  ): Promise<any> {
    if (!this.apiKey || this.apiKey === 'your_pinecone_api_key_here') {
      const errorMessage = `
╭─ Pinecone API Key Required ─╮
│                             │
│  To use vector search:       │
│  1. Visit https://app.pinecone.io/ │
│  2. Create a free account    │
│  3. Create an index named "noted" │
│  4. Get your API key         │
│  5. Update PINECONE_API_KEY in .env │
│  6. Restart expo server     │
│                             │
╰─────────────────────────────╯`;
      
      console.warn(errorMessage);
      throw new Error('Pinecone API key not configured. Vector search unavailable.');
    }

    try {
      const indexHost = await this.getIndexHost();
      
      const headers: Record<string, string> = {
        'Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      };

      const requestConfig: RequestInit = {
        method,
        headers,
      };

      if (data && method !== 'GET') {
        requestConfig.body = JSON.stringify(data);
      }

      const fullUrl = `https://${indexHost}${endpoint}`;
      if (__DEV__) {
        console.log(`Pinecone API call: ${method} ${fullUrl}`);
      }

      const response = await fetch(fullUrl, requestConfig);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Pinecone API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return method === 'DELETE' ? null : await response.json();
    } catch (error) {
      console.warn('Pinecone API request failed:', error);
      throw error;
    }
  }

  private async getEmbedding(text: string): Promise<number[]> {
    // Simple hash-based embedding (for demo purposes)
    // In a real implementation, you'd use an embedding model like OpenAI's text-embedding-ada-002
    // or call an embedding service via HTTP
    
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(1024).fill(0);
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      for (let j = 0; j < word.length && j < embedding.length; j++) {
        embedding[j] += word.charCodeAt(j % word.length) * (i + 1);
      }
    }
    
    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
  }

  async indexNote(note: Note): Promise<void> {
    try {
      // Combine title, content, and labels for embedding
      const textToEmbed = `${note.title} ${note.content} ${note.labels.join(' ')}`.trim();
      
      if (!textToEmbed) return; // Skip empty notes

      const embedding = await this.getEmbedding(textToEmbed);

      const vector: PineconeVector = {
        id: note.id,
        values: embedding,
        metadata: {
          title: note.title,
          content: note.content.substring(0, 1000), // Limit content size
          labels: note.labels,
          color: note.color,
          isPinned: note.isPinned,
          createdAt: note.createdAt.toISOString(),
          updatedAt: note.updatedAt.toISOString(),
        }
      };

      await this.makeRequest('/vectors/upsert', 'POST', {
        vectors: [vector]
      });

      console.log(`Indexed note: ${note.id}`);
    } catch (error) {
      console.error('Error indexing note in Pinecone:', error);
      // Don't throw error to prevent app crashes - just log it
    }
  }

  async searchNotes(query: string, topK: number = 10): Promise<any[]> {
    try {
      const queryEmbedding = await this.getEmbedding(query);

      const response: PineconeQueryResponse = await this.makeRequest('/query', 'POST', {
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
      });

      return response.matches?.map(match => ({
        id: match.id,
        score: match.score,
        ...match.metadata,
      })) || [];
    } catch (error) {
      console.error('Error searching notes in Pinecone:', error);
      return []; // Return empty array on error
    }
  }

  async deleteNote(noteId: string): Promise<void> {
    try {
      await this.makeRequest('/vectors/delete', 'POST', {
        ids: [noteId]
      });

      console.log(`Deleted note from index: ${noteId}`);
    } catch (error) {
      console.error('Error deleting note from Pinecone:', error);
      // Don't throw error to prevent app crashes
    }
  }

  async updateNote(note: Note): Promise<void> {
    // For updates, we can just re-index the note
    await this.indexNote(note);
  }

  async initializeIndex(): Promise<void> {
    try {
      // Check if index exists by making a test query
      await this.makeRequest('/describe_index_stats', 'POST', {});
      console.log(`Pinecone index ${this.indexName} is ready`);
    } catch (error) {
      console.error('Error checking Pinecone index:', error);
      console.log('Make sure your Pinecone index is created with dimension 1024 and cosine metric');
      // Don't throw error to prevent app crashes during startup
    }
  }

  async indexAllNotes(notes: Note[]): Promise<void> {
    try {
      console.log(`Indexing ${notes.length} notes...`);
      
      // Batch upsert for better performance
      const batchSize = 10;
      for (let i = 0; i < notes.length; i += batchSize) {
        const batch = notes.slice(i, i + batchSize);
        const vectors: PineconeVector[] = [];

        for (const note of batch) {
          const textToEmbed = `${note.title} ${note.content} ${note.labels.join(' ')}`.trim();
          
          if (textToEmbed) {
            const embedding = await this.getEmbedding(textToEmbed);
            vectors.push({
              id: note.id,
              values: embedding,
              metadata: {
                title: note.title,
                content: note.content.substring(0, 1000),
                labels: note.labels,
                color: note.color,
                isPinned: note.isPinned,
                createdAt: note.createdAt.toISOString(),
                updatedAt: note.updatedAt.toISOString(),
              }
            });
          }
        }

        if (vectors.length > 0) {
          await this.makeRequest('/vectors/upsert', 'POST', { vectors });
          console.log(`Indexed batch of ${vectors.length} notes`);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log('Finished indexing all notes');
    } catch (error) {
      console.error('Error indexing all notes:', error);
    }
  }

  // Semantic search that combines keyword and vector search
  async semanticSearch(query: string, allNotes: Note[], topK: number = 5): Promise<Note[]> {
    try {
      // First try vector search
      const vectorResults = await this.searchNotes(query, topK);
      
      // Convert vector results back to note objects
      const vectorNoteIds = vectorResults.map(result => result.id);
      const vectorNotes = allNotes.filter(note => vectorNoteIds.includes(note.id));

      // If we have good vector results (score > 0.7), return them
      const goodResults = vectorResults.filter(result => result.score && result.score > 0.7);
      if (goodResults.length > 0) {
        return vectorNotes.slice(0, Math.min(goodResults.length, topK));
      }

      // Fallback to keyword search if vector search doesn't return good results
      const keywordResults = allNotes.filter(note => {
        const searchText = `${note.title} ${note.content} ${note.labels.join(' ')}`.toLowerCase();
        const queryLower = query.toLowerCase();
        return searchText.includes(queryLower);
      });

      return keywordResults.slice(0, topK);
    } catch (error) {
      console.error('Error in semantic search:', error);
      
      // Fallback to simple text search
      const keywordResults = allNotes.filter(note => {
        const searchText = `${note.title} ${note.content} ${note.labels.join(' ')}`.toLowerCase();
        const queryLower = query.toLowerCase();
        return searchText.includes(queryLower);
      });

      return keywordResults.slice(0, topK);
    }
  }

  // Alternative search method that works purely offline
  async fallbackSearch(query: string, allNotes: Note[], topK: number = 5): Promise<Note[]> {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);

    const scoredNotes = allNotes.map(note => {
      const searchText = `${note.title} ${note.content} ${note.labels.join(' ')}`.toLowerCase();
      
      let score = 0;
      
      // Exact phrase match gets highest score
      if (searchText.includes(queryLower)) {
        score += 10;
      }
      
      // Word matches
      for (const word of queryWords) {
        if (searchText.includes(word)) {
          score += 1;
        }
      }
      
      // Title matches get bonus
      if (note.title.toLowerCase().includes(queryLower)) {
        score += 5;
      }
      
      // Pinned notes get small bonus
      if (note.isPinned) {
        score += 0.5;
      }

      return { note, score };
    });

    // Sort by score and return top results
    return scoredNotes
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(item => item.note);
  }
}

export default new PineconeService(); 
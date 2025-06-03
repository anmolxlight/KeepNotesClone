import config from './config';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

class GeminiService {
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  private cleanFormatting(text: string): string {
    // Remove markdown formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold **text**
      .replace(/\*(.*?)\*/g, '$1')     // Remove italic *text*
      .replace(/__(.*?)__/g, '$1')     // Remove bold __text__
      .replace(/_(.*?)_/g, '$1')       // Remove italic _text_
      .replace(/`(.*?)`/g, '$1')       // Remove code `text`
      .replace(/#{1,6}\s/g, '')        // Remove headers
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links [text](url)
      .trim();
  }

  private async makeRequest(prompt: string, maxTokens: number = 500, temperature: number = 0.7): Promise<string> {
    if (!config.geminiApiKey || config.geminiApiKey.trim() === '') {
      console.error('Gemini API key missing:', {
        hasKey: !!config.geminiApiKey,
        keyLength: config.geminiApiKey?.length || 0,
        keyPreview: config.geminiApiKey?.substring(0, 10) || 'undefined'
      });
      throw new Error('Gemini API key not configured. Please set GEMINI_API_KEY in your .env file.');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/models/gemini-1.5-flash-latest:generateContent?key=${config.geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: temperature,
              maxOutputTokens: maxTokens,
              topP: 0.8,
              topK: 10
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorData.error?.message || ''}`);
      }

      const data: GeminiResponse = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response generated from Gemini');
      }

      const text = data.candidates[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Invalid response format from Gemini');
      }

      return this.cleanFormatting(text);
    } catch (error) {
      console.error('Gemini API request failed:', error);
      throw error;
    }
  }

  async generateNoteText(query: string, noteContext: string = ''): Promise<string> {
    try {
      const systemPrompt = `You are an AI assistant helping with note-taking. Follow these guidelines:

RESPONSE STYLE:
- Never use bold, italic, or any markdown formatting
- Use plain text only
- Adapt your response to the user's request complexity:
  * Simple additions: Brief, relevant content
  * Detailed requests: Comprehensive, well-structured information
  * Creative writing: Full, engaging content as requested
  * Lists or outlines: Well-organized plain text structure

CONTENT GUIDELINES:
- Be practical and useful for note-taking
- If expanding existing content, build naturally upon it
- For new content, provide structured, valuable information
- Match the tone and style of existing note content when possible`;

      const prompt = `${systemPrompt}

${noteContext ? `Current note content: "${noteContext}"` : ''}

User request: "${query}"

Generate helpful content that can be added to their note:`;

      return await this.makeRequest(prompt, 500, 0.7);
    } catch (error) {
      console.error('Gemini text generation error:', error);
      throw new Error('Failed to generate AI content. Please check your API key and try again.');
    }
  }

  async searchNotes(query: string, notes: any[]): Promise<string> {
    try {
      const notesContext = notes.map(note => `Title: ${note.title}\nContent: ${note.content}\nLabels: ${note.labels.join(', ')}`).join('\n\n');

      const systemPrompt = `You are an AI assistant helping users search and understand their notes. Follow these guidelines:

RESPONSE STYLE:
- Never use bold, italic, or any markdown formatting
- Use plain text only
- Provide clear, conversational responses
- Adapt response detail to the query complexity

SEARCH CAPABILITIES:
- Find relevant notes that match the query
- Summarize relevant information concisely
- Provide insights or connections between notes when applicable
- Answer questions based on note content`;

      const prompt = `${systemPrompt}

Here are the user's notes:
${notesContext}

User query: "${query}"

Help the user by finding and explaining relevant information from their notes:`;

      return await this.makeRequest(prompt, 800, 0.3);
    } catch (error) {
      console.error('Gemini search error:', error);
      throw new Error('Failed to search notes with AI. Please try again.');
    }
  }

  async generateChatResponse(message: string, conversationHistory: any[] = [], notes: any[] = []): Promise<string> {
    try {
      const historyContext = conversationHistory.length > 0 
        ? `Previous conversation:\n${conversationHistory.map(msg => `${msg.isUser ? 'User' : 'Assistant'}: ${msg.text}`).join('\n')}\n\n`
        : '';

      const notesContext = notes.length > 0 
        ? `Available notes:\n${notes.slice(0, 10).map(note => `- ${note.title}: ${note.content.substring(0, 100)}`).join('\n')}\n\n`
        : '';

      const systemPrompt = `You are an AI assistant for a note-taking app similar to Google Keep. Follow these guidelines:

RESPONSE STYLE:
- Never use bold, italic, or any markdown formatting in your responses
- Use plain text only
- Adapt your response length and detail to match the query complexity:
  * For simple questions: Give concise, direct answers (1-2 sentences)
  * For complex requests: Provide detailed, comprehensive responses
  * For creative writing requests: Write substantial content as requested
  * For explanations: Provide appropriate depth based on the topic complexity

RESPONSE ADAPTATION:
- Simple queries (like "what notes do I have about shopping"): Brief, direct answers
- Complex queries (like "write a detailed report" or "explain this concept"): Comprehensive responses
- Creative requests (like "write a story" or "draft an email"): Full, well-developed content
- Analysis requests: Provide thorough analysis with examples

CAPABILITIES:
- Search and find relevant notes
- Summarize information from notes  
- Help organize or categorize notes
- Suggest note improvements
- Answer questions about the user's notes
- Provide general note-taking advice
- Write detailed content when requested
- Analyze and explain complex topics

Always be conversational, helpful, and match the user's expectations for response depth.`;

      const prompt = `${systemPrompt}

${notesContext}${historyContext}User: ${message}

Please provide a helpful response. You can:
- Search and find relevant notes
- Summarize information from notes
- Help organize or categorize notes
- Suggest note improvements
- Answer questions about the user's notes
- Provide general note-taking advice

Be conversational and helpful.`;

      return await this.makeRequest(prompt, 600, 0.4);
    } catch (error) {
      console.error('Gemini chat error:', error);
      throw new Error('Failed to generate chat response. Please try again.');
    }
  }

  async summarizeNote(noteContent: string): Promise<string> {
    try {
      const prompt = `Please provide a concise summary of this note content:

"${noteContent}"

Make the summary clear and capture the key points in 1-2 sentences.`;

      return await this.makeRequest(prompt, 200, 0.3);
    } catch (error) {
      console.error('Gemini summarization error:', error);
      throw new Error('Failed to summarize note. Please try again.');
    }
  }

  async generateLabels(noteContent: string): Promise<string[]> {
    try {
      const prompt = `Based on this note content, suggest 2-4 relevant labels/tags:

"${noteContent}"

Return only the labels, separated by commas, without any other text. Examples: "Work, Meeting", "Personal, Health", "Shopping, Groceries"`;

      const text = await this.makeRequest(prompt, 100, 0.3);
      return text.split(',').map(label => label.trim()).filter(label => label.length > 0);
    } catch (error) {
      console.error('Gemini label generation error:', error);
      throw new Error('Failed to generate labels. Please try again.');
    }
  }

  // Test method to verify API key is working
  async testConnection(): Promise<boolean> {
    try {
      const testResponse = await this.makeRequest('Say "Hello, API is working!"', 50, 0.1);
      return testResponse.toLowerCase().includes('hello');
    } catch (error) {
      console.error('Gemini connection test failed:', error);
      return false;
    }
  }
}

export default new GeminiService();
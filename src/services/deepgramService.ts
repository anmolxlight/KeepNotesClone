import config from './config';

interface DeepgramResponse {
  results: {
    channels: Array<{
      alternatives: Array<{
        transcript: string;
        confidence: number;
      }>;
    }>;
  };
}

interface DeepgramError {
  error: string;
  message: string;
}

class DeepgramService {
  private apiKey: string;
  private baseUrl = 'https://api.deepgram.com/v1';

  constructor() {
    this.apiKey = config.deepgramApiKey;
    
    if (__DEV__) {
      console.log('Deepgram Service initialized:', {
        hasApiKey: !!this.apiKey && this.apiKey !== 'your_deepgram_api_key_here',
        apiKeyPreview: this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'not set'
      });
    }
  }

  private async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    data?: any,
    contentType?: string
  ): Promise<any> {
    if (!this.apiKey || this.apiKey === 'your_deepgram_api_key_here') {
      const errorMessage = `
╭─ Deepgram API Key Required ─╮
│                             │
│  To use voice transcription: │
│  1. Visit https://console.deepgram.com/ │
│  2. Sign up (free $200 credit) │
│  3. Get your API key         │
│  4. Update DEEPGRAM_API_KEY in .env │
│  5. Restart expo server     │
│                             │
╰─────────────────────────────╯`;
      
      console.warn(errorMessage);
      throw new Error('Deepgram API key not configured. Voice transcription unavailable.');
    }

    try {
      const headers: Record<string, string> = {
        'Authorization': `Token ${this.apiKey}`,
      };

      if (contentType) {
        headers['Content-Type'] = contentType;
      } else if (data && typeof data === 'object' && !(data instanceof ArrayBuffer)) {
        headers['Content-Type'] = 'application/json';
      }

      const requestConfig: RequestInit = {
        method,
        headers,
      };

      if (data) {
        if (data instanceof ArrayBuffer) {
          requestConfig.body = data;
        } else if (typeof data === 'object') {
          requestConfig.body = JSON.stringify(data);
        } else {
          requestConfig.body = data;
        }
      }

      const fullUrl = `${this.baseUrl}${endpoint}`;
      if (__DEV__) {
        console.log(`Deepgram API call: ${method} ${fullUrl}`);
      }

      const response = await fetch(fullUrl, requestConfig);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || 'Unknown error';
        throw new Error(`Deepgram API error: ${response.status} ${response.statusText} - ${errorMessage}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Deepgram API request failed:', error);
      throw error;
    }
  }

  async transcribeAudio(audioUrl: string): Promise<string> {
    try {
      const queryParams = new URLSearchParams({
        model: 'nova-2',
        language: 'en-US',
        smart_format: 'true',
        punctuate: 'true',
        paragraphs: 'true',
        utterances: 'true',
        diarize: 'false',
      });

      const response: DeepgramResponse = await this.makeRequest(
        `/listen?${queryParams}`,
        'POST',
        { url: audioUrl }
      );

      const transcript = response.results?.channels?.[0]?.alternatives?.[0]?.transcript;
      
      if (!transcript) {
        throw new Error('No transcript found in response');
      }

      return transcript;
    } catch (error) {
      console.error('Deepgram transcription error:', error);
      throw new Error('Failed to transcribe audio. Please try again.');
    }
  }

  async transcribeAudioBuffer(audioBuffer: ArrayBuffer, mimeType: string = 'audio/wav'): Promise<string> {
    try {
      const queryParams = new URLSearchParams({
        model: 'nova-2',
        language: 'en-US',
        smart_format: 'true',
        punctuate: 'true',
        paragraphs: 'true',
        utterances: 'true',
        diarize: 'false',
      });

      const response: DeepgramResponse = await this.makeRequest(
        `/listen?${queryParams}`,
        'POST',
        audioBuffer,
        mimeType
      );

      const transcript = response.results?.channels?.[0]?.alternatives?.[0]?.transcript;
      
      if (!transcript) {
        throw new Error('No transcript found in response');
      }

      return transcript;
    } catch (error) {
      console.error('Deepgram transcription error:', error);
      throw new Error('Failed to transcribe audio. Please try again.');
    }
  }

  async transcribeAudioFile(audioFile: File): Promise<string> {
    try {
      const arrayBuffer = await audioFile.arrayBuffer();
      return await this.transcribeAudioBuffer(arrayBuffer, audioFile.type);
    } catch (error) {
      console.error('Deepgram file transcription error:', error);
      throw new Error('Failed to transcribe audio file. Please try again.');
    }
  }

  // Real-time transcription setup for live recording (simplified)
  async setupLiveTranscription(onTranscript: (transcript: string) => void): Promise<any> {
    console.warn('Live transcription requires WebSocket support - not implemented in HTTP-only version');
    // For live transcription, you would need to:
    // 1. Use WebSocket API (wss://api.deepgram.com/v1/listen)
    // 2. Handle binary audio streaming
    // 3. Manage connection lifecycle
    
    // For now, return a mock connection
    return {
      send: (audioData: ArrayBuffer) => {
        console.log('Live transcription send called (mock)');
      },
      close: () => {
        console.log('Live transcription connection closed (mock)');
      }
    };
  }

  // Helper method to check if Deepgram is properly configured
  isConfigured(): boolean {
    return !!(this.apiKey && this.apiKey !== 'your_deepgram_api_key_here' && this.apiKey.length > 10);
  }

  // Method to test the service
  async testConnection(): Promise<boolean> {
    try {
      // Test with a simple audio URL using correct endpoint
      const testResult = await this.transcribeAudio(
        'https://static.deepgram.com/examples/Bueller-Life-moves-pretty-fast.wav'
      );

      return !!testResult;
    } catch (error) {
      console.error('Deepgram connection test failed:', error);
      return false;
    }
  }

  // Get supported languages
  getSupportedLanguages(): string[] {
    return [
      'en-US', 'en-GB', 'en-AU', 'en-NZ', 'en-IN',
      'es-ES', 'es-419', 'fr-FR', 'fr-CA', 'de-DE',
      'it-IT', 'pt-BR', 'pt-PT', 'nl-NL', 'sv-SE',
      'no-NO', 'da-DK', 'fi-FI', 'pl-PL', 'cs-CZ',
      'sk-SK', 'hu-HU', 'ro-RO', 'bg-BG', 'hr-HR',
      'sl-SI', 'et-EE', 'lv-LV', 'lt-LT', 'mt-MT',
      'el-GR', 'tr-TR', 'ru-RU', 'uk-UA', 'ar-SA',
      'he-IL', 'hi-IN', 'ja-JP', 'ko-KR', 'zh-CN',
      'zh-TW', 'th-TH', 'vi-VN', 'id-ID', 'ms-MY',
      'tl-PH'
    ];
  }

  // Method to handle different audio formats
  async transcribeWithFormat(audioData: any, format: 'url' | 'buffer' | 'file'): Promise<string> {
    switch (format) {
      case 'url':
        return await this.transcribeAudio(audioData);
      case 'buffer':
        return await this.transcribeAudioBuffer(audioData);
      case 'file':
        return await this.transcribeAudioFile(audioData);
      default:
        throw new Error('Unsupported audio format');
    }
  }

  // Simplified transcription for base64 audio data (common in mobile apps)
  async transcribeBase64Audio(base64Audio: string, mimeType: string = 'audio/wav'): Promise<string> {
    try {
      // Convert base64 to ArrayBuffer
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      return await this.transcribeAudioBuffer(bytes.buffer, mimeType);
    } catch (error) {
      console.error('Base64 audio transcription error:', error);
      throw new Error('Failed to transcribe base64 audio. Please try again.');
    }
  }
}

export default new DeepgramService(); 
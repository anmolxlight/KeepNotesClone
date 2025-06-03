import { AudioRecorder, AudioPlayer } from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import deepgramService from './deepgramService';

interface AudioRecording {
  uri: string;
  duration: number;
  transcription?: string;
}

class AudioService {
  private recorder: AudioRecorder | null = null;
  private player: AudioPlayer | null = null;
  private isRecording = false;
  private isPlaying = false;

  async initialize(): Promise<void> {
    try {
      // Request permissions for expo-audio
      const permission = await AudioRecorder.requestPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Audio permission not granted');
      }

      console.log('Audio service initialized with expo-audio');
    } catch (error) {
      console.error('Error initializing audio service:', error);
      throw error;
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const permission = await AudioRecorder.requestPermissionsAsync();
      return permission.granted;
    } catch (error) {
      console.error('Error requesting audio permissions:', error);
      return false;
    }
  }

  async startRecording(): Promise<void> {
    try {
      if (this.isRecording) {
        console.warn('Recording already in progress');
        return;
      }

      await this.initialize();

      // Stop any existing playback
      if (this.player) {
        await this.player.pauseAsync();
        this.player = null;
      }

      // Create new recorder
      this.recorder = new AudioRecorder({
        android: {
          extension: '.m4a',
          outputFormat: 'mpeg4',
          audioEncoder: 'aac',
        },
        ios: {
          extension: '.m4a',
          outputFormat: 'mpeg4aac',
          audioQuality: 'high',
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });

      await this.recorder.recordAsync();
      
      this.isRecording = true;
      console.log('Recording started with expo-audio');
    } catch (error) {
      console.error('Error starting recording:', error);
      this.isRecording = false;
      throw error;
    }
  }

  async stopRecording(): Promise<AudioRecording | null> {
    try {
      if (!this.recorder || !this.isRecording) {
        console.warn('No recording in progress');
        return null;
      }

      const uri = await this.recorder.stopAsync();
      
      this.recorder = null;
      this.isRecording = false;

      if (!uri) {
        throw new Error('Recording URI not available');
      }

      // Get duration from file info
      const fileInfo = await FileSystem.getInfoAsync(uri);
      const duration = fileInfo.exists ? 0 : 0; // expo-audio doesn't provide duration directly

      console.log('Recording stopped:', { uri, duration });

      // Transcribe the audio if Deepgram is configured
      let transcription: string | undefined;
      if (deepgramService.isConfigured()) {
        try {
          console.log('Transcribing audio...');
          transcription = await this.transcribeAudio(uri);
          console.log('Transcription completed:', transcription.substring(0, 50) + '...');
        } catch (transcriptionError) {
          console.error('Transcription failed:', transcriptionError);
          // Don't throw error - return recording without transcription
          console.log('Recording saved without transcription');
        }
      } else {
        console.log('Deepgram not configured - recording saved without transcription');
      }

      return {
        uri,
        duration,
        transcription,
      };
    } catch (error) {
      console.error('Error stopping recording:', error);
      this.isRecording = false;
      throw error;
    }
  }

  async transcribeAudio(audioUri: string): Promise<string> {
    try {
      if (!deepgramService.isConfigured()) {
        throw new Error('Deepgram not configured - transcription unavailable');
      }

      // Read audio file as binary data
      const audioInfo = await FileSystem.getInfoAsync(audioUri);
      if (!audioInfo.exists) {
        throw new Error('Audio file not found');
      }

      // Read the file as base64
      const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Use the base64 transcription method
      const transcription = await deepgramService.transcribeBase64Audio(base64Audio, 'audio/m4a');
      
      if (!transcription || transcription.trim() === '') {
        throw new Error('No transcription returned');
      }
      
      return transcription;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      
      // Return a helpful error message based on the type of error
      if (error.message?.includes('not configured')) {
        throw new Error('Voice transcription requires Deepgram API key. Recording saved without transcription.');
      } else {
        throw new Error('Failed to transcribe audio. Recording saved without transcription.');
      }
    }
  }

  async playAudio(uri: string): Promise<void> {
    try {
      if (this.isPlaying) {
        await this.stopPlayback();
      }

      // Stop any ongoing recording
      if (this.isRecording) {
        await this.stopRecording();
      }

      // Create new player
      this.player = new AudioPlayer(uri);
      
      await this.player.playAsync();
      this.isPlaying = true;
      
      console.log('Audio playback started');
    } catch (error) {
      console.error('Error playing audio:', error);
      this.isPlaying = false;
      throw error;
    }
  }

  async pausePlayback(): Promise<void> {
    try {
      if (this.player) {
        await this.player.pauseAsync();
        console.log('Audio playback paused');
      }
    } catch (error) {
      console.error('Error pausing audio:', error);
      throw error;
    }
  }

  async resumePlayback(): Promise<void> {
    try {
      if (this.player) {
        await this.player.playAsync();
        console.log('Audio playback resumed');
      }
    } catch (error) {
      console.error('Error resuming audio:', error);
      throw error;
    }
  }

  async stopPlayback(): Promise<void> {
    try {
      if (this.player) {
        await this.player.pauseAsync(); // expo-audio uses pauseAsync to stop
        this.player = null;
        this.isPlaying = false;
        console.log('Audio playback stopped');
      }
    } catch (error) {
      console.error('Error stopping audio:', error);
      throw error;
    }
  }

  async deleteAudioFile(uri: string): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(uri);
        console.log('Audio file deleted:', uri);
      }
    } catch (error) {
      console.error('Error deleting audio file:', error);
      throw error;
    }
  }

  getRecordingStatus(): boolean {
    return this.isRecording;
  }

  getPlaybackStatus(): boolean {
    return this.isPlaying;
  }

  async getAudioDuration(uri: string): Promise<number> {
    try {
      // For now, return 0 as expo-audio doesn't provide direct duration access
      // You could implement this by reading file metadata
      const fileInfo = await FileSystem.getInfoAsync(uri);
      return fileInfo.exists ? 0 : 0;
    } catch (error) {
      console.error('Error getting audio duration:', error);
      return 0;
    }
  }

  formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  async startLiveTranscription(onTranscript: (transcript: string) => void): Promise<void> {
    try {
      // This would require WebSocket implementation with Deepgram
      // For now, we'll just log that it's not implemented
      console.warn('Live transcription not implemented in HTTP-only version');
      
      // You would need to:
      // 1. Establish WebSocket connection to Deepgram
      // 2. Stream audio data in real-time
      // 3. Handle partial and final transcription results
      
      throw new Error('Live transcription requires WebSocket implementation');
    } catch (error) {
      console.error('Error starting live transcription:', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (this.recorder) {
        await this.recorder.stopAsync();
        this.recorder = null;
      }
      
      if (this.player) {
        await this.player.pauseAsync();
        this.player = null;
      }
      
      this.isRecording = false;
      this.isPlaying = false;
      
      console.log('Audio service cleaned up');
    } catch (error) {
      console.error('Error cleaning up audio service:', error);
    }
  }
}

export default new AudioService(); 
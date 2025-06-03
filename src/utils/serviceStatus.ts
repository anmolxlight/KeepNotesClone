import config from '../services/config';
import geminiService from '../services/geminiService';
import deepgramService from '../services/deepgramService';

export interface ServiceStatus {
  name: string;
  configured: boolean;
  description: string;
  setupUrl?: string;
  freeCredit?: string;
}

export class ServiceStatusChecker {
  static getStatus(): ServiceStatus[] {
    return [
      {
        name: 'Gemini AI',
        configured: !!(config.geminiApiKey && config.geminiApiKey !== 'your_gemini_api_key_here'),
        description: 'AI text generation, chat responses, and note enhancement',
        setupUrl: 'https://makersuite.google.com/app/apikey',
        freeCredit: 'Free tier available'
      },
      {
        name: 'Deepgram',
        configured: deepgramService.isConfigured(),
        description: 'Voice transcription for audio notes',
        setupUrl: 'https://console.deepgram.com/',
        freeCredit: '$200 free credit'
      },
      {
        name: 'Pinecone',
        configured: !!(config.pineconeApiKey && config.pineconeApiKey !== 'your_pinecone_api_key_here'),
        description: 'Semantic search across your notes',
        setupUrl: 'https://www.pinecone.io/',
        freeCredit: 'Free starter plan'
      }
    ];
  }

  static getConfiguredServices(): ServiceStatus[] {
    return this.getStatus().filter(service => service.configured);
  }

  static getMissingServices(): ServiceStatus[] {
    return this.getStatus().filter(service => !service.configured);
  }

  static logServiceStatus(): void {
    if (__DEV__) {
      const status = this.getStatus();
      const configured = status.filter(s => s.configured).map(s => s.name);
      const missing = status.filter(s => !s.configured).map(s => s.name);

      console.log('╭─ Service Status ─╮');
      console.log(`│ ✅ Configured: ${configured.join(', ') || 'None'}`);
      console.log(`│ ⚠️  Missing: ${missing.join(', ') || 'None'}`);
      console.log('╰─────────────────╯');

      if (missing.length > 0) {
        console.log('\n📝 To enable missing services:');
        status.filter(s => !s.configured).forEach(service => {
          console.log(`   ${service.name}: ${service.setupUrl} (${service.freeCredit})`);
        });
        console.log('   Then update your .env file and restart the server.\n');
      }
    }
  }

  static getServiceMessage(serviceName: string): string {
    const service = this.getStatus().find(s => s.name === serviceName);
    if (!service) return `${serviceName} service not found`;
    
    if (service.configured) {
      return `${service.name} is ready ✅`;
    } else {
      return `${service.name} not configured. Get ${service.freeCredit} at ${service.setupUrl}`;
    }
  }
}

export default ServiceStatusChecker; 
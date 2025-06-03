import Constants from 'expo-constants';

interface AppConfig {
  // App Environment
  isDevelopment: boolean;
  isProduction: boolean;
  
  // Supabase Database Configuration (Replaces MongoDB)
  supabaseUrl: string;
  supabaseAnonKey: string;
  
  // Auth0 Authentication Configuration (Replaces Clerk)
  auth0Domain: string;
  auth0ClientId: string;
  
  // AI Services
  geminiApiKey: string;
  
  // Vector Database
  pineconeApiKey: string;
  pineconeEnvironment: string;
  pineconeIndexName: string;
  
  // Speech-to-Text
  deepgramApiKey: string;
  
  // Feature Flags
  enableOfflineMode: boolean;
  enableVectorSearch: boolean;
  enableAudioNotes: boolean;
  enableAIChat: boolean;
  enableRealTimeSync: boolean;
}

// Debug function to log environment variable loading
const getEnvVar = (key: string, envValue: string | undefined, defaultValue: string = ''): string => {
  // Try multiple sources for environment variables
  const expoValue = Constants.expoConfig?.extra?.[key];
  const manifestValue = Constants.manifest?.extra?.[key];
  
  let value = envValue || expoValue || manifestValue || defaultValue;
  
  // If we got a value that looks like a template (starts with $), it means env var wasn't substituted
  if (value && typeof value === 'string' && value.startsWith('$')) {
    console.warn(`Environment variable ${key} not properly substituted: ${value}`);
    value = defaultValue;
  }
  
  // Log environment variables in development (but mask sensitive values)
  if (__DEV__) {
    const maskedValue = value && value.length > 0 && !value.startsWith('$')
      ? value.substring(0, 8) + '...' 
      : 'NOT_SET';
    const source = envValue ? '@env' : expoValue ? 'expo' : manifestValue ? 'manifest' : 'default';
    console.log(`Config ${key}: ${maskedValue} (source: ${source})`);
  }
  
  return value;
};

const config: AppConfig = {
  // App Environment
  isDevelopment: __DEV__ || process.env.NODE_ENV === 'development',
  isProduction: !__DEV__ && process.env.NODE_ENV === 'production',
  
  // Supabase Configuration
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  
  // Auth0 Configuration
  auth0Domain: process.env.AUTH0_DOMAIN || '',
  auth0ClientId: process.env.AUTH0_CLIENT_ID || '',
  
  // AI Services
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  
  // Vector Database
  pineconeApiKey: process.env.PINECONE_API_KEY || '',
  pineconeEnvironment: process.env.PINECONE_ENVIRONMENT || 'us-east1-aws',
  pineconeIndexName: process.env.PINECONE_INDEX_NAME || 'keep-notes-index',
  
  // Speech-to-Text
  deepgramApiKey: process.env.DEEPGRAM_API_KEY || '',
  
  // Feature Flags (can be controlled via environment variables)
  enableOfflineMode: process.env.ENABLE_OFFLINE_MODE !== 'false', // Default: true
  enableVectorSearch: !!process.env.PINECONE_API_KEY, // Auto-enabled if API key exists
  enableAudioNotes: !!process.env.DEEPGRAM_API_KEY, // Auto-enabled if API key exists
  enableAIChat: !!process.env.GEMINI_API_KEY, // Auto-enabled if API key exists
  enableRealTimeSync: !!process.env.SUPABASE_URL, // Auto-enabled if Supabase is configured
};

// Configuration validation
export const validateConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Required configurations
  if (!config.supabaseUrl) {
    errors.push('SUPABASE_URL is required for database functionality');
  }
  
  if (!config.supabaseAnonKey) {
    errors.push('SUPABASE_ANON_KEY is required for database functionality');
  }
  
  if (!config.auth0Domain) {
    errors.push('AUTH0_DOMAIN is required for authentication');
  }
  
  if (!config.auth0ClientId) {
    errors.push('AUTH0_CLIENT_ID is required for authentication');
  }
  
  // Validate URL formats
  if (config.supabaseUrl && !isValidUrl(config.supabaseUrl)) {
    errors.push('SUPABASE_URL must be a valid URL');
  }
  
  if (config.auth0Domain && !isValidDomain(config.auth0Domain)) {
    errors.push('AUTH0_DOMAIN must be a valid domain (e.g., your-tenant.auth0.com)');
  }
  
  // Optional service warnings (not errors)
  const warnings: string[] = [];
  
  if (!config.geminiApiKey) {
    warnings.push('GEMINI_API_KEY not set - AI features will be disabled');
  }
  
  if (!config.pineconeApiKey) {
    warnings.push('PINECONE_API_KEY not set - Vector search will be disabled');
  }
  
  if (!config.deepgramApiKey) {
    warnings.push('DEEPGRAM_API_KEY not set - Audio transcription will be disabled');
  }
  
  if (config.isDevelopment && warnings.length > 0) {
    console.warn('⚠️ Configuration warnings:', warnings);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Helper functions
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const isValidDomain = (domain: string): boolean => {
  // Updated domain validation for Auth0 domains
  // Auth0 domains can have hyphens and multiple subdomains like: dev-d01cquhr17ihtieb.us.auth0.com
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-\.]*[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
  
  // Additional check for common Auth0 patterns
  const isAuth0Domain = domain.endsWith('.auth0.com');
  const hasValidFormat = domainRegex.test(domain) || isAuth0Domain;
  
  // Must have at least one dot and be longer than 3 characters
  const hasMinimumFormat = domain.includes('.') && domain.length > 3;
  
  return hasValidFormat && hasMinimumFormat;
};

// Configuration summary for debugging
export const getConfigSummary = () => {
  return {
    environment: config.isDevelopment ? 'development' : 'production',
    services: {
      database: config.supabaseUrl ? 'Supabase ✅' : 'Not configured ❌',
      authentication: config.auth0Domain ? 'Auth0 ✅' : 'Not configured ❌',
      ai: config.geminiApiKey ? 'Gemini ✅' : 'Not configured ⚠️',
      vectorSearch: config.pineconeApiKey ? 'Pinecone ✅' : 'Not configured ⚠️',
      speechToText: config.deepgramApiKey ? 'Deepgram ✅' : 'Not configured ⚠️',
    },
    features: {
      offlineMode: config.enableOfflineMode ? '✅' : '❌',
      vectorSearch: config.enableVectorSearch ? '✅' : '❌',
      audioNotes: config.enableAudioNotes ? '✅' : '❌',
      aiChat: config.enableAIChat ? '✅' : '❌',
      realTimeSync: config.enableRealTimeSync ? '✅' : '❌',
    },
  };
};

// Service availability checks
export const isServiceConfigured = {
  database: () => !!(config.supabaseUrl && config.supabaseAnonKey),
  auth: () => !!(config.auth0Domain && config.auth0ClientId),
  ai: () => !!config.geminiApiKey,
  vectorSearch: () => !!config.pineconeApiKey,
  speechToText: () => !!config.deepgramApiKey,
};

// Development helpers
if (config.isDevelopment) {
  console.log('🔧 App Configuration Summary:');
  console.table(getConfigSummary());
  
  const validation = validateConfig();
  if (!validation.isValid) {
    console.error('❌ Configuration errors:', validation.errors);
  } else {
    console.log('✅ Configuration is valid');
  }
}

export default config; 
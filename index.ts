// Import global polyfills first
import './globals';

// Essential polyfills for React Native
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import 'text-encoding';

// Add TextEncoder/TextDecoder polyfill if not available
if (typeof global.TextEncoder === 'undefined') {
  // Simple TextEncoder/TextDecoder polyfill using Buffer
  global.TextEncoder = class TextEncoder {
    encode(string) {
      return new Uint8Array(Buffer.from(string, 'utf8'));
    }
  };
  
  global.TextDecoder = class TextDecoder {
    decode(bytes) {
      return Buffer.from(bytes).toString('utf8');
    }
  };
}

// Add URL polyfill for React Native if not already available
if (typeof global.URL === 'undefined') {
  global.URL = require('react-native-url-polyfill').URL;
}

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

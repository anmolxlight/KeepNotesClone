const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// SOLUTION: Based on latest Supabase issue resolution
// This addresses the ws/stream import issues by using proper condition names
config.resolver = {
  ...config.resolver,
  
  // CRITICAL: Add 'browser' condition for proper package exports resolution
  unstable_conditionNames: ['browser', 'require', 'default'],
  
  // Disable package exports to prevent complex resolution issues
  unstable_enablePackageExports: false,
  
  // Core polyfills using extraNodeModules (system-wide resolution)
  extraNodeModules: {
    // Core Node.js modules polyfills
    stream: require.resolve('readable-stream'),
    buffer: require.resolve('buffer'),
    process: require.resolve('process'),
    events: require.resolve('events'),
    util: require.resolve('util'),
    
    // Additional Node.js modules
    assert: require.resolve('assert'),
    url: require.resolve('react-native-url-polyfill'),
    querystring: require.resolve('querystring-es3'),
    path: require.resolve('path-browserify'),
    os: require.resolve('os-browserify/browser'),
    
    // Empty modules for unused dependencies
    crypto: require.resolve('crypto-browserify'),
    http: require.resolve('empty-module'),
    https: require.resolve('empty-module'),
    zlib: require.resolve('empty-module'),
  },
  
  // Specific module resolution for problematic packages
  resolveRequest: (context, moduleName, platform) => {
    // Completely ignore ws module imports to prevent bundling issues
    if (moduleName === 'ws') {
      return { type: 'empty' };
    }
    
    // Use default resolution for everything else
    return context.resolveRequest(context, moduleName, platform);
  },
  
  // Alias for specific problematic modules
  alias: {
    // Replace specific Supabase realtime modules that use WebSocket
    '@supabase/realtime-js': path.resolve(__dirname, 'src/polyfills/realtime-polyfill.js'),
    
    // Additional stream-related polyfills
    'stream/readable': 'readable-stream/readable',
    'stream/writable': 'readable-stream/writable',
    'stream/duplex': 'readable-stream/duplex',
    'stream/transform': 'readable-stream/transform',
    'stream/passthrough': 'readable-stream/passthrough',
  },
  
  resolverMainFields: ['react-native', 'browser', 'main'],
  platforms: ['ios', 'android', 'web'],
};

// Configure transformer
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

module.exports = config; 
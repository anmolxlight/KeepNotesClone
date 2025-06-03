// Global polyfills for Node.js modules in React Native
// Based on Web3Auth and React Native best practices

// Buffer polyfill
global.Buffer = require('buffer').Buffer;

// Process polyfill
global.process = require('process');
global.process.version = 'v16.0.0';
if (!global.process.version) {
  global.process = require('process');
  console.log({ process: global.process });
}
global.process.browser = true;

// Location polyfill (needed for some stream libraries)
global.location = {
  protocol: 'file:',
  hostname: 'localhost',
  port: '',
  href: 'file://localhost/',
};

// Additional polyfills for Node.js compatibility
if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = (fn, ...args) => setTimeout(fn, 0, ...args);
}

if (typeof global.clearImmediate === 'undefined') {
  global.clearImmediate = (id) => clearTimeout(id);
}

// Ensure crypto is available
if (!global.crypto) {
  global.crypto = require('crypto-browserify');
}

console.log('Global polyfills loaded successfully'); 
// Complete WebSocket polyfill for React Native
// This replaces the Node.js 'ws' package with React Native's native WebSocket
// Designed to work with both client code and Expo CLI tooling

class WebSocketPolyfill extends WebSocket {
  constructor(url, protocols, options = {}) {
    // React Native WebSocket constructor only takes url and protocols
    super(url, protocols);
    
    // Store options for compatibility
    this.options = options;
    this.readyState = this.CONNECTING;
    
    // Add event emitter-like methods for compatibility with ws package
    this.on = this.addEventListener.bind(this);
    this.off = this.removeEventListener.bind(this);
    this.once = (event, callback) => {
      const handler = (...args) => {
        this.removeEventListener(event, handler);
        callback(...args);
      };
      this.addEventListener(event, handler);
    };
    
    // Add emit method for compatibility
    this.emit = (event, ...args) => {
      const customEvent = new Event(event);
      customEvent.data = args[0];
      this.dispatchEvent(customEvent);
    };
    
    // Map standard WebSocket events to ws package event names
    this.addEventListener('open', () => {
      this.readyState = this.OPEN;
      this.emit('open');
    });
    
    this.addEventListener('close', (event) => {
      this.readyState = this.CLOSED;
      this.emit('close', event.code, event.reason);
    });
    
    this.addEventListener('error', (error) => {
      this.emit('error', error);
    });
    
    this.addEventListener('message', (event) => {
      this.emit('message', event.data, false); // false for text frames
    });
  }
  
  // Add ping/pong methods (no-op in React Native)
  ping(data, mask, cb) {
    if (typeof data === 'function') {
      cb = data;
      data = undefined;
    }
    if (typeof mask === 'function') {
      cb = mask;
      mask = undefined;
    }
    if (typeof cb === 'function') {
      setTimeout(cb, 0);
    }
  }
  
  pong(data, mask, cb) {
    if (typeof data === 'function') {
      cb = data;
      data = undefined;
    }
    if (typeof mask === 'function') {
      cb = mask;
      mask = undefined;
    }
    if (typeof cb === 'function') {
      setTimeout(cb, 0);
    }
  }
  
  // Add terminate method (alias for close)
  terminate() {
    this.close();
  }
  
  // Override send to handle different data types
  send(data) {
    if (typeof data === 'object' && data !== null) {
      // Convert objects to JSON string
      super.send(JSON.stringify(data));
    } else {
      super.send(data);
    }
  }
}

// Server-side exports (no-op in React Native but needed for Expo CLI compatibility)
class WebSocketServer {
  constructor(options, callback) {
    console.warn('WebSocketServer is not supported in React Native - using no-op implementation');
    
    this.options = options || {};
    this.clients = new Set();
    
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    
    // Simulate async server creation
    if (typeof callback === 'function') {
      setTimeout(() => callback(null), 0);
    }
  }
  
  on(event, callback) {
    console.warn(`WebSocketServer.on(${event}) is no-op in React Native`);
    return this;
  }
  
  close(callback) {
    console.warn('WebSocketServer.close() is no-op in React Native');
    if (typeof callback === 'function') {
      setTimeout(callback, 0);
    }
  }
  
  handleUpgrade() {
    console.warn('WebSocketServer.handleUpgrade() is no-op in React Native');
  }
  
  shouldHandle() {
    return false;
  }
}

// Additional classes that might be imported
class WebSocketStream {
  constructor(ws, options = {}) {
    console.warn('WebSocketStream is not supported in React Native');
    this.ws = ws;
    this.options = options;
  }
}

// Export as both default and named export for maximum compatibility
const wsPolyfill = WebSocketPolyfill;
wsPolyfill.WebSocket = WebSocketPolyfill;
wsPolyfill.WebSocketServer = WebSocketServer;
wsPolyfill.WebSocketStream = WebSocketStream;
wsPolyfill.default = WebSocketPolyfill;

// Additional exports for compatibility
wsPolyfill.createWebSocketStream = (ws, options) => {
  console.warn('createWebSocketStream is not supported in React Native');
  return new WebSocketStream(ws, options);
};

wsPolyfill.Server = WebSocketServer;

// Constants
wsPolyfill.CONNECTING = 0;
wsPolyfill.OPEN = 1;
wsPolyfill.CLOSING = 2;
wsPolyfill.CLOSED = 3;

// Export for various module systems
module.exports = wsPolyfill;
module.exports.default = wsPolyfill;
module.exports.WebSocket = WebSocketPolyfill;
module.exports.WebSocketServer = WebSocketServer; 
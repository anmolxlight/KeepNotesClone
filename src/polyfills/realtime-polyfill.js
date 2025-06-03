// Supabase Realtime polyfill for React Native
// This replaces @supabase/realtime-js to avoid WebSocket dependencies

class RealtimeChannel {
  constructor(topic, params = {}) {
    this.topic = topic;
    this.params = params;
    this.bindings = [];
    this.state = 'closed';
  }

  on(event, filter, callback) {
    if (typeof filter === 'function') {
      callback = filter;
      filter = {};
    }
    
    this.bindings.push({ event, filter, callback });
    return this;
  }

  subscribe(callback) {
    console.warn('Realtime subscriptions disabled - using polyfill');
    this.state = 'joined';
    
    if (typeof callback === 'function') {
      setTimeout(() => callback('SUBSCRIBED'), 0);
    }
    
    return this;
  }

  unsubscribe() {
    this.state = 'closed';
    this.bindings = [];
    return this;
  }

  push(event, payload) {
    console.warn('Realtime push disabled - using polyfill');
    return Promise.resolve({ status: 'ok' });
  }
}

class RealtimeClient {
  constructor(endpointURL, options = {}) {
    this.endpointURL = endpointURL;
    this.options = options;
    this.channels = [];
    this.connected = false;
  }

  channel(topic, params = {}) {
    const channel = new RealtimeChannel(topic, params);
    this.channels.push(channel);
    return channel;
  }

  removeChannel(channel) {
    const index = this.channels.indexOf(channel);
    if (index > -1) {
      this.channels.splice(index, 1);
      channel.unsubscribe();
    }
    return this;
  }

  removeAllChannels() {
    this.channels.forEach(channel => channel.unsubscribe());
    this.channels = [];
    return this;
  }

  connect() {
    console.warn('Realtime connect disabled - using polyfill');
    this.connected = true;
    return this;
  }

  disconnect() {
    this.connected = false;
    this.removeAllChannels();
    return this;
  }

  getChannels() {
    return this.channels;
  }
}

// Export the polyfill
module.exports = {
  RealtimeClient,
  RealtimeChannel,
  default: RealtimeClient,
}; 
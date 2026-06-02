// ✅ Make sure this points to your ACTUAL backend port (e.g., 8000), NOT Vite (5173)
const SOCKET_URL = 'ws://localhost:8000/ws/chat'; 

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = {};
    this.reconnectTimer = null;
    this.token = null;
  }

  connect(token) {
    this.token = token;

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return this.socket;
    }

    const fullUrl = `${SOCKET_URL}?token=${this.token}`;
    console.log('🔄 [WebSocket] Attempting connection to:', fullUrl);
    
    this.socket = new WebSocket(fullUrl);

    this.socket.onopen = () => {
      console.log('🟢 [WebSocket] Connection Opened Successfully!');
      this._trigger('connect');
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    };

    this.socket.onmessage = (event) => {
      console.log('📩 [WebSocket] Raw Message Received:', event.data);
      try {
        const data = JSON.parse(event.data);
        this._trigger('bot_reply', data);
      } catch (error) {
        console.error('❌ [WebSocket] Failed to parse incoming JSON:', error);
      }
    };

    this.socket.onclose = (event) => {
      console.log(`🔴 [WebSocket] Connection Closed. Code: ${event.code}, Reason: ${event.reason}`);
      this._trigger('disconnect');
      this.reconnectTimer = setTimeout(() => this.connect(this.token), 3000);
    };

    this.socket.onerror = (error) => {
      console.error('⚠️ [WebSocket] Error occurred:', error);
      this._trigger('error', error);
    };

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      console.log('🛑 [WebSocket] Manually disconnecting...');
      this.socket.close();
      this.socket = null;
    }
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  _trigger(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  emit(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const payload = JSON.stringify(data);
      console.log('📤 [WebSocket] Sending Message:', payload);
      this.socket.send(payload);
    } else {
      console.warn('🚧 [WebSocket] Cannot send message, socket is not OPEN. Current state:', this.socket?.readyState);
    }
  }
}

export default new SocketService();
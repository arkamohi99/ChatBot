const SOCKET_URL =
  import.meta.env?.VITE_SOCKET_URL ||
  import.meta.env?.VITE_WS_URL ||
  'ws://localhost:8000/ws/chat';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = {};
    this.reconnectTimer = null;
    this.token = null;
    this.shouldReconnect = true;
  }

  connect(token) {
    if (!token) {
      console.warn('[WebSocket] No token provided');
      return null;
    }

    this.token = token;
    this.shouldReconnect = true;

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this._trigger('connect');
      return this.socket;
    }

    if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
      return this.socket;
    }

    if (this.socket) {
      try {
        this.socket.onclose = null;
        this.socket.onmessage = null;
        this.socket.onerror = null;
        this.socket.close();
      } catch (_) {
        /* ignore */
      }
      this.socket = null;
    }

    const fullUrl = `${SOCKET_URL}?token=${encodeURIComponent(this.token)}`;
    console.log('[WebSocket] Connecting to:', fullUrl);

    this.socket = new WebSocket(fullUrl);

    this.socket.onopen = () => {
      console.log('[WebSocket] Connected');
      this._trigger('connect');
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Fire EACH event name exactly once (do not double-fire bot_reply)
        if (data.event) {
          this._trigger(data.event, data);
        } else {
          this._trigger('message', data);
        }
      } catch (err) {
        console.error('[WebSocket] JSON parse error:', err);
      }
    };

    this.socket.onclose = (event) => {
      console.log(`[WebSocket] Closed (code ${event.code})`);
      this._trigger('disconnect');
      this.socket = null;

      if (this.shouldReconnect && this.token) {
        this.reconnectTimer = setTimeout(() => {
          this.connect(this.token);
        }, 3000);
      }
    };

    this.socket.onerror = (err) => {
      console.error('[WebSocket] Error', err);
      this._trigger('error', err);
    };

    return this.socket;
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      try {
        this.socket.onclose = null;
        this.socket.close();
      } catch (_) {
        /* ignore */
      }
      this.socket = null;
    }
  }

  /** Preferred send API */
  send(payload) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] Cannot send — not connected');
      return false;
    }
    this.socket.send(
      typeof payload === 'string' ? payload : JSON.stringify(payload)
    );
    return true;
  }

  /** Alias used by some ChatPanel versions */
  emit(payload) {
    return this.send(payload);
  }

  on(event, handler) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(handler);
  }

  off(event, handler) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter((h) => h !== handler);
  }

  _trigger(event, data) {
    (this.listeners[event] || []).forEach((h) => {
      try {
        h(data);
      } catch (e) {
        console.error(`[WebSocket] listener error for ${event}`, e);
      }
    });
  }
}

const socketService = new SocketService();
export default socketService;
import { io } from 'socket.io-client';

// Use relative URL in production (IIS proxy), absolute in development
const SOCKET_PATH = import.meta.env.VITE_SOCKET_PATH || '/socket.io/';
const API_URL = import.meta.env.PROD ? '' : 'http://127.0.0.1:8082';

class SocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.listeners = new Map();
  }

  connect() {
    try {
      this.socket = io(API_URL, {
        path: SOCKET_PATH,
        transports: ['websocket', 'polling'],
        timeout: 5000,
        forceNew: true,
        upgrade: true,
        rememberUpgrade: false
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket.IO connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.notifyListeners('connection', { connected: true });
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Socket.IO disconnected');
        this.isConnected = false;
        this.notifyListeners('connection', { connected: false });
      });

      this.socket.on('connect_error', (error) => {
        console.log('🔌 Socket.IO connection failed:', error.message);
        this.isConnected = false;
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.log('🚫 Max reconnection attempts reached. Falling back to polling.');
          this.notifyListeners('connection', { connected: false, fallback: true });
        }
      });

      // Listen for new alerts
      this.socket.on('new_alert', (alert) => {
        console.log('🚨 New alert received:', alert);
        this.notifyListeners('new_alert', alert);
      });

      return this.socket;
    } catch (error) {
      console.error('Socket connection error:', error);
      this.isConnected = false;
      return null;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }
}

export const socketManager = new SocketManager();
export default socketManager;
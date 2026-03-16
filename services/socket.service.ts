import { Config } from '@/config';
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private currentToken: string | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private wrappedCallbacks: WeakMap<Function, Function> = new WeakMap();

  connect(accessToken: string) {
    console.log('[Socket] connect() called, API_URL:', Config.API_URL);
    
    if (this.socket?.connected && this.currentToken === accessToken) {
      console.log('[Socket] Already connected with same token');
      return this.socket;
    }

    if (this.socket) {
      console.log('[Socket] Disconnecting existing socket');
      this.socket.disconnect();
    }

    this.currentToken = accessToken;
    console.log('[Socket] Creating new connection to:', Config.API_URL);
    
    this.socket = io(Config.API_URL as string, {
      auth: {
        token: `Bearer ${accessToken}`,
      },
      transports: ['polling', 'websocket'],
      upgrade: true,
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 30000,
      reconnectionAttempts: Infinity,
      timeout: 60000,
      forceNew: true,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected! Socket ID:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected, reason:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.log('[Socket] Connection error:', error.message);
    });

    // Re-register all listeners on the new socket
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        const wrapped = this.wrappedCallbacks.get(callback) || callback;
        this.socket?.on(event, wrapped as any);
      });
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: (data: any) => void) {
    console.log('[Socket] Subscribing to event:', event);
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    
    // Create a wrapper that logs incoming events
    const wrappedCallback = (data: any) => {
      const dataStr = JSON.stringify(data) ?? '';
      console.log(`[Socket] Received event "${event}":`, dataStr.substring(0, 200));
      callback(data);
    };
    
    // Store mapping for reconnection
    this.wrappedCallbacks.set(callback, wrappedCallback);
    
    this.socket?.on(event, wrappedCallback);

    return () => {
      this.listeners.get(event)?.delete(callback);
      this.wrappedCallbacks.delete(callback);
      this.socket?.off(event, wrappedCallback);
    };
  }

  emit(event: string, data: any) {
    console.log('[Socket] Emitting event:', event, data);
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.log('[Socket] Not connected, queuing emit for when connected');
      // Wait for connection then emit
      this.socket?.once('connect', () => {
        console.log('[Socket] Now connected, emitting queued event:', event);
        this.socket?.emit(event, data);
      });
    }
  }

  // Emit and wait for acknowledgment with timeout
  emitWithAck(event: string, data: any, timeout = 5000): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout waiting for ack on ${event}`));
      }, timeout);

      const doEmit = () => {
        this.socket?.emit(event, data, (response: any) => {
          clearTimeout(timer);
          resolve(response);
        });
      };

      if (this.socket?.connected) {
        doEmit();
      } else {
        this.socket?.once('connect', doEmit);
      }
    });
  }

  isConnected() {
    return this.socket?.connected ?? false;
  }

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();

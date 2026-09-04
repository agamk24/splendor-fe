import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

// Inisialisasi koneksi Socket.IO sekali (singleton)
export const socket = io(SERVER_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling'],
});

// Helper emit(event, payload)
export const emit = (event, payload) => {
  if (!socket) {
    console.warn(`[SocketClient] Cannot emit '${event}': socket is not initialized.`);
    return;
  }
  if (import.meta.env.DEV) {
    console.log(`[SocketClient] Emitting event: '${event}' with payload:`, payload);
  }
  socket.emit(event, payload);
};

// Helper register listener
export const on = (event, callback) => {
  if (!socket) return () => {};
  socket.on(event, callback);
  return () => socket.off(event, callback);
};

// Helper unregister listener
export const off = (event, callback) => {
  if (!socket) return;
  socket.off(event, callback);
};

// Helper getter
export const getSocket = () => socket;
export const getServerUrl = () => SERVER_URL;

import { create } from 'zustand';
import { socket, emit } from '../socket/socketClient';

let listenersInitialized = false;

export const useGameStore = create((set, get) => ({
  // State dasar sesuai spesifikasi brief
  roomId: sessionStorage.getItem('roomId') || null,
  myName: sessionStorage.getItem('myName') || '',
  mySocketId: null,
  isConnected: socket.connected,
  players: [],
  gameState: null,
  lastError: null,

  // Setters manual bila diperlukan
  setRoomId: (roomId) => set({ roomId }),
  setMyName: (myName) => set({ myName }),
  setPlayers: (players) => set({ players: Array.isArray(players) ? players : [] }),
  setGameState: (gameState) => set({ gameState }),
  setLastError: (lastError) => set({ lastError }),
  clearError: () => set({ lastError: null }),

  // Reset store ke kondisi awal
  resetStore: () =>
    set({
      roomId: null,
      players: [],
      gameState: null,
      lastError: null,
    }),

  // Action helpers yang memanggil socket emit
  createRoom: (name) => {
    set({ myName: name, lastError: null });
    emit('create_room', { name });
  },

  joinRoom: (roomId, name) => {
    set({ roomId, myName: name, lastError: null });
    emit('join_room', { roomId, name });
  },

  rejoinRoom: (roomId, name) => {
    set({ roomId, myName: name, lastError: null });
    emit('rejoin_room', { roomId, name });
  },

  startGame: (roomIdParam) => {
    const targetRoomId = roomIdParam || get().roomId;
    if (!targetRoomId) {
      console.warn('[GameStore] startGame called without roomId');
      return;
    }
    emit('start_game', { roomId: targetRoomId });
  },

  sendPlayerAction: (action) => {
    const { roomId } = get();
    if (!roomId) {
      console.warn('[GameStore] sendPlayerAction called without roomId');
      return;
    }
    emit('player_action', { roomId, action });
  },

  // Inisialisasi semua socket listener di satu tempat
  initSocketListeners: () => {
    if (listenersInitialized) {
      return;
    }
    listenersInitialized = true;

    // 1. Connection lifecycle
    if (socket.connected) {
      set({ isConnected: true, mySocketId: socket.id });
    }

    socket.on('connect', () => {
      console.log('[Socket] Connected with id:', socket.id);
      set({ isConnected: true, mySocketId: socket.id });
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected. Reason:', reason);
      set({ isConnected: false });
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error?.message);
    });

    // 2. room_created { roomId }
    socket.on('room_created', (payload) => {
      console.log('[Socket] room_created:', payload);
      const roomId = typeof payload === 'string' ? payload : payload?.roomId;
      set({ roomId, lastError: null });
    });

    // 3. room_joined { roomId, players }
    socket.on('room_joined', (payload) => {
      console.log('[Socket] room_joined:', payload);
      const roomId = payload?.roomId;
      const players = Array.isArray(payload?.players) ? payload.players : [];
      set((state) => ({
        roomId: roomId || state.roomId,
        players: players.length > 0 ? players : state.players,
        lastError: null,
      }));
    });

    // 4. player_list_update { players }
    socket.on('player_list_update', (payload) => {
      console.log('[Socket] player_list_update:', payload);
      const players = Array.isArray(payload) ? payload : payload?.players || [];
      set({ players });
    });

    // 5. game_started { gameState }
    socket.on('game_started', (payload) => {
      console.log('[Socket] game_started:', payload);
      const gameState = payload?.gameState || payload;
      set({ gameState, lastError: null });
    });

    // 6. state_update { gameState }
    socket.on('state_update', (payload) => {
      console.log('[Socket] state_update:', payload);
      const gameState = payload?.gameState || payload;
      set({ gameState });
    });

    // 7. action_error { message }
    socket.on('action_error', (payload) => {
      console.warn('[Socket] action_error:', payload);
      const message = typeof payload === 'string' ? payload : payload?.message || payload?.error || 'Unknown error occurred';
      set({ lastError: message });
    });
  },
}));

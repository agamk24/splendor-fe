import { create } from 'zustand';
import { socket, emit } from '../socket/socketClient';
import { translateError } from '../utils/errorMessages';
import { toServerColor, toServerTokenMap } from '../utils/gemUtils';

let listenersInitialized = false;

export const useGameStore = create((set, get) => ({
  // State dasar sesuai spesifikasi brief
  roomId: sessionStorage.getItem('roomId') || null,
  myName: sessionStorage.getItem('myName') || '',
  // playerId dari server: identitas stabil lintas reconnect, bukan socket.id.
  myPlayerId: sessionStorage.getItem('myPlayerId') || null,
  mySocketId: null,
  isConnected: socket.connected,
  players: [],
  gameState: null,
  lastError: null,

  // Setters manual bila diperlukan
  setRoomId: (roomId) => set({ roomId }),
  setMyName: (myName) => set({ myName }),
  setMyPlayerId: (myPlayerId) => set({ myPlayerId }),
  setPlayers: (players) => set({ players: Array.isArray(players) ? players : [] }),
  setGameState: (gameState) => set({ gameState }),
  setLastError: (lastError) => set({ lastError }),
  clearError: () => set({ lastError: null }),

  // Reset store ke kondisi awal
  resetStore: () => {
    sessionStorage.removeItem('myPlayerId');
    set({
      roomId: null,
      myPlayerId: null,
      players: [],
      gameState: null,
      lastError: null,
    });
  },

  /**
   * Satu-satunya sumber kebenaran "ini saya".
   * Player.id dari backend selalu playerId, bukan socket.id, jadi cocokkan ke situ.
   * Nama dipakai sebagai cadangan saat playerId belum sempat tersimpan.
   */
  isMe: (player) => {
    if (!player) return false;
    const { myPlayerId, myName } = get();
    if (myPlayerId && player.id) return player.id === myPlayerId;
    return Boolean(myName) && player.name === myName;
  },

  // Pemain lokal di dalam gameState, atau null bila belum ada.
  getMe: () => {
    const { gameState, isMe } = get();
    return (gameState?.players || []).find((p) => isMe(p)) || null;
  },

  // True bila sekarang giliran pemain lokal.
  isMyTurn: () => {
    const { gameState, isMe } = get();
    if (!gameState || gameState.status !== 'playing') return false;
    if (gameState.pendingDiscard) return false;
    const active = gameState.players?.[gameState.currentPlayerIndex];
    return isMe(active);
  },

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

  // --- Action helper per jenis aksi -----------------------------------------
  // Semua warna diterjemahkan ke nama resmi backend di sini, supaya komponen UI
  // tetap boleh memakai white/blue/green/red/black.

  /** Ambil 1 token dari 3 warna berbeda. Backend menolak selain tepat 3 warna. */
  takeThreeDifferent: (uiColors) => {
    const colors = (uiColors || []).map(toServerColor);
    get().sendPlayerAction({ type: 'take_three_different', colors });
  },

  /** Ambil 2 token warna sama. Backend butuh stok bank >= 4. */
  takeTwoSame: (uiColor) => {
    get().sendPlayerAction({ type: 'take_two_same', color: toServerColor(uiColor) });
  },

  buyCard: (cardId, fromReserved = false) => {
    get().sendPlayerAction({ type: 'buy_card', cardId, fromReserved });
  },

  reserveCardFromTable: (cardId) => {
    get().sendPlayerAction({ type: 'reserve_card', cardId });
  },

  reserveCardFromDeck: (tier) => {
    get().sendPlayerAction({ type: 'reserve_card', fromDeck: true, tier });
  },

  /** Buang token; backend menuntut jumlah persis sesuai pendingDiscard.excess. */
  discardTokens: (tokensByUiColor) => {
    get().sendPlayerAction({
      type: 'discard_tokens',
      tokensToDiscard: toServerTokenMap(tokensByUiColor),
    });
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

    // 2. room_created { roomId, playerId, players }
    socket.on('room_created', (payload) => {
      console.log('[Socket] room_created:', payload);
      const roomId = typeof payload === 'string' ? payload : payload?.roomId;
      const playerId = payload?.playerId || null;
      const players = Array.isArray(payload?.players) ? payload.players : [];
      if (roomId) sessionStorage.setItem('roomId', roomId);
      if (playerId) sessionStorage.setItem('myPlayerId', playerId);
      set((state) => ({
        roomId: roomId || state.roomId,
        myPlayerId: playerId || state.myPlayerId,
        players: players.length > 0 ? players : state.players,
        lastError: null,
      }));
    });

    // 3. room_joined { roomId, playerId, players }
    socket.on('room_joined', (payload) => {
      console.log('[Socket] room_joined:', payload);
      const roomId = payload?.roomId;
      const playerId = payload?.playerId || null;
      const players = Array.isArray(payload?.players) ? payload.players : [];
      if (roomId) sessionStorage.setItem('roomId', roomId);
      if (playerId) sessionStorage.setItem('myPlayerId', playerId);
      set((state) => ({
        roomId: roomId || state.roomId,
        myPlayerId: playerId || state.myPlayerId,
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

    // 7. action_error { error } — backend mengirim kode, bukan kalimat.
    socket.on('action_error', (payload) => {
      console.warn('[Socket] action_error:', payload);
      const code = typeof payload === 'string' ? payload : payload?.error || payload?.message;
      set({ lastError: translateError(code) });
    });
  },
}));

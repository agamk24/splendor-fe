import { create } from 'zustand';
import { socket, emit } from '../socket/socketClient';
import { translateError } from '../utils/errorMessages';
import { toServerColor, toServerTokenMap } from '../utils/gemUtils';
import { useAnimationStore } from './animationStore';

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
      const newGameState = payload?.gameState || payload;
      const prevGameState = get().gameState;

      // Deteksi aksi kartu & token secara reaktif untuk memicu animasi Framer Motion
      try {
        if (prevGameState && newGameState && Array.isArray(prevGameState.players) && Array.isArray(newGameState.players)) {
          const getTierCards = (tier, tCards) => {
            if (!tCards) return [];
            if (Array.isArray(tCards)) {
              if (Array.isArray(tCards[0])) return tCards[tier - 1] || [];
              return tCards.filter((c) => c && c.tier === tier);
            }
            return tCards[tier] || tCards[`tier${tier}`] || tCards[String(tier)] || [];
          };

          for (let pIdx = 0; pIdx < newGameState.players.length; pIdx++) {
            const newPlayer = newGameState.players[pIdx];
            const prevPlayer = prevGameState.players.find((p) => (p.id && p.id === newPlayer.id) || (p.playerId && p.playerId === newPlayer.playerId) || p.name === newPlayer.name) || prevGameState.players[pIdx];
            if (!prevPlayer) continue;

            const newCards = newPlayer.cardsOwned || newPlayer.cards || [];
            const prevCards = prevPlayer.cardsOwned || prevPlayer.cards || [];

            const newReserved = newPlayer.reservedCards || newPlayer.reserved || [];
            const prevReserved = prevPlayer.reservedCards || prevPlayer.reserved || [];

            const buyerPlayerId = newPlayer.id || newPlayer.playerId;
            const buyerPlayerIndex = pIdx;
            const buyerPlayerName = newPlayer.name;

            // 1. KASUS BELI KARTU (cardsOwned bertambah)
            if (newCards.length > prevCards.length) {
              const prevIds = new Set(prevCards.map((c) => c.id));
              const boughtCard = newCards.find((c) => !prevIds.has(c.id));

              if (boughtCard) {
                const tier = boughtCard.tier || 1;
                const prevTierCards = getTierCards(tier, prevGameState.tableCards);
                const slotIndex = prevTierCards.findIndex((c) => c && c.id === boughtCard.id);

                let newCard = null;
                if (slotIndex !== -1) {
                  const nextTierCards = getTierCards(tier, newGameState.tableCards);
                  const candidate = nextTierCards[slotIndex];
                  if (candidate && candidate.id !== boughtCard.id) {
                    newCard = candidate;
                  }
                }

                useAnimationStore.getState().triggerCardPurchase({
                  card: boughtCard,
                  buyerPlayerId,
                  buyerPlayerIndex,
                  buyerPlayerName,
                  tier: slotIndex !== -1 ? tier : undefined,
                  slotIndex: slotIndex !== -1 ? slotIndex : undefined,
                  newCard,
                  actionType: 'buy',
                });
              }
            }

            // 2. KASUS RESERVASI KARTU (reservedCards bertambah)
            if (newReserved.length > prevReserved.length) {
              const prevResIds = new Set(prevReserved.map((c) => c.id));
              const reservedCard = newReserved.find((c) => !prevResIds.has(c.id));

              if (reservedCard) {
                const tier = reservedCard.tier || 1;
                const prevTierCards = getTierCards(tier, prevGameState.tableCards);
                const slotIndex = prevTierCards.findIndex((c) => c && c.id === reservedCard.id);

                let newCard = null;
                // Jika direservasi dari meja (bukan blind reserve langsung dari deck)
                if (slotIndex !== -1) {
                  const nextTierCards = getTierCards(tier, newGameState.tableCards);
                  const candidate = nextTierCards[slotIndex];
                  if (candidate && candidate.id !== reservedCard.id) {
                    newCard = candidate;
                  }
                }

                useAnimationStore.getState().triggerCardPurchase({
                  card: reservedCard,
                  buyerPlayerId,
                  buyerPlayerIndex,
                  buyerPlayerName,
                  tier: slotIndex !== -1 ? tier : reservedCard.tier,
                  slotIndex: slotIndex !== -1 ? slotIndex : undefined,
                  newCard,
                  actionType: 'reserve',
                  fromDeck: slotIndex === -1,
                });
              }
            }

            // 3. KASUS PENGAMBILAN TOKEN (tokens bertambah)
            if (prevGameState.status === 'playing') {
              const normalizeTokenMap = (tokMap) => {
                const res = { white: 0, blue: 0, green: 0, red: 0, black: 0, gold: 0 };
                if (!tokMap) return res;
                Object.entries(tokMap).forEach(([k, val]) => {
                  const norm = normalizeColor(k);
                  if (res[norm] !== undefined) {
                    res[norm] = Math.max(res[norm], Number(val) || 0);
                  }
                });
                return res;
              };

              const prevTok = normalizeTokenMap(prevPlayer.tokens);
              const newTok = normalizeTokenMap(newPlayer.tokens);

              const gainedTokens = [];
              ['white', 'blue', 'green', 'red', 'black', 'gold'].forEach((col) => {
                const diff = (newTok[col] || 0) - (prevTok[col] || 0);
                if (diff > 0) {
                  const count = Math.min(diff, 3);
                  for (let i = 0; i < count; i++) {
                    gainedTokens.push(col);
                  }
                }
              });

              if (gainedTokens.length > 0) {
                useAnimationStore.getState().triggerTokenGain({
                  playerId: buyerPlayerId,
                  playerIndex: buyerPlayerIndex,
                  playerName: buyerPlayerName,
                  tokens: gainedTokens,
                });
              }
            }
          }
        }
      } catch (err) {
        console.error('[AnimationTrigger] Error detecting animations:', err);
      }

      set({ gameState: newGameState });
    });

    // 7. action_error { error } — backend mengirim kode, bukan kalimat.
    socket.on('action_error', (payload) => {
      console.warn('[Socket] action_error:', payload);
      const code = typeof payload === 'string' ? payload : payload?.error || payload?.message;
      set({ lastError: translateError(code) });
    });
  },
}));

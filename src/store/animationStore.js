import { create } from 'zustand';
import { sound } from '../utils/soundManager';

export const useAnimationStore = create((set, get) => ({
  // Antrean kartu yang sedang terbang dari meja ke arah panel pemain
  flyingCards: [],

  // Antrean token yang sedang terbang dari bank ke arah panel pemain
  flyingTokens: [],

  // Slot meja yang sedang mengalami animasi isi ulang (draw dari deck + 3D flip)
  // Format key: `${tier}-${slotIndex}` -> { card, tier, slotIndex, timestamp }
  dealingCards: {},

  // ID pemain yang baru saja menerima kartu (untuk efek pulse/glow di PlayerPanel)
  recentBuyerId: null,

  // ID pemain yang baru saja menerima token
  recentTokenBuyerId: null,

  /**
   * Memicu rangkaian animasi kartu (pembelian atau reservasi):
   * 1. Kartu meluncur terbang ke arah panel pemain pembeli
   * 2. Jika ada kartu baru pengganti dari deck di meja, slot memutar animasi 3D draw & flip
   */
  triggerCardPurchase: ({ card, buyerPlayerId, buyerPlayerIndex, buyerPlayerName, tier, slotIndex, newCard, actionType = 'buy', fromDeck = false }) => {
    if (!card) return;

    sound.playCardSwoosh();

    // 1. Cari koordinat awal kartu:
    // Jika dari deck: gunakan elemen tumpukan deck-tier-${tier}
    // Jika dari meja: gunakan elemen kartu table-card-${card.id} atau slot meja
    let cardEl = null;
    if (fromDeck && tier) {
      cardEl = document.getElementById(`deck-tier-${tier}`);
    } else {
      cardEl = (card.id ? document.getElementById(`table-card-${card.id}`) : null) || (tier && typeof slotIndex !== 'undefined' ? document.getElementById(`table-slot-${tier}-${slotIndex}`) : null);
    }

    // 2. Cari koordinat panel pemain tujuan (dukung ID, nama, atau index secara berlapis)
    let playerEl = null;
    if (buyerPlayerId) {
      playerEl = document.getElementById(`player-panel-${buyerPlayerId}`) || document.querySelector(`[data-player-panel="true"][data-player-id="${buyerPlayerId}"]`) || document.querySelector(`[data-player-id="${buyerPlayerId}"]`);
    }
    if (!playerEl && buyerPlayerName) {
      playerEl = document.getElementById(`player-panel-${buyerPlayerName}`) || document.querySelector(`[data-player-panel="true"][data-player-name="${buyerPlayerName}"]`) || document.querySelector(`[data-player-name="${buyerPlayerName}"]`);
    }
    if (!playerEl && typeof buyerPlayerIndex === 'number') {
      playerEl = document.querySelector(`[data-player-panel="true"][data-player-index="${buyerPlayerIndex}"]`) || document.querySelector(`[data-player-index="${buyerPlayerIndex}"]`);
    }

    console.log('[AnimationStore] triggerCardPurchase:', {
      cardId: card?.id,
      actionType,
      buyerPlayerId,
      buyerPlayerName,
      buyerPlayerIndex,
      playerElFound: Boolean(playerEl),
      cardElFound: Boolean(cardEl),
    });

    const startRect = cardEl
      ? cardEl.getBoundingClientRect()
      : {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
          width: 105,
          height: 145,
        };

    const fallbackY = 180 + (typeof buyerPlayerIndex === 'number' ? buyerPlayerIndex * 110 : 0);
    const targetRect = playerEl
      ? playerEl.getBoundingClientRect()
      : {
          x: 40,
          y: fallbackY,
          width: 260,
          height: 90,
        };

    const animId = `fly-${card.id || Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    // Tambahkan kartu terbang ke antrean portal
    set((state) => ({
      flyingCards: [
        ...state.flyingCards,
        {
          id: animId,
          card,
          startRect: {
            x: startRect.x,
            y: startRect.y,
            width: startRect.width,
            height: startRect.height,
          },
          targetRect: {
            x: targetRect.x,
            y: targetRect.y,
            width: targetRect.width,
            height: targetRect.height,
          },
          buyerPlayerId: buyerPlayerId || buyerPlayerName || buyerPlayerIndex,
          actionType,
          fromDeck,
        },
      ],
    }));

    // 2. Jika ada kartu pengganti baru dari deck di meja:
    if (newCard && typeof tier !== 'undefined' && typeof slotIndex !== 'undefined') {
      const slotKey = `${tier}-${slotIndex}`;
      sound.playCardDeal();
      set((state) => ({
        dealingCards: {
          ...state.dealingCards,
          [slotKey]: {
            key: slotKey,
            card: newCard,
            tier,
            slotIndex,
            timestamp: Date.now(),
          },
        },
      }));
    }
  },

  // Menghapus kartu terbang yang sudah mendarat di panel pemain
  removeFlyingCard: (id, buyerPlayerId) => {
    set((state) => ({
      flyingCards: state.flyingCards.filter((item) => item.id !== id),
      recentBuyerId: buyerPlayerId ?? state.recentBuyerId,
    }));

    // Reset recentBuyerId setelah efek pulse selesai
    setTimeout(() => {
      set((state) => (state.recentBuyerId === buyerPlayerId ? { recentBuyerId: null } : {}));
    }, 1400);
  },

  // Menyelesaikan animasi dealing card di slot tertentu
  finishDealingCard: (slotKey) => {
    set((state) => {
      const updated = { ...state.dealingCards };
      delete updated[slotKey];
      return { dealingCards: updated };
    });
  },

  /**
   * Memicu rangkaian animasi pengambilan token dari bank ke panel pemain:
   * tokens: array warna token, e.g. ['white', 'blue', 'green'] atau ['red', 'red']
   */
  triggerTokenGain: ({ playerId, playerIndex, playerName, tokens }) => {
    if (!tokens || tokens.length === 0) return;

    sound.playTakeTokens();

    let targetEl = null;
    if (playerId) {
      targetEl = document.getElementById(`player-panel-${playerId}`) || document.querySelector(`[data-player-panel="true"][data-player-id="${playerId}"]`) || document.querySelector(`[data-player-id="${playerId}"]`);
    }
    if (!targetEl && playerName) {
      targetEl = document.getElementById(`player-panel-${playerName}`) || document.querySelector(`[data-player-panel="true"][data-player-name="${playerName}"]`) || document.querySelector(`[data-player-name="${playerName}"]`);
    }
    if (!targetEl && typeof playerIndex === 'number') {
      targetEl = document.querySelector(`[data-player-panel="true"][data-player-index="${playerIndex}"]`) || document.querySelector(`[data-player-index="${playerIndex}"]`);
    }

    console.log('[AnimationStore] triggerTokenGain:', {
      tokens,
      playerId,
      playerName,
      playerIndex,
      targetElFound: Boolean(targetEl),
    });

    const fallbackY = 180 + (typeof playerIndex === 'number' ? playerIndex * 110 : 0);
    const fallbackTargetRect = targetEl
      ? targetEl.getBoundingClientRect()
      : {
          x: 40,
          y: fallbackY,
          width: 260,
          height: 90,
        };

    const newFlyingTokens = tokens.map((color, index) => {
      const bankEl = document.getElementById(`bank-token-${color}`);
      let playerTokenEl = null;
      if (playerId) {
        playerTokenEl = document.getElementById(`player-token-${playerId}-${color}`) || document.querySelector(`[data-player-id="${playerId}"][data-player-token="${color}"]`);
      }
      if (!playerTokenEl && playerName) {
        playerTokenEl = document.querySelector(`[data-player-name="${playerName}"][data-player-token="${color}"]`);
      }
      if (!playerTokenEl && typeof playerIndex === 'number') {
        playerTokenEl = document.querySelector(`[data-token-key="token-${playerIndex}-${color}"]`) || document.querySelector(`[data-player-index="${playerIndex}"][data-player-token="${color}"]`);
      }

      const startRect = bankEl
        ? bankEl.getBoundingClientRect()
        : {
            x: window.innerWidth * 0.7,
            y: window.innerHeight * 0.5,
            width: 44,
            height: 44,
          };

      const targetRect = playerTokenEl ? playerTokenEl.getBoundingClientRect() : fallbackTargetRect;

      return {
        id: `token-${Date.now()}-${color}-${index}-${Math.random().toString(36).slice(2, 6)}`,
        color,
        index,
        startRect: {
          x: startRect.x,
          y: startRect.y,
          width: startRect.width,
          height: startRect.height,
        },
        targetRect: {
          x: targetRect.x,
          y: targetRect.y,
          width: targetRect.width,
          height: targetRect.height,
        },
        playerId: playerId || playerName || playerIndex,
      };
    });

    set((state) => ({
      flyingTokens: [...state.flyingTokens, ...newFlyingTokens],
    }));
  },

  // Menghapus token terbang yang sudah mendarat di panel pemain
  removeFlyingToken: (id, playerId) => {
    set((state) => ({
      flyingTokens: state.flyingTokens.filter((item) => item.id !== id),
      recentTokenBuyerId: playerId ?? state.recentTokenBuyerId,
    }));

    setTimeout(() => {
      set((state) => (state.recentTokenBuyerId === playerId ? { recentTokenBuyerId: null } : {}));
    }, 1200);
  },
}));

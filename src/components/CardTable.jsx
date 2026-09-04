import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { GEM_COLORS, GEM_METADATA, normalizeColor } from '../utils/gemUtils';
import { sound } from '../utils/soundManager';

export default function CardTable() {
  const gameState = useGameStore((state) => state.gameState);
  const isMyTurn = useGameStore((state) => state.isMyTurn());
  const me = useGameStore((state) => state.getMe());
  const buyCard = useGameStore((state) => state.buyCard);
  const reserveCardFromTable = useGameStore((state) => state.reserveCardFromTable);
  const reserveCardFromDeck = useGameStore((state) => state.reserveCardFromDeck);

  // Selected card for action modal
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedDeckTier, setSelectedDeckTier] = useState(null);

  const tableCards = gameState?.tableCards || {};
  const decks = gameState?.decks || {};

  // Helper untuk mendapatkan kartu di meja per tier (Tier 3 di atas, Tier 1 di bawah)
  const getCardsForTier = (tier) => {
    if (Array.isArray(tableCards)) {
      // Jika tableCards berupa flat array atau array of arrays
      if (Array.isArray(tableCards[0])) {
        return tableCards[tier - 1] || [];
      }
      return tableCards.filter((c) => c.tier === tier);
    }
    return tableCards[tier] || tableCards[`tier${tier}`] || tableCards[String(tier)] || [];
  };

  // Helper untuk mendapatkan jumlah sisa deck per tier
  const getDeckCount = (tier) => {
    const d = decks[tier] ?? decks[`tier${tier}`] ?? decks[String(tier)] ?? (Array.isArray(decks) ? decks[tier - 1] : 0);

    if (Array.isArray(d)) return d.length;
    return typeof d === 'number' ? d : 0;
  };

  // Hitung apakah pemain lokal mampu membeli kartu tertentu
  const canAffordCard = (card) => {
    if (!me || !card || !card.cost) return false;

    // Bonus permanen berasal dari cardsOwned (nama field resmi backend).
    const bonuses = { white: 0, blue: 0, green: 0, red: 0, black: 0 };
    (me.cardsOwned || []).forEach((c) => {
      const bColor = normalizeColor(c.bonus);
      if (bonuses[bColor] !== undefined) bonuses[bColor]++;
    });

    // tokens dari server berkunci nama resmi, normalkan ke warna UI dulu.
    const tokens = {};
    Object.entries(me.tokens || {}).forEach(([serverColor, count]) => {
      tokens[normalizeColor(serverColor)] = count;
    });
    const goldTokens = tokens.gold || 0;
    let shortage = 0;

    Object.entries(card.cost).forEach(([colorKey, requiredCount]) => {
      const color = normalizeColor(colorKey);
      const bonus = bonuses[color] || 0;
      const playerTokens = tokens[color] || 0;
      const totalAvailable = bonus + playerTokens;

      if (totalAvailable < requiredCount) {
        shortage += requiredCount - totalAvailable;
      }
    });

    return shortage <= goldTokens;
  };

  const reservedCount = (me?.reservedCards || []).length;
  const canReserve = reservedCount < 3;

  // Handler aksi kartu
  const handleBuyCard = (card) => {
    if (!isMyTurn) return;
    sound.playBuyCard();
    // Kartu di meja: fromReserved false.
    buyCard(card.id, false);
    setSelectedCard(null);
  };

  const handleReserveCard = (card) => {
    if (!isMyTurn || !canReserve) return;
    sound.playReserveCard();
    reserveCardFromTable(card.id);
    setSelectedCard(null);
  };

  const handleReserveDeck = (tier) => {
    if (!isMyTurn || !canReserve) return;
    sound.playReserveCard();
    reserveCardFromDeck(tier);
    setSelectedDeckTier(null);
  };

  const tiers = [3, 2, 1]; // Urutan Splendor: Tier 3 paling atas, Tier 1 paling bawah

  return (
    <div className="card" style={{ flex: 1, padding: '1.25rem', overflowX: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>🃏 Kartu Perkembangan (Table Cards)</h3>
        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Klik kartu untuk opsi Beli / Reservasi</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {tiers.map((tier) => {
          const cards = getCardsForTier(tier);
          const deckCount = getDeckCount(tier);

          // Warna tema tier
          const tierColors = {
            3: { bg: 'linear-gradient(135deg, #1e3a8a, #0f172a)', border: '#3b82f6', label: 'Tier 3' },
            2: { bg: 'linear-gradient(135deg, #854d0e, #0f172a)', border: '#eab308', label: 'Tier 2' },
            1: { bg: 'linear-gradient(135deg, #14532d, #0f172a)', border: '#22c55e', label: 'Tier 1' },
          }[tier];

          return (
            <div
              key={tier}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.5rem',
                background: 'rgba(15, 23, 42, 0.4)',
                borderRadius: '8px',
              }}
            >
              {/* Tumpukan Deck per Tier */}
              <div
                onClick={() => deckCount > 0 && isMyTurn && canReserve && setSelectedDeckTier(tier)}
                style={{
                  width: '95px',
                  height: '145px',
                  background: tierColors.bg,
                  border: `2px solid ${tierColors.border}`,
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: deckCount > 0 && isMyTurn && canReserve ? 'pointer' : 'default',
                  flexShrink: 0,
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.4)',
                  userSelect: 'none',
                  transition: 'transform 0.2s',
                }}
                title={deckCount > 0 && isMyTurn && canReserve ? `Klik untuk reservasi kartu tertutup dari ${tierColors.label}` : `${tierColors.label} (${deckCount} sisa kartu)`}
              >
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: tierColors.border }}>{tierColors.label}</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', margin: '0.25rem 0' }}>{deckCount}</span>
                <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>sisa kartu</span>
              </div>

              {/* 4 Kartu Terbuka di Meja */}
              <div
                className="custom-scrollbar"
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  flexWrap: 'nowrap',
                  overflowX: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  padding: '4px',
                }}
              >
                {cards.map((card, idx) => {
                  const bonusColor = normalizeColor(card.gem || card.bonus || card.color);
                  const bonusMeta = GEM_METADATA[bonusColor] || GEM_METADATA.white;
                  const affordable = canAffordCard(card);
                  const points = card.points ?? card.prestige ?? 0;

                  return (
                    <div
                      key={card.id || `${tier}-${idx}`}
                      className={`splendor-card ${affordable ? 'affordable' : ''}`}
                      onClick={() => setSelectedCard({ ...card, tier })}
                      style={{
                        height: '145px',
                        width: '105px',
                        borderTop: `4px solid ${bonusMeta.borderColor}`,
                      }}
                    >
                      {/* Header Kartu: Poin & Bonus Permata */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>{points > 0 ? points : ''}</span>
                        <span
                          style={{
                            fontSize: '1rem',
                            filter: `drop-shadow(0 0 4px ${bonusMeta.glowColor})`,
                          }}
                          title={`Bonus: ${bonusMeta.indonesian}`}
                        >
                          {bonusMeta.symbol}
                        </span>
                      </div>

                      {/* Biaya Kartu (Cost) Menurun di Kiri Bawah Sesuai Desain Asli Splendor */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '3px',
                          marginTop: 'auto',
                          alignItems: 'flex-start',
                        }}
                      >
                        {card.cost &&
                          Object.entries(card.cost).map(([cKey, costAmount]) => {
                            if (costAmount <= 0) return null;
                            const c = normalizeColor(cKey);
                            const meta = GEM_METADATA[c];
                            return (
                              <div
                                key={cKey}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '21px',
                                  height: '21px',
                                  borderRadius: '50%',
                                  background: meta?.bgColor || '#334155',
                                  border: `1.5px solid ${meta?.borderColor || '#64748b'}`,
                                  color: meta?.textColor || '#fff',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
                                }}
                                title={`Biaya: ${costAmount} permata ${meta?.indonesian || cKey}`}
                              >
                                {costAmount}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  );
                })}

                {/* Placeholder jika kurang dari 4 kartu */}
                {Array.from({ length: Math.max(0, 4 - cards.length) }).map((_, emptyIdx) => (
                  <div
                    key={`empty-card-${emptyIdx}`}
                    style={{
                      height: '145px',
                      width: '105px',
                      border: '1px dashed rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#475569',
                      fontSize: '0.75rem',
                    }}
                  >
                    Kosong
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Aksi Kartu Terbuka */}
      {selectedCard && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => setSelectedCard(null)}
        >
          <div className="card" style={{ maxWidth: '380px', width: '100%', padding: '1.5rem', border: '1px solid #38bdf8' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>Opsi Kartu (Tier {selectedCard.tier})</h4>
              <button onClick={() => setSelectedCard(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.25rem', cursor: 'pointer' }}>
                &times;
              </button>
            </div>

            {/* Info Kartu */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#94a3b8' }}>Bonus Permata:</span>
                <span style={{ fontWeight: 700 }}>
                  {GEM_METADATA[normalizeColor(selectedCard.gem || selectedCard.bonus || selectedCard.color)]?.symbol} {GEM_METADATA[normalizeColor(selectedCard.gem || selectedCard.bonus || selectedCard.color)]?.indonesian}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#94a3b8' }}>Poin Prestise:</span>
                <span style={{ fontWeight: 700, color: '#fbbf24' }}>{selectedCard.points ?? selectedCard.prestige ?? 0} Poin</span>
              </div>

              <div style={{ marginTop: '0.75rem' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem' }}>Biaya Pembelian:</span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {selectedCard.cost &&
                    Object.entries(selectedCard.cost).map(([cKey, costAmount]) => {
                      if (costAmount <= 0) return null;
                      const c = normalizeColor(cKey);
                      const meta = GEM_METADATA[c];
                      return (
                        <span
                          key={cKey}
                          style={{
                            padding: '0.2rem 0.5rem',
                            background: meta?.bgColor,
                            border: `1px solid ${meta?.borderColor}`,
                            borderRadius: '6px',
                            color: meta?.textColor,
                            fontSize: '0.85rem',
                            fontWeight: 700,
                          }}
                        >
                          {meta?.symbol} {costAmount}
                        </span>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Status Mampu Beli */}
            <div style={{ marginBottom: '1.25rem', textAlign: 'center', fontSize: '0.875rem' }}>
              {canAffordCard(selectedCard) ? <span style={{ color: '#34d399', fontWeight: 600 }}>✓ Anda mampu membeli kartu ini!</span> : <span style={{ color: '#f87171' }}>✕ Sumber daya tidak mencukupi untuk membeli.</span>}
            </div>

            {/* Tombol Aksi */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button type="button" className="btn btn-primary" disabled={!isMyTurn || !canAffordCard(selectedCard)} onClick={() => handleBuyCard(selectedCard)}>
                🛒 Beli Kartu
              </button>
              <button type="button" className="btn btn-secondary" disabled={!isMyTurn || !canReserve} onClick={() => handleReserveCard(selectedCard)}>
                🔖 Reservasi Kartu {reservedCount >= 3 ? '(Maks 3)' : ''}
              </button>
              <button
                type="button"
                onClick={() => setSelectedCard(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  padding: '0.4rem',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reservasi Kartu dari Deck */}
      {selectedDeckTier && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => setSelectedDeckTier(null)}
        >
          <div className="card" style={{ maxWidth: '360px', width: '100%', padding: '1.5rem', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.75rem' }}>Reservasi Deck Tier {selectedDeckTier}</h4>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.25rem' }}>Ambil 1 kartu tertutup dari atas tumpukan Tier {selectedDeckTier} dan 1 token emas (jika tersedia di bank).</p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" onClick={() => setSelectedDeckTier(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                Batal
              </button>
              <button type="button" onClick={() => handleReserveDeck(selectedDeckTier)} className="btn btn-emerald" style={{ flex: 1 }} disabled={!isMyTurn || !canReserve}>
                Reservasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

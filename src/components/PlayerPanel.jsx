import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { GEM_COLORS, ALL_GEMS, GEM_METADATA, normalizeColor } from '../utils/gemUtils';

export default function PlayerPanel({ player, index }) {
  const gameState = useGameStore((state) => state.gameState);
  const checkIsMe = useGameStore((state) => state.isMe);
  const myTurn = useGameStore((state) => state.isMyTurn());
  const buyCard = useGameStore((state) => state.buyCard);

  // State modal untuk melihat/membeli kartu reservasi pemilik sendiri
  const [selectedReservedCard, setSelectedReservedCard] = useState(null);

  if (!player) return null;

  const currentIndex = gameState?.currentPlayerIndex ?? 0;
  const isCurrentTurn = typeof index === 'number' && currentIndex === index;

  const isMe = checkIsMe(player);

  const isConnected = player.connected !== false;

  // Hitung total poin
  const totalPoints = player.points ?? player.score ?? player.prestige ?? 0;

  // Token dari server berkunci nama resmi (emerald/...), normalkan ke warna UI.
  const tokens = {};
  Object.entries(player.tokens || {}).forEach(([serverColor, count]) => {
    tokens[normalizeColor(serverColor)] = count;
  });
  const totalTokens = ALL_GEMS.reduce((sum, c) => sum + (tokens[c] || 0), 0);

  // Bonus kartu per warna, dihitung dari cardsOwned (nama field resmi backend).
  const bonuses = { white: 0, blue: 0, green: 0, red: 0, black: 0 };
  (player.cardsOwned || []).forEach((c) => {
    const bColor = normalizeColor(c.bonus);
    if (bonuses[bColor] !== undefined) bonuses[bColor]++;
  });

  // Kartu reservasi
  const reservedCards = player.reservedCards || [];
  const reservedCount = reservedCards.length;

  // Cek apakah user (jika isMe) mampu membeli kartu reservasi
  const canAffordReservedCard = (card) => {
    if (!isMe || !card || !card.cost) return false;
    const goldTokens = tokens.gold || tokens.yellow || 0;
    let shortage = 0;

    Object.entries(card.cost).forEach(([cKey, reqCount]) => {
      const color = normalizeColor(cKey);
      const bonus = bonuses[color] || 0;
      const tCount = tokens[color] || 0;
      const totalAvail = bonus + tCount;
      if (totalAvail < reqCount) {
        shortage += reqCount - totalAvail;
      }
    });

    return shortage <= goldTokens;
  };

  const handleBuyReserved = (card) => {
    // Hanya pemilik kartu yang boleh membeli dari reservasinya sendiri.
    if (!isMe || !myTurn) return;
    buyCard(card.id, true);
    setSelectedReservedCard(null);
  };

  return (
    <div
      className={`card ${isCurrentTurn ? 'player-active' : ''}`}
      style={{
        padding: '1.25rem',
        border: isCurrentTurn ? '2px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)',
        background: isMe ? 'rgba(30, 41, 59, 0.85)' : 'rgba(15, 23, 42, 0.75)',
        position: 'relative',
      }}
    >
      {/* Turn Banner */}
      {isCurrentTurn && (
        <div
          style={{
            position: 'absolute',
            top: '-10px',
            right: '12px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#000',
            fontSize: '0.7rem',
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: '9999px',
            letterSpacing: '0.5px',
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.5)',
          }}
        >
          GILIRAN AKTIF
        </div>
      )}

      {/* Header Pemain & Poin */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>{player.name}</span>
            {isMe && (
              <span
                style={{
                  fontSize: '0.65rem',
                  background: 'rgba(59, 130, 246, 0.3)',
                  color: '#60a5fa',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  fontWeight: 700,
                }}
              >
                Anda
              </span>
            )}
            {/* Indikator Terputus sesuai spesifikasi nomor 11 */}
            {!isConnected && (
              <span
                style={{
                  fontSize: '0.65rem',
                  background: 'rgba(239, 68, 68, 0.25)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  fontWeight: 700,
                }}
              >
                Terputus
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Total Token: <strong style={{ color: totalTokens > 10 ? '#f87171' : '#cbd5e1' }}>{totalTokens}</strong> / 10
          </span>
        </div>

        {/* Poin Prestise */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.3))',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            padding: '0.3rem 0.6rem',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '0.65rem', color: '#fcd34d', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Poin</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fbbf24' }}>{totalPoints}</span>
        </div>
      </div>

      {/* Baris Bonus Kartu (Diskon Permanen) */}
      <div style={{ marginBottom: '0.85rem' }}>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>Bonus Kartu Dimiliki (Diskon):</span>
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {GEM_COLORS.map((color) => {
            const meta = GEM_METADATA[color];
            const count = bonuses[color] || 0;
            return (
              <div
                key={color}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: count > 0 ? meta.bgColor : 'rgba(15, 23, 42, 0.5)',
                  border: `1px solid ${count > 0 ? meta.borderColor : 'rgba(255, 255, 255, 0.05)'}`,
                  color: count > 0 ? meta.textColor : '#64748b',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
                title={`${meta.indonesian}: ${count} bonus kartu`}
              >
                <span>{meta.symbol}</span>
                <span>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Baris Token Permata Dimiliki */}
      <div style={{ marginBottom: '0.85rem' }}>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>Token Permata Dimiliki:</span>
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {ALL_GEMS.map((color) => {
            const meta = GEM_METADATA[color];
            const count = tokens[color] || 0;
            return (
              <div
                key={color}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '2px 6px',
                  borderRadius: '50px',
                  background: count > 0 ? meta.bgColor : 'rgba(15, 23, 42, 0.4)',
                  border: `1px solid ${count > 0 ? meta.borderColor : 'rgba(255, 255, 255, 0.05)'}`,
                  color: count > 0 ? meta.textColor : '#475569',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
                title={`${meta.indonesian}: ${count} token`}
              >
                <span>{meta.symbol}</span>
                <span>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bagian Kartu Reservasi */}
      <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Kartu Reservasi ({reservedCount}/3):</span>
          {isMe && reservedCount > 0 && <span style={{ fontSize: '0.7rem', color: '#38bdf8' }}>Klik kartu untuk membeli</span>}
        </div>

        {reservedCount === 0 ? (
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>Tidak ada kartu yang direservasi</span>
        ) : isMe ? (
          /* Pemilik Sendiri: Tampilkan detail biaya kartu */
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {Array.isArray(reservedCards) &&
              reservedCards.map((card, rIdx) => {
                const bonusColor = normalizeColor(card.gem || card.bonus || card.color);
                const meta = GEM_METADATA[bonusColor] || GEM_METADATA.white;
                const affordable = canAffordReservedCard(card);
                const points = card.points ?? card.prestige ?? 0;

                return (
                  <div
                    key={card.id || `r-${rIdx}`}
                    onClick={() => setSelectedReservedCard(card)}
                    style={{
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: affordable ? '1px solid #34d399' : `1px solid ${meta.borderColor}`,
                      borderRadius: '6px',
                      padding: '0.35rem 0.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.75rem',
                    }}
                    title="Klik untuk opsi membeli kartu reservasi ini"
                  >
                    <span>{meta.symbol}</span>
                    <span style={{ fontWeight: 700, color: '#fbbf24' }}>{points > 0 ? `${points}p` : ''}</span>
                    {affordable && <span style={{ fontSize: '0.65rem', color: '#34d399', fontWeight: 700 }}>✓ Beli</span>}
                  </div>
                );
              })}
          </div>
        ) : (
          /* Pemain Lain: Hanya lihat jumlah reservasi + indikator "reserved" tanpa detail biaya */
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {Array.from({ length: reservedCount }).map((_, rIdx) => (
              <div
                key={`other-r-${rIdx}`}
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.7rem',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
                title="Kartu Tersembunyi (Detail hanya dapat dilihat oleh pemilik kartu)"
              >
                <span>🔒</span>
                <span>Reserved</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Beli Kartu Reservasi Sendiri */}
      {selectedReservedCard && isMe && (
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
          onClick={() => setSelectedReservedCard(null)}
        >
          <div className="card" style={{ maxWidth: '340px', width: '100%', padding: '1.25rem' }} onClick={(e) => e.stopPropagation()}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.75rem' }}>Beli Kartu Reservasi</h4>
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: '6px', padding: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Bonus Permata:</span>
                <span style={{ fontWeight: 700 }}>
                  {GEM_METADATA[normalizeColor(selectedReservedCard.gem || selectedReservedCard.bonus || selectedReservedCard.color)]?.symbol}{' '}
                  {GEM_METADATA[normalizeColor(selectedReservedCard.gem || selectedReservedCard.bonus || selectedReservedCard.color)]?.indonesian}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Poin:</span>
                <span style={{ fontWeight: 700, color: '#fbbf24' }}>{selectedReservedCard.points ?? selectedReservedCard.prestige ?? 0} Poin</span>
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>Biaya:</span>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {selectedReservedCard.cost &&
                    Object.entries(selectedReservedCard.cost).map(([cKey, amount]) => {
                      if (amount <= 0) return null;
                      const c = normalizeColor(cKey);
                      const meta = GEM_METADATA[c];
                      return (
                        <span
                          key={cKey}
                          style={{
                            padding: '1px 5px',
                            background: meta?.bgColor,
                            border: `1px solid ${meta?.borderColor}`,
                            borderRadius: '4px',
                            color: meta?.textColor,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          {meta?.symbol} {amount}
                        </span>
                      );
                    })}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSelectedReservedCard(null)}>
                Batal
              </button>
              <button type="button" className="btn btn-emerald" style={{ flex: 1 }} disabled={!isMe || !myTurn || !canAffordReservedCard(selectedReservedCard)} onClick={() => handleBuyReserved(selectedReservedCard)}>
                🛒 Beli
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

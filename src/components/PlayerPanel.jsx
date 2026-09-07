import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useGameStore } from '../store/gameStore';
import { useAnimationStore } from '../store/animationStore';
import { GEM_COLORS, ALL_GEMS, GEM_METADATA, normalizeColor } from '../utils/gemUtils';
import GemIcon from './GemIcon';
import CardIllustration from './CardIllustration';

export default function PlayerPanel({ player, index }) {
  const gameState = useGameStore((state) => state.gameState);
  const checkIsMe = useGameStore((state) => state.isMe);
  const myTurn = useGameStore((state) => state.isMyTurn());
  const buyCard = useGameStore((state) => state.buyCard);
  const isRecentBuyer = useAnimationStore((state) => {
    const rId = state.recentBuyerId;
    if (rId === null || rId === undefined) return false;
    return rId === player?.id || rId === player?.playerId || rId === player?.name || (typeof index === 'number' && (rId === index || rId === `index-${index}`));
  });
  const isRecentTokenBuyer = useAnimationStore((state) => {
    const rId = state.recentTokenBuyerId;
    if (rId === null || rId === undefined) return false;
    return rId === player?.id || rId === player?.playerId || rId === player?.name || (typeof index === 'number' && (rId === index || rId === `index-${index}`));
  });

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

  // Bonus kartu per warna & daftar kartu terbeli per warna
  const bonuses = { white: 0, blue: 0, green: 0, red: 0, black: 0 };
  const cardsByColor = { white: [], blue: [], green: [], red: [], black: [] };
  (player.cardsOwned || []).forEach((c) => {
    const bColor = normalizeColor(c.bonus || c.gem || c.color);
    if (bonuses[bColor] !== undefined) bonuses[bColor]++;
    if (cardsByColor[bColor]) cardsByColor[bColor].push(c);
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
      id={`player-panel-${player.id || player.playerId || player.name}`}
      data-player-panel="true"
      data-player-id={player.id || player.playerId}
      data-player-name={player.name}
      data-player-index={index}
      className={`card ${isCurrentTurn ? 'player-active' : ''}`}
      style={{
        padding: '0.6rem 0.65rem',
        border: isRecentBuyer || isRecentTokenBuyer ? '2px solid #34d399' : isCurrentTurn ? '2px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)',
        background: isRecentBuyer
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(30, 41, 59, 0.95))'
          : isRecentTokenBuyer
            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(30, 41, 59, 0.95))'
            : isMe
              ? 'rgba(30, 41, 59, 0.9)'
              : 'rgba(15, 23, 42, 0.75)',
        boxShadow: isRecentBuyer ? '0 0 20px rgba(52, 211, 153, 0.7), 0 0 10px rgba(251, 191, 36, 0.4)' : isRecentTokenBuyer ? '0 0 20px rgba(251, 191, 36, 0.7), 0 0 10px rgba(52, 211, 153, 0.4)' : undefined,
        transform: isRecentBuyer || isRecentTokenBuyer ? 'scale(1.03)' : 'scale(1)',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        position: 'relative',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
      }}
    >
      {/* Baris 1: Identitas Pemain (Kiri) & Status Token / Poin (Kanan) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0, flex: 1 }}>
          {isCurrentTurn && (
            <span
              style={{
                fontSize: '0.62rem',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#000',
                fontWeight: 800,
                padding: '1px 5px',
                borderRadius: '3px',
                letterSpacing: '0.3px',
                boxShadow: '0 1px 4px rgba(245, 158, 11, 0.4)',
                flexShrink: 0,
              }}
            >
              GILIRAN
            </span>
          )}

          <span
            style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: isCurrentTurn ? '#fbbf24' : '#f8fafc',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: isMe ? '100px' : '130px',
            }}
            title={player.name}
          >
            {player.name}
          </span>

          {isMe && (
            <span
              style={{
                fontSize: '0.62rem',
                background: 'rgba(59, 130, 246, 0.3)',
                color: '#60a5fa',
                padding: '1px 4px',
                borderRadius: '3px',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              Anda
            </span>
          )}

          {!isConnected && (
            <span
              style={{
                fontSize: '0.62rem',
                background: 'rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                padding: '1px 4px',
                borderRadius: '3px',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              Offline
            </span>
          )}
        </div>

        {/* Kanan Header: Token Ringkas & Poin */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              color: totalTokens > 10 ? '#f87171' : '#94a3b8',
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '1px 5px',
              borderRadius: '4px',
              border: `1px solid ${totalTokens > 10 ? '#ef4444' : 'rgba(255, 255, 255, 0.08)'}`,
            }}
            title={`Total token yang dipegang: ${totalTokens}/10`}
          >
            🪙 {totalTokens}/10
          </span>

          <div
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.35))',
              border: '1px solid #f59e0b',
              borderRadius: '5px',
              padding: '1px 6px',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
            }}
            title={`Poin Prestise: ${totalPoints}`}
          >
            <span style={{ fontSize: '0.7rem' }}>👑</span>
            <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#fbbf24' }}>{totalPoints}</span>
          </div>
        </div>
      </div>

      {/* Baris 2: Token Permata Dimiliki (Ditukar ke atas) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <span
          style={{
            fontSize: '0.68rem',
            color: '#94a3b8',
            width: '45px',
            flexShrink: 0,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
          }}
          title="Token permata yang dipegang saat ini"
        >
          <span>🪙</span> Token
        </span>
        <div style={{ display: 'flex', gap: '0.25rem', flex: 1, justifyContent: 'space-between' }}>
          {ALL_GEMS.map((color) => {
            const meta = GEM_METADATA[color];
            const count = tokens[color] || 0;
            return (
              <div
                key={color}
                id={`player-token-${player.id || player.playerId || player.name}-${color}`}
                data-player-token={color}
                data-player-index={index}
                data-player-name={player.name}
                data-token-key={`token-${index}-${color}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  padding: '1px 3px',
                  borderRadius: '10px',
                  background: count > 0 ? meta.bgColor : 'rgba(15, 23, 42, 0.35)',
                  border: `1px solid ${count > 0 ? meta.borderColor : 'rgba(255, 255, 255, 0.05)'}`,
                  color: count > 0 ? meta.textColor : '#475569',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  flex: 1,
                  minWidth: 0,
                }}
                title={`${meta.indonesian}: ${count} token`}
              >
                <GemIcon color={color} size={12} />
                <span>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Baris 3: Tumpukan 5 Kolom Kartu Dimiliki (Muat 5 Kolom Sejajar) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '5px',
          padding: '2px 0 4px',
          alignItems: 'flex-start',
          marginTop: '0.2rem',
        }}
      >
        {GEM_COLORS.map((color) => {
          const meta = GEM_METADATA[color];
          const cards = cardsByColor[color] || [];
          const count = cards.length;

          // Ukuran kartu proporsional (72px x 100px) agar 5 kolom muat sejajar dalam panel
          const cardWidth = 72;
          const cardHeight = 100;
          // Langkah tumpukan vertikal (cascade)
          const stackStep = count <= 3 ? 24 : Math.max(12, Math.floor(60 / (count - 1)));
          const containerHeight = count > 0 ? cardHeight + (count - 1) * stackStep : cardHeight;

          return (
            <div
              key={color}
              id={`player-bonus-${player.id || player.playerId || player.name}-${color}`}
              data-player-bonus={color}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flexShrink: 0,
                width: `${cardWidth}px`,
              }}
            >
              {/* Tumpukan Kartu Bertingkat Proporsional (72px x 100px) */}
              <div
                style={{
                  position: 'relative',
                  width: `${cardWidth}px`,
                  height: `${containerHeight}px`,
                  transition: 'height 0.25s ease',
                }}
              >
                {count === 0 ? (
                  /* Placeholder Slot Kosong */
                  <div
                    style={{
                      width: `${cardWidth}px`,
                      height: `${cardHeight}px`,
                      borderRadius: '8px',
                      border: '1.5px dashed rgba(255, 255, 255, 0.12)',
                      background: 'rgba(15, 23, 42, 0.25)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      opacity: 0.45,
                    }}
                  >
                    <GemIcon color={color} size={20} />
                    <span style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 600 }}>0</span>
                  </div>
                ) : (
                  /* Kartu-kartu yang Ditumpuk dengan Artwork & Ukuran Rapi */
                  cards.map((card, cIdx) => {
                    const topOffset = cIdx * stackStep;
                    const isTopCard = cIdx === cards.length - 1;
                    const cardPts = card.points ?? card.prestige ?? 0;

                    return (
                      <div
                        key={card.id || `${color}-${cIdx}`}
                        className="splendor-card"
                        title={`Kartu Tier ${card.tier || 1} • Bonus ${meta.indonesian} • ${cardPts > 0 ? `${cardPts} Poin Prestise` : '0 Poin'}`}
                        style={{
                          position: 'absolute',
                          top: `${topOffset}px`,
                          left: 0,
                          width: `${cardWidth}px`,
                          height: `${cardHeight}px`,
                          borderRadius: '8px',
                          borderTop: `3px solid ${meta.borderColor}`,
                          border: `1.5px solid ${meta.borderColor}`,
                          boxShadow: isTopCard ? '0 6px 14px rgba(0, 0, 0, 0.6), 0 0 8px rgba(0, 0, 0, 0.3)' : '0 2px 6px rgba(0, 0, 0, 0.5)',
                          zIndex: cIdx + 1,
                          overflow: 'hidden',
                          cursor: 'default',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          padding: '0.35rem 0.35rem',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-3px) scale(1.04)';
                          e.currentTarget.style.zIndex = '99';
                          e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.8), 0 0 10px rgba(255, 255, 255, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.zIndex = String(cIdx + 1);
                          e.currentTarget.style.boxShadow = isTopCard ? '0 6px 14px rgba(0, 0, 0, 0.6), 0 0 8px rgba(0, 0, 0, 0.3)' : '0 2px 6px rgba(0, 0, 0, 0.5)';
                        }}
                      >
                        {/* Ilustrasi Artwork Kartu */}
                        <CardIllustration card={card} />

                        {/* Header Kartu: Poin & Bonus Permata (Selalu Tampak pada Tiap Tingkatan Stack) */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            position: 'relative',
                            zIndex: 2,
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.88rem',
                              fontWeight: 800,
                              color: '#f8fafc',
                              textShadow: '0 2px 4px rgba(0,0,0,0.9)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '1px',
                            }}
                          >
                            {cardPts > 0 ? (
                              <>
                                {cardPts} <span style={{ fontSize: '0.6rem' }}>👑</span>
                              </>
                            ) : (
                              ''
                            )}
                          </span>

                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              filter: `drop-shadow(0 0 4px ${meta.glowColor || 'rgba(0,0,0,0.5)'})`,
                            }}
                            title={`Bonus: ${meta.indonesian}`}
                          >
                            <GemIcon color={color} size={16} />
                          </span>
                        </div>

                        {/* Bagian Bawah Kartu (Terlihat pada kartu terdepan): Badge Tier */}
                        {isTopCard && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: '4px',
                              right: '4px',
                              zIndex: 2,
                              fontSize: '0.56rem',
                              fontWeight: 800,
                              color: 'rgba(255, 255, 255, 0.85)',
                              background: 'rgba(15, 23, 42, 0.8)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              padding: '0px 4px',
                              borderRadius: '3px',
                              letterSpacing: '0.2px',
                            }}
                          >
                            Tier {card.tier || 1}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Baris 4: Kartu Reservasi (Hanya ditampilkan jika ada kartu yang direservasi) */}
      {reservedCount > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            paddingTop: '0.3rem',
            marginTop: '0.1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <span
            style={{
              fontSize: '0.68rem',
              color: '#94a3b8',
              width: '45px',
              flexShrink: 0,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
            }}
            title="Kartu yang sedang direservasi (maksimal 3)"
          >
            <span>📦</span> {reservedCount}/3
          </span>

          <div style={{ display: 'flex', gap: '0.3rem', flex: 1, flexWrap: 'wrap' }}>
            {isMe
              ? reservedCards.map((card, rIdx) => {
                  const bonusColor = normalizeColor(card.gem || card.bonus || card.color);
                  const meta = GEM_METADATA[bonusColor] || GEM_METADATA.white;
                  const affordable = canAffordReservedCard(card);
                  const points = card.points ?? card.prestige ?? 0;

                  return (
                    <button
                      key={card.id || `r-${rIdx}`}
                      type="button"
                      onClick={() => setSelectedReservedCard(card)}
                      style={{
                        background: affordable ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 23, 42, 0.8)',
                        border: affordable ? '1px solid #34d399' : `1px solid ${meta.borderColor}`,
                        borderRadius: '4px',
                        padding: '1px 5px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '0.7rem',
                        color: '#f8fafc',
                      }}
                      title={affordable ? 'Klik untuk membeli kartu ini!' : 'Klik untuk melihat rincian biaya kartu ini'}
                    >
                      <GemIcon color={bonusColor} size={12} />
                      {points > 0 && <span style={{ fontWeight: 800, color: '#fbbf24' }}>{points}p</span>}
                      {affordable && <span style={{ fontSize: '0.6rem', color: '#34d399', fontWeight: 800 }}>✓</span>}
                    </button>
                  );
                })
              : Array.from({ length: reservedCount }).map((_, rIdx) => (
                  <span
                    key={`other-r-${rIdx}`}
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      padding: '1px 5px',
                      fontSize: '0.65rem',
                      color: '#94a3b8',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                    title="Kartu direservasi oleh lawan"
                  >
                    🔒 Kartu {rIdx + 1}
                  </span>
                ))}
          </div>
        </div>
      )}

      {/* Modal Beli Kartu Reservasi Sendiri - Dipindahkan ke Layar Utama (document.body) */}
      {selectedReservedCard &&
        isMe &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="modal-overlay" onClick={() => setSelectedReservedCard(null)}>
            <div className="card modal-content" style={{ maxWidth: '360px', width: '100%', padding: '1.5rem', border: '1px solid #38bdf8' }} onClick={(e) => e.stopPropagation()}>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.75rem' }}>Beli Kartu Reservasi</h4>
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: '6px', padding: '0.75rem', marginBottom: '1rem', position: 'relative', overflow: 'hidden' }}>
                <CardIllustration card={selectedReservedCard} style={{ opacity: 0.25 }} />

                <div style={{ position: 'relative', zIndex: 2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Bonus Permata:</span>
                    <span style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <GemIcon color={selectedReservedCard.gem || selectedReservedCard.bonus || selectedReservedCard.color} size={16} />
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
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                background: meta?.solidBg || '#1e293b',
                                border: `1.5px solid ${meta?.solidBorder || meta?.borderColor || '#64748b'}`,
                                color: meta?.solidText || '#ffffff',
                                fontSize: '0.85rem',
                                fontWeight: 900,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
                              }}
                              title={`Biaya: ${amount} permata ${meta?.indonesian || cKey}`}
                            >
                              {amount}
                            </span>
                          );
                        })}
                    </div>
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
          </div>,
          document.body,
        )}
    </div>
  );
}

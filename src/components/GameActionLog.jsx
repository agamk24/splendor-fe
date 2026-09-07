import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { normalizeColor, GEM_METADATA } from '../utils/gemUtils';
import GemIcon from './GemIcon';

export default function GameActionLog() {
  const gameState = useGameStore((state) => state.gameState);
  const checkIsMe = useGameStore((state) => state.isMe);
  const actionLog = useGameStore((state) => (Array.isArray(state.gameState?.log) && state.gameState.log.length > 0 ? state.gameState.log : state.actionLog || []));

  const [isCollapsed, setIsCollapsed] = useState(false);
  const logContainerRef = useRef(null);

  // Auto-scroll ke paling bawah saat ada log baru
  useEffect(() => {
    if (logContainerRef.current && !isCollapsed) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [actionLog.length, isCollapsed]);

  const players = gameState?.players || [];

  const getPlayer = (playerId) => {
    return players.find((p) => p.id === playerId || p.playerId === playerId) || null;
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '';
    }
  };

  // Helper untuk merender isi spesifik per jenis action sesuai API.md
  const renderLogContent = (entry) => {
    switch (entry.type) {
      case 'take_three_different': {
        const colors = entry.colors || [];
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
            <span>ambil {colors.length} token:</span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
              {colors.map((c, i) => {
                const norm = normalizeColor(c);
                const meta = GEM_METADATA[norm] || {};
                return (
                  <span
                    key={i}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px',
                      padding: '1px 4px',
                      borderRadius: '3px',
                      background: meta.bgColor || 'rgba(255,255,255,0.1)',
                      border: `1px solid ${meta.borderColor || 'rgba(255,255,255,0.2)'}`,
                      fontSize: '0.72rem',
                      color: meta.textColor || '#fff',
                    }}
                    title={meta.indonesian || norm}
                  >
                    <GemIcon color={norm} size={12} />
                  </span>
                );
              })}
            </div>
          </div>
        );
      }

      case 'take_two_same': {
        const norm = normalizeColor(entry.color);
        const meta = GEM_METADATA[norm] || {};
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
            <span>ambil 2x token</span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                padding: '1px 5px',
                borderRadius: '3px',
                background: meta.bgColor || 'rgba(255,255,255,0.1)',
                border: `1px solid ${meta.borderColor || 'rgba(255,255,255,0.2)'}`,
                fontSize: '0.72rem',
                color: meta.textColor || '#fff',
              }}
              title={meta.indonesian || norm}
            >
              <GemIcon color={norm} size={12} />
              <strong>2x</strong>
            </span>
          </div>
        );
      }

      case 'buy_card': {
        const card = entry.card || {};
        const bonusColor = normalizeColor(card.bonus || card.gem || card.color);
        const meta = GEM_METADATA[bonusColor] || {};
        const points = card.points ?? 0;
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
            <span>beli kartu Tier {card.tier || '1'}</span>
            {entry.fromReserved && <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontStyle: 'italic' }}>(reservasi)</span>}
            {bonusColor && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                  padding: '1px 4px',
                  borderRadius: '3px',
                  background: meta.bgColor || 'rgba(255,255,255,0.1)',
                  border: `1px solid ${meta.borderColor || 'rgba(255,255,255,0.2)'}`,
                  fontSize: '0.72rem',
                  color: meta.textColor || '#fff',
                }}
                title={`Bonus ${meta.indonesian || bonusColor}`}
              >
                <GemIcon color={bonusColor} size={12} />
                <span>+1</span>
              </span>
            )}
            {points > 0 && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                  padding: '1px 4px',
                  borderRadius: '3px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  border: '1px solid #f59e0b',
                  fontSize: '0.72rem',
                  color: '#fbbf24',
                  fontWeight: 700,
                }}
              >
                +{points} 👑
              </span>
            )}
          </div>
        );
      }

      case 'reserve_card': {
        const card = entry.card || {};
        const tier = card.tier || entry.tier || 1;
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
            <span>
              reservasi Tier {tier} {entry.fromDeck ? 'tertutup' : 'meja'}
            </span>
            {entry.tookGold && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                  padding: '1px 4px',
                  borderRadius: '3px',
                  background: 'rgba(251, 191, 36, 0.2)',
                  border: '1px solid #fbbf24',
                  fontSize: '0.7rem',
                  color: '#fde047',
                  fontWeight: 700,
                }}
                title="Mendapat 1 token emas"
              >
                +1 🟡 Emas
              </span>
            )}
          </div>
        );
      }

      case 'discard_tokens': {
        const tokens = entry.tokens || {};
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
            <span>kembalikan token:</span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
              {Object.entries(tokens).map(([col, amt]) => {
                if (!amt) return null;
                const norm = normalizeColor(col);
                const meta = GEM_METADATA[norm] || {};
                return (
                  <span
                    key={col}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px',
                      padding: '1px 3px',
                      borderRadius: '3px',
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid #ef4444',
                      fontSize: '0.7rem',
                      color: '#fca5a5',
                    }}
                  >
                    <GemIcon color={norm} size={11} />
                    <span>-{amt}</span>
                  </span>
                );
              })}
            </div>
          </div>
        );
      }

      case 'noble_visit': {
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
            <span style={{ color: '#fbbf24', fontWeight: 700 }}>🏛️ Dikunjungi Bangsawan! (+3 👑)</span>
          </div>
        );
      }

      case 'game_over': {
        const winner = getPlayer(entry.winnerId);
        const winnerName = winner ? winner.name : 'Pemain';
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
            <span style={{ color: '#34d399', fontWeight: 800 }}>🏆 Menang: {winnerName}</span>
          </div>
        );
      }

      default:
        return <span>{entry.type}</span>;
    }
  };

  return (
    <div
      className="card action-log-container"
      style={{
        padding: '0.75rem',
        borderRadius: '8px',
        background: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      {/* Header Log */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: isCollapsed ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: isCollapsed ? '0' : '0.45rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '1rem' }}>📜</span>
          <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>Riwayat Aksi</h4>
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '10px',
              padding: '0px 6px',
            }}
          >
            {actionLog.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            padding: '2px 4px',
            borderRadius: '4px',
            transition: 'color 0.2s',
          }}
          title={isCollapsed ? 'Tampilkan log' : 'Sembunyikan log'}
        >
          {isCollapsed ? '▼ Tampilkan' : '▲ Sembunyikan'}
        </button>
      </div>

      {/* Konten Log List */}
      {!isCollapsed && (
        <div
          ref={logContainerRef}
          className="custom-scrollbar"
          style={{
            maxHeight: '100px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.22rem',
            paddingRight: '4px',
          }}
        >
          {actionLog.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '0.75rem 0.5rem',
                color: '#64748b',
                fontSize: '0.76rem',
                fontStyle: 'italic',
              }}
            >
              Belum ada aksi. Setiap giliran pemain akan tercatat di sini.
            </div>
          ) : (
            actionLog.map((entry, idx) => {
              const player = getPlayer(entry.playerId);
              const isMe = checkIsMe(player);
              const playerName = player ? player.name : 'Pemain';
              const isLast = idx === actionLog.length - 1;

              return (
                <div
                  key={entry.id || idx}
                  style={{
                    fontSize: '0.74rem',
                    lineHeight: '1.25',
                    padding: '0.22rem 0.45rem',
                    borderRadius: '4px',
                    background: isLast ? 'rgba(56, 189, 248, 0.08)' : idx % 2 === 0 ? 'rgba(30, 41, 59, 0.45)' : 'rgba(15, 23, 42, 0.3)',
                    border: isLast ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(255, 255, 255, 0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.35rem',
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Bagian Kiri: Nama: aksinya apa.. */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap', minWidth: 0, flex: 1 }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        color: isMe ? '#60a5fa' : '#fbbf24',
                        flexShrink: 0,
                      }}
                    >
                      {playerName}
                      {isMe ? ' (Anda)' : ''}:
                    </span>
                    <div style={{ color: '#cbd5e1', display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>{renderLogContent(entry)}</div>
                  </div>

                  {/* Bagian Kanan: Timestamp */}
                  {entry.timestamp && <span style={{ fontSize: '0.64rem', color: '#64748b', flexShrink: 0, marginLeft: 'auto' }}>{formatTime(entry.timestamp)}</span>}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

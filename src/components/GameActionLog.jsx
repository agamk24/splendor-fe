import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { normalizeColor, GEM_METADATA } from '../utils/gemUtils';
import GemIcon from './GemIcon';

export default function GameActionLog() {
  const gameState = useGameStore((state) => state.gameState);
  const checkIsMe = useGameStore((state) => state.isMe);
  const actionLog = useGameStore((state) => state.gameState?.log || state.actionLog || []);

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
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
            <span>mengambil {colors.length} token:</span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
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
                      padding: '1px 5px',
                      borderRadius: '4px',
                      background: meta.bgColor || 'rgba(255,255,255,0.1)',
                      border: `1px solid ${meta.borderColor || 'rgba(255,255,255,0.2)'}`,
                      fontSize: '0.75rem',
                      color: meta.textColor || '#fff',
                    }}
                    title={meta.indonesian || norm}
                  >
                    <GemIcon color={norm} size={13} />
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
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
            <span>mengambil 2x token</span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                padding: '1px 6px',
                borderRadius: '4px',
                background: meta.bgColor || 'rgba(255,255,255,0.1)',
                border: `1px solid ${meta.borderColor || 'rgba(255,255,255,0.2)'}`,
                fontSize: '0.75rem',
                color: meta.textColor || '#fff',
              }}
              title={meta.indonesian || norm}
            >
              <GemIcon color={norm} size={13} />
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
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
            <span>membeli kartu Tier {card.tier || '1'}</span>
            {entry.fromReserved && <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic' }}>(dari reservasi)</span>}
            {bonusColor && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  background: meta.bgColor || 'rgba(255,255,255,0.1)',
                  border: `1px solid ${meta.borderColor || 'rgba(255,255,255,0.2)'}`,
                  fontSize: '0.75rem',
                  color: meta.textColor || '#fff',
                }}
                title={`Bonus ${meta.indonesian || bonusColor}`}
              >
                <GemIcon color={bonusColor} size={13} />
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
                  fontSize: '0.75rem',
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
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
            <span>
              mereservasi kartu Tier {tier} {entry.fromDeck ? 'tertutup' : 'dari meja'}
            </span>
            {entry.tookGold && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  background: 'rgba(251, 191, 36, 0.2)',
                  border: '1px solid #fbbf24',
                  fontSize: '0.75rem',
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
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
            <span>mengembalikan token:</span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
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
                      padding: '1px 4px',
                      borderRadius: '3px',
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid #ef4444',
                      fontSize: '0.72rem',
                      color: '#fca5a5',
                    }}
                  >
                    <GemIcon color={norm} size={12} />
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
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
            <span style={{ color: '#fbbf24', fontWeight: 700 }}>🏛️ Dikunjungi Bangsawan! (+3 Poin Prestise 👑)</span>
          </div>
        );
      }

      case 'game_over': {
        const winner = getPlayer(entry.winnerId);
        const winnerName = winner ? winner.name : 'Pemain';
        return (
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
            <span style={{ color: '#34d399', fontWeight: 800 }}>🏆 Permainan Selesai! Pemenang: {winnerName}</span>
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
            maxHeight: '260px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            paddingRight: '4px',
          }}
        >
          {actionLog.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '1.25rem 0.5rem',
                color: '#64748b',
                fontSize: '0.78rem',
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
                    fontSize: '0.78rem',
                    lineHeight: '1.35',
                    padding: '0.4rem 0.5rem',
                    borderRadius: '6px',
                    background: isLast ? 'rgba(56, 189, 248, 0.08)' : idx % 2 === 0 ? 'rgba(30, 41, 59, 0.45)' : 'rgba(15, 23, 42, 0.3)',
                    border: isLast ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(255, 255, 255, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Baris Atas Entry: Timestamp & Pemain */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.4rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: isMe ? '#60a5fa' : '#fbbf24',
                          background: isMe ? 'rgba(59, 130, 246, 0.2)' : 'rgba(245, 158, 11, 0.15)',
                          padding: '0px 5px',
                          borderRadius: '3px',
                          border: `1px solid ${isMe ? 'rgba(59, 130, 246, 0.35)' : 'rgba(245, 158, 11, 0.3)'}`,
                        }}
                      >
                        {playerName} {isMe && '(Anda)'}
                      </span>
                    </div>

                    {entry.timestamp && <span style={{ fontSize: '0.66rem', color: '#64748b' }}>{formatTime(entry.timestamp)}</span>}
                  </div>

                  {/* Isi Aksi */}
                  <div style={{ color: '#cbd5e1' }}>{renderLogContent(entry)}</div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

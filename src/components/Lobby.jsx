import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';

export default function Lobby({ roomId }) {
  const myName = useGameStore((state) => state.myName);
  const myPlayerId = useGameStore((state) => state.myPlayerId);
  const players = useGameStore((state) => state.players);
  const startGame = useGameStore((state) => state.startGame);
  const lastError = useGameStore((state) => state.lastError);
  const clearError = useGameStore((state) => state.clearError);

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // Normalisasi data pemain untuk mendukung format string maupun objek
  const normalizedPlayers = players.map((p, idx) => {
    if (typeof p === 'string') {
      return {
        id: `p-${idx}`,
        name: p,
        isHost: idx === 0,
        connected: true,
      };
    }
    // player_list_update mengirim PlayerListEntry: { playerId, name, connected, isHost }
    return {
      id: p.playerId || p.id || `p-${idx}`,
      name: p.name || 'Pemain',
      isHost: p.isHost ?? idx === 0,
      connected: p.connected ?? true,
    };
  });

  // Tentukan apakah user saat ini adalah host
  const hostPlayer = normalizedPlayers.find((p) => p.isHost) || normalizedPlayers[0];
  const isHost =
    normalizedPlayers.length > 0 &&
    (myPlayerId ? hostPlayer?.id === myPlayerId : hostPlayer?.name === myName);

  const canStart = isHost && normalizedPlayers.length >= 2 && normalizedPlayers.length <= 4;

  const handleStartGame = () => {
    if (!canStart || isStarting) return;
    setIsStarting(true);
    clearError();
    startGame(roomId);
    // Timeout reset guard jika server lambat merespons
    setTimeout(() => setIsStarting(false), 3000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Slot kosong untuk menampilkan maksimal 4 slot pemain
  const emptySlotsCount = Math.max(0, 4 - normalizedPlayers.length);

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      {/* Alert Error */}
      {lastError && (
        <div className="alert-error" style={{ marginBottom: '1.5rem' }}>
          <span>⚠️ {lastError}</span>
          <button onClick={clearError} style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '1.2rem' }}>
            &times;
          </button>
        </div>
      )}

      {/* Lobby Header Card */}
      <div className="card" style={{ marginBottom: '1.5rem', textAlign: 'center', padding: '2rem' }}>
        <span style={{ fontSize: '2.5rem' }}>🏰</span>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.5rem' }}>Lobby Permainan</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '0.25rem' }}>Kumpulkan 2 hingga 4 pemain sebelum memulai ekspedisi Splendor.</p>

        {/* Room Share Box */}
        <div
          style={{
            display: 'inline-flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            background: 'rgba(15, 23, 42, 0.7)',
            padding: '0.75rem 1.25rem',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginTop: '1.25rem',
          }}
        >
          <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Kode Room:</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '1px', color: '#38bdf8' }}>{roomId}</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleCopyCode} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
              {copiedCode ? '✓ Disalin' : 'Salin Kode'}
            </button>
            <button onClick={handleCopyLink} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
              {copiedLink ? '✓ Link Disalin' : 'Salin Link'}
            </button>
          </div>
        </div>
      </div>

      {/* Players Section */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f1f5f9' }}>Daftar Pemain</h3>
          <span className="badge" style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }}>
            {normalizedPlayers.length} / 4 Pemain
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {/* Terdaftar */}
          {normalizedPlayers.map((player, idx) => {
            const isMe = player.name === myName;
            return (
              <div
                key={player.id || idx}
                style={{
                  background: isMe ? 'rgba(59, 130, 246, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                  border: isMe ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: player.isHost ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: '#fff',
                    flexShrink: 0,
                  }}
                >
                  {player.isHost ? '👑' : player.name.charAt(0).toUpperCase()}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        fontWeight: 600,
                        color: '#f8fafc',
                        fontSize: '0.95rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={player.name}
                    >
                      {player.name}
                    </span>
                    {isMe && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          background: 'rgba(59, 130, 246, 0.3)',
                          color: '#60a5fa',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontWeight: 600,
                        }}
                      >
                        Anda
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem', fontSize: '0.75rem' }}>
                    {player.isHost && <span style={{ color: '#fbbf24', fontWeight: 600 }}>Host Room</span>}
                    {!player.connected && <span style={{ color: '#f87171' }}>• Terputus</span>}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Slot Kosong */}
          {Array.from({ length: emptySlotsCount }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              style={{
                border: '1px dashed rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: 'rgba(15, 23, 42, 0.2)',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '1px dashed rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  fontSize: '0.9rem',
                  flexShrink: 0,
                }}
              >
                +
              </div>
              <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Menunggu pemain...</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
        {isHost ? (
          <div>
            <button
              onClick={handleStartGame}
              disabled={!canStart || isStarting}
              className="btn btn-emerald"
              style={{
                fontSize: '1.1rem',
                padding: '0.85rem 2.5rem',
                fontWeight: 700,
                letterSpacing: '0.5px',
              }}
            >
              {isStarting ? 'Memulai Game...' : '⚔️ Start Game'}
            </button>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.75rem' }}>
              {normalizedPlayers.length < 2 ? '⚠️ Membutuhkan minimal 2 pemain untuk memulai permainan.' : 'Pemain sudah cukup! Klik Start Game saat semua pemain siap.'}
            </p>
          </div>
        ) : (
          <div style={{ color: '#94a3b8', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <span style={{ animation: 'spin 1.5s linear infinite', display: 'inline-block' }}>⏳</span>
            <span>
              Menunggu Host (<strong style={{ color: '#f1f5f9' }}>{hostPlayer?.name || 'Host'}</strong>) memulai permainan...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

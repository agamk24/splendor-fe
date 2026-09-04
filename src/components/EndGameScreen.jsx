import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { GEM_COLORS, GEM_METADATA, normalizeColor } from '../utils/gemUtils';

export default function EndGameScreen() {
  const navigate = useNavigate();
  const gameState = useGameStore((state) => state.gameState);
  const checkIsMe = useGameStore((state) => state.isMe);
  const resetStore = useGameStore((state) => state.resetStore);

  const players = gameState?.players || [];

  // Jumlah kartu perkembangan yang dibeli (nama field resmi backend).
  const getCardCount = (player) => (player.cardsOwned || []).length;

  // Ranking sesuai aturan resmi Splendor:
  // 1. Poin prestise tertinggi
  // 2. Tie-break: Jumlah kartu perkembangan yang dibeli paling SEDIKIT
  const rankedPlayers = [...players].sort((a, b) => {
    const pointsA = a.points ?? a.score ?? a.prestige ?? 0;
    const pointsB = b.points ?? b.score ?? b.prestige ?? 0;

    if (pointsB !== pointsA) {
      return pointsB - pointsA; // Poin terbanyak di urutan pertama
    }

    // Tie-break: Sedikit kartu lebih baik
    const cardsA = getCardCount(a);
    const cardsB = getCardCount(b);
    return cardsA - cardsB;
  });

  // Pemenang ditentukan server (winnerId). Ranking lokal hanya untuk urutan tampilan.
  const winner = players.find((p) => p.id === gameState?.winnerId) || rankedPlayers[0];
  const isWinnerMe = checkIsMe(winner);

  const handleReturnHome = () => {
    // Sesuai brief: clear sessionStorage dan redirect ke /
    sessionStorage.clear();
    resetStore();
    navigate('/');
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '1rem 0' }}>
      {/* Kartu Pengumuman Pemenang */}
      <div
        className="card"
        style={{
          textAlign: 'center',
          padding: '2.5rem 1.5rem',
          marginBottom: '1.75rem',
          background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
          border: '2px solid #f59e0b',
          boxShadow: '0 0 30px rgba(245, 158, 11, 0.25)',
        }}
      >
        <div style={{ fontSize: '4rem', marginBottom: '0.5rem', animation: 'bounce 2s infinite' }}>🏆</div>
        <span
          style={{
            fontSize: '0.85rem',
            color: '#f59e0b',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            fontWeight: 800,
          }}
        >
          Permainan Selesai
        </span>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#f8fafc', margin: '0.5rem 0' }}>{isWinnerMe ? '🎉 Selamat, Anda Menang!' : `🏆 ${winner?.name || 'Pemain'} Menang!`}</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: '460px', margin: '0 auto' }}>
          Mencapai {winner?.points ?? winner?.score ?? 15} poin prestise dengan total {getCardCount(winner || {})} kartu perkembangan.
        </p>
      </div>

      {/* Tabel Ranking Akhir */}
      <div className="card" style={{ marginBottom: '1.75rem', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1.25rem' }}>Klasemen Akhir</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {rankedPlayers.map((player, idx) => {
            const isMe = checkIsMe(player);
            const points = player.points ?? player.score ?? player.prestige ?? 0;
            const cardsCount = getCardCount(player);

            const rankMedals = ['🥇', '🥈', '🥉', '4️⃣'];
            const rankMedal = rankMedals[idx] || `${idx + 1}.`;

            return (
              <div
                key={player.id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  borderRadius: '10px',
                  background: idx === 0 ? 'linear-gradient(90deg, rgba(245, 158, 11, 0.15), rgba(15, 23, 42, 0.6))' : isMe ? 'rgba(59, 130, 246, 0.15)' : 'rgba(15, 23, 42, 0.5)',
                  border: idx === 0 ? '1px solid rgba(245, 158, 11, 0.5)' : isMe ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                {/* Ranking & Nama */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <span style={{ fontSize: '1.5rem', width: '32px', textAlign: 'center' }}>{rankMedal}</span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '1rem' }}>{player.name}</span>
                      {isMe && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            background: 'rgba(59, 130, 246, 0.3)',
                            color: '#60a5fa',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontWeight: 700,
                          }}
                        >
                          Anda
                        </span>
                      )}
                      {idx === 0 && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            background: 'rgba(245, 158, 11, 0.3)',
                            color: '#fbbf24',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontWeight: 700,
                          }}
                        >
                          Juara
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {cardsCount} kartu dibeli
                    </span>
                  </div>
                </div>

                {/* Skor Poin */}
                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      fontSize: '1.4rem',
                      fontWeight: 900,
                      color: idx === 0 ? '#fbbf24' : '#f8fafc',
                    }}
                  >
                    {points}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>Poin</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tombol Kembali ke Beranda */}
      <div style={{ textAlign: 'center' }}>
        <button
          type="button"
          onClick={handleReturnHome}
          className="btn btn-primary"
          style={{
            padding: '0.85rem 2.5rem',
            fontSize: '1.05rem',
            fontWeight: 700,
            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
          }}
        >
          🏠 Kembali ke Beranda
        </button>
      </div>
    </div>
  );
}

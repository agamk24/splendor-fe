import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { GEM_COLORS, GEM_METADATA, normalizeColor } from '../utils/gemUtils';

export default function BoardBank() {
  const gameState = useGameStore((state) => state.gameState);
  const myName = useGameStore((state) => state.myName);
  const mySocketId = useGameStore((state) => state.mySocketId);
  const sendPlayerAction = useGameStore((state) => state.sendPlayerAction);

  // Local state untuk token yang sedang dipilih sementara
  const [selected, setSelected] = useState({
    white: 0,
    blue: 0,
    green: 0,
    red: 0,
    black: 0,
  });

  const bank = gameState?.bank || {};
  const players = gameState?.players || [];
  const currentIndex = gameState?.currentPlayerIndex ?? 0;
  const currentPlayer = players[currentIndex];

  const isMyTurn = Boolean(currentPlayer && (currentPlayer.name === myName || (mySocketId && (currentPlayer.id === mySocketId || currentPlayer.socketId === mySocketId))));

  // Hitung ringkasan seleksi
  const selectedEntries = Object.entries(selected).filter(([_, count]) => count > 0);
  const totalSelected = selectedEntries.reduce((sum, [_, count]) => sum + count, 0);
  const selectedColorsCount = selectedEntries.length;
  const hasDouble = selectedEntries.some(([_, count]) => count === 2);

  // Validasi aturan pengambilan token Splendor:
  // 1. Ambil 2 token warna sama (hanya jika di bank ada minimal 4, dan tidak ada warna lain dipilih)
  // 2. Ambil hingga 3 token warna berbeda (masing-masing 1 token)
  const isValidSelection = (() => {
    if (totalSelected === 0) return false;
    if (hasDouble) {
      if (totalSelected === 2 && selectedColorsCount === 1) {
        const [doubleColor] = selectedEntries[0];
        return (bank[doubleColor] || 0) >= 4;
      }
      return false;
    }
    // Warna berbeda: 1 sampai 3 token
    return selectedColorsCount <= 3 && totalSelected === selectedColorsCount;
  })();

  // Klik token di bank untuk memilih
  const handleSelectToken = (color) => {
    if (!isMyTurn) return;
    const available = bank[color] || 0;
    const currentCount = selected[color] || 0;

    // Jika di bank tidak cukup
    if (available - currentCount <= 0) return;

    // Skenario 1: Belum ada token warna ini yang dipilih
    if (currentCount === 0) {
      // Jika sudah ada 2 warna sama dipilih, tidak bisa tambah warna lain
      if (hasDouble) return;
      // Jika sudah ada 3 warna berbeda dipilih, tidak bisa tambah
      if (selectedColorsCount >= 3) return;

      setSelected((prev) => ({ ...prev, [color]: 1 }));
    }
    // Skenario 2: Sudah memilih 1 token warna ini, ingin ambil token ke-2 (warna sama)
    else if (currentCount === 1) {
      // Hanya diperbolehkan jika tidak ada warna lain yang dipilih dan stok bank >= 4
      if (totalSelected === 1 && available >= 4) {
        setSelected((prev) => ({ ...prev, [color]: 2 }));
      }
    }
  };

  // Kurangi/batalkan pilihan untuk warna tertentu
  const handleRemoveToken = (color) => {
    setSelected((prev) => {
      const current = prev[color] || 0;
      if (current <= 0) return prev;
      return { ...prev, [color]: current - 1 };
    });
  };

  const handleResetSelection = () => {
    setSelected({ white: 0, blue: 0, green: 0, red: 0, black: 0 });
  };

  const handleConfirm = () => {
    if (!isValidSelection || !isMyTurn) return;

    // Buat daftar token dalam format array string maupun objek untuk kompatibilitas
    const tokenList = Object.entries(selected).flatMap(([color, count]) => Array(count).fill(color));

    sendPlayerAction({
      type: 'take_tokens',
      tokens: selected,
      tokenList: tokenList,
      color: hasDouble ? selectedEntries[0][0] : undefined,
    });

    handleResetSelection();
  };

  return (
    <div className="card" style={{ minWidth: '280px', padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>🏦 Bank Permata</h3>
        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{isMyTurn ? '🟢 Giliran Anda' : '⏳ Menunggu Giliran'}</span>
      </div>

      {/* Grid Token Bank */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', justifyItems: 'center', marginBottom: '1.25rem' }}>
        {/* 5 Permata Reguler */}
        {GEM_COLORS.map((color) => {
          const meta = GEM_METADATA[color];
          const count = bank[color] ?? 0;
          const isSelected = (selected[color] || 0) > 0;
          const isDisabled = !isMyTurn || count <= 0;

          return (
            <button
              key={color}
              type="button"
              className={`gem-token ${isSelected ? 'gem-token-selected' : ''}`}
              style={{
                background: `radial-gradient(circle at 35% 35%, ${meta.bgColor}, ${meta.borderColor})`,
                border: `2px solid ${meta.borderColor}`,
                color: meta.textColor,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
              }}
              onClick={() => handleSelectToken(color)}
              disabled={isDisabled}
              title={`${meta.indonesian} (${count} tersedia). Klik untuk memilih.`}
            >
              <span style={{ fontSize: '0.85rem' }}>{meta.symbol}</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>{count}</span>
            </button>
          );
        })}

        {/* Token Emas (Joker) - Tidak bisa diambil biasa */}
        {(() => {
          const meta = GEM_METADATA.gold;
          const goldCount = bank.gold ?? 0;
          return (
            <div
              className="gem-token"
              style={{
                background: `radial-gradient(circle at 35% 35%, ${meta.bgColor}, ${meta.borderColor})`,
                border: `2px solid ${meta.borderColor}`,
                color: meta.textColor,
                cursor: 'default',
                opacity: 0.9,
              }}
              title={`Emas (${goldCount} tersedia) — Diperoleh otomatis saat reservasi kartu.`}
            >
              <span style={{ fontSize: '0.85rem' }}>{meta.symbol}</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>{goldCount}</span>
            </div>
          );
        })()}
      </div>

      {/* Area Seleksi Sementara */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: '8px',
          padding: '0.75rem',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>PILIHAN SEMENTARA:</span>
          {totalSelected > 0 && (
            <button type="button" onClick={handleResetSelection} style={{ background: 'transparent', border: 'none', color: '#f87171', fontSize: '0.75rem', cursor: 'pointer' }}>
              Reset
            </button>
          )}
        </div>

        {totalSelected === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.8rem', textAlign: 'center', margin: '0.25rem 0' }}>Klik token bank di atas untuk memilih (maks 3 beda / 2 sama).</p>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {selectedEntries.map(([color, count]) => {
              const meta = GEM_METADATA[color];
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleRemoveToken(color)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.25rem 0.5rem',
                    background: meta.bgColor,
                    border: `1px solid ${meta.borderColor}`,
                    borderRadius: '6px',
                    color: meta.textColor,
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                  title="Klik untuk mengurangi"
                >
                  <span>{meta.symbol}</span>
                  <span>&times;{count}</span>
                  <span style={{ fontSize: '0.7rem', color: '#ef4444', marginLeft: '2px' }}>✕</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Tombol Confirm */}
      <button type="button" className="btn btn-emerald" style={{ width: '100%', padding: '0.65rem' }} disabled={!isValidSelection || !isMyTurn} onClick={handleConfirm}>
        ✓ Ambil Token ({totalSelected})
      </button>

      {!isMyTurn && <p style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', marginTop: '0.5rem' }}>Tunggu hingga giliran Anda untuk mengambil token.</p>}
    </div>
  );
}

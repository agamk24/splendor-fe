import React, { useState, useEffect } from 'react';

export default function RoomSidebar({ isOpen, onToggle, roomId, isConnected, isMuted, onToggleMute, onLeaveRoom, currentStatus }) {
  const [copied, setCopied] = useState(false);

  // Keyboard shortcut: Esc to close sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onToggle(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onToggle]);

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      {/* Floating Toggle Pill saat Sidebar Tercollapse (Default State) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => onToggle(true)}
          style={{
            position: 'fixed',
            top: '25px',
            right: '16px',
            zIndex: 900,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '24px',
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#f8fafc',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5), 0 0 10px rgba(56, 189, 248, 0.2)',
            fontSize: '0.82rem',
            fontWeight: 700,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            userSelect: 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
            e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.6)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.6), 0 0 15px rgba(56, 189, 248, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.5), 0 0 10px rgba(56, 189, 248, 0.2)';
          }}
          title="Buka Menu & Info Room"
        >
          <span style={{ fontSize: '1rem' }}>💎</span>
          <span style={{ color: '#38bdf8' }}>{roomId}</span>
          <span
            style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isConnected ? '#34d399' : '#f87171',
              boxShadow: isConnected ? '0 0 8px #34d399' : '0 0 8px #f87171',
            }}
            title={isConnected ? 'Online' : 'Offline'}
          />
          <span style={{ fontSize: '0.9rem', color: '#94a3b8', marginLeft: '2px' }}>☰</span>
        </button>
      )}

      {/* Backdrop & Drawer saat Sidebar Terbuka */}
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <div
            onClick={() => onToggle(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 998,
              animation: 'fadeIn 0.2s ease',
            }}
          />

          {/* Drawer Sidebar */}
          <aside
            className="custom-scrollbar"
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '320px',
              maxWidth: '85vw',
              background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
              borderLeft: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.7)',
              zIndex: 999,
              display: 'flex',
              flexDirection: 'column',
              padding: '1.25rem',
              gap: '1.25rem',
              overflowY: 'auto',
              animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Header Sidebar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.5rem' }}>💎</span>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>Splendor Online</h3>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Menu & Pengaturan</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onToggle(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#94a3b8';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
                title="Tutup menu (Esc)"
              >
                ✕
              </button>
            </div>

            {/* Kartu Informasi Room */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.65)',
                borderRadius: '8px',
                padding: '0.9rem',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>KODE ROOM</span>
                <span className={`badge ${isConnected ? 'badge-connected' : 'badge-disconnected'}`} style={{ fontSize: '0.7rem' }}>
                  <span className="badge-dot" />
                  {isConnected ? 'Online' : 'Offline'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#38bdf8', letterSpacing: '1px' }}>{roomId}</span>
                <button type="button" onClick={handleCopyLink} className="btn btn-secondary" style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }} title="Salin tautan room">
                  {copied ? '✓ Tersalin!' : '📋 Salin Link'}
                </button>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                Status Permainan:{' '}
                <strong style={{ color: currentStatus === 'playing' ? '#34d399' : currentStatus === 'waiting' ? '#fbbf24' : '#f87171' }}>
                  {currentStatus === 'playing' ? 'Sedang Bermain' : currentStatus === 'waiting' ? 'Menunggu di Lobby' : 'Permainan Selesai'}
                </strong>
              </div>
            </div>

            {/* Pengaturan Audio */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.65)',
                borderRadius: '8px',
                padding: '0.9rem',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>AUDIO & EFEK SUARA</span>
              <button
                type="button"
                onClick={onToggleMute}
                className="btn btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '0.6rem',
                  fontSize: '0.85rem',
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{isMuted ? '🔇' : '🔊'}</span>
                <span>{isMuted ? 'Aktifkan Suara' : 'Bisukan Suara (Mute)'}</span>
              </button>
            </div>

            {/* Tombol Aksi Keluar */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={onLeaveRoom}
                className="btn btn-danger"
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #ef4444',
                  color: '#fca5a5',
                }}
              >
                <span>🚪</span> Keluar dari Room
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}

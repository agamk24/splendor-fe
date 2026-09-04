import React, { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

export default function ToastAlert() {
  const lastError = useGameStore((state) => state.lastError);
  const clearError = useGameStore((state) => state.clearError);

  useEffect(() => {
    if (!lastError) return;

    // Auto-hide setelah 4 detik sesuai spesifikasi
    const timer = setTimeout(() => {
      clearError();
    }, 4000);

    return () => clearTimeout(timer);
  }, [lastError, clearError]);

  if (!lastError) return null;

  return (
    <div className="toast-container">
      <div className="toast">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.25rem' }}>⚠️</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{lastError}</span>
        </div>
        <button
          onClick={clearError}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#fca5a5',
            cursor: 'pointer',
            fontSize: '1.25rem',
            lineHeight: 1,
            padding: '0 0.25rem',
          }}
          title="Tutup"
        >
          &times;
        </button>
      </div>
    </div>
  );
}

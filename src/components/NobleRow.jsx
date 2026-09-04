import React from 'react';
import { useGameStore } from '../store/gameStore';
import { GEM_METADATA, normalizeColor } from '../utils/gemUtils';

export default function NobleRow() {
  const gameState = useGameStore((state) => state.gameState);
  const nobles = gameState?.nobles || [];

  if (!nobles || nobles.length === 0) {
    return null;
  }

  return (
    <div className="card" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>👑</span>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>Bangsawan (Noble Tiles)</h3>
        </div>
        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{nobles.length} bangsawan tersedia (Kunjungan otomatis saat syarat kartu terpenuhi)</span>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {nobles.map((noble, idx) => {
          const points = noble.points ?? 3;
          // Backend mengirim `requirement` (tunggal), berkunci nama permata resmi.
          const reqs = noble.requirement || {};

          return (
            <div key={noble.id || `noble-${idx}`} className="noble-tile" title={`Bangsawan: Memberikan ${points} poin saat Anda mengumpulkan kartu yang disyaratkan`}>
              {/* Header Bangsawan: Poin Prestise */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.85rem' }}>👑</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fbbf24', textShadow: '0 0 8px rgba(245, 158, 11, 0.4)' }}>{points}</span>
              </div>

              {/* Persyaratan Bonus Kartu */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: 'auto' }}>
                {Object.entries(reqs).map(([cKey, reqCount]) => {
                  if (reqCount <= 0) return null;
                  const color = normalizeColor(cKey);
                  const meta = GEM_METADATA[color];

                  return (
                    <div
                      key={cKey}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: meta?.bgColor || '#334155',
                        border: `1px solid ${meta?.borderColor || '#475569'}`,
                        borderRadius: '4px',
                        padding: '2px 6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: meta?.textColor || '#fff',
                      }}
                      title={`Syarat: ${reqCount} kartu bonus ${meta?.indonesian || color}`}
                    >
                      <span>{meta?.symbol}</span>
                      <span style={{ fontWeight: 800 }}>{reqCount}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

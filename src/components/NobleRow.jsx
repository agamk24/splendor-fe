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
          const reqs = noble.requirements || noble.cost || noble.reqs || {};

          return (
            <div key={noble.id || `noble-${idx}`} className="noble-tile" title={`Bangsawan: Memberikan ${points} poin saat Anda mengumpulkan kartu yang disyaratkan`}>
              {/* Header Bangsawan: Poin Prestise */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#f59e0b' }}>👑</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fbbf24' }}>{points}</span>
              </div>

              {/* Persyaratan Bonus Kartu */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: 'auto' }}>
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
                        padding: '1px 4px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: meta?.textColor || '#fff',
                      }}
                    >
                      <span>{meta?.symbol}</span>
                      <span>{reqCount}</span>
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

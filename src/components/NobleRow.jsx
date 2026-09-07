import React from 'react';
import { useGameStore } from '../store/gameStore';
import { GEM_METADATA, normalizeColor } from '../utils/gemUtils';
import NobleIllustration from './NobleIllustration';

export default function NobleRow() {
  const gameState = useGameStore((state) => state.gameState);
  const nobles = gameState?.nobles || [];

  if (!nobles || nobles.length === 0) {
    return null;
  }

  return (
    <div className="card" style={{ padding: '0.85rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '1.15rem' }}>👑</span>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>Bangsawan ({nobles.length})</h3>
        </div>
        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Kunjungan otomatis</span>
      </div>

      <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {nobles.map((noble, idx) => {
          const points = noble.points ?? 3;
          // Dukung berbagai variasi field nama backend: requirements (plural), requirement (singular), atau cost
          const rawReqs = noble.requirements || noble.requirement || noble.cost || {};
          const reqEntries = Array.isArray(rawReqs) ? rawReqs.map((item) => [item.color || item.gem, item.count || item.amount || 1]) : Object.entries(rawReqs);
          const validReqs = reqEntries.filter(([_, count]) => (Number(count) || 0) > 0);
          const isTwoCombos = validReqs.length <= 2;

          return (
            <div
              key={noble.id || `noble-${idx}`}
              className="noble-tile"
              title={`Bangsawan: Memberikan ${points} poin saat Anda mengumpulkan kartu yang disyaratkan`}
              style={{ position: 'relative', overflow: 'hidden', height: '116px', padding: '8px' }}
            >
              {/* Ilustrasi Artwork Bangsawan */}
              <NobleIllustration noble={noble} index={idx} />

              {/* Persyaratan Bonus Kartu: 2 kombinasi di bawah, 3 kombinasi spaced evenly seimbang */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: isTwoCombos ? 'flex-end' : 'space-between',
                  gap: isTwoCombos ? '8px' : '0',
                  height: '100%',
                  flex: 1,
                  position: 'relative',
                  zIndex: 2,
                  alignItems: 'flex-start',
                }}
              >
                {validReqs.map(([cKey, reqCount]) => {
                  const countNum = Number(reqCount) || 0;
                  const color = normalizeColor(cKey);
                  const meta = GEM_METADATA[color];

                  return (
                    <div
                      key={cKey}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '28px',
                        height: '28px',
                        borderRadius: '4px',
                        background: meta?.solidBg || '#334155',
                        border: `1.5px solid ${meta?.solidBorder || meta?.borderColor || '#475569'}`,
                        fontSize: '0.95rem',
                        fontWeight: 900,
                        color: meta?.solidText || '#fff',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.65)',
                        flexShrink: 0,
                      }}
                      title={`Syarat: ${countNum} kartu bonus ${meta?.indonesian || color}`}
                    >
                      {countNum}
                    </div>
                  );
                })}
              </div>

              {/* Poin Bangsawan di Kanan Bawah (Tanpa Icon Crown) */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '7px',
                  right: '9px',
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'flex-end',
                }}
              >
                <span
                  style={{
                    fontSize: '1.45rem',
                    fontWeight: 900,
                    color: '#fbbf24',
                    textShadow: '0 0 8px rgba(245, 158, 11, 0.5), 0 2px 4px rgba(0, 0, 0, 0.9)',
                    lineHeight: 1,
                  }}
                >
                  {points}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

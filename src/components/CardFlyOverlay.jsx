import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimationStore } from '../store/animationStore';
import { GEM_METADATA, normalizeColor } from '../utils/gemUtils';
import GemIcon from './GemIcon';
import CardIllustration from './CardIllustration';

export default function CardFlyOverlay() {
  const flyingCards = useAnimationStore((state) => state.flyingCards);
  const removeFlyingCard = useAnimationStore((state) => state.removeFlyingCard);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 99999,
        overflow: 'hidden',
      }}
    >
      <AnimatePresence>
        {flyingCards.map((item) => {
          const { card, startRect, targetRect, id, buyerPlayerId } = item;
          const bonusColor = normalizeColor(card.gem || card.bonus || card.color);
          const bonusMeta = GEM_METADATA[bonusColor] || GEM_METADATA.white;
          const points = card.points ?? card.prestige ?? 0;

          // Amankan koordinat awal dan tujuan agar bebas dari nilai undefined / NaN
          const sX = typeof startRect?.x === 'number' ? startRect.x : window.innerWidth / 2;
          const sY = typeof startRect?.y === 'number' ? startRect.y : window.innerHeight / 2;
          const sW = typeof startRect?.width === 'number' ? startRect.width : 105;
          const sH = typeof startRect?.height === 'number' ? startRect.height : 145;

          const tX = typeof targetRect?.x === 'number' ? targetRect.x : 40;
          const tY = typeof targetRect?.y === 'number' ? targetRect.y : 180;
          const tW = typeof targetRect?.width === 'number' ? targetRect.width : 260;
          const tH = typeof targetRect?.height === 'number' ? targetRect.height : 90;

          // Hitung posisi tengah target tujuan (panel pemain)
          const targetX = tX + tW * 0.35 - sW / 2;
          const targetY = tY + tH * 0.5 - sH / 2;

          return (
            <motion.div
              key={id}
              initial={{
                position: 'fixed',
                left: 0,
                top: 0,
                x: sX,
                y: sY,
                width: sW,
                height: sH,
                scale: 1,
                rotate: 0,
                opacity: 1,
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(251, 191, 36, 0.5)',
              }}
              animate={{
                x: targetX,
                y: targetY,
                scale: 0.38,
                rotate: -12,
                opacity: [1, 1, 1, 0.8, 0],
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              }}
              exit={{ opacity: 0 }}
              transition={{
                x: { duration: 1.8, ease: [0.22, 1, 0.36, 1] },
                y: { duration: 1.8, ease: [0.22, 1, 0.36, 1] },
                scale: { duration: 1.8, ease: [0.22, 1, 0.36, 1] },
                rotate: { duration: 1.8, ease: 'easeOut' },
                opacity: { duration: 1.8, times: [0, 0.6, 0.85, 0.95, 1], ease: 'easeInOut' },
              }}
              onAnimationComplete={() => removeFlyingCard(id, buyerPlayerId)}
              style={{
                background: '#1e293b',
                borderRadius: '10px',
                border: `2px solid ${bonusMeta.borderColor}`,
                borderTop: `4px solid ${bonusMeta.borderColor}`,
                padding: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                overflow: 'hidden',
                pointerEvents: 'none',
              }}
            >
              {/* Artwork Ilustrasi Kartu */}
              <CardIllustration card={card} />

              {/* Header Kartu: Poin & Bonus Permata */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                <span
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    color: '#f8fafc',
                    textShadow: '0 2px 4px rgba(0,0,0,0.9)',
                  }}
                >
                  {points > 0 ? points : ''}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    filter: `drop-shadow(0 0 5px ${bonusMeta.glowColor})`,
                  }}
                >
                  <GemIcon color={bonusColor} size={22} />
                </span>
              </div>

              {/* Biaya Kartu di Kiri Bawah */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                  marginTop: 'auto',
                  alignItems: 'flex-start',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                {card.cost &&
                  Object.entries(card.cost).map(([cKey, costAmount]) => {
                    if (costAmount <= 0) return null;
                    const c = normalizeColor(cKey);
                    const meta = GEM_METADATA[c];
                    return (
                      <div
                        key={cKey}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '21px',
                          height: '21px',
                          borderRadius: '50%',
                          background: meta?.bgColor || '#334155',
                          border: `1.5px solid ${meta?.borderColor || '#64748b'}`,
                          color: meta?.textColor || '#fff',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                        }}
                      >
                        {costAmount}
                      </div>
                    );
                  })}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>,
    document.body,
  );
}

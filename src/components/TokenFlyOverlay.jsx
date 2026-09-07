import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimationStore } from '../store/animationStore';
import { GEM_METADATA, normalizeColor } from '../utils/gemUtils';
import GemIcon from './GemIcon';

export default function TokenFlyOverlay() {
  const flyingTokens = useAnimationStore((state) => state.flyingTokens);
  const removeFlyingToken = useAnimationStore((state) => state.removeFlyingToken);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 99998,
        overflow: 'hidden',
      }}
    >
      <AnimatePresence>
        {flyingTokens.map((item) => {
          const { id, color, index, startRect, targetRect, playerId } = item;
          const norm = normalizeColor(color);
          const meta = GEM_METADATA[norm] || GEM_METADATA.white;

          // Amankan koordinat dengan fallback agar tidak pernah bernilai NaN
          const sX = typeof startRect?.x === 'number' ? startRect.x : window.innerWidth * 0.7;
          const sY = typeof startRect?.y === 'number' ? startRect.y : window.innerHeight * 0.5;
          const tW = typeof targetRect?.width === 'number' ? targetRect.width : 40;
          const tH = typeof targetRect?.height === 'number' ? targetRect.height : 40;
          const tX = (typeof targetRect?.x === 'number' ? targetRect.x : 40) + tW / 2 - 18;
          const tY = (typeof targetRect?.y === 'number' ? targetRect.y : 180) + tH / 2 - 18;

          // Titik tengah melengkung ke atas (parabolic arc)
          const mY = Math.min(sY, tY) - 55 - (index % 3) * 15;
          const mX = (sX + tX) / 2;

          return (
            <motion.div
              key={id}
              initial={{
                position: 'fixed',
                left: 0,
                top: 0,
                x: sX,
                y: sY,
                scale: 1,
                rotate: 0,
                opacity: 1,
              }}
              animate={{
                x: [sX, mX, tX],
                y: [sY, mY, tY],
                scale: [1, 1.25, 0.85],
                rotate: [0, 180, 360],
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 0.65,
                delay: index * 0.08,
                times: [0, 0.55, 1],
                ease: 'easeInOut',
              }}
              onAnimationComplete={() => removeFlyingToken(id, playerId)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: `radial-gradient(circle at 35% 35%, ${meta.bgColor}, ${meta.borderColor})`,
                border: `2.5px solid ${meta.borderColor}`,
                boxShadow: `0 6px 16px rgba(0, 0, 0, 0.6), 0 0 16px ${meta.glowColor || '#fbbf24'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <GemIcon color={norm} size={19} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>,
    document.body,
  );
}

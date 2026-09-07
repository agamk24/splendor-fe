import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAnimationStore } from '../store/animationStore';

export default function CardFlipSlot({ tier, slotIndex, children }) {
  const slotKey = `${tier}-${slotIndex}`;
  const dealingInfo = useAnimationStore((state) => state.dealingCards[slotKey]);
  const finishDealingCard = useAnimationStore((state) => state.finishDealingCard);

  const slotRef = useRef(null);
  const [deltaPos, setDeltaPos] = useState({ x: -120, y: 0 });

  // Hitung offset jarak dari posisi tumpukan deck ke slot meja ini
  useEffect(() => {
    if (dealingInfo && slotRef.current) {
      const deckEl = document.getElementById(`deck-tier-${tier}`);
      if (deckEl) {
        const deckRect = deckEl.getBoundingClientRect();
        const slotRect = slotRef.current.getBoundingClientRect();
        setDeltaPos({
          x: deckRect.x - slotRect.x,
          y: deckRect.y - slotRect.y,
        });
      }
    }
  }, [dealingInfo, tier]);

  // Warna tema punggung kartu sesuai tier
  const tierColors = {
    3: { bg: 'linear-gradient(135deg, #1e3a8a, #0f172a)', border: '#3b82f6', label: 'Tier 3' },
    2: { bg: 'linear-gradient(135deg, #854d0e, #0f172a)', border: '#eab308', label: 'Tier 2' },
    1: { bg: 'linear-gradient(135deg, #14532d, #0f172a)', border: '#22c55e', label: 'Tier 1' },
  }[tier] || { bg: '#1e293b', border: '#64748b', label: `Tier ${tier}` };

  // Jika sedang ada animasi kartu baru keluar dari deck & flip
  if (dealingInfo) {
    return (
      <div
        ref={slotRef}
        id={`table-slot-${tier}-${slotIndex}`}
        style={{
          width: '105px',
          height: '145px',
          perspective: '1200px',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        {/* Layer 1: Animasi meluncur dari koordinat deck ke slot meja */}
        <motion.div
          initial={{
            x: deltaPos.x,
            y: deltaPos.y,
            scale: 0.9,
            opacity: 0.9,
          }}
          animate={{
            x: 0,
            y: 0,
            scale: 1,
            opacity: 1,
          }}
          transition={{
            type: 'spring',
            stiffness: 55,
            damping: 15,
            duration: 1.1,
          }}
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
          }}
        >
          {/* Layer 2: Animasi 3D Card Flip (balikan kartu 180 derajat) */}
          <motion.div
            initial={{ rotateY: 0 }}
            animate={{ rotateY: 180 }}
            transition={{
              delay: 0.65,
              duration: 1.25,
              ease: [0.25, 1, 0.5, 1],
            }}
            onAnimationComplete={() => finishDealingCard(slotKey)}
            style={{
              width: '100%',
              height: '100%',
              position: 'relative',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Sisi Belakang Kartu (Punggung Deck Tertutup) */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                background: tierColors.bg,
                border: `2px solid ${tierColors.border}`,
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                userSelect: 'none',
              }}
            >
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: tierColors.border }}>{tierColors.label}</span>
              <span style={{ fontSize: '1.5rem', marginTop: '4px' }}>🃏</span>
            </div>

            {/* Sisi Depan Kartu (Muka Kartu Baru Terbuka) */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              {children}
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Kondisi normal tanpa animasi dealing
  return (
    <div
      ref={slotRef}
      id={`table-slot-${tier}-${slotIndex}`}
      style={{
        width: '105px',
        height: '145px',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
}

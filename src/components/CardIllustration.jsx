import React, { useState, useEffect } from 'react';
import { normalizeColor } from '../utils/gemUtils';

// Import langsung gambar agar dibundle secara native oleh Vite (HMR instan tanpa perlu restart server)
import diamondImg from '../assets/cards/diamond.jpg';
import sapphireImg from '../assets/cards/sapphire.jpg';
import emeraldImg from '../assets/cards/emerald.jpg';
import rubyImg from '../assets/cards/ruby.jpg';
import onyxImg from '../assets/cards/onyx.jpg';

const STATIC_GEM_IMAGES = {
  diamond: diamondImg,
  white: diamondImg,
  sapphire: sapphireImg,
  blue: sapphireImg,
  emerald: emeraldImg,
  green: emeraldImg,
  ruby: rubyImg,
  red: rubyImg,
  onyx: onyxImg,
  black: onyxImg,
};

/**
 * Komponen CardIllustration untuk menampilkan ilustrasi kartu perkembangan Splendor.
 * Menggunakan 5 artwork permata resmi beresolusi tinggi dengan fallback vektor tematik.
 */
export default function CardIllustration({ card, className = '', style = {} }) {
  const [hasError, setHasError] = useState(false);

  if (!card) return null;

  const tier = card.tier || 1;
  const bonusColor = normalizeColor(card.gem || card.bonus || card.color);

  // Reset status error saat kartu berubah
  useEffect(() => {
    setHasError(false);
  }, [card?.id, card?.tier, bonusColor]);

  // Sumber gambar utama dari bundle Vite atau custom path
  const imageSrc = STATIC_GEM_IMAGES[bonusColor] || card.image || card.illustration || `/assets/cards/${bonusColor}.jpg`;

  // Handler saat gambar gagal dimuat
  const handleError = () => {
    setHasError(true);
  };

  // Render gambar jika tersedia
  if (imageSrc && !hasError) {
    return (
      <div
        className={className}
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 1,
          ...style,
        }}
      >
        <img
          src={imageSrc}
          alt=""
          onError={handleError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.55,
            filter: 'brightness(0.95) contrast(1.15)',
          }}
        />
        {/* Gradient overlay agar teks angka di atas kartu tetap kontras terbaca */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(15,23,42,0.65) 0%, rgba(15,23,42,0.1) 35%, rgba(15,23,42,0.85) 100%)',
          }}
        />
      </div>
    );
  }

  // Fallback Vektor Tematik Splendor jika belum ada file gambar di folder public
  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
        opacity: 0.18,
        ...style,
      }}
    >
      {tier === 1 && (
        /* Siluet Tambang & Beliung (Tier 1: Mining) */
        <svg viewBox="0 0 100 100" width="80%" height="80%" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 80 L50 35 L80 80 Z" strokeWidth="2" />
          <path d="M35 80 L50 55 L65 80" />
          <line x1="30" y1="20" x2="70" y2="45" strokeWidth="3.5" stroke="#cbd5e1" />
          <path d="M32 15 C40 10 50 15 55 22" strokeWidth="4" stroke="#f8fafc" />
          <circle cx="50" cy="72" r="3" fill="#cbd5e1" />
          <circle cx="60" cy="75" r="2" fill="#cbd5e1" />
        </svg>
      )}

      {tier === 2 && (
        /* Siluet Roda Pengasah & Transportasi Karavan (Tier 2: Refinement & Caravans) */
        <svg viewBox="0 0 100 100" width="80%" height="80%" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round">
          <circle cx="50" cy="50" r="30" strokeWidth="2.5" strokeDasharray="6 4" />
          <circle cx="50" cy="50" r="14" strokeWidth="2" />
          <line x1="50" y1="20" x2="50" y2="80" strokeWidth="1.5" />
          <line x1="20" y1="50" x2="80" y2="50" strokeWidth="1.5" />
          <line x1="29" y1="29" x2="71" y2="71" strokeWidth="1.5" />
          <line x1="29" y1="71" x2="71" y2="29" strokeWidth="1.5" />
        </svg>
      )}

      {tier === 3 && (
        /* Siluet Mahkota & Istana Guild Dagang (Tier 3: Noble Estates & Guilds) */
        <svg viewBox="0 0 100 100" width="85%" height="85%" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 75 L85 75 L80 35 L62 55 L50 25 L38 55 L20 35 Z" strokeWidth="2.5" />
          <circle cx="50" cy="22" r="3" fill="#38bdf8" />
          <circle cx="20" cy="32" r="2.5" fill="#38bdf8" />
          <circle cx="80" cy="32" r="2.5" fill="#38bdf8" />
          <line x1="20" y1="83" x2="80" y2="83" strokeWidth="2" />
        </svg>
      )}
    </div>
  );
}

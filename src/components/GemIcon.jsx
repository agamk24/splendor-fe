import React, { useState } from 'react';
import { normalizeColor } from '../utils/gemUtils';

/**
 * Komponen GemIcon untuk menampilkan ikon batu mulia Splendor.
 * Mendukung:
 * 1. Gambar custom dari /assets/gems/{color}.png atau .svg (jika ada file di folder public)
 * 2. Vector SVG berpotongan facet permata asli (Brilliant Diamond, Sapphire, Emerald, Ruby, Onyx, Gold)
 */
export default function GemIcon({ color = 'white', size = 16, style = {}, className = '', useImageFirst = true }) {
  const [imageError, setImageError] = useState(false);
  const normalized = normalizeColor(color);

  // Jika user menaruh file gambar di /public/assets/gems/{color}.png atau .svg
  if (useImageFirst && !imageError) {
    return (
      <img
        src={`/assets/gems/${normalized}.png`}
        alt={normalized}
        width={size}
        height={size}
        onError={() => setImageError(true)}
        className={className}
        style={{
          display: 'inline-block',
          verticalAlign: 'middle',
          objectFit: 'contain',
          width: `${size}px`,
          height: `${size}px`,
          ...style,
        }}
      />
    );
  }

  // Fallback / Standalone: Vektor SVG Berpotongan Permata Berkualitas Tinggi
  const svgProps = {
    viewBox: '0 0 24 24',
    width: size,
    height: size,
    fill: 'none',
    className,
    style: {
      display: 'inline-block',
      verticalAlign: 'middle',
      flexShrink: 0,
      ...style,
    },
  };

  switch (normalized) {
    case 'white':
      // 💎 Berlian (Diamond) - Brilliant Facet Cut
      return (
        <svg {...svgProps}>
          <defs>
            <linearGradient id="diamond-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
            <linearGradient id="diamond-shine" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <polygon points="6,3 18,3 22,8 12,21 2,8" fill="url(#diamond-grad)" stroke="#cbd5e1" strokeWidth="1" strokeLinejoin="round" />
          <polyline points="6,3 12,21 18,3" stroke="#94a3b8" strokeWidth="0.75" />
          <line x1="2" y1="8" x2="22" y2="8" stroke="#94a3b8" strokeWidth="0.75" />
          <polygon points="8.5,8 12,3 15.5,8 12,21" fill="url(#diamond-shine)" stroke="#ffffff" strokeWidth="0.8" />
        </svg>
      );

    case 'blue':
      // 🔷 Safir (Sapphire) - Radiant Teardrop / Pear Facet
      return (
        <svg {...svgProps}>
          <defs>
            <linearGradient id="sapphire-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
            <linearGradient id="sapphire-facet" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.35" />
            </linearGradient>
          </defs>
          <path d="M12 2 C7 7 4 12 4 16 C4 20.4 7.6 23 12 23 C16.4 23 20 20.4 20 16 C20 12 17 7 12 2 Z" fill="url(#sapphire-grad)" stroke="#0ea5e9" strokeWidth="1" />
          <polygon points="12,5 7.5,15 12,21 16.5,15" fill="url(#sapphire-facet)" stroke="#7dd3fc" strokeWidth="0.8" />
          <line x1="12" y1="5" x2="12" y2="21" stroke="#38bdf8" strokeWidth="0.75" />
          <line x1="7.5" y1="15" x2="16.5" y2="15" stroke="#38bdf8" strokeWidth="0.75" />
        </svg>
      );

    case 'green':
      // 🟢 Zamrud (Emerald) - Rectangular Step Cut
      return (
        <svg {...svgProps}>
          <defs>
            <linearGradient id="emerald-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="50%" stopColor="#059669" />
              <stop offset="100%" stopColor="#064e3b" />
            </linearGradient>
            <linearGradient id="emerald-facet" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.35" />
            </linearGradient>
          </defs>
          <polygon points="6,3 18,3 22,7 22,17 18,21 6,21 2,17 2,7" fill="url(#emerald-grad)" stroke="#10b981" strokeWidth="1" />
          <polygon points="8,6 16,6 19,9 19,15 16,18 8,18 5,15 5,9" fill="url(#emerald-facet)" stroke="#6ee7b7" strokeWidth="0.8" />
          <line x1="6" y1="3" x2="8" y2="6" stroke="#34d399" strokeWidth="0.75" />
          <line x1="18" y1="3" x2="16" y2="6" stroke="#34d399" strokeWidth="0.75" />
          <line x1="22" y1="7" x2="19" y2="9" stroke="#34d399" strokeWidth="0.75" />
          <line x1="22" y1="17" x2="19" y2="15" stroke="#34d399" strokeWidth="0.75" />
          <line x1="18" y1="21" x2="16" y2="18" stroke="#34d399" strokeWidth="0.75" />
          <line x1="6" y1="21" x2="8" y2="18" stroke="#34d399" strokeWidth="0.75" />
          <line x1="2" y1="17" x2="5" y2="15" stroke="#34d399" strokeWidth="0.75" />
          <line x1="2" y1="7" x2="5" y2="9" stroke="#34d399" strokeWidth="0.75" />
        </svg>
      );

    case 'red':
      // 🔴 Rubi (Ruby) - Cushion Oval Brilliant
      return (
        <svg {...svgProps}>
          <defs>
            <linearGradient id="ruby-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="50%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#7f1d1d" />
            </linearGradient>
            <linearGradient id="ruby-facet" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fca5a5" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <polygon points="12,2 20,6 22,14 17,21 7,21 2,14 4,6" fill="url(#ruby-grad)" stroke="#ef4444" strokeWidth="1" />
          <polygon points="12,5 17,8 18,13 15,18 9,18 6,13 7,8" fill="url(#ruby-facet)" stroke="#f87171" strokeWidth="0.8" />
          <line x1="12" y1="2" x2="12" y2="5" stroke="#fca5a5" strokeWidth="0.75" />
          <line x1="20" y1="6" x2="17" y2="8" stroke="#fca5a5" strokeWidth="0.75" />
          <line x1="22" y1="14" x2="18" y2="13" stroke="#fca5a5" strokeWidth="0.75" />
          <line x1="17" y1="21" x2="15" y2="18" stroke="#fca5a5" strokeWidth="0.75" />
          <line x1="7" y1="21" x2="9" y2="18" stroke="#fca5a5" strokeWidth="0.75" />
          <line x1="2" y1="14" x2="6" y2="13" stroke="#fca5a5" strokeWidth="0.75" />
          <line x1="4" y1="6" x2="7" y2="8" stroke="#fca5a5" strokeWidth="0.75" />
        </svg>
      );

    case 'black':
      // ⚫ Oniks (Onyx) - Faceted Hexagon / Polygon
      return (
        <svg {...svgProps}>
          <defs>
            <linearGradient id="onyx-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="50%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#090d16" />
            </linearGradient>
            <linearGradient id="onyx-facet" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#334155" stopOpacity="0.25" />
            </linearGradient>
          </defs>
          <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" fill="url(#onyx-grad)" stroke="#64748b" strokeWidth="1" />
          <polygon points="12,6 18,9.5 18,14.5 12,18 6,14.5 6,9.5" fill="url(#onyx-facet)" stroke="#94a3b8" strokeWidth="0.8" />
          <line x1="12" y1="2" x2="12" y2="6" stroke="#94a3b8" strokeWidth="0.75" />
          <line x1="21" y1="7" x2="18" y2="9.5" stroke="#94a3b8" strokeWidth="0.75" />
          <line x1="21" y1="17" x2="18" y2="14.5" stroke="#94a3b8" strokeWidth="0.75" />
          <line x1="12" y1="22" x2="12" y2="18" stroke="#94a3b8" strokeWidth="0.75" />
          <line x1="3" y1="17" x2="6" y2="14.5" stroke="#94a3b8" strokeWidth="0.75" />
          <line x1="3" y1="7" x2="6" y2="9.5" stroke="#94a3b8" strokeWidth="0.75" />
        </svg>
      );

    case 'gold':
    default:
      // 🟡 Emas (Gold) - Embossed Royal Coin
      return (
        <svg {...svgProps}>
          <defs>
            <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="45%" stopColor="#fbbf24" />
              <stop offset="85%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
            <radialGradient id="gold-shine" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#fef9c3" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </radialGradient>
          </defs>
          <circle cx="12" cy="12" r="10" fill="url(#gold-grad)" stroke="#fef08a" strokeWidth="1" />
          <circle cx="12" cy="12" r="7.5" fill="url(#gold-shine)" stroke="#fbbf24" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
          <polygon points="12,7 13.3,10.5 17,10.5 14,12.8 15.2,16.5 12,14.2 8.8,16.5 10,12.8 7,10.5 10.7,10.5" fill="#fef08a" stroke="#d97706" strokeWidth="0.5" />
        </svg>
      );
  }
}

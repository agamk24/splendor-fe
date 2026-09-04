import React, { useState, useEffect } from 'react';

// Scan semua gambar di folder src/assets/nobles/ secara otomatis dengan Vite
const localNobleImages = import.meta.glob('../assets/nobles/*.{jpg,jpeg,png,jfif,webp}', {
  eager: true,
  import: 'default',
});

// Helper untuk memetakan ID bangsawan backend ke nomor urut 1-10
function getNobleIndex(noble, fallbackIndex) {
  if (!noble?.id) return ((fallbackIndex ?? 0) % 10) + 1;
  const id = String(noble.id).toLowerCase();

  const pairMatch = id.match(/noble-pair-(\d+)/);
  if (pairMatch) return parseInt(pairMatch[1], 10); // 1 - 5

  const tripleMatch = id.match(/noble-triple-(\d+)/);
  if (tripleMatch) return 5 + parseInt(tripleMatch[1], 10); // 6 - 10

  const numMatch = id.match(/\d+/);
  if (numMatch) {
    const val = parseInt(numMatch[0], 10);
    return ((val - 1) % 10) + 1;
  }

  return ((fallbackIndex ?? 0) % 10) + 1;
}

// Helper untuk mencari gambar lokal yang dibundle oleh Vite
function findLocalImage(noble, index) {
  const nobleId = noble?.id?.toLowerCase();
  const num = getNobleIndex(noble, index);
  const targetNames = [nobleId, `noble-${num}`, `noble${num}`, String(num), 'noble', 'default'].filter(Boolean);

  for (const [path, moduleUrl] of Object.entries(localNobleImages)) {
    const fileName = path.split('/').pop()?.split('.')[0]?.toLowerCase();
    if (targetNames.includes(fileName)) {
      return moduleUrl;
    }
  }

  // Jika ada gambar bangsawan apa pun di folder src/assets/nobles/, gunakan secara rotasi
  const allImages = Object.values(localNobleImages);
  if (allImages.length > 0) {
    return allImages[(num - 1) % allImages.length];
  }

  return null;
}

/**
 * Komponen NobleIllustration untuk menampilkan potret bangsawan (Noble Tile).
 * Mendukung:
 * 1. Gambar yang dibundle oleh Vite di src/assets/nobles/
 * 2. File statis di public/assets/nobles/ (noble-1.jpg, noble.jpg, dll.)
 * 3. Fallback siluet vektor monarki emas Renaissance (Crown & Robe)
 */
export default function NobleIllustration({ noble, index = 0, className = '', style = {} }) {
  const [loadStage, setLoadStage] = useState(0);

  useEffect(() => {
    setLoadStage(0);
  }, [noble?.id, index]);

  const num = getNobleIndex(noble, index);
  const nobleId = noble?.id || `noble-${num}`;

  // Prioritas 1: Gambar dari bundle Vite
  const bundledSrc = findLocalImage(noble, index);

  // Daftar fallback kandidat path gambar
  const EXTENSIONS = ['jpg', 'jfif', 'png', 'jpeg', 'webp'];
  const staticSources = [];

  if (bundledSrc) {
    staticSources.push(bundledSrc);
  }

  if (noble?.image) {
    staticSources.push(noble.image);
  }

  // Coba /assets/nobles/noble-{num}.ext
  for (const ext of EXTENSIONS) {
    staticSources.push(`/assets/nobles/noble-${num}.${ext}`);
  }

  // Coba /assets/nobles/{nobleId}.ext
  for (const ext of EXTENSIONS) {
    staticSources.push(`/assets/nobles/${nobleId}.${ext}`);
  }

  // Coba /assets/nobles/{num}.ext
  for (const ext of EXTENSIONS) {
    staticSources.push(`/assets/nobles/${num}.${ext}`);
  }

  // Coba gambar umum /assets/nobles/noble.ext
  for (const ext of EXTENSIONS) {
    staticSources.push(`/assets/nobles/noble.${ext}`);
  }

  const currentSrc = staticSources[loadStage];

  const handleError = () => {
    if (loadStage < staticSources.length - 1) {
      setLoadStage((prev) => prev + 1);
    } else {
      setLoadStage(staticSources.length); // Mode fallback vektor
    }
  };

  // Jika masih mencoba memuat URL gambar
  if (currentSrc && loadStage < staticSources.length) {
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
          src={currentSrc}
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
        {/* Gradient overlay agar poin mahkota & syarat permata kontras terbaca */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(15,23,42,0.65) 0%, rgba(15,23,42,0.1) 40%, rgba(15,23,42,0.85) 100%)',
          }}
        />
      </div>
    );
  }

  // Fallback Vektor Tematik: Siluet Potret Bangsawan / Raja / Ratu Renaissance
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
        opacity: 0.22,
        ...style,
      }}
    >
      <svg viewBox="0 0 100 100" width="80%" height="80%" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Lingkaran / Mahkota Bangsawan */}
        <circle cx="50" cy="38" r="16" stroke="#fbbf24" strokeWidth="2.5" />
        <path d="M40 25 L44 31 L50 24 L56 31 L60 25 L58 35 L42 35 Z" fill="#f59e0b" stroke="#f59e0b" />
        {/* Jubah Kebesaran Kerajaan */}
        <path d="M28 85 C32 60 40 55 50 55 C60 55 68 60 72 85" stroke="#f59e0b" strokeWidth="2.5" />
        <path d="M38 65 L50 78 L62 65" stroke="#fbbf24" strokeWidth="1.5" />
        <circle cx="50" cy="74" r="2.5" fill="#fbbf24" />
      </svg>
    </div>
  );
}

// Utility helper untuk definisi warna dan permata Splendor

export const GEM_COLORS = ['white', 'blue', 'green', 'red', 'black'];
export const ALL_GEMS = ['white', 'blue', 'green', 'red', 'black', 'gold'];

export const GEM_METADATA = {
  white: {
    label: 'Diamond',
    indonesian: 'Berlian',
    color: '#ffffff',
    bgColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: '#cbd5e1',
    textColor: '#ffffff',
    glowColor: 'rgba(255, 255, 255, 0.4)',
    symbol: '💎',
  },
  blue: {
    label: 'Sapphire',
    indonesian: 'Safir',
    color: '#38bdf8',
    bgColor: 'rgba(56, 189, 248, 0.2)',
    borderColor: '#0284c7',
    textColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.5)',
    symbol: '🔷',
  },
  green: {
    label: 'Emerald',
    indonesian: 'Zamrud',
    color: '#34d399',
    bgColor: 'rgba(52, 211, 153, 0.2)',
    borderColor: '#059669',
    textColor: '#34d399',
    glowColor: 'rgba(52, 211, 153, 0.5)',
    symbol: '🟢',
  },
  red: {
    label: 'Ruby',
    indonesian: 'Rubi',
    color: '#f87171',
    bgColor: 'rgba(248, 113, 113, 0.2)',
    borderColor: '#dc2626',
    textColor: '#f87171',
    glowColor: 'rgba(248, 113, 113, 0.5)',
    symbol: '🔴',
  },
  black: {
    label: 'Onyx',
    indonesian: 'Oniks',
    color: '#94a3b8',
    bgColor: 'rgba(30, 41, 59, 0.8)',
    borderColor: '#475569',
    textColor: '#cbd5e1',
    glowColor: 'rgba(148, 163, 184, 0.3)',
    symbol: '⚫',
  },
  gold: {
    label: 'Gold',
    indonesian: 'Emas',
    color: '#fbbf24',
    bgColor: 'rgba(251, 191, 36, 0.25)',
    borderColor: '#d97706',
    textColor: '#fbbf24',
    glowColor: 'rgba(251, 191, 36, 0.6)',
    symbol: '🟡',
  },
};

// Normalisasi nama warna (misal sapphire -> blue, diamond -> white)
export const normalizeColor = (color) => {
  if (!color) return 'white';
  const c = color.toLowerCase();
  if (c === 'diamond') return 'white';
  if (c === 'sapphire') return 'blue';
  if (c === 'emerald') return 'green';
  if (c === 'ruby') return 'red';
  if (c === 'onyx') return 'black';
  if (c === 'yellow') return 'gold';
  return c;
};

// Kebalikan normalizeColor: nama UI -> nama resmi backend.
// Backend memakai emerald/sapphire/ruby/diamond/onyx, bukan warna.
const SERVER_COLOR_BY_UI = {
  white: 'diamond',
  blue: 'sapphire',
  green: 'emerald',
  red: 'ruby',
  black: 'onyx',
  gold: 'gold',
};

export const toServerColor = (color) => {
  if (!color) return null;
  const c = String(color).toLowerCase();
  return SERVER_COLOR_BY_UI[c] || c;
};

/**
 * Ubah objek berkunci warna UI menjadi berkunci warna backend.
 * Entri bernilai 0 dibuang agar payload tetap ramping.
 */
export const toServerTokenMap = (tokensByUiColor) => {
  const result = {};
  Object.entries(tokensByUiColor || {}).forEach(([uiColor, count]) => {
    if (!count) return;
    result[toServerColor(uiColor)] = count;
  });
  return result;
};

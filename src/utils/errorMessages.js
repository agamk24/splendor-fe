// Backend mengirim kode error stabil (bukan kalimat) lewat event `action_error`.
// Sumber: splendor-be/src/socket/errors.ts dan splendor-be/src/engine/errors.ts

export const ERROR_MESSAGES = {
  // Room / lobby
  INVALID_PAYLOAD: 'Data yang dikirim tidak valid.',
  NAME_REQUIRED: 'Nama wajib diisi (maksimal 20 karakter).',
  ROOM_NOT_FOUND: 'Room tidak ditemukan.',
  ROOM_FULL: 'Room sudah penuh (maksimal 4 pemain).',
  ROOM_ALREADY_STARTED: 'Game di room ini sudah dimulai.',
  GAME_NOT_STARTED: 'Game belum dimulai.',
  NAME_TAKEN: 'Nama tersebut sudah dipakai di room ini.',
  NOT_HOST: 'Hanya host yang dapat memulai game.',
  NOT_ENOUGH_PLAYERS: 'Membutuhkan minimal 2 pemain untuk memulai.',
  NOT_IN_ROOM: 'Anda tidak terdaftar di room ini.',
  NO_SUCH_PLAYER: 'Pemain dengan nama tersebut tidak ada di room ini.',
  ALREADY_CONNECTED: 'Kursi ini sedang dipakai koneksi lain.',

  // Giliran / fase
  GAME_NOT_PLAYING: 'Game sedang tidak berjalan.',
  NOT_YOUR_TURN: 'Bukan giliran Anda.',
  UNKNOWN_PLAYER: 'Pemain tidak dikenali.',
  UNKNOWN_ACTION: 'Aksi tidak dikenali.',
  NOT_IMPLEMENTED: 'Aksi ini belum tersedia.',

  // Fase buang token
  DISCARD_REQUIRED: 'Ada pemain yang harus membuang token dulu.',
  NO_DISCARD_PENDING: 'Tidak ada token yang perlu dibuang.',
  DISCARD_WRONG_AMOUNT: 'Jumlah token yang dibuang tidak tepat.',
  DISCARD_TOKENS_NOT_HELD: 'Anda tidak memiliki token sebanyak itu.',

  // Ambil token
  INVALID_COLOR: 'Warna permata tidak valid.',
  NEED_THREE_DISTINCT_COLORS: 'Harus tepat 3 permata dengan warna berbeda.',
  COLOR_NOT_AVAILABLE: 'Stok permata di bank habis.',
  NOT_ENOUGH_IN_BANK_FOR_TWO: 'Ambil 2 warna sama butuh minimal 4 di bank.',

  // Reservasi
  RESERVE_LIMIT_REACHED: 'Reservasi penuh (maksimal 3 kartu).',
  DECK_EMPTY: 'Tumpukan kartu tier ini sudah habis.',
  CARD_NOT_ON_TABLE: 'Kartu tidak ada di meja.',
  INVALID_TIER: 'Tier kartu tidak valid.',

  // Pembelian
  CARD_NOT_FOUND: 'Kartu tidak ditemukan.',
  CARD_NOT_RESERVED: 'Kartu itu tidak ada di reservasi Anda.',
  INSUFFICIENT_RESOURCES: 'Sumber daya tidak mencukupi untuk membeli kartu ini.',
};

export const translateError = (code) => {
  if (!code) return 'Terjadi kesalahan yang tidak diketahui.';
  return ERROR_MESSAGES[code] || code;
};

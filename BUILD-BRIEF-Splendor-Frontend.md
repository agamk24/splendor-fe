# Build Brief — Splendor Web Game (FRONTEND)

Dokumen ini ditujukan untuk dieksekusi oleh coding agent. khusus untuk bagian **frontend**. Backend dibangun terpisah (lihat `BUILD-BRIEF-Splendor-Backend.md`) — frontend ini hanya perlu tahu kontrak event Socket.IO di bagian bawah dokumen ini, tidak perlu tahu detail implementasi backend.

## Tech Stack

- React (Vite)
- Zustand (state management)
- socket.io-client
- react-router-dom
- Tidak ada login/akun. Tidak ada mode vs AI/bot.

## Struktur Folder Target

```
/client
  /src
    /pages
      Landing.jsx
      Room.jsx
    /components
      BoardBank.jsx
      CardTable.jsx
      NobleRow.jsx
      PlayerPanel.jsx
      Lobby.jsx
      EndGameScreen.jsx
    /store
      gameStore.js     (zustand)
    /socket
      socketClient.js
    App.jsx
    main.jsx
  package.json
  .env (VITE_SERVER_URL=<url backend>)
```

## FASE 1 — Setup & Koneksi Socket

1. Init project Vite + React, install `zustand`, `socket.io-client`, `react-router-dom`.
2. `socketClient.js` — inisialisasi koneksi Socket.IO sekali (baca URL dari `import.meta.env.VITE_SERVER_URL`), expose helper `emit(event, payload)` dan fungsi untuk register listener.
3. `gameStore.js` (Zustand) — state yang disimpan:
   - `roomId`, `myName`, `mySocketId`
   - `players[]` (dari `player_list_update`)
   - `gameState` (dari `state_update`, ini adalah sumber kebenaran utama untuk render board)
   - `lastError` (dari `action_error`)
   - Register semua listener socket di satu tempat (mis. saat store diinisialisasi atau di `App.jsx`), update field terkait setiap event masuk.

## FASE 2 — Landing & Routing

4. Setup routing: `/` → `Landing.jsx`, `/room/:roomId` → `Room.jsx`.
5. `Landing.jsx`:
   - Form input nama tampilan
   - Tombol "Create Room" → emit `create_room {name}`, saat terima `room_created {roomId}` → simpan `myName` & `roomId` ke `sessionStorage`, redirect ke `/room/:roomId`
   - Input kode room + tombol "Join Room" → emit `join_room {roomId, name}`, saat terima `room_joined` → simpan ke `sessionStorage`, redirect ke `/room/:roomId`
   - Tampilkan error jika room tidak ditemukan/penuh/sudah mulai

## FASE 3 — Lobby & Room Container

6. `Room.jsx`:
   - Saat mount: jika `sessionStorage` punya `roomId`+`myName` yang cocok dengan URL, emit `rejoin_room {roomId, name}` (untuk handle refresh)
   - Render berdasarkan `gameState.status`:
     - `waiting` → render `Lobby.jsx`
     - `playing` → render board (BoardBank, CardTable, NobleRow, PlayerPanel)
     - `finished` → render `EndGameScreen.jsx`
7. `Lobby.jsx` — tampilkan daftar pemain yang sudah join (dari `players[]`), tombol "Start Game" hanya muncul untuk host dan aktif jika pemain >= 2. Emit `start_game {roomId}` saat diklik.

## FASE 4 — Game Board Components

8. `BoardBank.jsx` — render token bank dari `gameState.bank`. Klik token untuk memilih (state lokal komponen ini untuk seleksi sementara, sesuai aturan: maks 3 warna beda ATAU 2 warna sama). Tombol "Confirm" mengirim `player_action {roomId, action:{type:'take_tokens', ...}}`.
9. `CardTable.jsx` — render `gameState.tableCards` (tier 1-3) + jumlah sisa `decks` per tier. Klik kartu memunculkan opsi "Beli" / "Reservasi" → emit `player_action` dengan `type:'buy_card'` atau `type:'reserve_card'`.
10. `NobleRow.jsx` — render `gameState.nobles` yang tersedia di meja.
11. `PlayerPanel.jsx` (satu untuk tiap pemain di `gameState.players`):
    - Token yang dimiliki
    - Kartu dimiliki, dikelompokkan per warna bonus
    - Kartu reservasi (detail biaya hanya terlihat untuk pemilik sendiri; pemain lain hanya lihat jumlah reservasi + indikator "reserved")
    - Total poin
    - Highlight visual jika `gameState.currentPlayerIndex` menunjuk ke pemain ini
    - Indikator "disconnected" jika data pemain menunjukkan `connected:false`
12. Tampilkan `lastError` dari store sebagai toast/alert sementara (auto-hide setelah beberapa detik) saat `action_error` diterima.

## FASE 5 — End Game & Polish

13. `EndGameScreen.jsx` — tampilkan ranking akhir semua pemain (urut poin, tie-break jumlah kartu), tombol "Kembali ke Beranda" → clear `sessionStorage`, redirect ke `/`.
14. Pastikan UI dasar sudah responsif untuk layar sempit (mobile browser) — minimal papan tidak overflow horizontal tanpa scroll.

## Definition of Done

- Fase 1-2: bisa create room & join room dari 2 tab browser berbeda, keduanya masuk ke halaman room yang sama.
- Fase 3: Lobby menampilkan pemain real-time saat ada yang join/leave, host bisa start game.
- Fase 4: board render sesuai `state_update`, aksi (ambil token/beli/reservasi) berhasil terkirim dan ter-update di semua tab.
- Fase 5: game bisa dimainkan sampai selesai dan menampilkan hasil akhir; refresh salah satu tab di tengah game tetap bisa lanjut main (rejoin berhasil).

## Kontrak Event Socket.IO dengan Backend (jangan diubah sepihak)

**Emit dari client ke server:**

- `create_room {name}`
- `join_room {roomId, name}`
- `start_game {roomId}`
- `player_action {roomId, action}` — bentuk `action` disesuaikan dengan jenis aksi (`take_tokens`, `buy_card`, `reserve_card`, `discard_tokens`)
- `rejoin_room {roomId, name}`

**Diterima dari server:**

- `room_created {roomId}`
- `room_joined {roomId, players}`
- `player_list_update {players}`
- `game_started {gameState}`
- `state_update {gameState}` — sumber kebenaran utama untuk render board
- `action_error {message}`

## Batasan Eksplisit

- Tidak ada mode vs AI/bot.
- Tidak ada login/akun.
- Tidak ada chat, animasi kompleks, atau sound di versi ini — fokus hanya core gameplay loop multiplayer.

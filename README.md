# Splendor Web Game — Frontend Client

Frontend web game multiplayer untuk board game **Splendor**, dibangun menggunakan **React (Vite)**, **Zustand**, **Socket.IO Client**, dan **React Router**.

---

## 🎮 Fitur Utama

- **Fase 1 (Setup & Koneksi Socket)**: Inisialisasi Vite + React, singleton Socket.IO client, global store Zustand untuk sinkronisasi state real-time.
- **Fase 2 (Landing & Routing)**: Formulir input nama, tombol Buat Room & Gabung Room, navigasi URL `/room/:roomId`, notifikasi error jika room tidak ditemukan/penuh.
- **Fase 3 (Lobby & Auto Rejoin)**: Daftar pemain real-time di Lobby, deteksi Host, tombol _Start Game_ (minimal 2 pemain), dan penanganan _auto-rejoin_ saat tab di-refresh.
- **Fase 4 (Game Board Components)**:
  - `BoardBank`: Pemilihan token bank sesuai aturan Splendor (maksimal 3 warna berbeda atau 2 warna sama jika stok >= 4).
  - `CardTable`: 3 tingkat tier kartu perkembangan dengan indikator kartu yang mampu dibeli (_affordable_) serta modal aksi Beli dan Reservasi.
  - `NobleRow`: Ubin bangsawan dengan persyaratan bonus kartu.
  - `PlayerPanel`: Status pemain, token, diskon bonus kartu, privasi kartu reservasi, dan highlight giliran aktif.
  - `ToastAlert`: Notifikasi error otomatis (_auto-hide_ dalam 4 detik).
  - Modal buang token jika total token melebihi 10.
- **Fase 5 (End Game & Responsivitas)**:
  - `EndGameScreen`: Pengumuman pemenang dan klasemen akhir dengan aturan _tie-break_ resmi (kartu paling sedikit).
  - Desain responsif untuk layar ponsel/tablet tanpa _horizontal overflow_.

---

## 🛠️ Tech Stack

- **React 18** (Vite)
- **Zustand** (State Management)
- **Socket.IO Client**
- **React Router DOM v6**
- **Vanilla CSS** (Dark / Gem Theme)

---

## 🚀 Cara Menjalankan

### 1. Install Dependensi

```bash
npm install
```

### 2. Jalankan Mock Server (Opsional, jika backend belum siap)

Aplikasi dilengkapi dengan mock backend Socket.IO lokal untuk testing multiplayer:

```bash
npm run mock-server
```

Server dummy akan aktif di `http://localhost:3000`.

### 3. Jalankan Frontend

```bash
npm run dev
```

Buka browser di [http://localhost:5173](http://localhost:5173).

---

## 📁 Struktur Folder

```
/
├── mock-server.cjs          # Mock server Socket.IO untuk pengujian
├── index.html
├── package.json
├── vite.config.js
├── .env.example
└── src/
    ├── App.jsx              # Routing & inisialisasi socket
    ├── main.jsx
    ├── index.css            # Styling responsif bertema permata
    ├── pages/
    │   ├── Landing.jsx      # Halaman utama (Create / Join Room)
    │   └── Room.jsx         # Container Lobby & Papan Permainan
    ├── components/
    │   ├── BoardBank.jsx    # Bank token permata
    │   ├── CardTable.jsx    # Meja kartu Tier 1 - 3 & tumpukan deck
    │   ├── NobleRow.jsx     # Ubin bangsawan
    │   ├── PlayerPanel.jsx  # Status pemain, token & kartu reservasi
    │   ├── Lobby.jsx        # Ruang tunggu sebelum game dimulai
    │   ├── EndGameScreen.jsx# Layar klasemen akhir
    │   └── ToastAlert.jsx   # Banner error mengambang auto-hide
    ├── socket/
    │   └── socketClient.js  # Singleton Socket.IO client
    ├── store/
    │   └── gameStore.js     # Zustand store & socket event listeners
    └── utils/
        └── gemUtils.js      # Metadata permata, warna, dan ikon
```

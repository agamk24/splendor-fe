# Direktori Ilustrasi Kartu Perkembangan Splendor

Taruh aset gambar kartu Anda di folder ini (`public/assets/cards/`).
Vite akan otomatis menyediakannya di root `/assets/cards/`.

Komponen `CardIllustration.jsx` mendukung 3 metode pemuatan fleksibel (fallback bertingkat):

---

### Cukup Sediakan 5 File Gambar di Folder Ini:

Sistem dikonfigurasi untuk menggunakan **Opsi B (Ilustrasi Berdasarkan Warna Permata Bonus)**. Anda hanya perlu menyiapkan 5 file:

1. **`diamond.jfif`** (atau `white.jfif` / `.png` / `.jpg` / `.webp`) — Untuk kartu berbonus Berlian Putih
2. **`sapphire.jfif`** (atau `blue.jfif` / `.png` / `.jpg` / `.webp`) — Untuk kartu berbonus Safir Biru
3. **`emerald.jfif`** (atau `green.jfif` / `.png` / `.jpg` / `.webp`) — Untuk kartu berbonus Zamrud Hijau
4. **`ruby.jfif`** (atau `red.jfif` / `.png` / `.jpg` / `.webp`) — Untuk kartu berbonus Rubi Merah
5. **`onyx.jfif`** (atau `black.jfif` / `.png` / `.jpg` / `.webp`) — Untuk kartu berbonus Oniks Hitam

---

### Catatan Penting:

- **Format `.jfif` langsung didukung:** Tidak perlu convert atau rename.
- **Rasio yang disarankan:** Portrait ~ 2:3 atau 3:4 (contoh: 300x420 px).
- **Fallback Otomatis:** Jika salah satu file belum ada, kartu tetap aman menampilkan siluet vektor Renaissance built-in tanpa error atau icon rusak.

---

### Catatan Keterbacaan & Fallback:

- Jika folder ini kosong, sistem secara otomatis menampilkan **siluet vektor tematik Renaissance built-in** (tanpa error, tanpa icon gambar rusak).
- Teks poin prestise dan token biaya di kartu sudah dilapisi drop-shadow & kontras tinggi sehingga tetap terbaca jelas di atas gambar apa pun.
- Disarankan rasio gambar portrait ~ 2:3 atau 3:4 (misal: 300x420 px).

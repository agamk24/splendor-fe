# Direktori Ilustrasi Kartu Bangsawan (Noble Tiles)

Taruh aset gambar kartu bangsawan di folder ini (`public/assets/nobles/` atau `src/assets/nobles/`).

Komponen `NobleIllustration.jsx` mendukung format `.jpg`, `.jfif`, `.png`, dan `.webp`.

---

### Opsi Penamaan File:

#### Opsi 1: Cukup 1 Gambar Umum untuk Semua Bangsawan

Jika Anda memiliki 1 gambar potret bangsawan Renaissance:

- Beri nama: **`noble.jpg`** (atau `.jfif` / `.png` / `.webp`)
- Semua kartu bangsawan akan otomatis menampilkan gambar ini!

#### Opsi 2: Gambar per Bangsawan (1 s/d 10)

Jika Anda memiliki potret berbeda untuk masing-masing bangsawan (di Splendor ada 10 bangsawan sejarah Renaissance):

- `noble-1.jpg`
- `noble-2.jpg`
- `noble-3.jpg`
- `noble-4.jpg`
- `noble-5.jpg`
- `noble-6.jpg`
- `noble-7.jpg`
- `noble-8.jpg`
- `noble-9.jpg`
- `noble-10.jpg`

_(Bisa juga dinamai angka saja: `1.jpg`, `2.jpg`, dst.)_

---

### Catatan:

- **Fallback Vektor Otomatis:** Jika folder ini belum berisi gambar, kartu bangsawan otomatis menampilkan siluet vektor Monarki Emas Kerajaan (mahkota dan jubah emas) secara elegan.
- **Keterbacaan:** Nilai poin mahkota dan kotak syarat permata sudah dilapisi z-index dan drop shadow kontras tinggi.

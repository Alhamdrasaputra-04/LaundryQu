# LaundryKu — Aplikasi Manajemen Laundry & Pelacakan Status Cucian

Prototipe aplikasi web manajemen laundry modern untuk pengelolaan transaksi, pelanggan, layanan, pembayaran, dan pelacakan status cucian secara real-time.

## 🚀 Fitur Utama

- **Desain Split-Screen Modern**: Halaman Login & Registrasi responsif dengan palet warna terpadu (*Warm Orange* `#EB7F31` & *Golden Amber* `#FCAD38`).
- **Dashboard Operasional Laundry**:
  - 4 Kartu Metrik Harian (Transaksi Hari Ini, Pendapatan, Sedang Diproses, Siap Diambil).
  - Grafik Perkembangan Pendapatan (Line Chart) filter 7 hari & 30 hari.
  - Distribusi Status Cucian (Donut Chart).
  - Pemantauan Cucian Perlu Perhatian (Siap diambil / mendekati tenggat).
  - Tabel Transaksi Terbaru lengkap dengan filter status dan pencarian interaktif.
  - Modal Tambah Transaksi dengan kalkulasi total harga otomatis.
- **Dukungan Multi-Role (Admin & User)**:
  - Jalur Admin: Pengelolaan operasional dan kasir laundry.
  - Jalur Pelanggan: Pelacakan tahapan cucian secara real-time (*Baru Masuk ➔ Dicuci ➔ Dikeringkan ➔ Disetrika ➔ Siap Diambil ➔ Selesai*).
- **Integrasi Cloud**: Disiapkan untuk terhubung dengan database Supabase.

## 📁 Struktur File

```
├── Login.html           # Halaman login utama (Split-Screen)
├── index.html           # Entry point aplikasi / root
├── login.css            # Styling halaman login & registrasi
├── login.js             # Logika autentikasi dan validasi login
├── register.html        # Halaman pendaftaran akun pengguna
├── register.js          # Logika pendaftaran pengguna
├── dashboard.html       # Halaman dashboard admin laundry
├── dashboard.css        # Styling dashboard terpadu
├── dashboard.js         # Logika dashboard, grafik chart, & data transaksi
├── assets/
│   └── login-hero.jpg   # Aset ilustrasi visual 3D laundry
├── LAUNDRY_APP_DEVELOPMENT_PLAN.md  # Dokumen rencana induk pengembangan
└── AUTH_ROLE_BASED_PLAN.md         # Dokumen rencana autentikasi multi-role
```

## 🛠️ Menjalankan di Lokal

1. Clone repositori:
   ```bash
   git clone https://github.com/Alhamdrasaputra-04/LaundryQu.git
   ```
2. Buka folder dan jalankan web server:
   ```bash
   npm run dev
   ```
   Atau cukup buka file `Login.html` langsung di browser Anda.

## 👤 Akun Demo
- **Email/Username**: `demo`
- **Password**: `demo`

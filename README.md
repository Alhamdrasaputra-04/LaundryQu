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
├── login.js             # Logika autentikasi dan validasi login (Multi-Role)
├── register.html        # Halaman pendaftaran akun pengguna
├── register.js          # Logika pendaftaran pengguna
├── dashboard.html       # Halaman dashboard admin laundry (Kasir & Operasional)
├── dashboard.css        # Styling dashboard admin
├── dashboard.js         # Logika dashboard admin, grafik chart, & data transaksi
├── dashboard-user.html  # Halaman portal pelanggan (Live Tracking & Struk Digital)
├── dashboard-user.css   # Styling portal pelanggan responsif
├── dashboard-user.js    # Logika pelacakan cucian, riwayat, & struk pelanggan
├── supabaseClient.js    # Konektor database Supabase & Autentikasi multi-role
├── assets/
│   └── login-hero.jpg   # Aset ilustrasi visual 3D laundry
├── MASTER_DOCUMENTATION.md # Dokumen terpadu induk (Frontend & Backend terintegrasi)
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

## 👤 Akun Demo Uji Coba
- **Mode Admin (Pengelola / Kasir)**:
  - Username: `admin` (atau `demo`)
  - Password: `admin123` (atau `demo`)
  - Halaman tujuan: `dashboard.html`
- **Mode Pelanggan (User Tracking)**:
  - Email/Username: `budi@gmail.com` (atau `budi`)
  - Password: `budi123`
  - Halaman tujuan: `dashboard-user.html`

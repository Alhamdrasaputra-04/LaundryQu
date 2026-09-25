# 🧺 MASTER DOKUMENTASI TERPADU SISTEM LAUNDRYKU
> **Dokumen Tunggal Terintegrasi (*Single Source of Truth*)**  
> Menggabungkan seluruh spesifikasi dari: `README.md`, `Alur.md`, `LAUNDRY_APP_DEVELOPMENT_PLAN.md`, `AUTH_ROLE_BASED_PLAN.md`, dan `NOTES.md`.

---

## 📑 DAFTAR ISI
1. [Ringkasan Proyek & Panduan Penggunaan](#1-ringkasan-proyek--panduan-penggunaan)
2. [Peta Batas Arsitektur (Frontend vs Backend)](#2-peta-batas-arsitektur-frontend-vs-backend)
3. [BAGIAN 1: FRONTEND (Tampilan, UI/UX & Interaksi Klien)](#bagian-1-frontend-tampilan-uiux--interaksi-klien)
   - 3.1. [Design System & Estetika Antarmuka](#31-design-system--estetika-antarmuka)
   - 3.2. [Struktur Halaman & Komponen Frontend](#32-struktur-halaman--komponen-frontend)
   - 3.3. [Dashboard Pengelola / Admin (`dashboard.html`)](#33-dashboard-pengelola--admin-dashboardhtml)
   - 3.4. [Dashboard Khusus Pelanggan (`dashboard-user.html`)](#34-dashboard-khusus-pelanggan-dashboard-userhtml)
   - 3.5. [Komponen Pelacakan Visual (Live Tracking Timeline)](#35-komponen-pelacakan-visual-live-tracking-timeline)
   - 3.6. [Logika & Keamanan Sisi Klien (Client-Side Guards & State)](#36-logika--keamanan-sisi-klien-client-side-guards--state)
4. [BAGIAN 2: BACKEND, DATABASE & DATA LOGIC (Sisi Server & Penyimpanan)](#bagian-2-backend-database--data-logic-sisi-server--penyimpanan)
   - 4.1. [Desain Skema Database (Supabase PostgreSQL)](#41-desain-skema-database-supabase-postgresql)
   - 4.2. [Row Level Security (RLS) & Proteksi Data Server](#42-row-level-security-rls--proteksi-data-server)
   - 4.3. [Business Logic & Aturan Kalkulasi Data (Backend Rules)](#43-business-logic--aturan-kalkulasi-data-backend-rules)
   - 4.4. [Mesin Transisi Status Cucian (State Machine)](#44-mesin-transisi-status-cucian-state-machine)
   - 4.5. [Konektor Data & Adapter Cloud (`supabaseClient.js`)](#45-konektor-data--adapter-cloud-supabaseclientjs)
5. [BAGIAN 3: ALUR SISTEM END-TO-END (Integrasi Frontend & Backend)](#bagian-3-alur-sistem-end-to-end-integrasi-frontend--backend)
   - 5.1. [Alur Autentikasi Multi-Role & Routing](#51-alur-autentikasi-multi-role--routing)
   - 5.2. [Alur Operasional Kasir & Pengelolaan Transaksi](#52-alur-operasional-kasir--pengelolaan-transaksi)
   - 5.3. [Alur Pelacakan Cucian oleh Pelanggan](#53-alur-pelacakan-cucian-oleh-pelanggan)
6. [BAGIAN 4: ROADMAP, SCOPE & KETENTUAN PENGEMBANGAN](#bagian-4-roadmap-scope--ketentuan-pengembangan)
   - 6.1. [Scope Proyek (In Scope vs Out of Scope)](#61-scope-proyek-in-scope-vs-out-of-scope)
   - 6.2. [Fitur Berdasarkan Prioritas (Must, Should, Could Have)](#62-fitur-berdasarkan-prioritas-must-should-could-have)
   - 6.3. [Roadmap Pengembangan Bertahap (Phase 1 – Phase 6)](#63-roadmap-pengembangan-bertahap-phase-1--phase-6)
   - 6.4. [Definition of Done (DoD)](#64-definition-of-done-dod)
   - 6.5. [Aturan Rekayasa untuk AI & Pengembang (Rules for Antigravity)](#65-aturan-rekayasa-untuk-ai--pengembang-rules-for-antigravity)
7. [BAGIAN 5: CATATAN HARIAN & LOG IMPLEMENTASI (NOTES)](#bagian-5-catatan-harian--log-implementasi-notes)

---

## 1. Ringkasan Proyek & Panduan Penggunaan

**LaundryKu** adalah prototipe aplikasi web manajemen laundry modern yang memadukan pengelolaan operasional kasir (untuk pemilik/admin) dan pelacakan status pengerjaan cucian secara *real-time* (untuk pelanggan).

### 🎯 Nilai Tambah (*Value Proposition*)
> *"Aplikasi LaundryKu tidak hanya membantu pengelola mencatat transaksi cucian secara efisien, namun juga meningkatkan transparansi serta kenyamanan pelanggan melalui pelacakan tahapan cucian secara langsung (*live tracking*), estimasi waktu selesai yang akurat, dan pengingat cucian siap diambil."*

### 🛠️ Cara Menjalankan di Komputer Lokal
1. **Buka folder proyek** di terminal / command prompt.
2. Jalankan server lokal:
   ```bash
   npm run dev
   ```
   *Atau cukup klik dua kali dan buka file [Login.html](file:///d:/KULIAH/Login/Login.html) langsung pada web browser Anda.*
3. **Akun Pengujian Demo (Cepat):**
   - **Mode Admin (Pengelola):** Email/Username: `admin` (atau `demo`), Password: `admin123` (atau `demo`)  
     ➔ Diarahkan ke [dashboard.html](file:///d:/KULIAH/Login/dashboard.html)
   - **Mode User (Pelanggan):** Email/Username: `budi@gmail.com` (atau `budi`), Password: `budi123`  
     ➔ Diarahkan ke [dashboard-user.html](file:///d:/KULIAH/Login/dashboard-user.html)

---

## 2. Peta Batas Arsitektur (Frontend vs Backend)

Tabel berikut memberikan **garis batas tegas** pemisahan tanggung jawab antara komponen Frontend dan Backend dalam sistem LaundryKu:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ARSITEKTUR SISTEM LAUNDRYKU                           │
├───────────────────────────────────────┬─────────────────────────────────────────┤
│         🎨 SISI FRONTEND              │          ⚙️ SISI BACKEND & DATABASE      │
│     (Antarmuka, Klien & Visual)       │        (Server, Storage & Logika Data)  │
├───────────────────────────────────────┼─────────────────────────────────────────┤
│ • Desain Visual, CSS & Layout         │ • Skema Database PostgreSQL (Supabase)  │
│ • Halaman HTML (Admin & Pelanggan)    │ • Autentikasi Pengguna & Enkripsi       │
│ • Validasi Form Klien (Login/Reg)     │ • Row Level Security (RLS Policies)     │
│ • Grafik Chart.js (Line & Donut)      │ • Business Logic (Kalkulasi & Audit)    │
│ • Widget Live Tracking Timeline       │ • State Machine Transisi Status Cucian  │
│ • Client Session Storage & Guard      │ • Algoritma Estimasi Jam Selesai        │
│ • Interaksi DOM & Feedback Toast      │ • REST API / Supabase Client SDK        │
└───────────────────────────────────────┴─────────────────────────────────────────┘
```

| Domain | Frontend (Client-Side) | Backend & Database (Server-Side) |
|---|---|---|
| **Teknologi** | HTML5, CSS3 murni, Vanilla JavaScript, Chart.js | Supabase (PostgreSQL), Supabase Auth, Row Level Security, SQL Triggers |
| **Penyimpanan Data** | `localStorage` (`laundrySession`, `laundry_transactions` fallback) | Database PostgreSQL di Supabase Cloud (tabel `profiles`, `transaksi`, `layanan`, `pelanggan`, `riwayat_status`) |
| **Keamanan** | Navigasi halaman, redirect sesi login (`authGuard.js`), validasi tipe file/input form | Verifikasi kredensial autentikasi, hashing password, RLS (mencegah user membaca data transaksi orang lain) |
| **Kalkulasi Bisnis** | Menampilkan total harga di kasir saat input berat secara dinamis (*preview*) | Menyimpan nominal mutlak total bayar, menghitung rekap agregasi harian/bulanan di database |
| **Representasi Status**| Timeline visual berwarna, badge status (*Baru Masuk*, *Dicuci*, *Siap Diambil*, *Selesai*) | State validasi transisi status, pencatatan waktu riwayat log pengerjaan (*timestamp audit trail*) |

---

## ═══════════════════════════════════════════════════════════════
## BAGIAN 1: FRONTEND (Tampilan, UI/UX & Interaksi Klien)
## ═══════════════════════════════════════════════════════════════

Bagian ini mencakup seluruh kode, tampilan, layout, serta interaksi pengguna di sisi browser.

### 3.1. Design System & Estetika Antarmuka
Frontend LaundryKu dirancang dengan estetika modern, responsif, dan profesional:
- **Palet Warna Utama:**
  - *Warm Orange* (`#EB7F31`): Warna aksen interaktif, tombol aksi utama, dan brand identitas.
  - *Golden Amber* (`#FCAD38`): Warna gradient pendukung, badge status cucian berjalan.
  - *Primary Dark / Navy* (`#1E293B`): Teks utama, judul, dan struktur kontras tinggi.
  - *Background Soft* (`#F8FAFC`): Latar belakang halaman bersih dan nyaman dipandang.
  - *Border & Divider* (`#E2E8F0`): Garis pembatas kartu yang halus.
  - *Status Colors*: Sukses/Lunas (`#10B981`), Berjalan/Proses (`#3B82F6`), Menunggu/Perhatian (`#F59E0B`), Batal (`#EF4444`).
- **Prinsip UI:**
  - *Card Radius*: 10–12px dengan bayangan (*box-shadow*) halus.
  - *Typography*: Bersih dan modern (Inter / Outfit / Segoe UI).
  - *Responsiveness*: Optimal di 4 ukuran layar (Desktop, Laptop, Tablet, Mobile).
  - *Layar Kecil (Mobile)*: Sidebar otomatis beralih menjadi drawer/hamburger navigation, tabel mendukung horizontal scroll, kartu metrik menjadi 1–2 kolom.

---

### 3.2. Struktur Halaman & Komponen Frontend
Sistem terdiri dari file-file antarmuka sebagai berikut:

```text
Frontend/
├── Login.html           # Halaman login utama (Split-Screen Modern)
├── register.html        # Halaman registrasi akun baru
├── login.css            # Desain split-screen login & registrasi
├── login.js             # Logika interaktif validasi login
├── register.js          # Logika validasi registrasi
├── dashboard.html       # Dashboard operasional admin/pengelola
├── dashboard.css        # Desain layout dashboard admin terpadu
├── dashboard.js         # Logika grafik Chart.js & filter transaksi admin
├── dashboard-user.html  # Dashboard khusus pelanggan (Live Tracking)
├── pelanggan.html/.js   # Antarmuka manajemen master pelanggan
├── transaksi.html/.js   # Antarmuka kasir & daftar transaksi lengkap
├── cucian.html/.js      # Antarmuka update tahapan pengerjaan cucian
├── pembayaran.html/.js  # Antarmuka kasir pembayaran & nota digital
├── laporan.html/.js     # Antarmuka rekapitulasi omset & laporan
└── pengaturan.html/.js  # Antarmuka profil & setting tarif laundry
```

---

### 3.3. Dashboard Pengelola / Admin (`dashboard.html`)
Dirancang untuk efisiensi kerja kasir dan pemilik laundry:
1. **Header:**
   - Salam sambutan, indikator profil aktif, tombol notifikasi, dan tombol cepat **`+ Tambah Transaksi`**.
2. **4 Kartu Ringkasan (Summary Cards):**
   - **Transaksi Hari Ini**: Total volume transaksi masuk hari ini.
   - **Pendapatan Hari Ini**: Total omset rupiah transaksi hari ini.
   - **Sedang Diproses**: Jumlah cucian yang belum mencapai tahap akhir.
   - **Siap Diambil**: Jumlah cucian yang siap diserahkan kepada pelanggan.
3. **Analitik Visual:**
   - **Grafik Pendapatan (Line Chart)**: Dilengkapi filter waktu (7 Hari Terakhir & 30 Hari Terakhir).
   - **Distribusi Status Cucian (Donut Chart)**: Menampilkan proporsi status cucian saat ini.
4. **Widget Cucian Perlu Perhatian:**
   - Daftar cucian yang sudah siap diambil, mendekati estimasi batas waktu (*deadline*), atau terlambat diambil.
5. **Tabel Transaksi Terbaru:**
   - Menampilkan 5–10 transaksi paling baru lengkap dengan badge status pengerjaan, status bayar (Lunas/Belum), search bar, dan filter kategori.
6. **Modal Kasir Tambah Transaksi:**
   - Form input: Pilih Pelanggan ➔ Pilih Layanan ➔ Masukkan Berat (Kg/Pcs) ➔ Perhitungan Total Otomatis ➔ Tombol Simpan Transaksi.

---

### 3.4. Dashboard Khusus Pelanggan (`dashboard-user.html`)
Dirancang sederhana, berfokus pada pengalaman dan transparansi pelanggan (*customer centric*):
1. **Header Pelanggan:**
   - *"Halo, [Nama Pelanggan] 👋"*
   - Tombol bantuan cepat: Terhubung langsung ke WhatsApp admin laundry.
2. **Summary Cards Pelanggan:**
   - **Cucian Aktif**: Jumlah cucian pelanggan yang sedang dicuci/diproses.
   - **Siap Diambil**: Pemberitahuan jika pakaian sudah bersih dan siap diambil di outlet.
   - **Tagihan Belum Lunas**: Rincian biaya yang perlu diselesaikan.
3. **Riwayat Cucian Saya:**
   - Tabel riwayat berisi nomor nota, tanggal masuk, paket cucian, biaya, status, serta tombol download/buka **Struk Digital**.

---

### 3.5. Komponen Pelacakan Visual (Live Tracking Timeline)
Komponen frontend interaktif untuk melacak pengerjaan pakaian:

```text
[✓ Pesanan Masuk] ──► [✓ Dicuci] ──► [● Sedang Dikeringkan] ──► [○ Disetrika] ──► [○ Siap Diambil]
      10 Sep 09:30          10 Sep 11:00          10 Sep 13:15
```
- **Keterangan Indikator:**
  - `✓` (Hijau/Orange Terang): Tahapan yang telah tuntas dikerjakan.
  - `●` (Animasi Berkedip): Tahapan yang sedang berlangsung saat ini.
  - `○` (Abu-abu / Border): Tahapan berikutnya yang menunggu antrean.
- **Informasi Estimasi Selesai**: Ditampilkan di atas timeline (misal: *"Estimasi Siap: Besok, 11 Sep pukul 16:00 WIB"*).

---

### 3.6. Logika & Keamanan Sisi Klien (Client-Side Guards & State)
Menjaga kenyamanan alur navigasi sebelum data dikirimkan ke server:

1. **Struktur Session Klien (`localStorage.getItem('laundrySession')`):**
   ```json
   {
     "isLoggedIn": true,
     "user": {
       "id": "uuid-pengguna",
       "name": "Budi Santoso",
       "email": "budi@gmail.com",
       "role": "admin"
     },
     "token": "sb-jwt-token...",
     "loginAt": "2026-09-25T12:00:00Z"
   }
   ```

2. **Skrip Proteksi Rute Klien (`authGuard.js`):**
   - **Di Dashboard Admin (`dashboard.html`):**
     Jika user belum login ➔ alihkan ke `Login.html`.  
     Jika role user adalah `'user'` ➔ alihkan otomatis ke `dashboard-user.html`.
   - **Di Dashboard User (`dashboard-user.html`):**
     Jika user belum login ➔ alihkan ke `Login.html`.

---

## ═══════════════════════════════════════════════════════════════
## BAGIAN 2: BACKEND, DATABASE & DATA LOGIC (Sisi Server & Penyimpanan)
## ═══════════════════════════════════════════════════════════════

Bagian ini mencakup struktur database, hak akses data, integritas tabel, logika server, dan adapter cloud.

### 4.1. Desain Skema Database (Supabase PostgreSQL)
Seluruh skema terpusat di `schema.sql`:

#### A. Tabel `profiles` (Data Akun & Hak Akses)
```sql
create table if not exists public.profiles (
    id uuid default gen_random_uuid() primary key,
    nama text not null,
    email text unique not null,
    password text not null default '123456',
    nomor_telepon text,
    alamat text,
    role text not null default 'user' check (role in ('admin', 'user')),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);
```

#### B. Tabel `layanan` (Master Tarif & Estimasi Jam)
```sql
create table if not exists public.layanan (
    id bigserial primary key,
    nama_layanan text not null,
    harga numeric not null default 0,
    satuan text not null default 'kg',      -- 'kg' atau 'pcs'
    durasi_jam integer default 24,         -- dipakai menghitung estimasi selesai
    status text not null default 'aktif',  -- 'aktif' atau 'nonaktif'
    created_at timestamp with time zone default now()
);
```

#### C. Tabel `pelanggan` (Master Data Konsumen)
```sql
create table if not exists public.pelanggan (
    id bigserial primary key,
    nama text not null,
    nomor_telepon text,
    alamat text,
    catatan text,
    created_at timestamp with time zone default now()
);
```

#### D. Tabel `transaksi` (Inti Transaksi Laundry)
```sql
create table if not exists public.transaksi (
    id bigserial primary key,
    kode_transaksi text unique not null,
    user_id uuid references public.profiles(id) on delete set null, -- relasi akun pelanggan
    pelanggan_id bigint references public.pelanggan(id) on delete set null,
    pelanggan_nama text not null,
    nomor_telepon text,
    layanan_id bigint references public.layanan(id) on delete set null,
    layanan_nama text not null,
    berat numeric not null default 1,
    total numeric not null default 0,
    status_cucian text not null default 'Baru Masuk',
    status_pembayaran text not null default 'Belum', -- 'Belum', 'DP', 'Lunas'
    tanggal_masuk date default current_date,
    estimasi_selesai date,
    tanggal_selesai date,
    catatan text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);
```

#### E. Tabel `riwayat_status` (Audit Trail Pelacakan Cucian)
```sql
create table if not exists public.riwayat_status (
    id bigserial primary key,
    transaksi_id bigint references public.transaksi(id) on delete cascade,
    status text not null,
    catatan text,
    diubah_oleh text default 'Sistem/Admin',
    waktu timestamp with time zone default now()
);
```

---

### 4.2. Row Level Security (RLS) & Proteksi Data Server
Supabase RLS memastikan data terlindungi di tingkat basis data:

1. **Akses Penuh untuk Admin:**
   ```sql
   create policy "Admin dapat mengakses seluruh data transaksi"
   on public.transaksi
   for all
   using (
       exists (
           select 1 from public.profiles
           where profiles.id = auth.uid() and profiles.role = 'admin'
       )
   );
   ```

2. **Akses Terbatas untuk Pelanggan (User):**
   ```sql
   create policy "Pelanggan hanya dapat melihat transaksinya sendiri"
   on public.transaksi
   for select
   using (auth.uid() = user_id);
   ```

---

### 4.3. Business Logic & Aturan Kalkulasi Data (Backend Rules)

1. **Rumus Agregasi Dashboard:**
   - $\text{Total Transaksi Hari Ini} = \text{COUNT}(\text{transaksi where tanggal\_masuk} = \text{CURRENT\_DATE})$
   - $\text{Pendapatan Hari Ini} = \sum (\text{total where tanggal\_masuk} = \text{CURRENT\_DATE dan status\_pembayaran} = \text{'Lunas'})$
   - $\text{Sedang Diproses} = \text{COUNT}(\text{transaksi where status\_cucian} \notin (\text{'Siap Diambil'}, \text{'Selesai'}))$
   - $\text{Siap Diambil} = \text{COUNT}(\text{transaksi where status\_cucian} = \text{'Siap Diambil'})$

2. **Kalkulasi Total Biaya:**
   $$\text{Total Transaksi} = \text{Berat / Jumlah} \times \text{Tarif Layanan}$$

3. **Logika Estimasi Waktu Selesai:**
   $$\text{Estimasi Selesai} = \text{Waktu Masuk} + (\text{durasi\_jam dari tabel layanan})$$
   *Contoh:* Layanan Cuci Kilat (durasi 6 jam) masuk pada 10 Sep pukul 08:00 ➔ Estimasi selesai: 10 Sep pukul 14:00.

4. **Logika Otomasi Reminder Siap Diambil:**
   - Ketika status cucian berpindah ke **'Siap Diambil'**, sistem memicu tanda (*flagged for reminder*) untuk notifikasi/pesan WhatsApp kepada pelanggan.

---

### 4.4. Mesin Transisi Status Cucian (State Machine)
Perubahan tahapan status cucian harus mengikuti urutan linier untuk menjaga integritas data:

```
[ Baru Masuk ] 
      │
      ▼
  [ Dicuci ] 
      │
      ▼
[ Dikeringkan ] 
      │
      ▼
 [ Disetrika ] 
      │
      ▼
[ Siap Diambil ] ──► (Trigger Reminder Pelanggan)
      │
      ▼
  [ Selesai ]    ──► (Arsip Transaksi Ditutup)
```
*Catatan:* Setiap transisi status akan secara otomatis membuat entri baru pada tabel `riwayat_status` lengkap dengan timestamp server.

---

### 4.5. Konektor Data & Adapter Cloud (`supabaseClient.js`)
File [supabaseClient.js](file:///d:/KULIAH/Login/supabaseClient.js) berfungsi sebagai jembatan backend SDK:
- Menginisialisasi koneksi aman dengan Supabase API (`url` & `anon_key`).
- Menyediakan modul data `LaundryDB`:
  - `LaundryDB.getTransactions()`: Query data dengan pemetaan model otomatis.
  - `LaundryDB.createTransaction(data)`: Validasi dan insert transaksi baru.
  - `LaundryDB.updateStatusCucian(id, newStatus)`: Update status transaksi dan append riwayat status.
  - `LaundryDB.authenticate(email, password)`: Verifikasi login terhadap tabel `profiles`.
- **Mekanisme Fallback Otomatis**: Jika jaringan internet atau server Supabase sedang tidak terjangkau, fungsi secara transparan akan membaca/menyimpan data ke `localStorage` agar aplikasi tetap berjalan tanpa crash.

---

## ═══════════════════════════════════════════════════════════════
## BAGIAN 3: ALUR SISTEM END-TO-END (Integrasi Frontend & Backend)
## ═══════════════════════════════════════════════════════════════

### 5.1. Alur Autentikasi Multi-Role & Routing

```text
               +---------------------------+
               |  Pengguna Mengakses       |
               |  Halaman Login.html       |
               +-------------+-------------+
                             |
                             v
               +---------------------------+
               | Input Email & Password    |
               | (atau Klik Demo Login)    |
               +-------------+-------------+
                             |
                             v
               +---------------------------+
               | [Backend] Validasi via    |
               | Supabase Auth / Database  |
               +-------------+-------------+
                             |
                +------------+------------+
                | Kredensial Valid?       |
                +------------+------------+
                     |              |
                    TIDAK           YA
                     |              |
                     v              v
     +-------------------+   +------------------------------------+
     | [Frontend] Tampil |   | [Backend] Ambil Profil Akun        |
     | Toast Error       |   | & Identifikasi Nilai 'role'        |
     +-------------------+   +-----------------+------------------+
                                               |
                                               v
                                 +----------------------------+
                                 | Apa Role Pengguna?         |
                                 +--------------+-------------+
                                                |
                       +------------------------+-----------------------+
                       |                                                |
                  ROLE == 'admin'                                  ROLE == 'user'
                       |                                                |
                       v                                                v
        +-------------------------------+              +-------------------------------+
        | [Frontend] Simpan Sesi Admin  |              | [Frontend] Simpan Sesi User   |
        | { role: 'admin', ... }        |              | { role: 'user', userId, ... } |
        +---------------+---------------+              +---------------+---------------+
                        |                                              |
                        v                                              v
        +-------------------------------+              +-------------------------------+
        | Redirect Browser ke:          |              | Redirect Browser ke:          |
        | dashboard.html (Admin)        |              | dashboard-user.html (Pelanggan|
        +-------------------------------+              +-------------------------------+
```

---

### 5.2. Alur Operasional Kasir & Pengelolaan Transaksi
1. **Penerimaan (Frontend)**: Kasir mengklik tombol `+ Tambah Transaksi`.
2. **Input Data**: Memilih data pelanggan atau mengetik pelanggan baru, memilih layanan cucian (misal: Cuci Setrika Regular), serta menimbang pakaian.
3. **Kalkulasi**: Frontend menghitung total biaya secara instan.
4. **Penyimpanan (Backend)**: Transaksi dikirim ke Supabase tabel `transaksi`. Status awal otomatis diatur ke **'Baru Masuk'**.
5. **Pengerjaan & Update Status**: Tim operasional mengupdate status pakaian di `cucian.html` (Dicuci ➔ Dikeringkan ➔ Disetrika).
6. **Pelunasan & Pengambilan**: Kasir menerima pembayaran di `pembayaran.html` ➔ ubah status pembayaran menjadi **'Lunas'** ➔ serahkan cucian ke pelanggan ➔ status menjadi **'Selesai'**.

---

### 5.3. Alur Pelacakan Cucian oleh Pelanggan
1. **Login Pelanggan**: Konsumen masuk menggunakan akunnya di `Login.html`.
2. **Kueri Data Sisi Server**: Backend mengeksekusi kueri `select * from transaksi where user_id = auth.uid()`.
3. **Visualisasi Live Tracking (Frontend)**:
   - Pelanggan melihat kartu cucian aktif miliknya.
   - Timeline menunjukkan tahapan saat ini lengkap dengan waktu pembaruan terakhir.
   - Pelanggan melihat estimasi jam selesai tanpa perlu menelepon kasir.
4. **Aksi Pelanggan**: Pelanggan dapat mengklik tombol *"Chat WhatsApp"* jika memiliki instruksi khusus untuk cuciannya.

---

## ═══════════════════════════════════════════════════════════════
## BAGIAN 4: ROADMAP, SCOPE & KETENTUAN PENGEMBANGAN
## ═══════════════════════════════════════════════════════════════

### 6.1. Scope Proyek (In Scope vs Out of Scope)
- **Dalam Cakupan (In Scope):**
  - Autentikasi 2 Peran (Admin & Pelanggan).
  - Dashboard Operasional Laundry (4 cards, 2 grafik Chart.js, tabel transaksi).
  - Dashboard Khusus Pelanggan dengan Live Tracking Timeline.
  - CRUD Pelanggan, CRUD Layanan Tarif.
  - Kasir Transaksi & Penghitungan Total Otomatis.
  - Pembayaran & Status Pelunasan.
  - Estimasi Jam Selesai & Simulasi Reminder Siap Diambil.
  - Rekapitulasi Laporan Transaksi Sederhana.
- **Di Luar Cakupan (Out of Scope):**
  - Sistem multi-cabang kompleks (*multi-outlet franchise*).
  - Marketplace laundry terintegrasi kurir pihak ketiga (Gojek/Grab API).
  - Integrasi hardware modul IoT mesin cuci fisik.
  - Sistem pembukuan akuntansi laba-rugi & perpajakan tingkat lanjut.

---

### 6.2. Fitur Berdasarkan Prioritas
| Must Have (Wajib) | Should Have (Penting) | Could Have (Opsional) |
|---|---|---|
| • Login & Autentikasi Multi-Role<br>• Dashboard Admin & Pelanggan<br>• Manajemen Pelanggan & Layanan<br>• Input Kasir Transaksi Baru<br>• Manajemen Status Cucian<br>• Live Tracking Timeline<br>• Modul Pembayaran | • Estimasi Waktu Selesai Otomatis<br>• Reminder Cucian Siap Diambil<br>• Riwayat Lengkap Transaksi<br>• Laporan Keuangan Harian/Bulanan | • Program Poin Loyalty Pelanggan<br>• Integrasi Gateway Pembayaran Otomatis (Midtrans/Xendit)<br>• Kirim Pesan WhatsApp Otomatis (Fonnte/Wwebjs) |

---

### 6.3. Roadmap Pengembangan Bertahap (Phase 1 – Phase 6)

#### 🚀 Phase 1 — Dashboard MVP & Fondasi UI (Selesai Sebagian)
- [x] Layout dashboard modern terpadu ([dashboard.html](file:///d:/KULIAH/Login/dashboard.html), [dashboard.css](file:///d:/KULIAH/Login/dashboard.css))
- [x] Header dan Sidebar navigasi responsif
- [x] 4 summary cards metrik operasional
- [x] Grafik pendapatan (Line Chart) & status cucian (Donut Chart)
- [x] Widget cucian perlu perhatian
- [x] Tabel transaksi terbaru dengan filter dan pencarian
- [x] Modal kasir tambah transaksi
- [x] Adaptasi tampilan mobile & tablet

#### 👥 Phase 2 — Master Data & Role Based Auth
- [x] Rencana arsitektur multi-role (`AUTH_ROLE_BASED_PLAN.md`)
- [x] Skema database `profiles` & kolom `role` di `schema.sql`
- [ ] Implementasi routing dinamis di `login.js` sesuai peran akun
- [ ] Pembuatan halaman `dashboard-user.html` untuk pelanggan
- [ ] Penyusunan skrip proteksi rute `authGuard.js`
- [ ] Pengelolaan master data pelanggan (`pelanggan.html`) & layanan (`pengaturan.html`)

#### 🧾 Phase 3 — Transaksi & Kasir
- [x] Alur tambah transaksi kasir terhubung ke database/fallback
- [x] Kalkulasi total harga otomatis berdasarkan bobot cucian
- [ ] Cetak struk/nota digital transaksi
- [ ] Filter transaksi mendalam berdasarkan tanggal dan status

#### 🔄 Phase 4 — Status Cucian & Tracking Timeline
- [x] Definisi 6 tahapan pengerjaan cucian
- [ ] Modul update status cucian oleh operator (`cucian.html`)
- [ ] Komponen Live Tracking Timeline di dashboard pelanggan
- [ ] Pencatatan log waktu perubahan status ke tabel `riwayat_status`
- [ ] Kalkulasi otomatis tanggal & estimasi jam selesai

#### 💳 Phase 5 — Pembayaran & Pelunasan
- [ ] Manajemen status bayar (Belum, DP, Lunas) di `pembayaran.html`
- [ ] Pencatatan sisa tagihan pelanggan
- [ ] Konfirmasi penerimaan pembayaran kasir

#### 📊 Phase 6 — Fitur Nilai Tambah (Value-Added)
- [ ] Fitur reminder cucian siap diambil
- [ ] Simulasi notifikasi sistem
- [ ] Rekap laporan omset dan cetak laporan di `laporan.html`

---

### 6.4. Definition of Done (DoD)
Sebuah modul dianggap tuntas jika memenuhi standar:
1. Alur otentikasi dan hak akses berjalan tanpa celah kebocoran peran.
2. Tidak terdapat pesan kesalahan (*console error*) pada browser developer tools.
3. Tampilan teruji rapi dan responsif di resolusi Desktop, Tablet, dan Ponsel.
4. Perubahan data di antarmuka terhubung sinkron ke database Supabase (atau fallback state).
5. Desain tetap konsisten dengan palet brand `#EB7F31` & `#FCAD38`.

---

### 6.5. Aturan Rekayasa untuk AI & Pengembang (Rules for Antigravity)
1. **Jangan pernah merusak atau menghapus fungsi login** yang sudah berjalan stabil.
2. **Periksa struktur file proyek** sebelum mengedit kode untuk mencegah redudansi.
3. **Gunakan kembali komponen dan kelas CSS** yang sudah tersedia di `login.css` dan `dashboard.css`.
4. **Hindari menambah pustaka/dependency eksternal** yang tidak esensial.
5. **Pisahkan kode secara disiplin**: HTML untuk struktur semantik, CSS untuk styling, dan JS untuk interaksi logika.
6. **Jangan menjadikan dummy data sebagai solusi permanen**; utamakan koneksi `LaundryDB` Supabase dengan graceful fallback.
7. **Jalankan aplikasi dan uji responsivitas** setelah melakukan perubahan kode.
8. **Pertahankan solusi teknis yang bersih, modular, dan mudah dipelihara**.

---

## ═══════════════════════════════════════════════════════════════
## BAGIAN 5: CATATAN HARIAN & LOG IMPLEMENTASI (NOTES)
## ═══════════════════════════════════════════════════════════════

> *Bagian ini merupakan pengganti dari `NOTES.md` yang disediakan untuk mencatat progres pengerjaan, temuan teknis (*technical debts*), serta rencana pengerjaan harian tim pengembang.*

### 📝 Log Catatan Pengembang:
- **Status Saat Ini:**
  - Halaman login (`Login.html`) dan registrasi (`register.html`) telah selesai menggunakan arsitektur split-screen.
  - Halaman operasional admin (`dashboard.html`, `transaksi.html`, `pelanggan.html`, `cucian.html`, `pembayaran.html`, `laporan.html`, `pengaturan.html`) sudah memiliki kerangka dasar dan stylesheet terpadu.
  - Skema database Supabase telah dirancang pada `schema.sql` dan adapter JavaScript dibuat di `supabaseClient.js`.
- **Target Prioritas Berikutnya:**
  1. Melengkapi aktivasi pemisahan dashboard: membuat antarmuka `dashboard-user.html` untuk pelanggan.
  2. Mengaktifkan `authGuard.js` untuk proteksi URL antarmuka.
  3. Memastikan alur live tracking timeline dapat diakses langsung oleh pelanggan sesuai nomor nota / akun mereka.

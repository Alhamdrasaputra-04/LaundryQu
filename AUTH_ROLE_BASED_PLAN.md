# 🔐 RENCANA AUTENTIKASI MULTI-ROLE (ADMIN & USER) — LAUNDRYKU

Dokumen ini berisi spesifikasi arsitektur, alur kerja (*flow*), skema database, dan panduan implementasi sistem autentikasi 2 jalur peran (**Admin** dan **User**) pada aplikasi **LaundryKu**.

---

## 1. Ringkasan & Tujuan

Saat pengguna masuk melalui halaman login ([Login.html](file:///d:/KULIAH/Login/Login.html)), sistem akan memeriksa peran (*role*) akun yang terdaftar:
1. **Jalur Admin (Pengelola Laundry):**
   - Diarahkan ke **Dashboard Admin** (`dashboard.html`).
   - Memiliki wewenang operasional penuh: kelola pelanggan, buat transaksi kasir, ubah status cucian, konfirmasi pembayaran, dan lihat laporan keuangan.
2. **Jalur User (Pelanggan Laundry):**
   - Diarahkan ke **Dashboard Pelanggan** (`dashboard-user.html`).
   - Memiliki tampilan yang dipersonalisasi: melacak status pengerjaan cucian miliknya secara *real-time*, melihat estimasi selesai, memeriksa tagihan, dan melihat riwayat cucian.

---

## 2. Perbandingan Fitur Berdasarkan Peran

| Kategori | Role: Admin (Pengelola) | Role: User (Pelanggan) |
|---|---|---|
| **Halaman Utama** | `dashboard.html` | `dashboard-user.html` |
| **Cakupan Data** | Seluruh transaksi dari semua pelanggan | Hanya transaksi milik akun yang bersangkutan |
| **Summary Cards** | - Total Transaksi Hari Ini<br>- Pendapatan Hari Ini<br>- Sedang Diproses (Global)<br>- Siap Diambil (Global) | - Cucian Sedang Diproses<br>- Cucian Siap Diambil<br>- Total Transaksi Saya<br>- Tagihan Belum Lunas |
| **Fitur Utama** | - Input transaksi baru (Kasir)<br>- Ubah status cucian (*Baru Masuk* s/d *Selesai*)<br>- Rekap grafik omset & keuangan<br>- Kelola master pelanggan & layanan | - Live Tracking Timeline cucian aktif<br>- Detail nota/struk digital per transaksi<br>- Estimasi tanggal/jam cucian selesai<br>- Riwayat pemesanan laundry |
| **Aksi Terbatas** | Input, Edit, Update Status, Hapus Transaksi | *Read-only* terhadap status cucian, tombol hubungi admin via WhatsApp |

---

## 3. Diagram Alur Autentikasi (Flowchart)

```text
               +---------------------------+
               |  Pengguna Mengakses       |
               |  Halaman Login.html       |
               +-------------+-------------+
                             |
                             v
               +---------------------------+
               | Input Email & Password    |
               | (atau Demo Login)         |
               +-------------+-------------+
                             |
                             v
               +---------------------------+
               | Validasi Kredensial via   |
               | Supabase Auth / Local     |
               +-------------+-------------+
                             |
                +------------+------------+
                | Berhasil?               |
                +------------+------------+
                     |              |
                    TIDAK           YA
                     |              |
                     v              v
     +-------------------+   +------------------------------------+
     | Tampilkan Pesan   |   | Ambil Data Profil & Cek 'role'     |
     | Error (Toast)     |   +-----------------+------------------+
     +-------------------+                     |
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
        | Simpan Sesi Admin             |              | Simpan Sesi User              |
        | { role: 'admin', ... }        |              | { role: 'user', userId, ... } |
        +---------------+---------------+              +---------------+---------------+
                        |                                              |
                        v                                              v
        +-------------------------------+              +-------------------------------+
        | Redirect ke:                  |              | Redirect ke:                  |
        | dashboard.html (Admin)        |              | dashboard-user.html (Pelanggan|
        +-------------------------------+              +-------------------------------+
```

---

## 4. Desain Skema Database (Supabase)

Untuk mendukung 2 peran secara aman di Supabase:

### A. Tabel `profiles` (Data Pengguna & Role)
```sql
create table public.profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    nama text not null,
    email text unique not null,
    nomor_telepon text,
    alamat text,
    role text not null default 'user' check (role in ('admin', 'user')),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);
```

### B. Relasi pada Tabel `transaksi`
Tambahkan kolom `user_id` pada tabel transaksi:
```sql
alter table public.transaksi 
add column user_id uuid references public.profiles(id);
```

### C. Row Level Security (RLS) di Supabase
- **Admin**: Dapat membaca dan mengubah seluruh baris transaksi.
  ```sql
  create policy "Admin can access all transactions"
  on public.transaksi
  for all
  using (
      exists (
          select 1 from public.profiles
          where profiles.id = auth.uid() and profiles.role = 'admin'
      )
  );
  ```
- **User (Pelanggan)**: Hanya dapat melihat transaksi yang `user_id`-nya sama dengan miliknya.
  ```sql
  create policy "Users can only view their own transactions"
  on public.transaksi
  for select
  using (auth.uid() = user_id);
  ```

---

## 5. Struktur Session & Keamanan Sisi Klien

### Format Local Session Storage (`laundrySession`)
```json
{
  "isLoggedIn": true,
  "user": {
    "id": "usr_99812",
    "name": "Budi Santoso",
    "email": "budi@gmail.com",
    "role": "user"
  },
  "token": "sb-access-token...",
  "loginAt": "2026-09-22T19:45:00.000Z"
}
```

### Skrip Proteksi Rute (`authGuard.js`)
Setiap halaman dashboard akan menyertakan skrip penjaga akses (*guard*):
1. **Di `dashboard.html` (Admin):**
   ```javascript
   const session = JSON.parse(localStorage.getItem('laundrySession'));
   if (!session || !session.isLoggedIn) {
       window.location.href = 'Login.html';
   } else if (session.user.role !== 'admin') {
       // Jika user biasa mencoba masuk ke dashboard admin, lempar ke dashboard user
       window.location.href = 'dashboard-user.html';
   }
   ```
2. **Di `dashboard-user.html` (User):**
   ```javascript
   const session = JSON.parse(localStorage.getItem('laundrySession'));
   if (!session || !session.isLoggedIn) {
       window.location.href = 'Login.html';
   }
   ```

---

## 6. Kredensial Akun Pengujian (Demo Mode)

Untuk kemudahan pengujian tanpa perlu mendaftar akun baru setiap saat:

| Peran | Username / Email | Password | Tujuan Pengujian |
|---|---|---|---|
| **Admin** | `admin` (atau `admin@laundryku.com`) | `admin123` (atau `demo`) | Membuka Dashboard Admin penuh |
| **User** | `user` (atau `pelanggan@gmail.com`) | `user123` (atau `demo`) | Membuka Dashboard Pelanggan & pelacakan cucian |

---

## 7. Desain Halaman Dashboard Pelanggan (`dashboard-user.html`)

Dashboard khusus user dirancang lebih ringkas, fokus pada kenyamanan pelanggan, dan mempertahankan estetika palet warna **#EB7F31** & **#FCAD38**:

1. **Header Khusus Pelanggan:**
   - Menampilkan: *"Halo, Budi Santoso 👋"* dan status keanggotaan/nomor HP.
   - Tombol *"Butuh Bantuan?"* (buka chat WhatsApp pengelola laundry).
2. **Summary Cards Pelanggan:**
   - **Cucian Berjalan** (contoh: 1 pesanan dalam proses).
   - **Siap Diambil** (contoh: 1 pesanan siap diambil di outlet).
   - **Total Tagihan Belum Bayar** (contoh: Rp 45.000).
3. **Widget Hero: Live Tracking Timeline:**
   - Menampilkan tahapan pakaian terkini:
     `[✓ Pesanan Diterima] ➔ [✓ Dicuci] ➔ [● Dikeringkan] ➔ [○ Disetrika] ➔ [○ Siap Diambil]`
   - Estimasi selesai: *"Besok, 23 Sep pukul 14:00 WIB"*.
4. **Tabel Riwayat Pesanan Saya:**
   - No. Nota / Kode Transaksi
   - Tanggal Masuk
   - Paket Layanan (Cuci Setrika / Express / Dry Clean)
   - Total Biaya & Status Pembayaran (Lunas / Belum Lunas)
   - Status Terakhir Cucian
   - Tombol *"Lihat Struk Digital"*

---

## 8. Rencana Tahapan Kerja (Roadmap Implementasi)

- [ ] **Langkah 1:** Tambahkan dukungan role pada skrip database `schema.sql` (tabel `profiles`, kolom `role`, dan data seed admin + user).
- [ ] **Langkah 2:** Perbarui [login.js](file:///d:/KULIAH/Login/login.js) agar mengenali kredensial Admin vs User dan melakukan *routing* ke halaman yang sesuai.
- [ ] **Langkah 3:** Buat file `dashboard-user.html`, `dashboard-user.css`, dan `dashboard-user.js` khusus pelanggan.
- [ ] **Langkah 4:** Tambahkan `authGuard.js` untuk proteksi keamanan URL antar kedua peran.
- [ ] **Langkah 5:** Pengujian menyeluruh (*login sebagai admin ➔ verifikasi dashboard admin, logout ➔ login sebagai user ➔ verifikasi dashboard user*).

# LAUNDRY APP — DEVELOPMENT PLAN

## 1. Project
**Judul:** Pengembangan Prototipe Aplikasi Laundry untuk Manajemen Transaksi dan Pelacakan Status Cucian

**Tujuan:** Membantu admin/pemilik laundry mengelola pelanggan, layanan, transaksi, pembayaran, dan status cucian secara terstruktur.

**Status saat ini:**
- Login: sudah dibuat.
- Dashboard: sedang dikembangkan.
- Fitur lain: dikerjakan bertahap.

---

## 2. Dashboard

Dashboard adalah halaman ringkasan kondisi laundry. Setiap informasi harus memiliki sumber data dan manfaat yang jelas.

### Target pengguna
- Admin laundry
- Pemilik laundry

### Prinsip UI
- Clean
- Modern
- Minimal
- Mudah dipahami
- Responsive
- Tidak terlalu banyak warna

### Struktur
```text
Dashboard
├── Header
│   ├── Judul
│   ├── User
│   ├── Notifikasi
│   └── + Tambah Transaksi
├── Summary Cards
│   ├── Transaksi Hari Ini
│   ├── Pendapatan Hari Ini
│   ├── Sedang Diproses
│   └── Siap Diambil
├── Analytics
│   ├── Grafik Pendapatan
│   └── Status Cucian
├── Cucian Perlu Perhatian
└── Transaksi Terbaru
```

## 3. Summary Cards

Buat 4 card:
1. **Transaksi Hari Ini** — jumlah transaksi hari ini.
2. **Pendapatan Hari Ini** — total nominal transaksi hari ini.
3. **Sedang Diproses** — jumlah cucian yang belum selesai.
4. **Siap Diambil** — jumlah cucian yang sudah selesai dan menunggu diambil.

Gunakan data database/state, bukan angka hardcoded pada implementasi final.

---

## 4. Grafik Pendapatan

Gunakan line chart untuk pendapatan:
- Default: 7 hari terakhir.
- Filter: 7 Hari / 30 Hari.

Tujuan: melihat perkembangan pendapatan dengan cepat.

---

## 5. Status Cucian

Tampilkan jumlah berdasarkan status:
1. Baru Masuk
2. Dicuci
3. Dikeringkan
4. Disetrika
5. Siap Diambil
6. Selesai

Gunakan donut chart atau progress bar.

---

## 6. Cucian Perlu Perhatian

Tampilkan transaksi yang:
- Siap diambil.
- Mendekati estimasi selesai.
- Melewati estimasi selesai.

Contoh:
```text
Budi — #TRX00125
Status: Siap Diambil
Estimasi: Hari ini
```

Sediakan tombol **Lihat Semua**.

Bagian ini nantinya dapat dikembangkan menjadi fitur reminder.

---

## 7. Transaksi Terbaru

Tampilkan tabel:
- ID
- Pelanggan
- Layanan
- Total
- Status

Sediakan tombol **Lihat Semua Transaksi**.

Gunakan badge/status indicator agar status mudah dibaca.

---

## 8. Tombol Tambah Transaksi

Letakkan **+ Tambah Transaksi** di header.

Alur:
```text
Tambah Transaksi
→ Pilih/Tambah Pelanggan
→ Pilih Layanan
→ Masukkan Berat/Jumlah
→ Hitung Total
→ Simpan
→ Status = Baru Masuk
```

---

## 9. Sidebar

Menu:
```text
Dashboard
Pelanggan
Transaksi
Cucian
Pembayaran
Laporan
Pengaturan
```

Tambahkan Notifikasi jika fitur sudah tersedia.

---

## 10. Design System

Palet awal:
```text
Primary:        #2563EB
Background:     #F8FAFC
Card:           #FFFFFF
Text Primary:   #1E293B
Text Secondary: #64748B
Border:         #E2E8F0
```

Gunakan:
- Card radius sekitar 10–12px.
- Whitespace yang cukup.
- Typography konsisten.
- Icon sederhana.
- Primary color untuk tombol utama, active state, dan elemen interaktif.

---

## 11. Responsive

Target:
- Desktop
- Laptop
- Tablet
- Mobile

Pada layar kecil:
- Sidebar menjadi drawer/mobile navigation.
- Cards menjadi 1–2 kolom.
- Tabel dapat horizontal scroll.
- Grafik tetap terbaca.

---

# 12. Core Features

## Must Have
1. Login
2. Dashboard
3. Manajemen Pelanggan
4. Manajemen Layanan Laundry
5. Penerimaan Laundry
6. Manajemen Transaksi
7. Status Cucian
8. Tracking Cucian
9. Pembayaran

## Should Have
1. Estimasi Waktu Selesai
2. Reminder Cucian Siap Diambil
3. Riwayat Transaksi
4. Laporan

## Could Have
1. Loyalty Pelanggan
2. Fitur tambahan yang mendukung pengalaman pelanggan

---

# 13. Alur Utama

### Admin
```text
Login
→ Dashboard
→ Pelanggan
→ Buat Transaksi
→ Pilih Layanan
→ Masukkan Detail Cucian
→ Simpan
→ Baru Masuk
→ Update Status
→ Cucian Selesai
→ Pembayaran
→ Siap Diambil
→ Transaksi Selesai
```

### Tracking
```text
Baru Masuk
→ Dicuci
→ Dikeringkan
→ Disetrika
→ Siap Diambil
→ Selesai
```

---

# 14. Tracking Timeline

Tampilkan perjalanan cucian:

```text
✓ Pesanan Diterima
  10 Sep, 09:30

✓ Sedang Dicuci
  10 Sep, 11:00

● Disetrika
  Sedang diproses

○ Siap Diambil
```

Tujuan:
- Status mudah dipahami.
- Mengurangi pertanyaan pelanggan.
- Menambah transparansi layanan.

---

# 15. Estimasi Selesai

Setiap transaksi memiliki:
- Tanggal masuk
- Estimasi selesai
- Tanggal selesai aktual

Contoh:
```text
Tanggal Masuk: 10 September 2026
Estimasi: 11 September 2026
Status: Sedang Diproses
```

---

# 16. Reminder

Ketika status menjadi **Siap Diambil**, transaksi dapat ditandai untuk reminder.

Tahap awal cukup berupa simulasi/notifikasi internal. Integrasi WhatsApp/SMS tidak wajib untuk MVP.

---

# 17. Data Utama

### Pelanggan
```text
id
nama
nomor_telepon
alamat
created_at
updated_at
```

### Layanan
```text
id
nama_layanan
harga
satuan
status
created_at
updated_at
```

### Transaksi
```text
id
kode_transaksi
pelanggan_id
tanggal_masuk
estimasi_selesai
tanggal_selesai
total
status_pembayaran
status_cucian
created_at
updated_at
```

### Riwayat Status
```text
id
transaksi_id
status
waktu
catatan
```

---

# 18. Dashboard Data Rules

Contoh:
```text
Total Transaksi Hari Ini
= COUNT(transaksi hari ini)

Pendapatan Hari Ini
= SUM(total transaksi valid hari ini)

Sedang Diproses
= COUNT(transaksi dengan status belum selesai)

Siap Diambil
= COUNT(transaksi dengan status "Siap Diambil")
```

Dummy data hanya untuk tahap UI. Implementasi final harus memakai data aktual.

---

# 19. Development Roadmap

## Phase 1 — Dashboard MVP
- [ ] Layout dashboard
- [ ] Sidebar
- [ ] Header
- [ ] 4 summary cards
- [ ] Grafik pendapatan
- [ ] Statistik status cucian
- [ ] Cucian perlu perhatian
- [ ] Transaksi terbaru
- [ ] Tombol tambah transaksi
- [ ] Responsive

## Phase 2 — Master Data
- [ ] CRUD pelanggan
- [ ] CRUD layanan

## Phase 3 — Transaksi
- [ ] Tambah transaksi
- [ ] Hitung total otomatis
- [ ] Simpan transaksi
- [ ] Detail transaksi
- [ ] Riwayat transaksi

## Phase 4 — Status & Tracking
- [ ] Status cucian
- [ ] Update status
- [ ] Riwayat perubahan status
- [ ] Timeline tracking
- [ ] Estimasi selesai

## Phase 5 — Pembayaran
- [ ] Status pembayaran
- [ ] Nominal pembayaran
- [ ] Sisa pembayaran jika diperlukan
- [ ] Konfirmasi pembayaran

## Phase 6 — Value Added
- [ ] Reminder cucian selesai
- [ ] Notifikasi
- [ ] Laporan

---

# 20. Rules for Antigravity

1. Jangan menghapus atau merusak Login yang sudah berjalan.
2. Periksa struktur project sebelum mengubah kode.
3. Reuse komponen yang sudah ada.
4. Jangan menambah dependency jika tidak diperlukan.
5. Pisahkan UI, logic, dan data sesuai struktur project.
6. Jangan menjadikan dummy data sebagai solusi permanen.
7. Jangan mengerjakan fitur di luar scope tanpa persetujuan.
8. Setelah perubahan, jalankan aplikasi dan periksa error.
9. Periksa responsive layout.
10. Pastikan fitur dapat diuji sebelum lanjut ke fitur berikutnya.
11. Gunakan solusi teknis yang sederhana dan sesuai kebutuhan prototipe.
12. Jangan melakukan refactor besar jika tidak diperlukan untuk fitur yang sedang dikerjakan.

---

# 21. Definition of Done — Dashboard

Dashboard selesai jika:
- [ ] Login dapat menuju Dashboard.
- [ ] Sidebar berfungsi.
- [ ] 4 summary cards tampil.
- [ ] Grafik pendapatan tampil.
- [ ] Statistik status cucian tampil.
- [ ] Cucian perlu perhatian tampil.
- [ ] Transaksi terbaru tampil.
- [ ] Tombol Tambah Transaksi tersedia.
- [ ] Tidak ada error console.
- [ ] Responsive.
- [ ] Tampilan konsisten.
- [ ] Data dashboard dapat berubah ketika transaksi/status berubah.

---

# 22. Scope

### In Scope
- Login
- Dashboard
- Pelanggan
- Layanan
- Transaksi
- Pembayaran
- Status dan tracking cucian
- Estimasi selesai
- Reminder
- Riwayat transaksi
- Laporan

### Out of Scope
- Multi-cabang
- Marketplace
- Sistem kurir kompleks
- Integrasi mesin laundry
- Akuntansi lengkap
- Prediksi bisnis AI
- Loyalty kompleks

---

# 23. Value Proposition

> Aplikasi laundry kami tidak hanya membantu mengelola transaksi cucian, tetapi juga membantu meningkatkan transparansi dan kenyamanan pelanggan melalui fitur pelacakan status, estimasi waktu selesai, dan reminder cucian.

---

# 24. Target Produk

Alur utama produk:
```text
Pelanggan
→ Transaksi
→ Status Cucian
→ Tracking
→ Pembayaran
→ Siap Diambil
→ Reminder
→ Laporan
```

Setiap fitur harus memiliki hubungan yang jelas dengan masalah bisnis yang ingin diselesaikan.

-- ============================================================
-- LAUNDRYKU DATABASE SCHEMA (SUPABASE POSTGRESQL)
-- ============================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. TABEL PROFILES (PENGGUNA & ROLE)
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

-- Pastikan kolom password ada jika tabel sudah terlanjur dibuat
alter table public.profiles add column if not exists password text default '123456';

-- 3. TABEL LAYANAN (MASTER TARIF LAUNDRY)
create table if not exists public.layanan (
    id bigserial primary key,
    nama_layanan text not null,
    harga numeric not null default 0,
    satuan text not null default 'kg', -- 'kg' atau 'pcs'
    durasi_jam integer default 24,
    status text not null default 'aktif', -- 'aktif' / 'nonaktif'
    created_at timestamp with time zone default now()
);

-- 4. TABEL PELANGGAN (MASTER DATA PELANGGAN)
create table if not exists public.pelanggan (
    id bigserial primary key,
    nama text not null,
    nomor_telepon text,
    alamat text,
    catatan text,
    created_at timestamp with time zone default now()
);

-- 5. TABEL TRANSAKSI (JANTUNG OPERASIONAL & KASIR LAUNDRY)
create table if not exists public.transaksi (
    id bigserial primary key,
    kode_transaksi text unique not null,
    user_id uuid references public.profiles(id) on delete set null,
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

-- Pastikan kolom user_id ada jika tabel sudah terlanjur dibuat sebelumnya
alter table public.transaksi add column if not exists user_id uuid references public.profiles(id);

-- 6. TABEL RIWAYAT STATUS (HISTORI TIMELINE TRACKING)
create table if not exists public.riwayat_status (
    id bigserial primary key,
    transaksi_id bigint references public.transaksi(id) on delete cascade,
    status text not null,
    waktu timestamp with time zone default now(),
    catatan text
);

-- 7. TABEL PENGATURAN OUTLET (PROFIL TOKO & FOOTER NOTA)
create table if not exists public.pengaturan_outlet (
    id integer primary key default 1,
    nama_outlet text default 'LaundryKu',
    slogan text default 'Bersih, Wangi & Terpercaya',
    nomor_wa text default '081234567890',
    jam_operasional text default '07:00 - 21:00 WIB',
    alamat text default 'Jl. Kampus No. 12, Limau Manis, Padang',
    footer_nota text default 'Terima kasih atas kepercayaannya! Cucian Anda aman bersama kami.',
    updated_at timestamp with time zone default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) & PUBLIC POLICIES
-- ============================================================
alter table public.profiles enable row level security;
alter table public.layanan enable row level security;
alter table public.pelanggan enable row level security;
alter table public.transaksi enable row level security;
alter table public.riwayat_status enable row level security;
alter table public.pengaturan_outlet enable row level security;

-- Izinkan akses untuk prototipe (anon key dapat membaca & mengubah data)
drop policy if exists "Allow anon read all" on public.profiles;
create policy "Allow anon read all" on public.profiles for select using (true);
drop policy if exists "Allow anon write all" on public.profiles;
create policy "Allow anon write all" on public.profiles for all using (true) with check (true);

drop policy if exists "Allow anon all layanan" on public.layanan;
create policy "Allow anon all layanan" on public.layanan for all using (true) with check (true);

drop policy if exists "Allow anon all pelanggan" on public.pelanggan;
create policy "Allow anon all pelanggan" on public.pelanggan for all using (true) with check (true);

drop policy if exists "Allow anon all transaksi" on public.transaksi;
create policy "Allow anon all transaksi" on public.transaksi for all using (true) with check (true);

drop policy if exists "Allow anon all riwayat" on public.riwayat_status;
create policy "Allow anon all riwayat" on public.riwayat_status for all using (true) with check (true);

drop policy if exists "Allow anon all outlet" on public.pengaturan_outlet;
create policy "Allow anon all outlet" on public.pengaturan_outlet for all using (true) with check (true);

-- ============================================================
-- DATA AWAL (SEED DATA CONTOH)
-- ============================================================

-- Data Master Layanan
insert into public.layanan (nama_layanan, harga, satuan, durasi_jam, status) values
('Cuci Reguler', 5000, 'kg', 48, 'aktif'),
('Cuci Express', 8000, 'kg', 24, 'aktif'),
('Cuci Setrika', 10000, 'kg', 48, 'aktif'),
('Dry Clean', 15000, 'pcs', 72, 'aktif'),
('Laundry Sepatu', 20000, 'pcs', 72, 'aktif')
on conflict do nothing;

-- Data Master Pelanggan
insert into public.pelanggan (nama, nomor_telepon, alamat) values
('Budi Santoso', '081234567890', 'Jl. Kaliurang KM 5, Yogyakarta'),
('Siti Rahayu', '081398765432', 'Jl. Gejayan No. 12, Sleman'),
('Ahmad Wahyu', '082155667788', 'Jl. Seturan Raya No. 45, Depok'),
('Dewi Lestari', '085711223344', 'Jl. Palagan KM 8, Ngaglik'),
('Eko Prasetyo', '081900112233', 'Jl. Monjali No. 20, Sleman'),
('Rina Wati', '087833445566', 'Jl. Colombo No. 8, Yogyakarta'),
('Hendra Kurniawan', '081288990011', 'Jl. Solo KM 9, Kalasan')
on conflict do nothing;

-- Data Awal Transaksi
insert into public.transaksi (kode_transaksi, pelanggan_nama, nomor_telepon, layanan_nama, berat, total, status_cucian, status_pembayaran, tanggal_masuk, estimasi_selesai, catatan) values
('TRX00131', 'Eko Prasetyo', '081900112233', 'Cuci Setrika', 7.5, 75000, 'Dikeringkan', 'Lunas', current_date, current_date + interval '1 day', 'Pakaian kerja kantor, pisahkan kemeja putih'),
('TRX00130', 'Ahmad Wahyu', '082155667788', 'Cuci Express', 7, 56000, 'Dicuci', 'DP', current_date, current_date + interval '1 day', 'Jangan pakai pelembut terlalu wangi'),
('TRX00129', 'Rina Wati', '087833445566', 'Cuci Reguler', 7, 35000, 'Baru Masuk', 'Belum', current_date, current_date + interval '2 days', 'Pakaian harian biasa'),
('TRX00128', 'Siti Rahayu', '081398765432', 'Dry Clean', 6, 90000, 'Disetrika', 'Lunas', current_date - interval '1 day', current_date, 'Jas dan blazer formal'),
('TRX00127', 'Hendra Kurniawan', '081288990011', 'Cuci Setrika', 12, 120000, 'Siap Diambil', 'Lunas', current_date - interval '1 day', current_date, 'Sprei dan selimut bed cover'),
('TRX00126', 'Dewi Lestari', '085711223344', 'Laundry Sepatu', 2, 40000, 'Siap Diambil', 'DP', current_date - interval '2 days', current_date - interval '1 day', 'Sepatu sneakers putih kanvas'),
('TRX00125', 'Budi Santoso', '081234567890', 'Cuci Express', 8, 64000, 'Siap Diambil', 'Lunas', current_date - interval '2 days', current_date, 'Sudah selesai dicuci rapi'),
('TRX00124', 'Eko Prasetyo', '081900112233', 'Cuci Reguler', 5, 25000, 'Selesai', 'Lunas', current_date - interval '3 days', current_date - interval '1 day', 'Sudah diambil pelanggan'),
('TRX00123', 'Siti Rahayu', '081398765432', 'Cuci Setrika', 5, 50000, 'Selesai', 'Lunas', current_date - interval '3 days', current_date - interval '1 day', 'Selesai diambil'),
('TRX00122', 'Dewi Lestari', '085711223344', 'Cuci Express', 6, 48000, 'Baru Masuk', 'Belum', current_date, current_date + interval '1 day', 'Kaos dan celana olahraga')
on conflict (kode_transaksi) do nothing;

-- Data Akun Profiles Awal
insert into public.profiles (nama, email, password, role, nomor_telepon, alamat) values
('Admin LaundryKu', 'admin@laundryku.com', 'admin123', 'admin', '08123456789', 'Outlet LaundryKu Pusat'),
('Budi Santoso', 'budi@gmail.com', 'budi123', 'user', '081234567890', 'Jl. Kaliurang KM 5, Yogyakarta')
on conflict (email) do update set password = excluded.password;

-- Data Profil Usaha Outlet Awal
insert into public.pengaturan_outlet (id, nama_outlet, slogan, nomor_wa, jam_operasional, alamat, footer_nota) values
(1, 'LaundryKu', 'Bersih, Wangi & Terpercaya', '081234567890', '07:00 - 21:00 WIB', 'Jl. Kampus No. 12, Limau Manis, Padang', 'Terima kasih atas kepercayaannya! Cucian Anda aman bersama kami.')
on conflict (id) do update set 
    nama_outlet = excluded.nama_outlet,
    slogan = excluded.slogan,
    nomor_wa = excluded.nomor_wa,
    jam_operasional = excluded.jam_operasional,
    alamat = excluded.alamat,
    footer_nota = excluded.footer_nota,
    updated_at = now();


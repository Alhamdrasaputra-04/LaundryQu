# Alur Aplikasi LaundryKu

Dokumen alur lengkap dan terpadu dapat dilihat pada:
- **[MASTER_DOCUMENTATION.md](file:///d:/KULIAH/Login/MASTER_DOCUMENTATION.md)** — Dokumen Master Terpadu (Frontend & Backend).
- **[LAUNDRY_APP_DEVELOPMENT_PLAN.md](file:///d:/KULIAH/Login/LAUNDRY_APP_DEVELOPMENT_PLAN.md)** — Rencana induk fitur aplikasi (Phase 1–6).
- **[AUTH_ROLE_BASED_PLAN.md](file:///d:/KULIAH/Login/AUTH_ROLE_BASED_PLAN.md)** — Rencana autentikasi 2 jalur (Admin vs User/Pelanggan).

---

## Ringkasan Alur Utama Autentikasi & Navigasi

```text
[ Pengguna Masuk di Login.html ]
              │
              ▼
    [ Cek Kredensial & Role ]
     ├── Jika Role = ADMIN  ──► Masuk ke dashboard.html (Dashboard Pengelola Laundry)
     └── Jika Role = USER   ──► Masuk ke dashboard-user.html (Dashboard Khusus Pelanggan)
```

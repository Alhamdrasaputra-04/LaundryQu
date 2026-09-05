# Login Page Skripsi

Login page sederhana dengan desain Blue Sky untuk pretest masuk grup skripsi.

## Fitur

- ✅ Google Authentication
- ✅ Login dengan email dan password
- ✅ Verifikasi eligibility mahasiswa
- ✅ Desain modern dan responsif
- ✅ Warna tema Blue Sky

## Cara Menggunakan

1. Buka file `Login.html` di browser
2. Pilih metode login:
   - Login dengan Google (akan muncul popup Google)
   - Login dengan email mahasiswa dan password

## Konfigurasi Google API

Untuk mengaktifkan Google Login, Anda perlu:

### 1. Buat Project di Google Cloud Console

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru
3. Aktifkan Google Identity Services API

### 2. Buat OAuth 2.0 Credentials

1. Buka menu **APIs & Services** > **Credentials**
2. Klik **Create Credentials** > **OAuth client ID**
3. Konfigurasi consent screen jika diminta
4. Pilih tipe **Web application**
5. Tambahkan authorized JavaScript origins:
   - `http://localhost:3000` (untuk development)
6. Copy **Client ID**

### 3. Update Kode

Ganti di file `script.js`:

```javascript
const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID'; // Ganti dengan Client ID Anda
const API_KEY = 'YOUR_GOOGLE_API_KEY';     // Ganti dengan API Key Anda
```

### 4. Implementasi Backend Verification

Untuk verifikasi eligibility yang sebenarnya, Anda perlu backend API:

```javascript
// Contoh endpoint backend
async function verifyStudentEligibility(email) {
    const response = await fetch('/api/verify-eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    
    const result = await response.json();
    return result.eligible;
}
```

## Struktur File

```
Login/
├── Login.html    # File HTML utama
├── style.css     # Styling dengan Blue Sky theme
├── script.js     # JavaScript untuk auth & logic
└── README.md     # Dokumentasi
```

## Customization

### Mengubah Warna

Edit file `style.css`:
- Primary Blue: `#0069D9` (ubah di `.login-btn`)
- Background Gradient: di `body` selector

### Menambah Logo

Tambahkan gambar di `.logo-section`:
```html
<img src="logo.png" alt="Logo" class="logo-image">
```

## Tech Stack

- HTML5
- CSS3 (Flexbox, CSS Variables)
- Vanilla JavaScript
- Google Identity Services API

## License

MIT License - bebas digunakan untuk keperluan akademik
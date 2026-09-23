/* ============================================================
   supabaseClient.js — Integrasi Cloud Database LaundryKu
   ============================================================ */

const SUPABASE_CONFIG = {
    url: 'https://bhopkqqehvnvrzzwnxqm.supabase.co',
    key: 'sb_publishable_jnc8yj2Tpd02uMOM8Gybxg_gBOPPu61'
};

// Inisialisasi Supabase Client jika SDK tersedia
let sbClient = null;
if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
    try {
        sbClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
        console.log('⚡ Supabase Client initialized successfully.');
    } catch (e) {
        console.warn('⚠️ Supabase init warning:', e.message);
    }
}

// ============================================================
// DATABASE HELPER FUNCTIONS (WITH AUTOMATIC FALLBACK)
// ============================================================

const LaundryDB = {
    // 1. Ambil Semua Transaksi
    async getTransactions() {
        if (sbClient) {
            try {
                const { data, error } = await sbClient
                    .from('transaksi')
                    .select('*')
                    .order('id', { ascending: false });

                if (!error && data && data.length > 0) {
                    // Normalisasi kolom
                    return data.map(item => ({
                        id: item.kode_transaksi || ('TRX00' + item.id),
                        dbId: item.id,
                        pelanggan: item.pelanggan_nama,
                        telepon: item.nomor_telepon || '-',
                        layanan: item.layanan_nama,
                        berat: parseFloat(item.berat) || 1,
                        total: parseFloat(item.total) || 0,
                        statusCucian: item.status_cucian,
                        pembayaran: item.status_pembayaran,
                        tanggal: item.tanggal_masuk,
                        estimasi: item.estimasi_selesai,
                        catatan: item.catatan || '-'
                    }));
                }
            } catch (err) {
                console.warn('Supabase fetch error, using local fallback:', err.message);
            }
        }
        // Fallback: Ambil dari localStorage
        const local = localStorage.getItem('laundry_transactions');
        if (local) {
            try { return JSON.parse(local); } catch(e){}
        }
        return null; // Gunakan default awal
    },

    // 2. Simpan Transaksi Baru
    async addTransaction(trx) {
        // Simpan ke Supabase jika aktif
        if (sbClient) {
            try {
                const { data, error } = await sbClient
                    .from('transaksi')
                    .insert([{
                        kode_transaksi: trx.id,
                        pelanggan_nama: trx.pelanggan,
                        nomor_telepon: trx.telepon || '-',
                        layanan_nama: trx.layanan,
                        berat: trx.berat || 1,
                        total: trx.total,
                        status_cucian: trx.statusCucian || 'Baru Masuk',
                        status_pembayaran: trx.pembayaran || 'Belum',
                        tanggal_masuk: trx.tanggal || new Date().toISOString().split('T')[0],
                        estimasi_selesai: trx.estimasi || new Date(Date.now() + 86400000).toISOString().split('T')[0],
                        catatan: trx.catatan || ''
                    }])
                    .select();

                if (!error && data && data[0]) {
                    // Tambah riwayat awal
                    await sbClient.from('riwayat_status').insert([{
                        transaksi_id: data[0].id,
                        status: 'Baru Masuk',
                        catatan: 'Pesanan laundry diterima'
                    }]);
                    console.log('✅ Berhasil simpan transaksi ke Supabase:', data[0]);
                }
            } catch (err) {
                console.warn('Gagal simpan ke Supabase, tersimpan di lokal:', err.message);
            }
        }
        // Selalu sinkronkan ke localStorage agar tetap persisten
        LaundryDB.syncLocal(trx, 'add');
    },

    // 3. Update Status Transaksi
    async updateStatus(id, newStatus, newPayment, catatan = '') {
        if (sbClient) {
            try {
                const updatePayload = {};
                if (newStatus) updatePayload.status_cucian = newStatus;
                if (newPayment) updatePayload.status_pembayaran = newPayment;
                if (newStatus === 'Selesai') updatePayload.tanggal_selesai = new Date().toISOString().split('T')[0];

                const { data, error } = await sbClient
                    .from('transaksi')
                    .update(updatePayload)
                    .eq('kode_transaksi', id)
                    .select();

                if (!error && data && data[0] && newStatus) {
                    await sbClient.from('riwayat_status').insert([{
                        transaksi_id: data[0].id,
                        status: newStatus,
                        catatan: catatan || `Status diubah menjadi ${newStatus}`
                    }]);
                }
            } catch (err) {
                console.warn('Supabase update warning:', err.message);
            }
        }
        LaundryDB.syncLocal({ id, statusCucian: newStatus, pembayaran: newPayment }, 'update');
    },

    // 4. Hapus Transaksi
    async deleteTransaction(id) {
        if (sbClient) {
            try {
                await sbClient.from('transaksi').delete().eq('kode_transaksi', id);
            } catch (err) {
                console.warn('Supabase delete warning:', err.message);
            }
        }
        LaundryDB.syncLocal({ id }, 'delete');
    },

    // Helper sinkronisasi LocalStorage
    syncLocal(item, action) {
        let list = [];
        try {
            const stored = localStorage.getItem('laundry_transactions');
            list = stored ? JSON.parse(stored) : [];
        } catch(e) { list = []; }

        if (action === 'add') {
            list.unshift(item);
        } else if (action === 'update') {
            const idx = list.findIndex(t => t.id === item.id);
            if (idx !== -1) {
                if (item.statusCucian) list[idx].statusCucian = item.statusCucian;
                if (item.pembayaran) list[idx].pembayaran = item.pembayaran;
                if (item.catatan) list[idx].catatan = item.catatan;
            }
        } else if (action === 'delete') {
            list = list.filter(t => t.id !== item.id);
        }
    }
};

// ============================================================
// AUTHENTICATION HELPER (SUPABASE + LOCAL FALLBACK)
// ============================================================
const LaundryAuth = {
    // 1. Pendaftaran Akun Baru (Register)
    async register(name, email, password, role = 'user') {
        const cleanEmail = email.toLowerCase().trim();
        
        // Cek dulu apakah email sudah ada di Supabase
        if (sbClient) {
            try {
                const { data: existing } = await sbClient
                    .from('profiles')
                    .select('id, email')
                    .eq('email', cleanEmail)
                    .maybeSingle();

                if (existing) {
                    return { success: false, message: 'Email sudah terdaftar! Silakan login menggunakan email tersebut.' };
                }

                // Simpan ke Supabase tabel profiles
                const { data, error } = await sbClient
                    .from('profiles')
                    .insert([{
                        nama: name,
                        email: cleanEmail,
                        password: password,
                        role: role || 'user'
                    }])
                    .select();

                if (error) {
                    console.warn('Supabase register error:', error.message);
                } else {
                    console.log('✅ Profil pengguna tersimpan di Supabase:', data);
                }
            } catch (err) {
                console.warn('Register catch error:', err.message);
            }
        }

        // Simpan juga di localStorage sebagai backup
        const localUsers = LaundryAuth.getLocalUsers();
        if (localUsers.some(u => u.email === cleanEmail)) {
            return { success: false, message: 'Email sudah terdaftar di sistem! Silakan login.' };
        }
        localUsers.push({ nama: name, email: cleanEmail, password: password, role: role || 'user' });
        localStorage.setItem('laundry_registered_users', JSON.stringify(localUsers));

        return { success: true, message: 'Pendaftaran berhasil! Akun Anda kini aktif.' };
    },

    // 2. Masuk ke Akun (Login dengan Validasi Ketat)
    async login(emailOrUsername, password) {
        const identifier = emailOrUsername.toLowerCase().trim();

        // 1. Akun Cepat Demo (demo / demo)
        if (identifier === 'demo' && password === 'demo') {
            const demoUser = {
                nama: 'Demo Admin',
                email: 'demo@laundryku.com',
                role: 'admin',
                isLoggedIn: true
            };
            localStorage.setItem('laundryUser', JSON.stringify(demoUser));
            return { success: true, user: demoUser };
        }

        // 2. Validasi ke Supabase Cloud Database
        if (sbClient) {
            try {
                const { data: user, error } = await sbClient
                    .from('profiles')
                    .select('*')
                    .eq('email', identifier)
                    .maybeSingle();

                if (!error && user) {
                    // Cek kata sandi
                    if (user.password && user.password !== password) {
                        return { 
                            success: false, 
                            message: 'Kata sandi salah! Silakan periksa kembali password Anda.' 
                        };
                    }

                    // Jika password cocok
                    const sessionUser = {
                        id: user.id,
                        nama: user.nama,
                        email: user.email,
                        role: user.role || 'user',
                        isLoggedIn: true
                    };
                    localStorage.setItem('laundryUser', JSON.stringify(sessionUser));
                    return { success: true, user: sessionUser };
                }
            } catch (err) {
                console.warn('Supabase login check error:', err.message);
            }
        }

        // 3. Validasi ke Local Storage (Penyimpanan Lokal)
        const localUsers = LaundryAuth.getLocalUsers();
        const localUser = localUsers.find(u => u.email === identifier);
        if (localUser) {
            if (localUser.password !== password) {
                return { 
                    success: false, 
                    message: 'Kata sandi salah! Silakan periksa kembali password Anda.' 
                };
            }
            const sessionUser = {
                nama: localUser.nama,
                email: localUser.email,
                role: localUser.role || 'user',
                isLoggedIn: true
            };
            localStorage.setItem('laundryUser', JSON.stringify(sessionUser));
            return { success: true, user: sessionUser };
        }

        // 4. Cek Akun Default Bawaan jika baru pertama kali dijalankan
        if (identifier === 'admin@laundryku.com') {
            if (password === 'admin123') {
                const adminUser = { nama: 'Admin LaundryKu', email: 'admin@laundryku.com', role: 'admin', isLoggedIn: true };
                localStorage.setItem('laundryUser', JSON.stringify(adminUser));
                return { success: true, user: adminUser };
            } else {
                return { success: false, message: 'Kata sandi salah! Silakan periksa kembali password Anda.' };
            }
        }
        if (identifier === 'budi@gmail.com') {
            if (password === 'budi123') {
                const budiUser = { nama: 'Budi Santoso', email: 'budi@gmail.com', role: 'user', isLoggedIn: true };
                localStorage.setItem('laundryUser', JSON.stringify(budiUser));
                return { success: true, user: budiUser };
            } else {
                return { success: false, message: 'Kata sandi salah! Silakan periksa kembali password Anda.' };
            }
        }

        // 5. Jika akun tidak ada sama sekali di database maupun lokal
        return { 
            success: false, 
            message: `Akun "${identifier}" belum terdaftar. Silakan daftar akun baru terlebih dahulu.` 
        };
    },

    // Ambil daftar user lokal
    getLocalUsers() {
        try {
            const saved = localStorage.getItem('laundry_registered_users');
            if (saved) return JSON.parse(saved);
        } catch(e) {}
        const defaultUsers = [
            { nama: 'Admin LaundryKu', email: 'admin@laundryku.com', password: 'admin123', role: 'admin' },
            { nama: 'Budi Santoso', email: 'budi@gmail.com', password: 'budi123', role: 'user' }
        ];
        localStorage.setItem('laundry_registered_users', JSON.stringify(defaultUsers));
        return defaultUsers;
    },

    // Ambil user yang sedang aktif login
    getCurrentUser() {
        try {
            const saved = localStorage.getItem('laundryUser');
            return saved ? JSON.parse(saved) : null;
        } catch(e) {
            return null;
        }
    },

    // Keluar (Logout)
    logout() {
        localStorage.removeItem('laundryUser');
        window.location.href = 'Login.html';
    }
};

window.LaundryDB = LaundryDB;
window.LaundryAuth = LaundryAuth;

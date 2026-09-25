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
        let localList = [];
        try {
            const local = localStorage.getItem('laundry_transactions');
            if (local) localList = JSON.parse(local);
        } catch(e){}

        if (sbClient) {
            try {
                const { data, error } = await sbClient
                    .from('transaksi')
                    .select('*')
                    .order('id', { ascending: false });

                if (!error && data && data.length > 0) {
                    // Normalisasi kolom
                    return data.map(item => {
                        const localItem = localList.find(l => l.id === (item.kode_transaksi || ('TRX00' + item.id))) || {};
                        return {
                            id: item.kode_transaksi || ('TRX00' + item.id),
                            dbId: item.id,
                            pelangganId: item.pelanggan_id,
                            pelanggan: item.pelanggan_nama,
                            telepon: item.nomor_telepon || '-',
                            layananId: item.layanan_id,
                            layanan: item.layanan_nama,
                            berat: parseFloat(item.berat) || 1,
                            total: parseFloat(item.total) || 0,
                            statusCucian: item.status_cucian,
                            pembayaran: item.status_pembayaran,
                            tanggal: item.tanggal_masuk,
                            estimasi: item.estimasi_selesai,
                            catatan: item.catatan || '-',
                            metodeBayar: localItem.metodeBayar || (item.status_pembayaran === 'Lunas' ? 'Tunai' : '-'),
                            nominalDP: localItem.nominalDP || 0,
                            cashReceived: localItem.cashReceived || 0,
                            kembalian: localItem.kembalian || 0
                        };
                    });
                }
            } catch (err) {
                console.warn('Supabase fetch error, using local fallback:', err.message);
            }
        }
        // Fallback: Ambil dari localStorage
        if (localList && localList.length > 0) {
            return localList;
        }
        return null; // Gunakan default awal
    },

    // 2. Simpan Transaksi Baru
    async addTransaction(trx) {
        let currentUser = null;
        try {
            if (typeof LaundryAuth !== 'undefined' && LaundryAuth.getCurrentUser) {
                currentUser = LaundryAuth.getCurrentUser();
            }
        } catch(e){}

        // Simpan ke Supabase jika aktif
        if (sbClient) {
            try {
                const insertPayload = {
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
                };

                if (trx.pelangganId && !isNaN(Number(trx.pelangganId))) {
                    insertPayload.pelanggan_id = Number(trx.pelangganId);
                }
                if (trx.layananId && !isNaN(Number(trx.layananId))) {
                    insertPayload.layanan_id = Number(trx.layananId);
                }
                if (currentUser && currentUser.id) {
                    insertPayload.user_id = currentUser.id;
                }

                const { data, error } = await sbClient
                    .from('transaksi')
                    .insert([insertPayload])
                    .select();

                if (!error && data && data[0]) {
                    trx.dbId = data[0].id;
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
    async updateStatus(id, newStatus, newPayment, catatan = '', extraMeta = {}) {
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
        LaundryDB.syncLocal({ id, statusCucian: newStatus, pembayaran: newPayment, ...extraMeta }, 'update');
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
                if (item.metodeBayar) list[idx].metodeBayar = item.metodeBayar;
                if (typeof item.nominalDP !== 'undefined') list[idx].nominalDP = item.nominalDP;
                if (typeof item.cashReceived !== 'undefined') list[idx].cashReceived = item.cashReceived;
                if (typeof item.kembalian !== 'undefined') list[idx].kembalian = item.kembalian;
            }
        } else if (action === 'delete') {
            list = list.filter(t => t.id !== item.id);
        }
        localStorage.setItem('laundry_transactions', JSON.stringify(list));
    },

    // 4.1 Ambil Riwayat Status Real dari Supabase
    async getTransactionHistory(trxId, dbId) {
        if (sbClient && dbId) {
            try {
                const { data, error } = await sbClient
                    .from('riwayat_status')
                    .select('*')
                    .eq('transaksi_id', dbId)
                    .order('waktu', { ascending: true });
                if (!error && data && data.length > 0) {
                    return data;
                }
            } catch(e){
                console.warn('Supabase fetch riwayat error:', e.message);
            }
        }
        return null;
    },

    // 4.2 Ambil Pengaturan Profil Outlet (Supabase + Local)
    async getOutletSettings() {
        if (sbClient) {
            try {
                const { data, error } = await sbClient
                    .from('pengaturan_outlet')
                    .select('*')
                    .eq('id', 1)
                    .maybeSingle();

                if (!error && data) {
                    const mapped = {
                        nama: data.nama_outlet || 'LaundryKu',
                        slogan: data.slogan || 'Bersih, Wangi & Terpercaya',
                        wa: data.nomor_wa || '081234567890',
                        jam: data.jam_operasional || '07:00 - 21:00 WIB',
                        alamat: data.alamat || 'Jl. Kampus No. 12, Limau Manis, Padang',
                        footer: data.footer_nota || 'Terima kasih atas kepercayaannya! Cucian Anda aman bersama kami.'
                    };
                    localStorage.setItem('laundry_outlet_profile', JSON.stringify(mapped));
                    return mapped;
                }
            } catch(e) {
                console.warn('Supabase fetch outlet settings warning:', e.message);
            }
        }
        const local = localStorage.getItem('laundry_outlet_profile');
        if (local) {
            try { return JSON.parse(local); } catch(e){}
        }
        return {
            nama: 'LaundryKu',
            slogan: 'Bersih, Wangi & Terpercaya',
            wa: '081234567890',
            jam: '07:00 - 21:00 WIB',
            alamat: 'Jl. Kampus No. 12, Limau Manis, Padang',
            footer: 'Terima kasih atas kepercayaannya! Cucian Anda aman bersama kami.'
        };
    },

    // 4.3 Simpan Pengaturan Profil Outlet (Supabase + Local)
    async updateOutletSettings(payload) {
        if (sbClient) {
            try {
                await sbClient
                    .from('pengaturan_outlet')
                    .upsert({
                        id: 1,
                        nama_outlet: payload.nama,
                        slogan: payload.slogan,
                        nomor_wa: payload.wa,
                        jam_operasional: payload.jam,
                        alamat: payload.alamat,
                        footer_nota: payload.footer,
                        updated_at: new Date().toISOString()
                    });
                console.log('✅ Pengaturan outlet berhasil disimpan ke Supabase.');
            } catch(e) {
                console.warn('Supabase update outlet settings warning:', e.message);
            }
        }
        localStorage.setItem('laundry_outlet_profile', JSON.stringify(payload));
        return payload;
    },

    // 5. Ambil Data Pelanggan
    async getCustomers() {
        if (sbClient) {
            try {
                const { data, error } = await sbClient
                    .from('pelanggan')
                    .select('*')
                    .order('id', { ascending: true });

                if (!error && data && data.length > 0) {
                    return data.map(c => ({
                        id: c.id,
                        code: 'PLG00' + c.id,
                        nama: c.nama,
                        telepon: c.nomor_telepon || '-',
                        alamat: c.alamat || '-',
                        catatan: c.catatan || '-',
                        tanggal: c.created_at ? c.created_at.split('T')[0] : '2026-09-01'
                    }));
                }
            } catch (err) {
                console.warn('Supabase fetch pelanggan error:', err.message);
            }
        }
        // Fallback: Ambil dari localStorage
        const local = localStorage.getItem('laundry_customers');
        if (local) {
            try { return JSON.parse(local); } catch(e){}
        }
        // Default awal jika kosong
        const defaultCustomers = [
            { id: 1, code: 'PLG001', nama: 'Budi Santoso',     telepon: '081234567890', alamat: 'Jl. Kaliurang KM 5, Yogyakarta',   catatan: 'Pelanggan express prioritas', tanggal: '2026-09-01' },
            { id: 2, code: 'PLG002', nama: 'Siti Rahayu',      telepon: '081398765432', alamat: 'Jl. Gejayan No. 12, Sleman',       catatan: 'Langganan dry clean jas kantor', tanggal: '2026-09-02' },
            { id: 3, code: 'PLG003', nama: 'Ahmad Wahyu',      telepon: '082155667788', alamat: 'Jl. Seturan Raya No. 45, Depok',   catatan: 'Jangan pakai pewangi menyengat', tanggal: '2026-09-03' },
            { id: 4, code: 'PLG004', nama: 'Dewi Lestari',     telepon: '085711223344', alamat: 'Jl. Palagan KM 8, Ngaglik',       catatan: 'Sering cuci sepatu sneakers', tanggal: '2026-09-05' },
            { id: 5, code: 'PLG005', nama: 'Eko Prasetyo',     telepon: '081900112233', alamat: 'Jl. Monjali No. 20, Sleman',      catatan: 'Kemeja kerja selalu dilipat rapi', tanggal: '2026-09-06' },
            { id: 6, code: 'PLG006', nama: 'Rina Wati',        telepon: '087833445566', alamat: 'Jl. Colombo No. 8, Yogyakarta',    catatan: 'Pakaian bayi pisahkan deterjen', tanggal: '2026-09-08' },
            { id: 7, code: 'PLG007', nama: 'Hendra Kurniawan', telepon: '081288990011', alamat: 'Jl. Solo KM 9, Kalasan',          catatan: 'Cuci bed cover dan sprei tebal', tanggal: '2026-09-10' }
        ];
        localStorage.setItem('laundry_customers', JSON.stringify(defaultCustomers));
        return defaultCustomers;
    },

    // 6. Tambah Pelanggan
    async addCustomer(cust) {
        let insertedId = Date.now();
        if (sbClient) {
            try {
                const { data, error } = await sbClient
                    .from('pelanggan')
                    .insert([{
                        nama: cust.nama,
                        nomor_telepon: cust.telepon,
                        alamat: cust.alamat || '-',
                        catatan: cust.catatan || '-'
                    }])
                    .select();

                if (!error && data && data[0]) {
                    insertedId = data[0].id;
                }
            } catch (err) {
                console.warn('Supabase add customer error:', err.message);
            }
        }
        const newCust = {
            id: insertedId,
            code: 'PLG00' + (typeof insertedId === 'number' && insertedId < 1000 ? insertedId : Math.floor(Math.random() * 800 + 100)),
            nama: cust.nama,
            telepon: cust.telepon,
            alamat: cust.alamat || '-',
            catatan: cust.catatan || '-',
            tanggal: new Date().toISOString().split('T')[0]
        };
        LaundryDB.syncCustomer(newCust, 'add');
        return newCust;
    },

    // 7. Update Pelanggan
    async updateCustomer(id, updatedData) {
        if (sbClient) {
            try {
                await sbClient
                    .from('pelanggan')
                    .update({
                        nama: updatedData.nama,
                        nomor_telepon: updatedData.telepon,
                        alamat: updatedData.alamat,
                        catatan: updatedData.catatan
                    })
                    .eq('id', id);
            } catch (err) {
                console.warn('Supabase update customer warning:', err.message);
            }
        }
        LaundryDB.syncCustomer({ id, ...updatedData }, 'update');
    },

    // 8. Hapus Pelanggan
    async deleteCustomer(id) {
        if (sbClient) {
            try {
                await sbClient.from('pelanggan').delete().eq('id', id);
            } catch (err) {
                console.warn('Supabase delete customer warning:', err.message);
            }
        }
        LaundryDB.syncCustomer({ id }, 'delete');
    },

    // Helper sinkronisasi Customer LocalStorage
    syncCustomer(item, action) {
        let list = [];
        try {
            const stored = localStorage.getItem('laundry_customers');
            list = stored ? JSON.parse(stored) : [];
        } catch(e) { list = []; }

        if (action === 'add') {
            list.unshift(item);
        } else if (action === 'update') {
            const idx = list.findIndex(c => String(c.id) === String(item.id));
            if (idx !== -1) {
                list[idx] = { ...list[idx], ...item };
            }
        } else if (action === 'delete') {
            list = list.filter(c => String(c.id) !== String(item.id));
        }
        localStorage.setItem('laundry_customers', JSON.stringify(list));
    },

    // 9. Ambil Master Layanan (Tarif)
    async getServices() {
        if (sbClient) {
            try {
                const { data, error } = await sbClient
                    .from('layanan')
                    .select('*')
                    .order('id', { ascending: true });
                if (!error && data && data.length > 0) {
                    return data.map(s => ({
                        id: s.id,
                        nama: s.nama_layanan,
                        tarif: parseFloat(s.harga) || 0,
                        satuan: s.satuan || 'kg',
                        durasi: s.durasi_jam ? `${s.durasi_jam} Jam` : '2 Hari',
                        durasi_jam: s.durasi_jam || 24,
                        aktif: s.status === 'aktif'
                    }));
                }
            } catch(e){
                console.warn('Supabase fetch layanan error:', e.message);
            }
        }
        const local = localStorage.getItem('laundry_services');
        if (local) {
            try { return JSON.parse(local); } catch(e){}
        }
        const defaultServices = [
            { id: 1, nama: 'Cuci Setrika', tarif: 10000, satuan: 'kg', durasi: '48 Jam', durasi_jam: 48, aktif: true },
            { id: 2, nama: 'Cuci Reguler', tarif: 5000, satuan: 'kg', durasi: '48 Jam', durasi_jam: 48, aktif: true },
            { id: 3, nama: 'Cuci Express', tarif: 8000, satuan: 'kg', durasi: '24 Jam', durasi_jam: 24, aktif: true },
            { id: 4, nama: 'Dry Clean', tarif: 15000, satuan: 'pcs', durasi: '72 Jam', durasi_jam: 72, aktif: true },
            { id: 5, nama: 'Laundry Sepatu', tarif: 20000, satuan: 'pcs', durasi: '72 Jam', durasi_jam: 72, aktif: true }
        ];
        localStorage.setItem('laundry_services', JSON.stringify(defaultServices));
        return defaultServices;
    },

    // 10. Tambah Layanan Baru
    async addService(svc) {
        let insertedId = Date.now();
        if (sbClient) {
            try {
                const { data, error } = await sbClient
                    .from('layanan')
                    .insert([{
                        nama_layanan: svc.nama,
                        harga: svc.tarif,
                        satuan: svc.satuan || 'kg',
                        durasi_jam: parseInt(svc.durasi) || 24,
                        status: svc.aktif ? 'aktif' : 'nonaktif'
                    }])
                    .select();
                if (!error && data && data[0]) {
                    insertedId = data[0].id;
                }
            } catch (err) {
                console.warn('Supabase add layanan error:', err.message);
            }
        }
        const newService = {
            id: insertedId,
            nama: svc.nama,
            tarif: svc.tarif,
            satuan: svc.satuan,
            durasi: svc.durasi || '24 Jam',
            aktif: svc.aktif !== false
        };
        LaundryDB.syncService(newService, 'add');
        return newService;
    },

    // 11. Update Layanan
    async updateService(id, svc) {
        if (sbClient) {
            try {
                await sbClient
                    .from('layanan')
                    .update({
                        nama_layanan: svc.nama,
                        harga: svc.tarif,
                        satuan: svc.satuan,
                        durasi_jam: parseInt(svc.durasi) || 24,
                        status: svc.aktif ? 'aktif' : 'nonaktif'
                    })
                    .eq('id', id);
            } catch (err) {
                console.warn('Supabase update layanan error:', err.message);
            }
        }
        LaundryDB.syncService({ id, ...svc }, 'update');
    },

    // 12. Toggle Status Layanan (Aktif / Nonaktif)
    async toggleServiceStatus(id, newStatusBool) {
        const statusStr = newStatusBool ? 'aktif' : 'nonaktif';
        if (sbClient) {
            try {
                await sbClient
                    .from('layanan')
                    .update({ status: statusStr })
                    .eq('id', id);
            } catch (err) {
                console.warn('Supabase toggle layanan error:', err.message);
            }
        }
        LaundryDB.syncService({ id, aktif: newStatusBool }, 'update');
    },

    // Helper Sinkronisasi Layanan LocalStorage
    syncService(item, action) {
        let list = [];
        try {
            const stored = localStorage.getItem('laundry_services');
            list = stored ? JSON.parse(stored) : [];
        } catch(e) { list = []; }

        if (action === 'add') {
            list.push(item);
        } else if (action === 'update') {
            const idx = list.findIndex(s => String(s.id) === String(item.id));
            if (idx !== -1) {
                list[idx] = { ...list[idx], ...item };
            }
        } else if (action === 'delete') {
            list = list.filter(s => String(s.id) !== String(item.id));
        }
        localStorage.setItem('laundry_services', JSON.stringify(list));
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

        // Jika mendaftar sebagai pelanggan/user, otomatis daftarkan juga ke direktori pelanggan tetap
        if (role === 'user') {
            try {
                await LaundryDB.addCustomer({
                    nama: name,
                    telepon: '-',
                    alamat: '-',
                    catatan: `Terdaftar mandiri via web (${cleanEmail})`
                });
            } catch (e) {
                console.warn('Auto sync pelanggan error:', e);
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
    },

    // Perbarui Nama Profil
    async updateProfileName(email, newName) {
        if (sbClient) {
            try {
                await sbClient
                    .from('profiles')
                    .update({ nama: newName })
                    .eq('email', email);
            } catch(e) {
                console.warn('Supabase update profile error:', e.message);
            }
        }
        try {
            const cur = LaundryAuth.getCurrentUser();
            if (cur) {
                cur.nama = newName;
                localStorage.setItem('laundryUser', JSON.stringify(cur));
            }
            const regUsers = LaundryAuth.getLocalUsers();
            const idx = regUsers.findIndex(u => u.email === email);
            if (idx !== -1) {
                regUsers[idx].nama = newName;
                localStorage.setItem('laundry_registered_users', JSON.stringify(regUsers));
            }
        } catch(e){}
    },

    // Perbarui Password Pengguna
    async updatePassword(email, newPassword) {
        if (sbClient) {
            try {
                await sbClient
                    .from('profiles')
                    .update({ password: newPassword })
                    .eq('email', email);
            } catch(e) {
                console.warn('Supabase update password error:', e.message);
            }
        }
        try {
            const regUsers = LaundryAuth.getLocalUsers();
            const idx = regUsers.findIndex(u => u.email === email);
            if (idx !== -1) {
                regUsers[idx].password = newPassword;
                localStorage.setItem('laundry_registered_users', JSON.stringify(regUsers));
            }
        } catch(e){}
    },

    // 5. Auth Guard & Role Verification
    requireAuth(allowedRoles = null) {
        const user = LaundryAuth.getCurrentUser();
        if (!user || !user.isLoggedIn) {
            console.warn('⚠️ Sesi login tidak ditemukan. Mengalihkan ke Login.html');
            window.location.href = 'Login.html';
            return null;
        }
        if (allowedRoles && Array.isArray(allowedRoles) && !allowedRoles.includes(user.role)) {
            alert('Akses Terbatas: Halaman ini hanya untuk hak akses ' + allowedRoles.join('/') + '.');
            window.location.href = 'dashboard.html';
            return null;
        }
        return user;
    }
};

window.LaundryDB = LaundryDB;
window.LaundryAuth = LaundryAuth;

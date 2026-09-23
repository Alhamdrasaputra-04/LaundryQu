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
        localStorage.setItem('laundry_transactions', JSON.stringify(list));
    }
};

window.LaundryDB = LaundryDB;

/* ============================================================
   dashboard-user.js — Logika Portal Pelanggan & Tracking Cucian
   ============================================================ */

const STAGES = [
    { key: 'Baru Masuk',   label: 'Pesanan Diterima',    desc: 'Cucian telah diterima dan dicatat di kasir' },
    { key: 'Dicuci',       label: 'Sedang Dicuci',       desc: 'Pakaian sedang dicuci bersih di mesin cuci' },
    { key: 'Dikeringkan',  label: 'Sedang Dikeringkan',  desc: 'Proses pengeringan higienis suhu teratur' },
    { key: 'Disetrika',    label: 'Sedang Disetrika',    desc: 'Disetrika rapi, licin, dan diberi pewangi' },
    { key: 'Siap Diambil', label: 'Siap Diambil',        desc: 'Cucian rapi, terbungkus rapi, siap diambil di kasir' },
    { key: 'Selesai',      label: 'Selesai',             desc: 'Pakaian telah diambil oleh pelanggan' }
];

const STATUS_BADGE = {
    'Baru Masuk':   'badge-new',
    'Dicuci':       'badge-process',
    'Dikeringkan':  'badge-process',
    'Disetrika':    'badge-process',
    'Siap Diambil': 'badge-ready',
    'Selesai':      'badge-done',
};

const BAYAR_BADGE = {
    'Lunas': 'badge-lunas',
    'DP':    'badge-dp',
    'Belum': 'badge-belum',
};

let currentUser = null;
let allTransactions = [];
let myTransactions = [];
let currentOutlet = null;

// ============================================================
// DOM READY & INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth Guard
    if (window.LaundryAuth && LaundryAuth.requireAuth) {
        currentUser = LaundryAuth.requireAuth();
        if (!currentUser) return;
    } else {
        currentUser = { nama: 'Budi Santoso', email: 'budi@gmail.com', role: 'user' };
    }

    initNavbarAndUser();
    await loadOutletSettings();
    await loadUserTransactions();
    initSearchFilter();
    initModals();
});

// ============================================================
// NAVBAR & PROFILE
// ============================================================
function initNavbarAndUser() {
    const avatarEl = document.getElementById('userAvatarText');
    const nameEl   = document.getElementById('userNameDisplay');
    const emailEl  = document.getElementById('userEmailDisplay');
    const welcomeEl= document.getElementById('welcomeTitle');

    const displayName = currentUser.nama || 'Pelanggan';
    const initial = displayName.charAt(0).toUpperCase();

    if (avatarEl) avatarEl.textContent = initial;
    if (nameEl)   nameEl.textContent   = displayName;
    if (emailEl)  emailEl.textContent  = currentUser.email || 'pelanggan@email.com';
    if (welcomeEl)welcomeEl.textContent= `Halo, ${displayName}! 👋`;

    const logoutBtn = document.getElementById('btnLogoutUser');
    logoutBtn && logoutBtn.addEventListener('click', () => {
        if (confirm('Apakah Anda yakin ingin keluar dari akun?')) {
            if (window.LaundryAuth && LaundryAuth.logout) {
                LaundryAuth.logout();
            } else {
                localStorage.removeItem('laundryUser');
                window.location.href = 'Login.html';
            }
        }
    });
}

// ============================================================
// OUTLET SETTINGS SYNC
// ============================================================
async function loadOutletSettings() {
    try {
        if (window.LaundryDB && LaundryDB.getOutletSettings) {
            currentOutlet = await LaundryDB.getOutletSettings();
        } else {
            currentOutlet = {
                nama: 'LaundryKu',
                slogan: 'Bersih, Wangi & Terpercaya',
                wa: '081234567890',
                jam: '07:00 - 21:00 WIB',
                alamat: 'Jl. Kampus No. 12, Limau Manis, Padang',
                footer: 'Terima kasih atas kepercayaannya!'
            };
        }
    } catch(e){
        console.warn('Gagal memuat profil outlet:', e);
    }

    if (!currentOutlet) return;

    const tagEl = document.getElementById('outletNameTag');
    if (tagEl) tagEl.textContent = currentOutlet.nama || 'LaundryKu';

    const waBtn = document.getElementById('btnWhatsAppOutlet');
    if (waBtn && currentOutlet.wa) {
        let cleanWA = currentOutlet.wa.replace(/[^0-9]/g, '');
        if (cleanWA.startsWith('0')) cleanWA = '62' + cleanWA.slice(1);
        const text = encodeURIComponent(`Halo Kasir ${currentOutlet.nama}, saya ${currentUser.nama || 'pelanggan'} ingin menanyakan status cucian saya...`);
        waBtn.href = `https://wa.me/${cleanWA}?text=${text}`;
    }

    // Modal Outlet Body
    const modalBody = document.getElementById('outletModalBody');
    if (modalBody) {
        modalBody.innerHTML = `
            <div style="text-align:center;margin-bottom:16px;">
                <div style="font-size:22px;font-weight:800;color:var(--primary);">${currentOutlet.nama}</div>
                <div style="font-size:12px;color:var(--text-3);">${currentOutlet.slogan}</div>
            </div>
            <div style="background:#F8FAFC;border-radius:12px;padding:16px;border:1px solid #E2E8F0;font-size:13px;display:flex;flex-direction:column;gap:12px;">
                <div>
                    <span style="color:#64748B;font-size:11.5px;display:block;">Alamat Gerai:</span>
                    <b style="color:#1E293B;">${currentOutlet.alamat}</b>
                </div>
                <div>
                    <span style="color:#64748B;font-size:11.5px;display:block;">Jam Operasional:</span>
                    <b style="color:#1E293B;">${currentOutlet.jam}</b>
                </div>
                <div>
                    <span style="color:#64748B;font-size:11.5px;display:block;">WhatsApp Kasir:</span>
                    <b style="color:#10B981;">${currentOutlet.wa}</b>
                </div>
            </div>
        `;
    }
}

// ============================================================
// LOAD TRANSAKSI KHUSUS PELANGGAN
// ============================================================
async function loadUserTransactions() {
    try {
        if (window.LaundryDB && LaundryDB.getTransactions) {
            allTransactions = await LaundryDB.getTransactions() || [];
        } else {
            const stored = localStorage.getItem('laundry_transactions');
            allTransactions = stored ? JSON.parse(stored) : [];
        }
    } catch(e) {
        allTransactions = [];
    }

    // Filter hanya transaksi milik user yang sedang aktif login
    const myName = (currentUser.nama || '').toLowerCase().trim();
    const myEmail = (currentUser.email || '').toLowerCase().trim();

    myTransactions = allTransactions.filter(t => {
        const matchName = t.pelanggan && t.pelanggan.toLowerCase().trim() === myName;
        const matchUser = t.user_id && currentUser.id && t.user_id === currentUser.id;
        // Khusus pengujian demo budi
        const isBudiDemo = myEmail.includes('budi') && t.pelanggan && t.pelanggan.toLowerCase().includes('budi');
        return matchName || matchUser || isBudiDemo;
    });

    // Jika akun baru belum memiliki riwayat, gunakan data relevan atau fallback bersih
    updateSummaryMetrics();
    await renderLiveTrackingHero();
    renderOrdersTable(myTransactions);
}

// ============================================================
// 4 SUMMARY METRICS
// ============================================================
function updateSummaryMetrics() {
    let diprosesCount = 0;
    let siapCount = 0;
    let totalUnpaid = 0;

    myTransactions.forEach(t => {
        if (['Baru Masuk', 'Dicuci', 'Dikeringkan', 'Disetrika'].includes(t.statusCucian)) {
            diprosesCount++;
        }
        if (t.statusCucian === 'Siap Diambil') {
            siapCount++;
        }
        if (t.pembayaran !== 'Lunas') {
            totalUnpaid += Number(t.total) || 0;
        }
    });

    const elDiproses = document.getElementById('valDiproses');
    const elSiap     = document.getElementById('valSiap');
    const elTagihan  = document.getElementById('valTagihan');
    const elTotal    = document.getElementById('valTotalPesanan');

    if (elDiproses) elDiproses.textContent = diprosesCount;
    if (elSiap)     elSiap.textContent     = siapCount;
    if (elTagihan)  elTagihan.textContent  = 'Rp ' + totalUnpaid.toLocaleString('id-ID');
    if (elTotal)    elTotal.textContent    = myTransactions.length;
}

// ============================================================
// HERO: LIVE TRACKING TIMELINE
// ============================================================
async function renderLiveTrackingHero() {
    const container = document.getElementById('liveTrackingContainer');
    if (!container) return;

    // Cari transaksi aktif yang paling mendesak (prioritas: Siap Diambil > Diproses)
    const activeOrder = myTransactions.find(t => t.statusCucian === 'Siap Diambil') ||
                        myTransactions.find(t => ['Disetrika', 'Dikeringkan', 'Dicuci', 'Baru Masuk'].includes(t.statusCucian)) ||
                        myTransactions[0];

    // Jika tidak ada transaksi sama sekali
    if (!activeOrder) {
        container.innerHTML = `
            <div class="hero-tracking-card" style="background:linear-gradient(135deg, #1E293B, #334155);text-align:center;padding:40px 24px;">
                <div style="font-size:36px;margin-bottom:12px;">🧺</div>
                <h2 style="font-size:20px;font-weight:700;color:white;margin-bottom:8px;">Belum Ada Cucian yang Berjalan</h2>
                <p style="color:#CBD5E1;font-size:13px;max-width:480px;margin:0 auto 20px auto;">
                    Pakaian kotor menumpuk? Bawa cucian Anda ke gerai LaundryKu atau hubungi admin kasir via WhatsApp untuk penjemputan!
                </p>
                <a href="#btnWhatsAppOutlet" onclick="document.getElementById('btnWhatsAppOutlet').click()" class="btn-contact-outlet" style="padding:10px 20px;font-size:13px;">
                    💬 Pesan Laundry Sekarang
                </a>
            </div>
        `;
        return;
    }

    // Ambil riwayat status asli jika ada
    let realHistory = [];
    try {
        if (window.LaundryDB && LaundryDB.getTransactionHistory) {
            realHistory = await LaundryDB.getTransactionHistory(activeOrder.id, activeOrder.dbId) || [];
        }
    } catch(e){}

    const stageKeys = STAGES.map(s => s.key);
    const currentIdx = stageKeys.indexOf(activeOrder.statusCucian);

    let headline = `Sedang Diproses: ${activeOrder.statusCucian}`;
    let subMessage = `Pesanan #${activeOrder.id} (${activeOrder.layanan} &bull; ${activeOrder.berat} kg) sedang dikerjakan dengan standar higienis.`;

    if (activeOrder.statusCucian === 'Siap Diambil') {
        headline = 'Pakaian Anda Sudah SIAP DIAMBIL! 🎉';
        subMessage = `Cucian #${activeOrder.id} sudah selesai dicuci rapi & wangi. Silakan ambil di kasir outlet kami.`;
    } else if (activeOrder.statusCucian === 'Selesai') {
        headline = 'Pesanan Terakhir Telah Selesai ✓';
        subMessage = `Cucian #${activeOrder.id} telah selesai dan diserahkan kepada Anda. Terima kasih atas kepercayaannya!`;
    }

    container.innerHTML = `
        <div class="hero-tracking-card">
            <div class="hero-tracking-top">
                <div class="live-pill">
                    <span class="live-dot"></span>
                    <span>LIVE TRACKING CUCIAN</span>
                </div>
                <span class="hero-trx-id">Kode Nota: #${activeOrder.id}</span>
            </div>

            <h2 class="hero-main-status">${headline}</h2>
            <p class="hero-meta-desc">${subMessage}</p>

            <!-- 6-Step Visual Timeline Track -->
            <div class="live-timeline-track">
                ${STAGES.map((s, idx) => {
                    let stepClass = '';
                    let dotIcon = (idx + 1);

                    if (idx < currentIdx) {
                        stepClass = 'completed';
                        dotIcon = '✓';
                    } else if (idx === currentIdx) {
                        stepClass = 'active';
                        dotIcon = '●';
                    }

                    // Cek log riwayat riil
                    const log = realHistory.find(h => h.status === s.key);
                    const timeInfo = log && log.waktu ? new Date(log.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '';

                    return `
                        <div class="lt-step ${stepClass}">
                            <div class="lt-dot">${dotIcon}</div>
                            <span class="lt-label">
                                ${s.label}
                                ${timeInfo ? `<div style="font-size:10px;color:#CBD5E1;font-weight:400;margin-top:2px;">${timeInfo} WIB</div>` : ''}
                            </span>
                        </div>
                    `;
                }).join('')}
            </div>

            <div class="hero-footer-bar">
                <div class="hf-info-item">
                    <span>Estimasi Selesai: </span>
                    <b>${activeOrder.estimasi || 'Hari ini'}</b>
                </div>
                <div class="hf-info-item">
                    <span>Status Tagihan: </span>
                    <b style="color:${activeOrder.pembayaran === 'Lunas' ? '#10B981' : '#F59E0B'};">${activeOrder.pembayaran} (Rp ${(Number(activeOrder.total)||0).toLocaleString('id-ID')})</b>
                </div>
                <div>
                    <button type="button" class="btn-view-receipt" onclick="openUserReceipt('${activeOrder.id}')" style="padding:7px 16px;background:rgba(255,255,255,0.15);color:white;border:1px solid rgba(255,255,255,0.3);">
                        🧾 Lihat Struk Digital
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ============================================================
// TABEL RIWAYAT TRANSAKSI SAYA
// ============================================================
function renderOrdersTable(data) {
    const tbody = document.getElementById('userOrdersTbody');
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;padding:40px;color:#94A3B8;font-size:13.5px;">
                    Belum ada riwayat transaksi cucian yang ditemukan
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = data.map(trx => {
        return `
            <tr>
                <td><b style="color:var(--navy);font-size:13.5px;">#${trx.id}</b></td>
                <td>${trx.tanggal || '-'}</td>
                <td>${trx.estimasi || '-'}</td>
                <td>
                    <div style="font-weight:600;color:var(--text-1);">${trx.layanan}</div>
                    <div style="font-size:11.5px;color:var(--text-3);">${trx.berat || 1} kg/pcs</div>
                </td>
                <td><b style="color:var(--primary);font-size:13.5px;">Rp ${(Number(trx.total)||0).toLocaleString('id-ID')}</b></td>
                <td><span class="badge ${BAYAR_BADGE[trx.pembayaran] || 'badge-belum'}">${trx.pembayaran}</span></td>
                <td><span class="badge ${STATUS_BADGE[trx.statusCucian] || 'badge-new'}">${trx.statusCucian}</span></td>
                <td style="text-align:right;">
                    <button type="button" class="btn-view-receipt" onclick="openUserReceipt('${trx.id}')">
                        <svg style="width:13px;height:13px;fill:currentColor;" viewBox="0 0 24 24"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M16,18H8V16H16V18M16,14H8V12H16V14M13,9V3.5L18.5,9H13Z"/></svg>
                        <span>Struk</span>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ============================================================
// SEARCH FILTER
// ============================================================
function initSearchFilter() {
    const input = document.getElementById('searchUserOrders');
    if (!input) return;

    input.addEventListener('input', () => {
        const q = input.value.toLowerCase().trim();
        const filtered = myTransactions.filter(t => 
            t.id.toLowerCase().includes(q) ||
            t.layanan.toLowerCase().includes(q) ||
            t.statusCucian.toLowerCase().includes(q)
        );
        renderOrdersTable(filtered);
    });
}

// ============================================================
// MODAL DIALOGS (STRUK & OUTLET)
// ============================================================
function initModals() {
    // Modal Struk
    const receiptOverlay = document.getElementById('receiptModalOverlay');
    const closeRecBtn    = document.getElementById('closeReceiptModal');
    const closeRecBtn2   = document.getElementById('closeReceiptBtn');

    function closeReceipt() {
        if (receiptOverlay) {
            receiptOverlay.classList.remove('show');
            document.body.style.overflow = '';
        }
    }
    closeRecBtn && closeRecBtn.addEventListener('click', closeReceipt);
    closeRecBtn2 && closeRecBtn2.addEventListener('click', closeReceipt);
    receiptOverlay && receiptOverlay.addEventListener('click', e => { if (e.target === receiptOverlay) closeReceipt(); });

    // Modal Outlet
    const outletOverlay = document.getElementById('outletModalOverlay');
    const openOutletBtn = document.getElementById('btnOpenOutletInfo');
    const closeOutletBtn= document.getElementById('closeOutletModal');
    const okOutletBtn   = document.getElementById('btnOkOutletModal');

    function openOutlet() {
        if (outletOverlay) {
            outletOverlay.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }
    function closeOutlet() {
        if (outletOverlay) {
            outletOverlay.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    openOutletBtn && openOutletBtn.addEventListener('click', openOutlet);
    closeOutletBtn && closeOutletBtn.addEventListener('click', closeOutlet);
    okOutletBtn && okOutletBtn.addEventListener('click', closeOutlet);
    outletOverlay && outletOverlay.addEventListener('click', e => { if (e.target === outletOverlay) closeOutlet(); });
}

// Tampilkan Struk Pelanggan
async function openUserReceipt(id) {
    const trx = allTransactions.find(t => t.id === id);
    if (!trx) return;

    const overlay = document.getElementById('receiptModalOverlay');
    const box     = document.getElementById('printableReceiptBox');
    if (!overlay || !box) return;

    const outlet = currentOutlet || {
        nama: 'LAUNDRYKU',
        slogan: 'Sistem Manajemen Laundry Modern & Higienis',
        alamat: 'Jl. Kampus No. 12, Padang',
        wa: '0812-3456-7890',
        footer: 'Terima kasih atas kunjungan & kepercayaan Anda!'
    };

    const totalVal = Number(trx.total) || 0;
    const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
    const isLunas = trx.pembayaran === 'Lunas';
    const isDP = trx.pembayaran === 'DP';

    box.innerHTML = `
        <div class="receipt-header">
            <div class="receipt-logo">${(outlet.nama || 'LAUNDRYKU').toUpperCase()}</div>
            <div style="font-size:11px; color:#64748B; margin-top:2px;">${outlet.slogan || 'Sistem Manajemen Laundry Modern'}</div>
            <div style="font-size:11.5px; margin-top:4px;">${outlet.alamat || 'Jl. Kampus No. 12, Padang'}</div>
            <div style="font-size:11.5px;">WA: ${outlet.wa || '0812-3456-7890'}</div>
        </div>
        <div class="receipt-line">
            <span>No. Nota:</span>
            <b style="font-size:13px;">#${trx.id}</b>
        </div>
        <div class="receipt-line">
            <span>Waktu Cetak:</span>
            <span>${nowStr}</span>
        </div>
        <div class="receipt-line">
            <span>Nama Pelanggan:</span>
            <b>${trx.pelanggan}</b>
        </div>
        <div class="receipt-line">
            <span>No. Telepon:</span>
            <span>${trx.telepon || '-'}</span>
        </div>
        <hr style="border:none; border-top:1px dashed #CBD5E1; margin:8px 0;">
        <div class="receipt-line">
            <span>${trx.layanan} (${trx.berat || 1} kg/pcs)</span>
            <span>Rp ${totalVal.toLocaleString('id-ID')}</span>
        </div>
        <div class="receipt-total-line">
            <span>TOTAL TAGIHAN:</span>
            <span>Rp ${totalVal.toLocaleString('id-ID')}</span>
        </div>
        <div class="receipt-line" style="margin-top:6px;">
            <span>Metode Bayar:</span>
            <b>${trx.metodeBayar || (isLunas ? 'Tunai' : 'Belum Bayar')}</b>
        </div>
        <div class="receipt-line" style="margin-top:4px;">
            <span>STATUS PEMBAYARAN:</span>
            <b style="color:${isLunas ? '#10B981' : (isDP ? '#CA8A04' : '#EF4444')};">
                ${isLunas ? '✓ LUNAS' : (isDP ? '⏱️ DP (UANG MUKA)' : '⚠️ BELUM BAYAR')}
            </b>
        </div>
        <div class="receipt-line" style="margin-top:4px;">
            <span>STATUS PENGERJAAN:</span>
            <b style="color:#0284C7;">${trx.statusCucian}</b>
        </div>
        <div class="receipt-footer">
            <div>${outlet.footer || 'Terima kasih atas kepercayaannya!'}</div>
            <div style="margin-top:4px; font-weight:600;">Pakaian Bersih, Wangi & Rapi Bersama ${(outlet.nama || 'LaundryKu')}</div>
        </div>
    `;

    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}
window.openUserReceipt = openUserReceipt;

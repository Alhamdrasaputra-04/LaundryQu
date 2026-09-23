/* ============================================================
   pembayaran.js — Manajemen Kasir & Pembayaran LaundryKu
   ============================================================ */

let allTransactions = [];
let filteredTransactions = [];

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
    'Belum': 'badge-belum'
};

// ============================================================
// DOM READY
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    initDate();
    initUserProfile();
    initSidebar();
    initSearchAndFilter();
    initReceiptModal();
    loadPaymentData();
});

// ============================================================
// DATE & USER
// ============================================================
function initDate() {
    const el = document.getElementById('topbarDate');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
}

function initUserProfile() {
    const user = window.LaundryAuth ? LaundryAuth.getCurrentUser() : null;
    if (user) {
        const nameEl = document.querySelector('.user-name');
        const roleEl = document.querySelector('.user-role');
        const avatarEl = document.querySelector('.user-avatar');
        if (nameEl) nameEl.textContent = user.nama || user.email;
        if (roleEl) roleEl.textContent = user.role === 'admin' ? 'Administrator' : 'Pelanggan / Pengguna';
        if (avatarEl) avatarEl.textContent = (user.nama ? user.nama.charAt(0) : 'U').toUpperCase();
    }
}

// ============================================================
// LOAD DATA
// ============================================================
async function loadPaymentData() {
    try {
        if (window.LaundryDB) {
            const data = await LaundryDB.getTransactions();
            if (data && data.length > 0) {
                allTransactions = data;
            } else {
                const stored = localStorage.getItem('laundry_transactions');
                allTransactions = stored ? JSON.parse(stored) : [];
            }
        }
    } catch (e) {
        console.warn('Load payment data error:', e);
    }
    filteredTransactions = [...allTransactions];
    updateFinancialMetrics();
    renderPaymentTable(filteredTransactions);
    updateLiveNotifications();
}

// ============================================================
// FINANCIAL SUMMARY CARDS
// ============================================================
function updateFinancialMetrics() {
    let totalOmzet = 0;
    let totalKasLunas = 0;
    let totalPiutang = 0;
    let totalDP = 0;

    allTransactions.forEach(t => {
        const val = Number(t.total) || 0;
        totalOmzet += val;

        if (t.pembayaran === 'Lunas') {
            totalKasLunas += val;
        } else if (t.pembayaran === 'DP') {
            totalDP += val;
        } else {
            totalPiutang += val;
        }
    });

    const elOmzet   = document.getElementById('cardTotalOmzet');
    const elLunas   = document.getElementById('cardKasLunas');
    const elPiutang = document.getElementById('cardTotalPiutang');
    const elDP      = document.getElementById('cardTotalDP');

    if (elOmzet)   elOmzet.textContent   = 'Rp ' + totalOmzet.toLocaleString('id-ID');
    if (elLunas)   elLunas.textContent   = 'Rp ' + totalKasLunas.toLocaleString('id-ID');
    if (elPiutang) elPiutang.textContent = 'Rp ' + totalPiutang.toLocaleString('id-ID');
    if (elDP)      elDP.textContent      = 'Rp ' + totalDP.toLocaleString('id-ID');
}

// ============================================================
// RENDER PAYMENT TABLE
// ============================================================
function renderPaymentTable(data) {
    const tbody = document.getElementById('paymentTbody');
    const countBadge = document.getElementById('tableCountBadge');
    if (!tbody) return;

    if (countBadge) countBadge.textContent = `${data.length} Transaksi`;

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:#94A3B8;">Tidak ada data tagihan yang sesuai</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(trx => {
        const isLunas = trx.pembayaran === 'Lunas';
        const rawPhone = (trx.telepon || '').replace(/[^0-9]/g, '');
        const waNumber = rawPhone.startsWith('0') ? '62' + rawPhone.slice(1) : (rawPhone || '6281234567890');
        const waText = encodeURIComponent(`Halo Kak ${trx.pelanggan}, kami dari LaundryKu mengingatkan perihal tagihan laundry #${trx.id} (${trx.layanan}) sebesar Rp ${(Number(trx.total)||0).toLocaleString('id-ID')} dengan status: ${trx.pembayaran}. Terima kasih!`);
        const waLink = `https://wa.me/${waNumber}?text=${waText}`;

        let settleBtnHtml = '';
        if (!isLunas) {
            settleBtnHtml = `
                <button class="btn-pay-settle" onclick="settlePayment('${trx.id}')" title="Konfirmasi Pelunasan Kasir">
                    <svg style="width:13px;height:13px;fill:white;" viewBox="0 0 24 24"><path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/></svg>
                    Lunasi
                </button>
            `;
        }

        let waReminderHtml = '';
        if (!isLunas) {
            waReminderHtml = `
                <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn-pay-wa" title="Tagih via WhatsApp">
                    <svg viewBox="0 0 24 24"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67Z"/></svg>
                </a>
            `;
        }

        return `
            <tr>
                <td><span class="trx-id">#${trx.id}</span></td>
                <td>${trx.tanggal || '-'}</td>
                <td>
                    <div style="font-weight:600; color:var(--text-1);">${trx.pelanggan}</div>
                    <div style="font-size:11.5px; color:var(--text-3);">${trx.telepon || '-'}</div>
                </td>
                <td>${trx.layanan} (${trx.berat} kg)</td>
                <td><span class="total-cell">Rp ${(Number(trx.total)||0).toLocaleString('id-ID')}</span></td>
                <td><span class="badge ${BAYAR_BADGE[trx.pembayaran] || 'badge-belum'}">${trx.pembayaran}</span></td>
                <td><span class="badge ${STATUS_BADGE[trx.statusCucian] || 'badge-new'}">${trx.statusCucian}</span></td>
                <td>
                    <div class="pay-action-btns">
                        ${settleBtnHtml}
                        <button class="btn-pay-print" onclick="openReceipt('${trx.id}')" title="Cetak Kwitansi Struk">
                            <svg viewBox="0 0 24 24"><path d="M19,8H5C3.34,8 2,9.34 2,11V17H6V21H18V17H22V11C22,9.34 20.66,8 19,8M16,19H8V15H16V19M19,12C18.45,12 18,11.55 18,11C18,10.45 18.45,10 19,10C19.55,10 20,10.45 20,11C20,11.55 19.55,12 19,12M18,3H6V7H18V3Z"/></svg>
                        </button>
                        ${waReminderHtml}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ============================================================
// SETTLE PAYMENT ACTION (1-KLIK)
// ============================================================
async function settlePayment(id) {
    const trx = allTransactions.find(t => t.id === id);
    if (!trx) return;

    if (confirm(`Konfirmasi pelunasan tagihan #${id} (${trx.pelanggan}) sebesar Rp ${(Number(trx.total)||0).toLocaleString('id-ID')}?`)) {
        // Simpan ke Supabase & LocalStorage
        if (window.LaundryDB) {
            await LaundryDB.updateStatus(id, null, 'Lunas', 'Pelunasan tagihan dikonfirmasi di kasir');
        }

        trx.pembayaran = 'Lunas';
        const filteredTrx = filteredTransactions.find(t => t.id === id);
        if (filteredTrx) filteredTrx.pembayaran = 'Lunas';

        updateFinancialMetrics();
        renderPaymentTable(filteredTransactions);
        updateLiveNotifications();
        showToast(`Tagihan #${id} berhasil dilunasi!`, 'success');
    }
}
window.settlePayment = settlePayment;

// ============================================================
// SEARCH & FILTER
// ============================================================
function initSearchAndFilter() {
    const searchInput = document.getElementById('searchPayment');
    const filterSelect = document.getElementById('filterPaymentStatus');

    function apply() {
        const q = (searchInput ? searchInput.value : '').toLowerCase().trim();
        const s = filterSelect ? filterSelect.value : '';

        filteredTransactions = allTransactions.filter(t => {
            const matchQ = !q ||
                t.id.toLowerCase().includes(q) ||
                t.pelanggan.toLowerCase().includes(q) ||
                t.layanan.toLowerCase().includes(q);
            const matchS = !s || t.pembayaran === s;
            return matchQ && matchS;
        });

        renderPaymentTable(filteredTransactions);
    }

    searchInput && searchInput.addEventListener('input', apply);
    filterSelect && filterSelect.addEventListener('change', apply);
}

// ============================================================
// PRINTABLE RECEIPT MODAL
// ============================================================
function openReceipt(id) {
    const trx = allTransactions.find(t => t.id === id);
    if (!trx) return;

    const overlay = document.getElementById('receiptModalOverlay');
    const box = document.getElementById('printableReceiptBox');
    if (!overlay || !box) return;

    const totalVal = Number(trx.total) || 0;
    const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

    box.innerHTML = `
        <div class="receipt-header">
            <div class="receipt-logo">LAUNDRYKU</div>
            <div>Jl. Kampus No. 12, Padang</div>
            <div>WA: 0812-3456-7890</div>
        </div>
        <div class="receipt-line">
            <span>No. Nota:</span>
            <b>#${trx.id}</b>
        </div>
        <div class="receipt-line">
            <span>Waktu:</span>
            <span>${nowStr}</span>
        </div>
        <div class="receipt-line">
            <span>Pelanggan:</span>
            <b>${trx.pelanggan}</b>
        </div>
        <div class="receipt-line">
            <span>No. HP:</span>
            <span>${trx.telepon || '-'}</span>
        </div>
        <hr style="border:none; border-top:1px dashed #CBD5E1; margin:8px 0;">
        <div class="receipt-line">
            <span>${trx.layanan} (${trx.berat} kg)</span>
            <span>Rp ${totalVal.toLocaleString('id-ID')}</span>
        </div>
        <div class="receipt-total-line">
            <span>TOTAL:</span>
            <span>Rp ${totalVal.toLocaleString('id-ID')}</span>
        </div>
        <div class="receipt-line" style="margin-top:4px;">
            <span>STATUS BAYAR:</span>
            <b style="color:${trx.pembayaran === 'Lunas' ? '#10B981' : '#EF4444'};">${(trx.pembayaran || 'Belum').toUpperCase()}</b>
        </div>
        <div class="receipt-footer">
            <div>Terima kasih atas kepercayaan Anda!</div>
            <div>Pakaian bersih, wangi, dan rapi bersama LaundryKu.</div>
        </div>
    `;

    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}
window.openReceipt = openReceipt;

function initReceiptModal() {
    const overlay = document.getElementById('receiptModalOverlay');
    const closeBtn = document.getElementById('closeReceiptModal');
    const closeFooterBtn = document.getElementById('closeReceiptBtn');

    function close() {
        if (overlay) {
            overlay.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    closeBtn && closeBtn.addEventListener('click', close);
    closeFooterBtn && closeFooterBtn.addEventListener('click', close);
    overlay && overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
}

// ============================================================
// LIVE NOTIFICATIONS
// ============================================================
function updateLiveNotifications() {
    const notifList = document.querySelector('.notif-list');
    const notifDot = document.querySelector('.notif-dot');
    if (!notifList) return;

    const notifs = [];
    allTransactions.forEach(trx => {
        if (trx.statusCucian === 'Siap Diambil') {
            notifs.push({
                id: trx.id,
                color: 'green',
                icon: '<svg viewBox="0 0 24 24"><path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/></svg>',
                title: `Cucian ${trx.pelanggan} siap diambil!`,
                time: `#${trx.id} • ${trx.pembayaran}`,
                unread: true
            });
        }
    });

    if (notifs.length === 0) {
        notifList.innerHTML = `<div style="padding:20px;text-align:center;color:#94A3B8;font-size:12px;">Tidak ada notifikasi baru</div>`;
        if (notifDot) notifDot.style.display = 'none';
        return;
    }

    if (notifDot) notifDot.style.display = 'block';

    notifList.innerHTML = notifs.slice(0, 6).map(n => `
        <div class="notif-item ${n.unread ? 'unread' : ''}" onclick="openReceipt('${n.id}')" style="cursor:pointer;" title="Klik untuk lihat struk">
            <div class="notif-icon ${n.color}">${n.icon}</div>
            <div class="notif-body">
                <div class="notif-title">${n.title}</div>
                <div class="notif-time">${n.time}</div>
            </div>
        </div>
    `).join('');

    const notifBtn = document.getElementById('notifBtn');
    const notifDropdown = document.getElementById('notifDropdown');
    const markAllRead = document.getElementById('markAllRead');

    if (notifBtn && notifDropdown && !notifBtn.hasListener) {
        notifBtn.hasListener = true;
        notifBtn.addEventListener('click', e => {
            e.stopPropagation();
            notifDropdown.classList.toggle('show');
        });
        document.addEventListener('click', e => {
            if (!notifDropdown.contains(e.target) && e.target !== notifBtn) {
                notifDropdown.classList.remove('show');
            }
        });
        markAllRead && markAllRead.addEventListener('click', () => {
            document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
            if (notifDot) notifDot.style.display = 'none';
            showToast('Semua notifikasi ditandai dibaca', 'success');
        });
    }
}

// ============================================================
// SIDEBAR & TOAST HELPERS
// ============================================================
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const hamburger = document.getElementById('hamburgerBtn');
    const closeBtn = document.getElementById('sidebarClose');

    function open() { sidebar.classList.add('open'); overlay.classList.add('show'); }
    function close() { sidebar.classList.remove('open'); overlay.classList.remove('show'); }

    hamburger && hamburger.addEventListener('click', open);
    closeBtn && closeBtn.addEventListener('click', close);
    overlay && overlay.addEventListener('click', close);
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

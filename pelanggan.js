/* ============================================================
   pelanggan.js — Logika Manajemen Master Pelanggan LaundryKu
   ============================================================ */

let allCustomers = [];
let filteredCustomers = [];
let allTransactions = [];
let currentEditCustomerId = null;

// ============================================================
// DOM READY
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    initDate();
    initUserProfile();
    initSidebar();
    initSearch();
    initModals();
    initCustomerData();
});

// ============================================================
// TOPBAR & USER PROFILE
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
        const sideName = document.querySelector('.user-name-sm');
        const sideRole = document.querySelector('.user-role-sm');
        const sideAvatar = document.querySelector('.user-avatar-sm');

        const initial = (user.nama ? user.nama.charAt(0) : 'U').toUpperCase();
        const roleText = user.role === 'admin' ? 'Administrator' : 'Pelanggan / User';

        if (nameEl) nameEl.textContent = user.nama || user.email;
        if (roleEl) roleEl.textContent = roleText;
        if (avatarEl) avatarEl.textContent = initial;
        if (sideName) sideName.textContent = user.nama || user.email;
        if (sideRole) sideRole.textContent = roleText;
        if (sideAvatar) sideAvatar.textContent = initial;
    }
}

// ============================================================
// SIDEBAR (MOBILE DRAWER)
// ============================================================
function initSidebar() {
    const sidebar   = document.getElementById('sidebar');
    const overlay   = document.getElementById('sidebarOverlay');
    const hamburger = document.getElementById('hamburgerBtn');
    const closeBtn  = document.getElementById('sidebarClose');

    function openSidebar() {
        sidebar.classList.add('open');
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    }

    hamburger && hamburger.addEventListener('click', openSidebar);
    closeBtn  && closeBtn.addEventListener('click', closeSidebar);
    overlay   && overlay.addEventListener('click', closeSidebar);
}

// ============================================================
// DATA INITIALIZATION & SYNC
// ============================================================
async function initCustomerData() {
    try {
        if (window.LaundryDB) {
            // Ambil data pelanggan & transaksi dari database
            const [custData, trxData] = await Promise.all([
                LaundryDB.getCustomers(),
                LaundryDB.getTransactions()
            ]);

            allCustomers = custData || [];
            allTransactions = trxData || [];
            filteredCustomers = [...allCustomers];
        }
    } catch (err) {
        console.warn('Gagal memuat data pelanggan:', err);
    }

    renderCustomers(filteredCustomers);
    updateCustomerMetrics();
}

// ============================================================
// METRICS RECALCULATION
// ============================================================
function updateCustomerMetrics() {
    // 1. Total Pelanggan
    const cardTotal = document.getElementById('cardTotalPelanggan');
    if (cardTotal) cardTotal.textContent = allCustomers.length;

    // 2. Pelanggan Aktif (sedang memiliki cucian belum berstatus 'Selesai')
    const cardAktif = document.getElementById('cardPelangganAktif');
    if (cardAktif) {
        const activeNames = new Set(
            allTransactions
                .filter(t => t.statusCucian !== 'Selesai')
                .map(t => t.pelanggan.toLowerCase().trim())
        );
        const countAktif = allCustomers.filter(c => activeNames.has(c.nama.toLowerCase().trim())).length;
        cardAktif.textContent = countAktif;
    }

    // 3. Pelanggan Baru
    const cardBaru = document.getElementById('cardPelangganBaru');
    if (cardBaru) cardBaru.textContent = allCustomers.length;
}

// ============================================================
// RENDER TABLE PELANGGAN
// ============================================================
function renderCustomers(data) {
    const tbody = document.getElementById('customerTbody');
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:#94A3B8;font-size:14px;">
            Tidak ada pelanggan yang ditemukan
        </td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(cust => {
        // Hitung total transaksi pelanggan ini
        const customerOrders = allTransactions.filter(t => 
            t.pelanggan.toLowerCase().trim() === cust.nama.toLowerCase().trim()
        );
        const totalOrder = customerOrders.length;

        // Bersihkan format nomor untuk link WA
        let waNumber = (cust.telepon || '').replace(/[^0-9]/g, '');
        if (waNumber.startsWith('0')) {
            waNumber = '62' + waNumber.slice(1);
        }
        const waLink = waNumber ? `https://wa.me/${waNumber}?text=Halo%20Kak%20${encodeURIComponent(cust.nama)},%20kami%20dari%20LaundryKu...` : '#';

        const initial = cust.nama ? cust.nama.charAt(0).toUpperCase() : 'P';

        return `
            <tr>
                <td><span class="trx-id">${cust.code || ('PLG00' + cust.id)}</span></td>
                <td>
                    <div class="cust-name-cell">
                        <div class="cust-avatar">${initial}</div>
                        <div>
                            <div class="cust-name-title">${cust.nama}</div>
                            <div class="cust-notes-sub">${cust.catatan && cust.catatan !== '-' ? cust.catatan : 'Pelanggan umum'}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span>${cust.telepon}</span>
                        ${waNumber ? `
                            <a href="${waLink}" target="_blank" class="wa-btn" title="Chat WhatsApp">
                                <svg viewBox="0 0 24 24"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67Z"/></svg>
                            </a>
                        ` : ''}
                    </div>
                </td>
                <td><span style="color:var(--text-2);font-size:13px;">${cust.alamat || '-'}</span></td>
                <td><span class="order-badge-pill">${totalOrder} Pesanan</span></td>
                <td><span style="color:var(--text-3);font-size:12px;">${cust.tanggal || 'Sep 2026'}</span></td>
                <td style="text-align:right;">
                    <div class="action-btns" style="justify-content:flex-end;">
                        <button class="action-btn view" title="Lihat Riwayat Cucian" onclick="viewCustomerDetail('${cust.id}')">
                            <svg viewBox="0 0 24 24"><path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/></svg>
                        </button>
                        <button class="action-btn edit" title="Edit Data Pelanggan" onclick="openEditCustomerModal('${cust.id}')">
                            <svg viewBox="0 0 24 24"><path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/></svg>
                        </button>
                        <button class="action-btn delete" title="Hapus Pelanggan" onclick="deleteCustomer('${cust.id}')">
                            <svg viewBox="0 0 24 24"><path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z"/></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ============================================================
// SEARCH REAL-TIME
// ============================================================
function initSearch() {
    const input = document.getElementById('searchCustomer');
    if (!input) return;

    input.addEventListener('input', () => {
        const q = input.value.toLowerCase().trim();
        filteredCustomers = allCustomers.filter(c => 
            c.nama.toLowerCase().includes(q) ||
            c.telepon.toLowerCase().includes(q) ||
            c.alamat.toLowerCase().includes(q) ||
            (c.code && c.code.toLowerCase().includes(q))
        );
        renderCustomers(filteredCustomers);
    });
}

// ============================================================
// MODAL TAMBAH & EDIT PELANGGAN
// ============================================================
function initModals() {
    const openAddBtn    = document.getElementById('openAddCustomerModalBtn');
    const modalOverlay  = document.getElementById('customerModalOverlay');
    const closeBtn      = document.getElementById('closeCustModal');
    const cancelBtn     = document.getElementById('cancelCustModal');
    const saveBtn       = document.getElementById('saveCustomerBtn');

    // Detail Modal elements
    const detailOverlay = document.getElementById('customerDetailModalOverlay');
    const closeDetBtn   = document.getElementById('closeCustDetailModal');
    const closeDetBtn2  = document.getElementById('closeCustDetailBtn');

    function openModal() {
        modalOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    function closeModal() {
        modalOverlay.classList.remove('show');
        document.body.style.overflow = '';
        document.getElementById('customerForm').reset();
        document.getElementById('custEditId').value = '';
        currentEditCustomerId = null;
        document.getElementById('custModalTitle').innerHTML = `
            <svg viewBox="0 0 24 24"><path d="M15,14C12.33,14 7,15.33 7,18V20H23V18C23,15.33 17.67,14 15,14M6,10V7H4V10H1V12H4V15H6V12H9V10M15,12A4,4 0 0,0 19,8A4,4 0 0,0 15,4A4,4 0 0,0 11,8A4,4 0 0,0 15,12Z"/></svg>
            Tambah Pelanggan Baru
        `;
    }

    openAddBtn && openAddBtn.addEventListener('click', () => {
        document.getElementById('customerForm').reset();
        document.getElementById('custEditId').value = '';
        currentEditCustomerId = null;
        openModal();
    });
    closeBtn  && closeBtn.addEventListener('click', closeModal);
    cancelBtn && cancelBtn.addEventListener('click', closeModal);
    modalOverlay && modalOverlay.addEventListener('click', e => {
        if (e.target === modalOverlay) closeModal();
    });

    // Detail close
    function closeDetail() {
        detailOverlay.classList.remove('show');
        document.body.style.overflow = '';
    }
    closeDetBtn  && closeDetBtn.addEventListener('click', closeDetail);
    closeDetBtn2 && closeDetBtn2.addEventListener('click', closeDetail);
    detailOverlay && detailOverlay.addEventListener('click', e => {
        if (e.target === detailOverlay) closeDetail();
    });

    // Save action
    saveBtn && saveBtn.addEventListener('click', async () => {
        const nama    = document.getElementById('custNama').value.trim();
        const telepon = document.getElementById('custTelepon').value.trim();
        const alamat  = document.getElementById('custAlamat').value.trim();
        const catatan = document.getElementById('custCatatan').value.trim();
        const editId  = document.getElementById('custEditId').value;

        if (!nama) {
            showToast('Nama pelanggan wajib diisi', 'error');
            return;
        }
        if (!telepon) {
            showToast('Nomor telepon / WhatsApp wajib diisi', 'error');
            return;
        }

        saveBtn.disabled = true;

        if (editId) {
            // Mode Update
            const updated = { nama, telepon, alamat: alamat || '-', catatan: catatan || '-' };
            if (window.LaundryDB) {
                await LaundryDB.updateCustomer(editId, updated);
            }
            const idx = allCustomers.findIndex(c => String(c.id) === String(editId));
            if (idx !== -1) {
                allCustomers[idx] = { ...allCustomers[idx], ...updated };
            }
            const fIdx = filteredCustomers.findIndex(c => String(c.id) === String(editId));
            if (fIdx !== -1) {
                filteredCustomers[fIdx] = { ...filteredCustomers[fIdx], ...updated };
            }
            showToast(`Data pelanggan "${nama}" berhasil diperbarui!`, 'success');
        } else {
            // Mode Tambah Baru
            const newCust = { nama, telepon, alamat: alamat || '-', catatan: catatan || '-' };
            let saved = newCust;
            if (window.LaundryDB) {
                saved = await LaundryDB.addCustomer(newCust);
            }
            allCustomers.unshift(saved);
            filteredCustomers.unshift(saved);
            showToast(`Pelanggan baru "${nama}" berhasil ditambahkan ke database!`, 'success');
        }

        saveBtn.disabled = false;
        renderCustomers(filteredCustomers);
        updateCustomerMetrics();
        closeModal();
    });

    // Global Esc
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closeModal();
            closeDetail();
        }
    });
}

// ============================================================
// OPEN EDIT MODAL
// ============================================================
function openEditCustomerModal(id) {
    const cust = allCustomers.find(c => String(c.id) === String(id));
    if (!cust) return;

    currentEditCustomerId = cust.id;
    document.getElementById('custEditId').value = cust.id;
    document.getElementById('custNama').value = cust.nama;
    document.getElementById('custTelepon').value = cust.telepon;
    document.getElementById('custAlamat').value = cust.alamat && cust.alamat !== '-' ? cust.alamat : '';
    document.getElementById('custCatatan').value = cust.catatan && cust.catatan !== '-' ? cust.catatan : '';

    document.getElementById('custModalTitle').innerHTML = `
        <svg viewBox="0 0 24 24"><path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/></svg>
        Edit Data Pelanggan (${cust.nama})
    `;

    const overlay = document.getElementById('customerModalOverlay');
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}
window.openEditCustomerModal = openEditCustomerModal;

// ============================================================
// DELETE CUSTOMER
// ============================================================
async function deleteCustomer(id) {
    const cust = allCustomers.find(c => String(c.id) === String(id));
    if (!cust) return;

    if (confirm(`Yakin ingin menghapus pelanggan "${cust.nama}" dari database?`)) {
        if (window.LaundryDB) {
            await LaundryDB.deleteCustomer(id);
        }
        allCustomers = allCustomers.filter(c => String(c.id) !== String(id));
        filteredCustomers = filteredCustomers.filter(c => String(c.id) !== String(id));
        renderCustomers(filteredCustomers);
        updateCustomerMetrics();
        showToast(`Pelanggan "${cust.nama}" berhasil dihapus`, 'success');
    }
}
window.deleteCustomer = deleteCustomer;

// ============================================================
// DETAIL & RIWAYAT PESANAN PELANGGAN
// ============================================================
function viewCustomerDetail(id) {
    const cust = allCustomers.find(c => String(c.id) === String(id));
    if (!cust) return;

    document.getElementById('detCustNama').textContent = cust.nama;
    document.getElementById('detCustTelp').textContent = cust.telepon || '-';
    document.getElementById('detCustAlamat').textContent = cust.alamat || '-';
    document.getElementById('detCustCatatan').textContent = cust.catatan && cust.catatan !== '-' ? cust.catatan : 'Tidak ada catatan preferensi khusus';

    // WA Button link
    let waNumber = (cust.telepon || '').replace(/[^0-9]/g, '');
    if (waNumber.startsWith('0')) waNumber = '62' + waNumber.slice(1);
    const waLink = waNumber ? `https://wa.me/${waNumber}?text=Halo%20Kak%20${encodeURIComponent(cust.nama)},%20terima%20kasih%20telah%20menjadi%20pelanggan%20setia%20LaundryKu!` : '#';
    const waBtn = document.getElementById('detCustWaBtn');
    if (waBtn) waBtn.href = waLink;

    // Filter seluruh pesanan milik pelanggan ini
    const customerOrders = allTransactions.filter(t => 
        t.pelanggan.toLowerCase().trim() === cust.nama.toLowerCase().trim()
    );

    const historyTbody = document.getElementById('custOrderHistoryTbody');
    if (historyTbody) {
        if (customerOrders.length === 0) {
            historyTbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:#94A3B8;">Belum ada riwayat transaksi cucian untuk pelanggan ini</td></tr>`;
        } else {
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

            historyTbody.innerHTML = customerOrders.map(t => `
                <tr>
                    <td><b style="color:var(--primary);font-family:monospace;">#${t.id}</b></td>
                    <td>${t.tanggal}</td>
                    <td>${t.layanan}</td>
                    <td><b>Rp ${(Number(t.total) || 0).toLocaleString('id-ID')}</b></td>
                    <td><span class="badge ${STATUS_BADGE[t.statusCucian] || 'badge-new'}">${t.statusCucian}</span></td>
                    <td><span class="badge ${BAYAR_BADGE[t.pembayaran] || 'badge-belum'}">${t.pembayaran}</span></td>
                </tr>
            `).join('');
        }
    }

    const overlay = document.getElementById('customerDetailModalOverlay');
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}
window.viewCustomerDetail = viewCustomerDetail;

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = {
        success: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/></svg>',
        error:   '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/></svg>',
        warning: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z"/></svg>',
        info:    '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/></svg>',
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.info}</div>
        <div class="toast-msg">${message}</div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <svg viewBox="0 0 24 24"><path fill="#94A3B8" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/></svg>
        </button>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(40px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

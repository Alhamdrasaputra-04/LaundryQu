/* ============================================================
   transaksi.js — Logika Manajemen Transaksi LaundryKu
   ============================================================ */

let allTransactions = [];
let filteredTransactions = [];
let allCustomers = [];
let allServices = [];
let currentDetailId = null;
let currentEditingId = null;

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

const TIMELINE_STAGES = [
    { key: 'Baru Masuk',   label: 'Baru Masuk' },
    { key: 'Dicuci',       label: 'Dicuci' },
    { key: 'Dikeringkan',  label: 'Dikeringkan' },
    { key: 'Disetrika',    label: 'Disetrika' },
    { key: 'Siap Diambil', label: 'Siap Diambil' },
    { key: 'Selesai',      label: 'Selesai' }
];

// ============================================================
// DOM READY
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    initDate();
    initUserProfile();
    initSidebar();
    initFilters();
    initModals();
    initTotalCalculation();
    setTodayDates();
    initTrxData();
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
async function initTrxData() {
    try {
        if (window.LaundryDB) {
            const [trxData, custData, srvData] = await Promise.all([
                LaundryDB.getTransactions(),
                LaundryDB.getCustomers(),
                LaundryDB.getServices()
            ]);

            allTransactions = trxData || [];
            allCustomers    = custData || [];
            allServices     = srvData || [];
            filteredTransactions = [...allTransactions];

            populateAddTrxDropdowns();
        }
    } catch (err) {
        console.warn('Gagal load transaksi:', err);
    }

    renderTransactions(filteredTransactions);
    updateTrxMetrics();
}

function populateAddTrxDropdowns() {
    // Dropdown Pelanggan
    const custSelect = document.getElementById('trxPelangganSelect');
    if (custSelect) {
        if (allCustomers.length === 0) {
            custSelect.innerHTML = `<option value="">-- Belum ada pelanggan (tambah di halaman Pelanggan) --</option>`;
        } else {
            custSelect.innerHTML = `<option value="">-- Pilih Pelanggan --</option>` + 
                allCustomers.map(c => `
                    <option value="${c.nama}" data-telp="${c.telepon}">${c.nama} (${c.telepon})</option>
                `).join('');
        }
    }

    // Dropdown Layanan
    const srvSelect = document.getElementById('trxLayananSelect');
    if (srvSelect) {
        srvSelect.innerHTML = `<option value="">-- Pilih Layanan --</option>` +
            allServices.map(s => `
                <option value="${s.harga}">${s.nama_layanan} (Rp ${Number(s.harga).toLocaleString('id-ID')}/${s.satuan || 'kg'})</option>
            `).join('');
    }
}

// ============================================================
// METRICS RECALCULATION
// ============================================================
function updateTrxMetrics() {
    const elTotal = document.getElementById('trxStatTotal');
    const elDiproses = document.getElementById('trxStatDiproses');
    const elSiap = document.getElementById('trxStatSiap');
    const elSelesai = document.getElementById('trxStatSelesai');

    if (elTotal) elTotal.textContent = allTransactions.length;
    if (elDiproses) {
        elDiproses.textContent = allTransactions.filter(t => 
            ['Dicuci', 'Dikeringkan', 'Disetrika'].includes(t.statusCucian)
        ).length;
    }
    if (elSiap) {
        elSiap.textContent = allTransactions.filter(t => t.statusCucian === 'Siap Diambil').length;
    }
    if (elSelesai) {
        elSelesai.textContent = allTransactions.filter(t => t.statusCucian === 'Selesai').length;
    }
}

// ============================================================
// RENDER TRANSACTIONS TABLE
// ============================================================
function renderTransactions(data) {
    const tbody = document.getElementById('transactionTbody');
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:#94A3B8;font-size:14px;">
            Tidak ada transaksi yang cocok dengan filter pencarian
        </td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(trx => {
        // WhatsApp Reminder Link (khusus jika Siap Diambil)
        let waBtnHtml = '';
        let waNumber = (trx.telepon || '').replace(/[^0-9]/g, '');
        if (waNumber.startsWith('0')) waNumber = '62' + waNumber.slice(1);
        
        if (trx.statusCucian === 'Siap Diambil' && waNumber) {
            const waMsg = encodeURIComponent(
                `Halo Kak ${trx.pelanggan}, kami dari LaundryKu ingin menginformasikan bahwa cucian Anda dengan kode #${trx.id} (${trx.layanan}) telah selesai dicuci & disetrika rapi, dan SIAP DIAMBIL di kasir. Total biaya: Rp ${(Number(trx.total) || 0).toLocaleString('id-ID')} (${trx.pembayaran}). Terima kasih!`
            );
            waBtnHtml = `
                <a href="https://wa.me/${waNumber}?text=${waMsg}" target="_blank" class="wa-reminder-btn" title="Kirim Reminder WhatsApp Siap Diambil">
                    <svg viewBox="0 0 24 24"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67Z"/></svg>
                </a>
            `;
        }

        return `
            <tr>
                <td><span class="trx-id">#${trx.id}</span></td>
                <td>
                    <div>
                        <div class="date-cell-main">${trx.tanggal || '-'}</div>
                        <div class="date-cell-sub">Est: ${trx.estimasi || '-'}</div>
                    </div>
                </td>
                <td>
                    <div>
                        <div class="pelanggan-cell">${trx.pelanggan}</div>
                        <div style="font-size:11.5px;color:var(--text-3);">${trx.telepon || '-'}</div>
                    </div>
                </td>
                <td>
                    <div>
                        <span style="font-weight:600;">${trx.layanan}</span>
                        <div style="font-size:11.5px;color:var(--text-3);">${trx.berat || 1} kg/pcs</div>
                    </div>
                </td>
                <td><span class="total-cell">Rp ${(Number(trx.total) || 0).toLocaleString('id-ID')}</span></td>
                <td><span class="badge ${STATUS_BADGE[trx.statusCucian] || 'badge-new'}">${trx.statusCucian}</span></td>
                <td><span class="badge ${BAYAR_BADGE[trx.pembayaran] || 'badge-belum'}">${trx.pembayaran}</span></td>
                <td style="text-align:right;">
                    <div class="action-btns" style="justify-content:flex-end;">
                        ${waBtnHtml}
                        <button class="action-btn view" title="Lihat Detail & Tracking" onclick="viewDetail('${trx.id}')">
                            <svg viewBox="0 0 24 24"><path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/></svg>
                        </button>
                        <button class="action-btn edit" title="Ubah Status Cucian & Bayar" onclick="editStatus('${trx.id}')">
                            <svg viewBox="0 0 24 24"><path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/></svg>
                        </button>
                        <button class="action-btn delete" title="Hapus Transaksi" onclick="deleteTransaction('${trx.id}')">
                            <svg viewBox="0 0 24 24"><path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z"/></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ============================================================
// MULTI-FILTERS
// ============================================================
function initFilters() {
    const searchInput = document.getElementById('searchTrxInput');
    const cucianSelect = document.getElementById('filterCucianSelect');
    const bayarSelect = document.getElementById('filterBayarSelect');

    function applyFilter() {
        const q = searchInput.value.toLowerCase().trim();
        const sc = cucianSelect.value;
        const sp = bayarSelect.value;

        filteredTransactions = allTransactions.filter(t => {
            const matchQ = !q ||
                t.id.toLowerCase().includes(q) ||
                t.pelanggan.toLowerCase().includes(q) ||
                t.layanan.toLowerCase().includes(q);

            const matchCucian = !sc || t.statusCucian === sc;
            const matchBayar  = !sp || t.pembayaran === sp;

            return matchQ && matchCucian && matchBayar;
        });

        renderTransactions(filteredTransactions);
    }

    searchInput && searchInput.addEventListener('input', applyFilter);
    cucianSelect && cucianSelect.addEventListener('change', applyFilter);
    bayarSelect && bayarSelect.addEventListener('change', applyFilter);
}

// ============================================================
// TOTAL CALCULATOR (ADD TRX)
// ============================================================
function initTotalCalculation() {
    const srvSel = document.getElementById('trxLayananSelect');
    const beratIn = document.getElementById('trxBeratInput');
    if (!srvSel || !beratIn) return;

    function calc() {
        const harga = parseInt(srvSel.value) || 0;
        const berat = parseInt(beratIn.value) || 0;
        const total = harga * berat;
        const el = document.getElementById('trxTotalDisplay');
        if (el) el.textContent = 'Rp ' + total.toLocaleString('id-ID');
    }

    srvSel.addEventListener('change', calc);
    beratIn.addEventListener('input', calc);
}

function setTodayDates() {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const tgl = document.getElementById('trxTanggalMasuk');
    const est = document.getElementById('trxEstimasiSelesai');
    if (tgl) tgl.value = today;
    if (est) est.value = tomorrow;
}

// ============================================================
// MODALS
// ============================================================
function initModals() {
    // 1. Add Trx Modal
    const openAddBtn = document.getElementById('openAddTrxBtn');
    const addOverlay = document.getElementById('trxModalOverlay');
    const closeAddBtn = document.getElementById('closeAddTrxModal');
    const cancelAddBtn = document.getElementById('cancelAddTrxBtn');
    const saveAddBtn = document.getElementById('saveAddTrxBtn');

    function openAddModal() {
        addOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    function closeAddModal() {
        addOverlay.classList.remove('show');
        document.body.style.overflow = '';
        document.getElementById('addTrxForm').reset();
        document.getElementById('trxTotalDisplay').textContent = 'Rp 0';
        setTodayDates();
    }

    openAddBtn && openAddBtn.addEventListener('click', openAddModal);
    closeAddBtn && closeAddBtn.addEventListener('click', closeAddModal);
    cancelAddBtn && cancelAddBtn.addEventListener('click', closeAddModal);

    // Tombol Cepat Tambah Pelanggan Baru Langsung Dari Modal Transaksi
    const quickAddBtn = document.getElementById('quickAddCustBtn');
    quickAddBtn && quickAddBtn.addEventListener('click', async () => {
        const nama = prompt('Masukkan Nama Lengkap Pelanggan Baru:');
        if (!nama || !nama.trim()) return;
        const telp = prompt('Masukkan Nomor Telepon/WhatsApp (contoh: 081234567890):', '08') || '-';

        const newCust = {
            nama: nama.trim(),
            telepon: telp.trim(),
            alamat: '-',
            catatan: 'Didaftarkan saat transaksi baru'
        };

        let saved = newCust;
        if (window.LaundryDB) {
            saved = await LaundryDB.addCustomer(newCust);
            allCustomers.unshift(saved);
        } else {
            allCustomers.unshift(newCust);
        }

        populateAddTrxDropdowns();
        const custSelect = document.getElementById('trxPelangganSelect');
        if (custSelect) custSelect.value = newCust.nama;

        showToast(`Pelanggan "${newCust.nama}" berhasil disimpan ke direktori pelanggan!`, 'success');
    });

    addOverlay && addOverlay.addEventListener('click', e => {
        if (e.target === addOverlay) closeAddModal();
    });

    saveAddBtn && saveAddBtn.addEventListener('click', async () => {
        const custSel = document.getElementById('trxPelangganSelect');
        const srvSel  = document.getElementById('trxLayananSelect');
        const beratIn = document.getElementById('trxBeratInput');
        const bayarSel = document.getElementById('trxStatusBayarSelect');
        const tglIn   = document.getElementById('trxTanggalMasuk');
        const estIn   = document.getElementById('trxEstimasiSelesai');
        const catIn   = document.getElementById('trxCatatanInput');

        const pelanggan = custSel.value;
        const harga = parseInt(srvSel.value);
        const berat = parseInt(beratIn.value);

        if (!pelanggan) { showToast('Pilih nama pelanggan terlebih dahulu', 'error'); return; }
        if (!harga) { showToast('Pilih jenis layanan laundry', 'error'); return; }
        if (!berat || berat < 1) { showToast('Masukkan berat/jumlah cucian yang valid', 'error'); return; }

        const srvText = srvSel.options[srvSel.selectedIndex].text.split(' (')[0];
        const selectedCustOpt = custSel.options[custSel.selectedIndex];
        const telepon = selectedCustOpt.dataset.telp || '0812-3456-7890';
        const total = harga * berat;
        const newId = 'TRX00' + (132 + allTransactions.length);

        const newTrx = {
            id: newId,
            pelanggan,
            telepon,
            layanan: srvText,
            berat,
            total,
            statusCucian: 'Baru Masuk',
            pembayaran: bayarSel.value || 'Belum',
            tanggal: tglIn.value || new Date().toISOString().split('T')[0],
            estimasi: estIn.value || new Date(Date.now() + 86400000).toISOString().split('T')[0],
            catatan: catIn.value.trim() || '-'
        };

        saveAddBtn.disabled = true;

        if (window.LaundryDB) {
            await LaundryDB.addTransaction(newTrx);
        }

        allTransactions.unshift(newTrx);
        filteredTransactions.unshift(newTrx);

        saveAddBtn.disabled = false;
        renderTransactions(filteredTransactions);
        updateTrxMetrics();
        closeAddModal();
        showToast(`Transaksi #${newId} berhasil disimpan ke database!`, 'success');
    });

    // 2. Detail Modal
    const detailOverlay = document.getElementById('detailModalOverlay');
    const closeDetBtn   = document.getElementById('closeDetailModal');
    const printBtn      = document.getElementById('printStrukBtn');
    const editFromDet   = document.getElementById('openEditFromDetailBtn');

    function closeDetailModal() {
        detailOverlay.classList.remove('show');
        document.body.style.overflow = '';
    }
    closeDetBtn && closeDetBtn.addEventListener('click', closeDetailModal);
    detailOverlay && detailOverlay.addEventListener('click', e => {
        if (e.target === detailOverlay) closeDetailModal();
    });
    printBtn && printBtn.addEventListener('click', () => window.print());
    editFromDet && editFromDet.addEventListener('click', () => {
        if (currentDetailId) {
            closeDetailModal();
            editStatus(currentDetailId);
        }
    });

    // 3. Edit Status Modal
    const editOverlay = document.getElementById('editStatusModalOverlay');
    const closeEditBtn = document.getElementById('closeEditModal');
    const cancelEditBtn = document.getElementById('cancelEditStatusBtn');
    const saveEditBtn = document.getElementById('saveEditStatusBtn');

    function closeEditModal() {
        editOverlay.classList.remove('show');
        document.body.style.overflow = '';
    }
    closeEditBtn && closeEditBtn.addEventListener('click', closeEditModal);
    cancelEditBtn && cancelEditBtn.addEventListener('click', closeEditModal);
    editOverlay && editOverlay.addEventListener('click', e => {
        if (e.target === editOverlay) closeEditModal();
    });

    saveEditBtn && saveEditBtn.addEventListener('click', async () => {
        if (!currentEditingId) return;

        const newStatus = document.getElementById('editStatusCucian').value;
        const newPayment = document.getElementById('editStatusPembayaran').value;
        const catatan = document.getElementById('editCatatanStatus').value.trim();

        saveEditBtn.disabled = true;

        if (window.LaundryDB) {
            await LaundryDB.updateStatus(currentEditingId, newStatus, newPayment, catatan);
        }

        const trx = allTransactions.find(t => t.id === currentEditingId);
        if (trx) {
            trx.statusCucian = newStatus;
            trx.pembayaran = newPayment;
            if (catatan) trx.catatan = catatan;
        }
        const fTrx = filteredTransactions.find(t => t.id === currentEditingId);
        if (fTrx) {
            fTrx.statusCucian = newStatus;
            fTrx.pembayaran = newPayment;
            if (catatan) fTrx.catatan = catatan;
        }

        saveEditBtn.disabled = false;
        renderTransactions(filteredTransactions);
        updateTrxMetrics();
        closeEditModal();
        showToast(`Status transaksi #${currentEditingId} berhasil diubah ke ${newStatus}!`, 'success');
    });

    // Global Esc
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closeAddModal();
            closeDetailModal();
            closeEditModal();
        }
    });
}

// ============================================================
// VIEW DETAIL & TIMELINE
// ============================================================
function viewDetail(id) {
    const trx = allTransactions.find(t => t.id === id);
    if (!trx) return;
    currentDetailId = trx.id;

    document.getElementById('detailTrxCode').textContent = `#${trx.id}`;
    const badge = document.getElementById('detailStatusBadge');
    badge.textContent = trx.statusCucian;
    badge.className = `badge ${STATUS_BADGE[trx.statusCucian] || 'badge-new'}`;

    document.getElementById('detailNama').textContent = trx.pelanggan;
    document.getElementById('detailTelp').textContent = `📞 ${trx.telepon || '0812-3456-7890'}`;
    document.getElementById('detailLayanan').textContent = trx.layanan;
    document.getElementById('detailBerat').textContent = `${trx.berat || 1} kg/pcs`;
    document.getElementById('detailTotal').textContent = `Rp ${(Number(trx.total) || 0).toLocaleString('id-ID')}`;
    
    const bayarBadge = document.getElementById('detailBayarBadge');
    bayarBadge.textContent = trx.pembayaran;
    bayarBadge.className = `badge ${BAYAR_BADGE[trx.pembayaran] || 'badge-belum'}`;

    document.getElementById('detailEstimasi').textContent = trx.estimasi || '-';
    document.getElementById('detailMasuk').textContent = `Masuk: ${trx.tanggal || '-'}`;
    document.getElementById('detailCatatan').textContent = trx.catatan && trx.catatan !== '-' ? trx.catatan : 'Tidak ada catatan khusus';

    // Render Timeline
    const tlContainer = document.getElementById('modalTimeline');
    if (tlContainer) {
        const currentIdx = TIMELINE_STAGES.findIndex(s => s.key === trx.statusCucian);
        const activeIndex = currentIdx === -1 ? 0 : currentIdx;

        tlContainer.innerHTML = TIMELINE_STAGES.map((stage, idx) => {
            let stepClass = 'm-timeline-step';
            let dotContent = `${idx + 1}`;

            if (idx < activeIndex || (activeIndex === 5 && idx === 5)) {
                stepClass += ' done';
                dotContent = `<svg viewBox="0 0 24 24" style="width:14px;height:14px;fill:white;"><path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/></svg>`;
            } else if (idx === activeIndex) {
                stepClass += ' active';
            }

            return `
                <div class="${stepClass}">
                    <div class="m-timeline-dot">${dotContent}</div>
                    <div class="m-timeline-label">${stage.label}</div>
                </div>
            `;
        }).join('');
    }

    const overlay = document.getElementById('detailModalOverlay');
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}
window.viewDetail = viewDetail;

// ============================================================
// EDIT STATUS MODAL
// ============================================================
function editStatus(id) {
    const trx = allTransactions.find(t => t.id === id);
    if (!trx) return;
    currentEditingId = trx.id;

    document.getElementById('editTrxCode').textContent = `#${trx.id} (${trx.pelanggan})`;
    document.getElementById('editStatusCucian').value = trx.statusCucian;
    document.getElementById('editStatusPembayaran').value = trx.pembayaran;
    document.getElementById('editCatatanStatus').value = '';

    const overlay = document.getElementById('editStatusModalOverlay');
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}
window.editStatus = editStatus;

// ============================================================
// DELETE TRANSACTION
// ============================================================
async function deleteTransaction(id) {
    if (confirm(`Yakin ingin menghapus transaksi #${id}?`)) {
        if (window.LaundryDB) {
            await LaundryDB.deleteTransaction(id);
        }
        allTransactions = allTransactions.filter(t => t.id !== id);
        filteredTransactions = filteredTransactions.filter(t => t.id !== id);
        renderTransactions(filteredTransactions);
        updateTrxMetrics();
        showToast(`Transaksi #${id} berhasil dihapus dari database`, 'success');
    }
}
window.deleteTransaction = deleteTransaction;

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

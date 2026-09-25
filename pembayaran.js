/* ============================================================
   pembayaran.js — Manajemen Kasir & Pembayaran LaundryKu
   ============================================================ */

let allTransactions = [];
let filteredTransactions = [];
let currentSettleTrx = null;
let currentSettleType = 'Lunas';
let currentSettleMethod = 'Tunai';

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
    if (window.LaundryAuth && LaundryAuth.requireAuth) {
        if (!LaundryAuth.requireAuth()) return;
    }
    initDate();
    initUserProfile();
    initSidebar();
    initSearchAndFilter();
    initReceiptModal();
    initSettleModal();
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
        const sideName = document.querySelector('.user-name-sm');
        const sideRole = document.querySelector('.user-role-sm');
        const sideAvatar = document.querySelector('.user-avatar-sm');

        const initial = (user.nama ? user.nama.charAt(0) : 'U').toUpperCase();
        const roleText = user.role === 'admin' ? 'Administrator' : 'Pelanggan / Pengguna';

        if (nameEl) nameEl.textContent = user.nama || user.email;
        if (roleEl) roleEl.textContent = roleText;
        if (avatarEl) avatarEl.textContent = initial;
        if (sideName) sideName.textContent = user.nama || user.email;
        if (sideRole) sideRole.textContent = roleText;
        if (sideAvatar) sideAvatar.textContent = initial;
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
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:35px; color:#94A3B8; font-size:13.5px;">
            Tidak ada transaksi pembayaran yang sesuai filter pencarian
        </td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(trx => {
        const isLunas = trx.pembayaran === 'Lunas';
        const isDP    = trx.pembayaran === 'DP';

        // Format nomor WhatsApp & Link tagihan / konfirmasi
        const rawPhone = (trx.telepon || '').replace(/[^0-9]/g, '');
        let waNumber = rawPhone.startsWith('0') ? '62' + rawPhone.slice(1) : (rawPhone || '');
        if (waNumber.startsWith('8')) waNumber = '62' + waNumber;

        let waBtnHtml = '';
        if (waNumber) {
            let waMsg = '';
            if (isLunas) {
                waMsg = encodeURIComponent(`Halo Kak ${trx.pelanggan}, kami dari LaundryKu mengonfirmasi pembayaran transaksi #${trx.id} (${trx.layanan}) sebesar Rp ${(Number(trx.total)||0).toLocaleString('id-ID')} telah LUNAS via ${trx.metodeBayar || 'Kasir'}. Terima kasih banyak!`);
            } else {
                waMsg = encodeURIComponent(`Halo Kak ${trx.pelanggan}, kami dari LaundryKu menginformasikan perihal tagihan laundry #${trx.id} (${trx.layanan}) sebesar Rp ${(Number(trx.total)||0).toLocaleString('id-ID')} dengan status: ${trx.pembayaran}. Pembayaran dapat dilakukan langsung di kasir atau transfer ke BCA 123-456-7890 a/n LaundryKu. Terima kasih!`);
            }
            waBtnHtml = `
                <a href="https://wa.me/${waNumber}?text=${waMsg}" target="_blank" rel="noopener noreferrer" class="btn-pay-wa" title="${isLunas ? 'Kirim Konfirmasi WA Lunas' : 'Tagih via WhatsApp'}">
                    <svg viewBox="0 0 24 24"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67Z"/></svg>
                </a>
            `;
        }

        // Metode bayar badge
        const method = trx.metodeBayar || (isLunas ? 'Tunai' : '-');
        let methodBadgeHtml = '<span class="method-badge none">-</span>';
        if (method === 'Tunai') {
            methodBadgeHtml = '<span class="method-badge tunai">💵 Tunai</span>';
        } else if (method === 'QRIS') {
            methodBadgeHtml = '<span class="method-badge qris">📱 QRIS</span>';
        } else if (method === 'Transfer') {
            methodBadgeHtml = '<span class="method-badge transfer">🏦 Transfer</span>';
        }

        // Tombol Aksi Kasir
        let actionBtnHtml = '';
        if (!isLunas) {
            actionBtnHtml = `
                <button class="btn-pay-settle" onclick="openSettleModal('${trx.id}')" title="Buka Kasir Pelunasan">
                    <svg style="width:13px;height:13px;fill:white;" viewBox="0 0 24 24"><path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/></svg>
                    ${isDP ? 'Lunasi Sisa' : 'Bayar Kasir'}
                </button>
            `;
        } else {
            actionBtnHtml = `
                <button class="btn-pay-settle" style="background:#0284C7;" onclick="openSettleModal('${trx.id}')" title="Ubah / Periksa Metode Bayar">
                    <svg style="width:12px;height:12px;fill:white;" viewBox="0 0 24 24"><path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/></svg>
                    Ubah
                </button>
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
                <td>
                    <div style="font-weight:500;">${trx.layanan}</div>
                    <div style="font-size:11.5px; color:var(--text-3);">${trx.berat || 1} kg/pcs</div>
                </td>
                <td><span class="total-cell">Rp ${(Number(trx.total)||0).toLocaleString('id-ID')}</span></td>
                <td>${methodBadgeHtml}</td>
                <td><span class="badge ${BAYAR_BADGE[trx.pembayaran] || 'badge-belum'}">${trx.pembayaran}</span></td>
                <td><span class="badge ${STATUS_BADGE[trx.statusCucian] || 'badge-new'}">${trx.statusCucian}</span></td>
                <td style="text-align:right;">
                    <div class="pay-action-btns" style="justify-content:flex-end;">
                        ${actionBtnHtml}
                        <button class="btn-pay-print" onclick="openReceipt('${trx.id}')" title="Cetak Struk Kwitansi">
                            <svg viewBox="0 0 24 24"><path d="M19,8H5C3.34,8 2,9.34 2,11V17H6V21H18V17H22V11C22,9.34 20.66,8 19,8M16,19H8V15H16V19M19,12C18.45,12 18,11.55 18,11C18,10.45 18.45,10 19,10C19.55,10 20,10.45 20,11C20,11.55 19.55,12 19,12M18,3H6V7H18V3Z"/></svg>
                        </button>
                        ${waBtnHtml}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ============================================================
// SEARCH & FILTER CONTROLLER
// ============================================================
function initSearchAndFilter() {
    const searchInput = document.getElementById('searchPayment');
    const statusSelect = document.getElementById('filterPaymentStatus');
    const methodSelect = document.getElementById('filterPaymentMethod');

    function apply() {
        const q = (searchInput ? searchInput.value : '').toLowerCase().trim();
        const s = statusSelect ? statusSelect.value : '';
        const m = methodSelect ? methodSelect.value : '';

        filteredTransactions = allTransactions.filter(t => {
            const matchQ = !q ||
                t.id.toLowerCase().includes(q) ||
                t.pelanggan.toLowerCase().includes(q) ||
                t.layanan.toLowerCase().includes(q);

            const matchS = !s || t.pembayaran === s;

            let matchM = true;
            if (m) {
                const method = t.metodeBayar || (t.pembayaran === 'Lunas' ? 'Tunai' : '');
                matchM = method.toLowerCase() === m.toLowerCase();
            }

            return matchQ && matchS && matchM;
        });

        renderPaymentTable(filteredTransactions);
    }

    searchInput && searchInput.addEventListener('input', apply);
    statusSelect && statusSelect.addEventListener('change', () => {
        syncSummaryCardHighlight(statusSelect.value);
        apply();
    });
    methodSelect && methodSelect.addEventListener('change', apply);

    // Interactive Summary Cards Filter
    const cardOmzet   = document.getElementById('cardFilterOmzet');
    const cardLunas   = document.getElementById('cardFilterLunas');
    const cardPiutang = document.getElementById('cardFilterPiutang');
    const cardDP      = document.getElementById('cardFilterDP');

    function resetCardActive() {
        [cardOmzet, cardLunas, cardPiutang, cardDP].forEach(c => c && c.classList.remove('active'));
    }

    if (cardOmzet) {
        cardOmzet.addEventListener('click', () => {
            resetCardActive();
            cardOmzet.classList.add('active');
            if (statusSelect) statusSelect.value = '';
            if (methodSelect) methodSelect.value = '';
            if (searchInput) searchInput.value = '';
            apply();
            showToast('Menampilkan seluruh tagihan & transaksi', 'info');
        });
    }

    if (cardLunas) {
        cardLunas.addEventListener('click', () => {
            resetCardActive();
            cardLunas.classList.add('active');
            if (statusSelect) statusSelect.value = 'Lunas';
            apply();
            showToast('Filter: Tagihan Lunas', 'info');
        });
    }

    if (cardPiutang) {
        cardPiutang.addEventListener('click', () => {
            resetCardActive();
            cardPiutang.classList.add('active');
            if (statusSelect) statusSelect.value = 'Belum';
            apply();
            showToast('Filter: Piutang (Belum Bayar)', 'info');
        });
    }

    if (cardDP) {
        cardDP.addEventListener('click', () => {
            resetCardActive();
            cardDP.classList.add('active');
            if (statusSelect) statusSelect.value = 'DP';
            apply();
            showToast('Filter: Pembayaran DP (Uang Muka)', 'info');
        });
    }
}

function syncSummaryCardHighlight(statusVal) {
    const cardOmzet   = document.getElementById('cardFilterOmzet');
    const cardLunas   = document.getElementById('cardFilterLunas');
    const cardPiutang = document.getElementById('cardFilterPiutang');
    const cardDP      = document.getElementById('cardFilterDP');

    [cardOmzet, cardLunas, cardPiutang, cardDP].forEach(c => c && c.classList.remove('active'));

    if (!statusVal && cardOmzet) cardOmzet.classList.add('active');
    else if (statusVal === 'Lunas' && cardLunas) cardLunas.classList.add('active');
    else if (statusVal === 'Belum' && cardPiutang) cardPiutang.classList.add('active');
    else if (statusVal === 'DP' && cardDP) cardDP.classList.add('active');
}

// ============================================================
// KASIR SETTLEMENT MODAL (POS LOGIC)
// ============================================================
function initSettleModal() {
    const overlay = document.getElementById('settleModalOverlay');
    const closeBtn = document.getElementById('closeSettleModal');
    const cancelBtn = document.getElementById('cancelSettleBtn');
    const saveOnlyBtn = document.getElementById('saveSettleOnlyBtn');
    const saveAndPrintBtn = document.getElementById('saveAndPrintBtn');
    const cashInput = document.getElementById('settleCashReceived');
    const dpInput = document.getElementById('settleDPAmount');

    function close() {
        if (overlay) {
            overlay.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    closeBtn && closeBtn.addEventListener('click', close);
    cancelBtn && cancelBtn.addEventListener('click', close);
    overlay && overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    cashInput && cashInput.addEventListener('input', calcChange);
    dpInput && dpInput.addEventListener('input', () => {
        calcDPNotice();
        calcChange();
    });

    saveOnlyBtn && saveOnlyBtn.addEventListener('click', () => saveSettlement(false));
    saveAndPrintBtn && saveAndPrintBtn.addEventListener('click', () => saveSettlement(true));
}

function openSettleModal(id) {
    const trx = allTransactions.find(t => t.id === id);
    if (!trx) return;

    currentSettleTrx = trx;
    currentSettleType = trx.pembayaran === 'DP' ? 'Lunas' : (trx.pembayaran === 'Lunas' ? 'Lunas' : 'Lunas');
    currentSettleMethod = trx.metodeBayar || 'Tunai';

    const custEl    = document.getElementById('settleRecapCust');
    const serviceEl = document.getElementById('settleRecapService');
    const statusEl  = document.getElementById('settleRecapStatus');
    const totalEl   = document.getElementById('settleRecapTotal');
    const notesEl   = document.getElementById('settleNotes');
    const cashIn    = document.getElementById('settleCashReceived');
    const dpIn      = document.getElementById('settleDPAmount');

    const totalVal = Number(trx.total) || 0;

    if (custEl)    custEl.textContent = `#${trx.id} • ${trx.pelanggan} (${trx.telepon || '-'})`;
    if (serviceEl) serviceEl.textContent = `${trx.layanan} • ${trx.berat || 1} kg/pcs`;
    if (statusEl)  statusEl.innerHTML = `<span class="badge ${BAYAR_BADGE[trx.pembayaran] || 'badge-belum'}">${trx.pembayaran}</span>`;
    if (totalEl)   totalEl.textContent = `Rp ${totalVal.toLocaleString('id-ID')}`;
    if (notesEl)   notesEl.value = trx.catatanBayar || '';

    // Default DP amount: setengah dari total tagihan
    if (dpIn) dpIn.value = Math.round(totalVal / 2);

    setSettleType(currentSettleType);
    selectPaymentMethod(currentSettleMethod);

    if (cashIn) {
        cashIn.value = totalVal;
    }
    calcChange();

    const overlay = document.getElementById('settleModalOverlay');
    if (overlay) {
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}
window.openSettleModal = openSettleModal;

function setSettleType(type) {
    currentSettleType = type;
    const btnLunas = document.getElementById('btnTypeLunas');
    const btnDP    = document.getElementById('btnTypeDP');
    const dpWrap   = document.getElementById('dpInputWrap');

    if (type === 'Lunas') {
        btnLunas && btnLunas.classList.add('active');
        btnDP && btnDP.classList.remove('active');
        if (dpWrap) dpWrap.style.display = 'none';
    } else {
        btnDP && btnDP.classList.add('active');
        btnLunas && btnLunas.classList.remove('active');
        if (dpWrap) dpWrap.style.display = 'block';
        calcDPNotice();
    }
    calcChange();
}
window.setSettleType = setSettleType;

function calcDPNotice() {
    if (!currentSettleTrx) return;
    const totalVal = Number(currentSettleTrx.total) || 0;
    const dpIn = document.getElementById('settleDPAmount');
    const noticeEl = document.getElementById('settleRemainingNotice');
    const dpVal = parseInt(dpIn ? dpIn.value : 0) || 0;
    const sisa = Math.max(0, totalVal - dpVal);

    if (noticeEl) {
        noticeEl.innerHTML = `Sisa tagihan: <b style="color:#DC2626;">Rp ${sisa.toLocaleString('id-ID')}</b> (akan ditagih saat pakaian diambil).`;
    }
}

function selectPaymentMethod(method) {
    currentSettleMethod = method;
    const cardTunai    = document.getElementById('methodCardTunai');
    const cardQRIS     = document.getElementById('methodCardQRIS');
    const cardTransfer = document.getElementById('methodCardTransfer');
    const cashSection  = document.getElementById('cashCalcSection');

    [cardTunai, cardQRIS, cardTransfer].forEach(c => c && c.classList.remove('active'));

    if (method === 'Tunai' && cardTunai) cardTunai.classList.add('active');
    if (method === 'QRIS' && cardQRIS) cardQRIS.classList.add('active');
    if (method === 'Transfer' && cardTransfer) cardTransfer.classList.add('active');

    if (cashSection) {
        cashSection.style.display = method === 'Tunai' ? 'block' : 'none';
    }
}
window.selectPaymentMethod = selectPaymentMethod;

function getTargetBillAmount() {
    if (!currentSettleTrx) return 0;
    const total = Number(currentSettleTrx.total) || 0;
    if (currentSettleType === 'DP') {
        const dpIn = document.getElementById('settleDPAmount');
        return parseInt(dpIn ? dpIn.value : 0) || 0;
    }
    return total;
}

function calcChange() {
    const cashIn = document.getElementById('settleCashReceived');
    const changeBox = document.getElementById('changeBox');
    const changeLabel = document.getElementById('changeLabel');
    const changeAmount = document.getElementById('changeAmount');
    if (!cashIn || !changeBox || !changeAmount) return;

    const target = getTargetBillAmount();
    const received = parseInt(cashIn.value) || 0;
    const diff = received - target;

    if (diff >= 0) {
        changeBox.classList.remove('insufficient');
        if (changeLabel) changeLabel.textContent = 'Kembalian:';
        changeAmount.textContent = 'Rp ' + diff.toLocaleString('id-ID');
    } else {
        changeBox.classList.add('insufficient');
        if (changeLabel) changeLabel.textContent = 'Uang Kurang:';
        changeAmount.textContent = 'Rp ' + Math.abs(diff).toLocaleString('id-ID');
    }
}

function setCashInput(val) {
    const cashIn = document.getElementById('settleCashReceived');
    if (cashIn) {
        cashIn.value = val;
        calcChange();
    }
}
window.setCashInput = setCashInput;

function setCashPas() {
    const target = getTargetBillAmount();
    setCashInput(target);
}
window.setCashPas = setCashPas;

async function saveSettlement(shouldPrintReceipt) {
    if (!currentSettleTrx) return;

    const totalVal = Number(currentSettleTrx.total) || 0;
    const notesIn = document.getElementById('settleNotes');
    const notes = notesIn ? notesIn.value.trim() : '';

    let dpVal = 0;
    if (currentSettleType === 'DP') {
        const dpIn = document.getElementById('settleDPAmount');
        dpVal = parseInt(dpIn ? dpIn.value : 0) || 0;
        if (dpVal <= 0 || dpVal >= totalVal) {
            alert('Nominal DP harus lebih dari Rp 0 dan lebih kecil dari total tagihan!');
            return;
        }
    }

    let cashReceived = 0;
    let changeVal = 0;
    if (currentSettleMethod === 'Tunai') {
        const cashIn = document.getElementById('settleCashReceived');
        cashReceived = parseInt(cashIn ? cashIn.value : 0) || 0;
        const target = currentSettleType === 'DP' ? dpVal : totalVal;
        if (cashReceived < target) {
            if (!confirm(`Uang yang diterima (Rp ${cashReceived.toLocaleString('id-ID')}) kurang dari tagihan (Rp ${target.toLocaleString('id-ID')}). Tetap lanjutkan?`)) {
                return;
            }
        }
        changeVal = Math.max(0, cashReceived - target);
    }

    // Persist to Supabase & LocalStorage
    const finalPaymentStatus = currentSettleType;
    const statusNote = `Kasir pelunasan via ${currentSettleMethod} (${finalPaymentStatus}). ${notes}`;

    if (window.LaundryDB) {
        await LaundryDB.updateStatus(
            currentSettleTrx.id, 
            null, 
            finalPaymentStatus, 
            statusNote,
            {
                metodeBayar: currentSettleMethod,
                nominalDP: dpVal,
                cashReceived: cashReceived,
                kembalian: changeVal
            }
        );
    }

    // Update in memory
    currentSettleTrx.pembayaran = finalPaymentStatus;
    currentSettleTrx.metodeBayar = currentSettleMethod;
    currentSettleTrx.cashReceived = cashReceived;
    currentSettleTrx.kembalian = changeVal;
    currentSettleTrx.catatanBayar = notes;
    if (currentSettleType === 'DP') {
        currentSettleTrx.nominalDP = dpVal;
    }

    const filteredTrx = filteredTransactions.find(t => t.id === currentSettleTrx.id);
    if (filteredTrx) {
        filteredTrx.pembayaran = finalPaymentStatus;
        filteredTrx.metodeBayar = currentSettleMethod;
    }

    updateFinancialMetrics();
    renderPaymentTable(filteredTransactions);
    updateLiveNotifications();

    const targetId = currentSettleTrx.id;

    // Close modal
    const overlay = document.getElementById('settleModalOverlay');
    if (overlay) {
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    }

    showToast(`Pembayaran #${targetId} berhasil disimpan (${finalPaymentStatus} - ${currentSettleMethod})!`, 'success');

    if (shouldPrintReceipt) {
        setTimeout(() => {
            openReceipt(targetId);
        }, 200);
    }
}
window.saveSettlement = saveSettlement;

// ============================================================
// PRINTABLE RECEIPT MODAL (DYNAMIC OUTLET INFO)
// ============================================================
async function openReceipt(id) {
    const trx = allTransactions.find(t => t.id === id);
    if (!trx) return;

    const overlay = document.getElementById('receiptModalOverlay');
    const box = document.getElementById('printableReceiptBox');
    if (!overlay || !box) return;

    let outlet = {
        nama: 'LAUNDRYKU',
        slogan: 'Sistem Manajemen Laundry Modern & Higienis',
        alamat: 'Jl. Kampus No. 12, Padang',
        wa: '0812-3456-7890',
        footer: 'Terima kasih atas kunjungan & kepercayaan Anda!'
    };

    try {
        if (window.LaundryDB && LaundryDB.getOutletSettings) {
            outlet = await LaundryDB.getOutletSettings();
        }
    } catch(e){}

    const totalVal = Number(trx.total) || 0;
    const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
    const isLunas = trx.pembayaran === 'Lunas';
    const isDP = trx.pembayaran === 'DP';
    const methodStr = trx.metodeBayar || (isLunas ? 'Tunai' : 'Belum Bayar');

    let cashCalcDetailsHtml = '';
    if (methodStr === 'Tunai' && trx.cashReceived) {
        cashCalcDetailsHtml = `
            <div class="receipt-line">
                <span>Uang Diterima:</span>
                <span>Rp ${(Number(trx.cashReceived)||0).toLocaleString('id-ID')}</span>
            </div>
            <div class="receipt-line">
                <span>Kembalian:</span>
                <span>Rp ${(Number(trx.kembalian)||0).toLocaleString('id-ID')}</span>
            </div>
        `;
    }

    let dpNoticeHtml = '';
    if (isDP && trx.nominalDP) {
        const sisa = Math.max(0, totalVal - Number(trx.nominalDP));
        dpNoticeHtml = `
            <div class="receipt-line" style="color:#CA8A04;">
                <span>DP Dibayar:</span>
                <b>Rp ${(Number(trx.nominalDP)||0).toLocaleString('id-ID')}</b>
            </div>
            <div class="receipt-line" style="color:#DC2626; font-weight:700;">
                <span>Sisa Tagihan:</span>
                <span>Rp ${sisa.toLocaleString('id-ID')}</span>
            </div>
        `;
    }

    box.innerHTML = `
        <div class="receipt-header">
            <div class="receipt-logo">${(outlet.nama || 'LAUNDRYKU').toUpperCase()}</div>
            <div style="font-size:11px; color:#64748B; margin-top:2px;">${outlet.slogan || 'Sistem Manajemen Laundry Modern & Higienis'}</div>
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
            <span>Pelanggan:</span>
            <b>${trx.pelanggan}</b>
        </div>
        <div class="receipt-line">
            <span>No. HP:</span>
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
            <b>${methodStr}</b>
        </div>
        ${cashCalcDetailsHtml}
        ${dpNoticeHtml}
        <div class="receipt-line" style="margin-top:4px;">
            <span>STATUS PEMBAYARAN:</span>
            <b style="color:${isLunas ? '#10B981' : (isDP ? '#CA8A04' : '#EF4444')};">
                ${isLunas ? '✓ LUNAS' : (isDP ? '⏱️ DP (UANG MUKA)' : '⚠️ BELUM BAYAR')}
            </b>
        </div>
        <div class="receipt-footer">
            <div>${outlet.footer || 'Terima kasih atas kunjungan & kepercayaan Anda!'}</div>
            <div style="margin-top:4px; font-weight:600;">Pakaian Bersih, Wangi & Rapi Bersama ${(outlet.nama || 'LaundryKu')}</div>
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

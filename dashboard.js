/* ============================================================
   dashboard.js — LaundryKu Dashboard Logic
   ============================================================ */

// ============================================================
// DEFAULT DUMMY DATA (Initial Seed & Offline Fallback)
// ============================================================
const DUMMY_TRANSACTIONS = [
    { id: 'TRX00131', pelanggan: 'Eko Prasetyo',      telepon: '081234567891', berat: 4, layanan: 'Cuci Setrika',  total: 75000,  statusCucian: 'Dikeringkan',  pembayaran: 'Lunas',  tanggal: '2026-09-16', estimasi: '2026-09-17', catatan: 'Pakaian kantor, lipat rapi' },
    { id: 'TRX00130', pelanggan: 'Ahmad Wahyu',        telepon: '085712345678', berat: 7, layanan: 'Cuci Express',  total: 56000,  statusCucian: 'Dicuci',        pembayaran: 'DP',     tanggal: '2026-09-16', estimasi: '2026-09-17', catatan: 'Express selesai besok pagi' },
    { id: 'TRX00129', pelanggan: 'Rina Wati',          telepon: '082198765432', berat: 5, layanan: 'Cuci Reguler',  total: 35000,  statusCucian: 'Baru Masuk',   pembayaran: 'Belum',  tanggal: '2026-09-16', estimasi: '2026-09-18', catatan: 'Ada kemeja putih terpisah' },
    { id: 'TRX00128', pelanggan: 'Siti Rahayu',        telepon: '081345678901', berat: 6, layanan: 'Dry Clean',     total: 90000,  statusCucian: 'Disetrika',    pembayaran: 'Lunas',  tanggal: '2026-09-15', estimasi: '2026-09-16', catatan: 'Gaun pesta sutra, harap hati-hati' },
    { id: 'TRX00127', pelanggan: 'Hendra Kurniawan',   telepon: '081987654321', berat: 12,layanan: 'Cuci Setrika', total: 120000, statusCucian: 'Siap Diambil', pembayaran: 'Lunas',  tanggal: '2026-09-15', estimasi: '2026-09-16', catatan: 'Sprei king size dan selimut tebal' },
    { id: 'TRX00126', pelanggan: 'Dewi Lestari',       telepon: '087812345678', berat: 2, layanan: 'Laundry Sepatu',total: 40000,  statusCucian: 'Siap Diambil', pembayaran: 'DP',     tanggal: '2026-09-14', estimasi: '2026-09-15', catatan: 'Sneakers putih converse' },
    { id: 'TRX00125', pelanggan: 'Budi Santoso',       telepon: '081234567890', berat: 8, layanan: 'Cuci Express',  total: 64000,  statusCucian: 'Siap Diambil', pembayaran: 'Lunas',  tanggal: '2026-09-14', estimasi: '2026-09-15', catatan: 'Harap kabari via WhatsApp jika siap' },
    { id: 'TRX00124', pelanggan: 'Eko Prasetyo',       telepon: '081234567891', berat: 5, layanan: 'Cuci Reguler',  total: 25000,  statusCucian: 'Selesai',      pembayaran: 'Lunas',  tanggal: '2026-09-13', estimasi: '2026-09-15', catatan: 'Pesanan diambil sendiri' },
    { id: 'TRX00123', pelanggan: 'Siti Rahayu',        telepon: '081345678901', berat: 5, layanan: 'Cuci Setrika',  total: 50000,  statusCucian: 'Selesai',      pembayaran: 'Lunas',  tanggal: '2026-09-13', estimasi: '2026-09-15', catatan: 'Lunas tunai di kasir' },
    { id: 'TRX00122', pelanggan: 'Dewi Lestari',       telepon: '087812345678', berat: 6, layanan: 'Cuci Express',  total: 48000,  statusCucian: 'Baru Masuk',   pembayaran: 'Belum',  tanggal: '2026-09-16', estimasi: '2026-09-17', catatan: 'Baru masuk pagi' },
];

const REVENUE_7 = [
    { label: '10 Sep', value: 320000 },
    { label: '11 Sep', value: 410000 },
    { label: '12 Sep', value: 280000 },
    { label: '13 Sep', value: 520000 },
    { label: '14 Sep', value: 460000 },
    { label: '15 Sep', value: 390000 },
    { label: '16 Sep', value: 485000 },
];

const REVENUE_30 = Array.from({ length: 30 }, (_, i) => ({
    label: `${(i + 1)} Sep`,
    value: Math.floor(Math.random() * 350000 + 150000),
}));

const STATUS_DATA = {
    labels: ['Baru Masuk', 'Dicuci', 'Dikeringkan', 'Disetrika', 'Siap Diambil', 'Selesai'],
    values: [2, 1, 1, 1, 3, 2],
    colors: ['#EB7F31', '#FCAD38', '#F59E0B', '#10B981', '#8B5CF6', '#64748B'],
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
// STATE
// ============================================================
let revenueChart = null;
let statusChart  = null;
let currentPeriod = 7;
let allTransactions = [...DUMMY_TRANSACTIONS];
let filteredTransactions = [...DUMMY_TRANSACTIONS];
let currentDetailId = null;
let currentEditingId = null;

// ============================================================
// DOM READY
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    initDate();
    initUserProfile();
    renderRevenueChart(REVENUE_7);
    renderStatusChart();
    initSidebar();
    initModal();
    initStatusAndDetailModals();
    initNotifications();
    initSearch();
    initChartFilter();
    setTodayDates();
    initTotalCalculation();
    animateSummaryCards();
    initDashboardData();
});

// ============================================================
// LOGGED-IN USER PROFILE SYNC
// ============================================================
function initUserProfile() {
    const user = window.LaundryAuth ? LaundryAuth.getCurrentUser() : null;
    if (user) {
        const nameEl = document.querySelector('.user-name');
        const roleEl = document.querySelector('.user-role');
        const avatarEl = document.querySelector('.user-avatar');
        const welcomeEl = document.querySelector('.dashboard-title');

        if (nameEl) nameEl.textContent = user.nama || user.email;
        if (roleEl) roleEl.textContent = user.role === 'admin' ? 'Administrator' : 'Pelanggan / Pengguna';
        if (avatarEl) avatarEl.textContent = (user.nama ? user.nama.charAt(0) : 'U').toUpperCase();
        if (welcomeEl) welcomeEl.innerHTML = `Selamat Datang, ${user.nama || 'Pengguna'}! &#128075;`;
    }
}

// ============================================================
// DATA INITIALIZATION & SYNC
// ============================================================
async function initDashboardData() {
    try {
        if (window.LaundryDB) {
            let data = await LaundryDB.getTransactions();
            if (!data || data.length === 0) {
                // Inisialisasi awal ke localStorage jika kosong
                localStorage.setItem('laundry_transactions', JSON.stringify(DUMMY_TRANSACTIONS));
                data = DUMMY_TRANSACTIONS;
            }
            allTransactions = data;
            filteredTransactions = [...allTransactions];
        }
    } catch (err) {
        console.warn('Load transaksi warning:', err);
    }
    renderTransactions(filteredTransactions);
    updateDashboardMetrics();
}

// ============================================================
// DYNAMIC METRICS RECALCULATION
// ============================================================
function updateDashboardMetrics() {
    // 1. Total Transaksi
    const cardTrx = document.getElementById('cardTransaksi');
    if (cardTrx) {
        cardTrx.textContent = allTransactions.length;
    }

    // 2. Pendapatan (Total yang sudah lunas)
    const cardPendapatan = document.getElementById('cardPendapatan');
    if (cardPendapatan) {
        const totalLunas = allTransactions
            .filter(t => t.pembayaran === 'Lunas')
            .reduce((sum, t) => sum + (Number(t.total) || 0), 0);
        cardPendapatan.textContent = 'Rp ' + totalLunas.toLocaleString('id-ID');
    }

    // 3. Sedang Diproses (Dicuci, Dikeringkan, Disetrika)
    const cardDiproses = document.getElementById('cardDiproses');
    if (cardDiproses) {
        const diprosesCount = allTransactions.filter(t => 
            ['Dicuci', 'Dikeringkan', 'Disetrika'].includes(t.statusCucian)
        ).length;
        cardDiproses.textContent = diprosesCount;
    }

    // 4. Siap Diambil
    const cardSiap = document.getElementById('cardSiap');
    if (cardSiap) {
        const siapCount = allTransactions.filter(t => t.statusCucian === 'Siap Diambil').length;
        cardSiap.textContent = siapCount;
    }

    // 5. Donut Chart & Legend
    const counts = STATUS_DATA.labels.map(lbl => 
        allTransactions.filter(t => t.statusCucian === lbl).length
    );
    STATUS_DATA.values = counts;

    if (statusChart) {
        statusChart.data.datasets[0].data = counts;
        statusChart.update();
    }

    const legendContainer = document.querySelector('.donut-legend');
    if (legendContainer) {
        legendContainer.innerHTML = STATUS_DATA.labels.map((lbl, idx) => `
            <div class="legend-item">
                <span class="legend-dot" style="background:${STATUS_DATA.colors[idx]}"></span>
                ${lbl} <b>${STATUS_DATA.values[idx]}</b>
            </div>
        `).join('');
    }

    // 6. Cucian Perlu Perhatian
    renderAttentionList();
}

// ============================================================
// ATTENTION LIST (CUCIAN PERLU PERHATIAN)
// ============================================================
function renderAttentionList() {
    const listEl = document.getElementById('attentionList');
    if (!listEl) return;

    // Prioritaskan status: Siap Diambil > Baru Masuk > Disetrika / lainnya yang belum selesai
    const activeItems = allTransactions.filter(t => t.statusCucian !== 'Selesai');
    
    // Sort urutan urgensi
    activeItems.sort((a, b) => {
        const priority = { 'Siap Diambil': 1, 'Baru Masuk': 2, 'Disetrika': 3, 'Dikeringkan': 4, 'Dicuci': 5 };
        return (priority[a.statusCucian] || 9) - (priority[b.statusCucian] || 9);
    });

    const displayItems = activeItems.slice(0, 4);

    if (displayItems.length === 0) {
        listEl.innerHTML = `
            <div style="text-align:center;padding:30px 20px;color:#94A3B8;font-size:13px;">
                🎉 Semua cucian telah selesai diambil pelanggan!
            </div>
        `;
        return;
    }

    listEl.innerHTML = displayItems.map(trx => {
        let levelClass = 'warning';
        let badgeClass = 'badge-process';
        let noteText = `Estimasi: ${trx.estimasi || 'Hari ini'}`;

        if (trx.statusCucian === 'Siap Diambil') {
            levelClass = 'urgent';
            badgeClass = 'badge-ready';
            noteText = 'Siap Diambil Pelanggan';
        } else if (trx.statusCucian === 'Baru Masuk') {
            levelClass = 'urgent';
            badgeClass = 'badge-new';
            noteText = 'Perlu segera dicuci';
        } else if (trx.statusCucian === 'Disetrika') {
            levelClass = 'warning';
            badgeClass = 'badge-process';
            noteText = 'Tahap akhir penyelesaian';
        }

        return `
            <div class="attention-item ${levelClass}">
                <div class="attention-status-bar"></div>
                <div class="attention-info">
                    <div class="attention-name">${trx.pelanggan}</div>
                    <div class="attention-code">#${trx.id} &bull; ${trx.layanan}</div>
                    <div class="attention-meta">
                        <span class="badge ${badgeClass}">${trx.statusCucian}</span>
                        <span class="attention-time">${noteText}</span>
                    </div>
                </div>
                <button class="attention-action" aria-label="Lihat detail #${trx.id}" onclick="viewDetail('${trx.id}')">
                    <svg viewBox="0 0 24 24"><path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"/></svg>
                </button>
            </div>
        `;
    }).join('');
}

// ============================================================
// DATE
// ============================================================
function initDate() {
    const el = document.getElementById('topbarDate');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
}

// ============================================================
// CHARTS
// ============================================================
function renderRevenueChart(data) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    if (revenueChart) { revenueChart.destroy(); }

    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, 'rgba(235,127,49,0.3)');
    gradient.addColorStop(1, 'rgba(235,127,49,0.02)');

    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.label),
            datasets: [{
                label: 'Pendapatan',
                data: data.map(d => d.value),
                borderColor: '#EB7F31',
                backgroundColor: gradient,
                borderWidth: 2.5,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#EB7F31',
                pointBorderColor: 'white',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1E293B',
                    titleColor: '#94A3B8',
                    bodyColor: 'white',
                    padding: 12,
                    cornerRadius: 10,
                    callbacks: {
                        label: ctx => 'Rp ' + ctx.parsed.y.toLocaleString('id-ID'),
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { family: 'Poppins', size: 11 }, color: '#94A3B8' },
                    border: { display: false },
                },
                y: {
                    grid: { color: '#F1F5F9', drawBorder: false },
                    ticks: {
                        font: { family: 'Poppins', size: 11 },
                        color: '#94A3B8',
                        callback: v => 'Rp ' + (v / 1000).toFixed(0) + 'k',
                    },
                    border: { display: false, dash: [4, 4] },
                }
            }
        }
    });
}

function renderStatusChart() {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;

    if (statusChart) { statusChart.destroy(); }

    statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: STATUS_DATA.labels,
            datasets: [{
                data: STATUS_DATA.values,
                backgroundColor: STATUS_DATA.colors,
                borderWidth: 3,
                borderColor: 'white',
                hoverOffset: 8,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1E293B',
                    titleColor: '#94A3B8',
                    bodyColor: 'white',
                    padding: 12,
                    cornerRadius: 10,
                }
            }
        }
    });
}

// ============================================================
// CHART FILTER
// ============================================================
function initChartFilter() {
    const btn7  = document.getElementById('filter7');
    const btn30 = document.getElementById('filter30');
    if (!btn7 || !btn30) return;

    btn7.addEventListener('click', () => {
        btn7.classList.add('active');
        btn30.classList.remove('active');
        renderRevenueChart(REVENUE_7);
        currentPeriod = 7;
    });

    btn30.addEventListener('click', () => {
        btn30.classList.add('active');
        btn7.classList.remove('active');
        renderRevenueChart(REVENUE_30);
        currentPeriod = 30;
    });
}

// ============================================================
// TRANSACTIONS TABLE
// ============================================================
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

function renderTransactions(data) {
    const tbody = document.getElementById('transactionTbody');
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:#94A3B8;font-size:14px;">
            Tidak ada transaksi yang ditemukan
        </td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(trx => `
        <tr>
            <td><span class="trx-id">#${trx.id}</span></td>
            <td><span class="pelanggan-cell">${trx.pelanggan}</span></td>
            <td>${trx.layanan}</td>
            <td><span class="total-cell">Rp ${(Number(trx.total) || 0).toLocaleString('id-ID')}</span></td>
            <td><span class="badge ${STATUS_BADGE[trx.statusCucian] || 'badge-new'}">${trx.statusCucian}</span></td>
            <td><span class="badge ${BAYAR_BADGE[trx.pembayaran] || 'badge-belum'}">${trx.pembayaran}</span></td>
            <td>
                <div class="action-btns">
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
    `).join('');
}

// ============================================================
// DETAIL MODAL & LIVE TRACKING TIMELINE
// ============================================================
function viewDetail(id) {
    const trx = allTransactions.find(t => t.id === id);
    if (!trx) {
        showToast(`Transaksi #${id} tidak ditemukan`, 'error');
        return;
    }
    currentDetailId = trx.id;

    // Isi konten detail
    const trxCodeEl = document.getElementById('detailTrxCode');
    const badgeEl   = document.getElementById('detailStatusBadge');
    const namaEl    = document.getElementById('detailNama');
    const telpEl    = document.getElementById('detailTelp');
    const layEl     = document.getElementById('detailLayanan');
    const beratEl   = document.getElementById('detailBerat');
    const totalEl   = document.getElementById('detailTotal');
    const bayarEl   = document.getElementById('detailBayarBadge');
    const estEl     = document.getElementById('detailEstimasi');
    const masukEl   = document.getElementById('detailMasuk');
    const catEl     = document.getElementById('detailCatatan');

    if (trxCodeEl) trxCodeEl.textContent = `#${trx.id}`;
    if (badgeEl) {
        badgeEl.textContent = trx.statusCucian;
        badgeEl.className = `badge ${STATUS_BADGE[trx.statusCucian] || 'badge-new'}`;
    }
    if (namaEl)  namaEl.textContent = trx.pelanggan;
    if (telpEl)  telpEl.textContent = `📞 ${trx.telepon || '0812-3456-7890'}`;
    if (layEl)   layEl.textContent = trx.layanan;
    if (beratEl) beratEl.textContent = `${trx.berat || 1} kg`;
    if (totalEl) totalEl.textContent = `Rp ${(Number(trx.total) || 0).toLocaleString('id-ID')}`;
    if (bayarEl) {
        bayarEl.textContent = trx.pembayaran;
        bayarEl.className = `badge ${BAYAR_BADGE[trx.pembayaran] || 'badge-belum'}`;
    }
    if (estEl)   estEl.textContent = trx.estimasi || '-';
    if (masukEl) masukEl.textContent = `Masuk: ${trx.tanggal || '-'}`;
    if (catEl)   catEl.textContent = trx.catatan || 'Tidak ada catatan khusus';

    // Render 6-stage Timeline Tracking
    renderModalTimeline(trx.statusCucian);

    // Buka Modal Detail
    const overlay = document.getElementById('detailModalOverlay');
    if (overlay) {
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}
window.viewDetail = viewDetail;

function closeDetailModal() {
    const overlay = document.getElementById('detailModalOverlay');
    if (overlay) {
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function renderModalTimeline(currentStatus) {
    const container = document.getElementById('modalTimeline');
    if (!container) return;

    const currentIdx = TIMELINE_STAGES.findIndex(s => s.key === currentStatus);
    const activeIndex = currentIdx === -1 ? 0 : currentIdx;

    container.innerHTML = TIMELINE_STAGES.map((stage, idx) => {
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

// ============================================================
// EDIT STATUS MODAL
// ============================================================
function editStatus(id) {
    const trx = allTransactions.find(t => t.id === id);
    if (!trx) {
        showToast(`Transaksi #${id} tidak ditemukan`, 'error');
        return;
    }
    currentEditingId = trx.id;

    const editTrxCode = document.getElementById('editTrxCode');
    const selectStatus = document.getElementById('editStatusCucian');
    const selectBayar  = document.getElementById('editStatusPembayaran');
    const inputCatatan = document.getElementById('editCatatanStatus');

    if (editTrxCode) editTrxCode.textContent = `#${trx.id} (${trx.pelanggan})`;
    if (selectStatus) selectStatus.value = trx.statusCucian;
    if (selectBayar)  selectBayar.value  = trx.pembayaran;
    if (inputCatatan) inputCatatan.value = '';

    const overlay = document.getElementById('editStatusModalOverlay');
    if (overlay) {
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}
window.editStatus = editStatus;

function closeEditStatusModal() {
    const overlay = document.getElementById('editStatusModalOverlay');
    if (overlay) {
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// ============================================================
// INIT MODAL HANDLERS (DETAIL & EDIT STATUS)
// ============================================================
function initStatusAndDetailModals() {
    // Detail Modal Buttons
    const closeDetailBtn = document.getElementById('closeDetailModal');
    const detailOverlay  = document.getElementById('detailModalOverlay');
    const printBtn       = document.getElementById('printStrukBtn');
    const openEditFromDetail = document.getElementById('openEditFromDetailBtn');

    closeDetailBtn && closeDetailBtn.addEventListener('click', closeDetailModal);
    detailOverlay && detailOverlay.addEventListener('click', e => {
        if (e.target === detailOverlay) closeDetailModal();
    });
    printBtn && printBtn.addEventListener('click', () => {
        window.print();
    });
    openEditFromDetail && openEditFromDetail.addEventListener('click', () => {
        if (currentDetailId) {
            closeDetailModal();
            editStatus(currentDetailId);
        }
    });

    // Edit Status Modal Buttons
    const closeEditBtn   = document.getElementById('closeEditModal');
    const cancelEditBtn  = document.getElementById('cancelEditStatusBtn');
    const editOverlay    = document.getElementById('editStatusModalOverlay');
    const saveEditBtn    = document.getElementById('saveEditStatusBtn');

    closeEditBtn && closeEditBtn.addEventListener('click', closeEditStatusModal);
    cancelEditBtn && cancelEditBtn.addEventListener('click', closeEditStatusModal);
    editOverlay && editOverlay.addEventListener('click', e => {
        if (e.target === editOverlay) closeEditStatusModal();
    });

    saveEditBtn && saveEditBtn.addEventListener('click', async () => {
        if (!currentEditingId) return;

        const newStatus = document.getElementById('editStatusCucian').value;
        const newPayment = document.getElementById('editStatusPembayaran').value;
        const catatan = document.getElementById('editCatatanStatus').value.trim();

        // 1. Simpan ke Database Supabase & LocalStorage
        if (window.LaundryDB) {
            await LaundryDB.updateStatus(currentEditingId, newStatus, newPayment, catatan);
        }

        // 2. Update state lokal
        const trx = allTransactions.find(t => t.id === currentEditingId);
        if (trx) {
            trx.statusCucian = newStatus;
            trx.pembayaran = newPayment;
            if (catatan) trx.catatan = catatan;
        }
        const filteredTrx = filteredTransactions.find(t => t.id === currentEditingId);
        if (filteredTrx) {
            filteredTrx.statusCucian = newStatus;
            filteredTrx.pembayaran = newPayment;
            if (catatan) filteredTrx.catatan = catatan;
        }

        // 3. Render ulang tampilan & update metrik
        renderTransactions(filteredTransactions);
        updateDashboardMetrics();
        closeEditStatusModal();
        showToast(`Status transaksi #${currentEditingId} berhasil diubah ke ${newStatus}!`, 'success');
    });

    // Escape listener untuk semua modal
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closeDetailModal();
            closeEditStatusModal();
            const addModal = document.getElementById('modalOverlay');
            if (addModal && addModal.classList.contains('show')) {
                addModal.classList.remove('show');
                document.body.style.overflow = '';
            }
        }
    });

    // viewAllAttention button
    const viewAllAttention = document.getElementById('viewAllAttention');
    if (viewAllAttention) {
        viewAllAttention.addEventListener('click', () => {
            const tableCard = document.querySelector('.table-card');
            if (tableCard) {
                tableCard.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
}

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
        updateDashboardMetrics();
        showToast(`Transaksi #${id} berhasil dihapus`, 'success');
    }
}
window.deleteTransaction = deleteTransaction;

// ============================================================
// SEARCH & FILTER
// ============================================================
function initSearch() {
    const searchInput  = document.getElementById('searchTrx');
    const filterSelect = document.getElementById('filterStatus');
    if (!searchInput || !filterSelect) return;

    function applyFilter() {
        const q = searchInput.value.toLowerCase();
        const s = filterSelect.value;
        filteredTransactions = allTransactions.filter(t => {
            const matchQ = !q ||
                t.id.toLowerCase().includes(q) ||
                t.pelanggan.toLowerCase().includes(q) ||
                t.layanan.toLowerCase().includes(q);
            const matchS = !s || t.statusCucian === s;
            return matchQ && matchS;
        });
        renderTransactions(filteredTransactions);
    }

    searchInput.addEventListener('input', applyFilter);
    filterSelect.addEventListener('change', applyFilter);
}

// ============================================================
// SIDEBAR
// ============================================================
function initSidebar() {
    const sidebar  = document.getElementById('sidebar');
    const overlay  = document.getElementById('sidebarOverlay');
    const hamburger = document.getElementById('hamburgerBtn');
    const closeBtn = document.getElementById('sidebarClose');

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

    // Nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            link.closest('.nav-item').classList.add('active');
            const page = link.dataset.page;
            const bc = document.getElementById('breadcrumbCurrent');
            if (bc) bc.textContent = capitalize(page);
            if (window.innerWidth < 900) closeSidebar();
            if (page !== 'dashboard') {
                showToast(`Halaman ${capitalize(page)} siap dikembangkan pada fase berikutnya!`, 'info');
            }
        });
    });
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================================
// NOTIFICATIONS
// ============================================================
function initNotifications() {
    const notifBtn      = document.getElementById('notifBtn');
    const notifDropdown = document.getElementById('notifDropdown');
    const markAllRead   = document.getElementById('markAllRead');

    if (!notifBtn || !notifDropdown) return;

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
        const dot = document.querySelector('.notif-dot');
        if (dot) dot.style.display = 'none';
        showToast('Semua notifikasi ditandai dibaca', 'success');
    });
}

// ============================================================
// MODAL TAMBAH TRANSAKSI
// ============================================================
function initModal() {
    const openBtn   = document.getElementById('addTransaksiBtn');
    const overlay   = document.getElementById('modalOverlay');
    const closeBtn  = document.getElementById('modalClose');
    const cancelBtn = document.getElementById('cancelModal');
    const saveBtn   = document.getElementById('saveTransaksi');

    function openModal() {
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    function closeModal() {
        overlay.classList.remove('show');
        document.body.style.overflow = '';
        document.getElementById('transaksiForm').reset();
        document.getElementById('totalDisplay').textContent = 'Rp 0';
    }

    openBtn  && openBtn.addEventListener('click', openModal);
    closeBtn && closeBtn.addEventListener('click', closeModal);
    cancelBtn && cancelBtn.addEventListener('click', closeModal);

    overlay && overlay.addEventListener('click', e => {
        if (e.target === overlay) closeModal();
    });

    saveBtn && saveBtn.addEventListener('click', async () => {
        const pelangganSelect = document.getElementById('pelangganSelect');
        const layananSelect   = document.getElementById('layananSelect');
        const beratInput      = document.getElementById('beratInput');
        const tglMasuk        = document.getElementById('tanggalMasuk');
        const estSelesai      = document.getElementById('estimasiSelesai');
        const catatanInput    = document.getElementById('catatanInput');

        const pelanggan = pelangganSelect.value;
        const hargaUnit = layananSelect.value;
        const berat     = beratInput.value;

        if (!pelanggan) { showToast('Pilih pelanggan terlebih dahulu', 'error'); return; }
        if (!hargaUnit) { showToast('Pilih layanan terlebih dahulu', 'error'); return; }
        if (!berat || berat < 1) { showToast('Masukkan berat atau jumlah yang valid', 'error'); return; }

        const newId = 'TRX00' + (132 + allTransactions.length);
        const total = parseInt(hargaUnit) * parseInt(berat);
        const newTrx = {
            id: newId,
            pelanggan,
            telepon: '0812-3456-7890',
            layanan: layananSelect.options[layananSelect.selectedIndex].text.split(' (')[0],
            berat: parseInt(berat),
            total,
            statusCucian: 'Baru Masuk',
            pembayaran:   'Belum',
            tanggal:  tglMasuk.value || new Date().toISOString().split('T')[0],
            estimasi: estSelesai.value || new Date(Date.now() + 86400000).toISOString().split('T')[0],
            catatan:  catatanInput.value.trim() || '-'
        };

        // Simpan ke Supabase & LocalStorage
        if (window.LaundryDB) {
            await LaundryDB.addTransaction(newTrx);
        }

        allTransactions.unshift(newTrx);
        filteredTransactions.unshift(newTrx);

        renderTransactions(filteredTransactions);
        updateDashboardMetrics();
        closeModal();
        showToast(`Transaksi #${newId} berhasil disimpan!`, 'success');
    });
}

// ============================================================
// TOTAL CALCULATOR
// ============================================================
function initTotalCalculation() {
    const layananSel = document.getElementById('layananSelect');
    const beratInput = document.getElementById('beratInput');
    if (!layananSel || !beratInput) return;

    function calc() {
        const harga = parseInt(layananSel.value) || 0;
        const berat = parseInt(beratInput.value) || 0;
        const total = harga * berat;
        const el = document.getElementById('totalDisplay');
        if (el) el.textContent = 'Rp ' + total.toLocaleString('id-ID');
    }

    layananSel.addEventListener('change', calc);
    beratInput.addEventListener('input', calc);
}
window.hitungTotal = function() {};

// ============================================================
// TODAY DATES
// ============================================================
function setTodayDates() {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const tgl = document.getElementById('tanggalMasuk');
    const est = document.getElementById('estimasiSelesai');
    if (tgl) tgl.value = today;
    if (est) est.value = tomorrow;
}

// ============================================================
// ANIMATE CARDS
// ============================================================
function animateSummaryCards() {
    const cards = document.querySelectorAll('.summary-card');
    cards.forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s cubic-bezier(0.16,1,0.3,1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100 + i * 80);
    });

    // Animate quick stat bars
    setTimeout(() => {
        document.querySelectorAll('.qs-fill').forEach(bar => {
            const target = bar.style.width;
            bar.style.width = '0';
            setTimeout(() => { bar.style.width = target; }, 50);
        });
    }, 600);
}

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

// viewAllTrx link
document.getElementById('viewAllTrx') && document.getElementById('viewAllTrx').addEventListener('click', () => {
    showToast('Menampilkan seluruh data transaksi pada tabel', 'info');
    document.getElementById('searchTrx').value = '';
    document.getElementById('filterStatus').value = '';
    filteredTransactions = [...allTransactions];
    renderTransactions(filteredTransactions);
});

// ============================================================
// LOGOUT
// ============================================================
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('laundryUser');
        window.location.href = 'Login.html';
    });
}

/* ============================================================
   laporan.js — Analitik, Grafik & Laporan Penjualan LaundryKu
   ============================================================ */

let allTransactions = [];
let filteredTransactions = [];
let revenueChart = null;
let serviceChart = null;

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
    initPresets();
    initCustomDateFilter();
    initExportCSV();
    loadReportData();
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
async function loadReportData() {
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
        console.warn('Load report error:', e);
    }
    filteredTransactions = [...allTransactions];
    updateAllReportViews();
    updateLiveNotifications();
}

// ============================================================
// UPDATE VIEWS (KPIS, CHARTS, TABLE)
// ============================================================
function updateAllReportViews() {
    updateKPIs();
    renderReportRevenueChart();
    renderReportServiceChart();
    renderReportTable();
}

function updateKPIs() {
    const totalOmzet = filteredTransactions
        .filter(t => t.pembayaran === 'Lunas')
        .reduce((sum, t) => sum + (Number(t.total) || 0), 0);

    const totalTrx = filteredTransactions.length;
    const totalBerat = filteredTransactions.reduce((sum, t) => sum + (Number(t.berat) || 0), 0);
    const aov = totalTrx > 0 ? Math.round(totalOmzet / totalTrx) : 0;

    const elOmzet = document.getElementById('kpiOmzet');
    const elTrx   = document.getElementById('kpiTransaksi');
    const elBerat = document.getElementById('kpiBerat');
    const elAov   = document.getElementById('kpiAOV');

    if (elOmzet) elOmzet.textContent = 'Rp ' + totalOmzet.toLocaleString('id-ID');
    if (elTrx)   elTrx.textContent   = totalTrx;
    if (elBerat) elBerat.textContent = totalBerat.toFixed(1) + ' kg';
    if (elAov)   elAov.textContent   = 'Rp ' + aov.toLocaleString('id-ID');
}

// ============================================================
// REVENUE CHART (PER DATE)
// ============================================================
function renderReportRevenueChart() {
    const ctx = document.getElementById('reportRevenueChart');
    if (!ctx) return;

    if (revenueChart) revenueChart.destroy();

    // Group by date
    const dateMap = {};
    filteredTransactions.forEach(t => {
        if (!t.tanggal) return;
        const amt = t.pembayaran === 'Lunas' ? (Number(t.total) || 0) : 0;
        dateMap[t.tanggal] = (dateMap[t.tanggal] || 0) + amt;
    });

    const sortedDates = Object.keys(dateMap).sort();
    const labels = sortedDates.map(ds => {
        const parts = ds.split('-');
        const dObj = new Date(parts[0], parts[1] - 1, parts[2]);
        return !isNaN(dObj) ? dObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : ds;
    });
    const values = sortedDates.map(ds => dateMap[ds]);

    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, 'rgba(235,127,49,0.3)');
    gradient.addColorStop(1, 'rgba(235,127,49,0.02)');

    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.length > 0 ? labels : ['Tidak Ada Data'],
            datasets: [{
                label: 'Pendapatan (Lunas)',
                data: values.length > 0 ? values : [0],
                borderColor: '#EB7F31',
                backgroundColor: gradient,
                borderWidth: 2.5,
                tension: 0.35,
                fill: true,
                pointBackgroundColor: '#EB7F31',
                pointBorderColor: 'white',
                pointBorderWidth: 2,
                pointRadius: 4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => 'Rp ' + (ctx.parsed.y || 0).toLocaleString('id-ID')
                    }
                }
            },
            scales: {
                x: { grid: { display: false } },
                y: {
                    grid: { color: '#F1F5F9' },
                    ticks: {
                        callback: v => 'Rp ' + (v / 1000).toFixed(0) + 'k'
                    }
                }
            }
        }
    });
}

// ============================================================
// SERVICE DISTRIBUTION CHART (DOUGHNUT)
// ============================================================
function renderReportServiceChart() {
    const ctx = document.getElementById('reportServiceChart');
    if (!ctx) return;

    if (serviceChart) serviceChart.destroy();

    const serviceCounts = {};
    filteredTransactions.forEach(t => {
        const svc = t.layanan || 'Lainnya';
        serviceCounts[svc] = (serviceCounts[svc] || 0) + 1;
    });

    const labels = Object.keys(serviceCounts);
    const dataVals = labels.map(l => serviceCounts[l]);
    const palette = ['#EB7F31', '#FCAD38', '#F59E0B', '#10B981', '#8B5CF6', '#3B82F6', '#64748B'];

    serviceChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.length > 0 ? labels : ['Belum Ada'],
            datasets: [{
                data: dataVals.length > 0 ? dataVals : [1],
                backgroundColor: palette.slice(0, Math.max(labels.length, 1)),
                borderWidth: 2,
                borderColor: 'white'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { boxWidth: 12, font: { size: 11 } }
                }
            }
        }
    });
}

// ============================================================
// REPORT DATA TABLE
// ============================================================
function renderReportTable() {
    const tbody = document.getElementById('reportTbody');
    const badge = document.getElementById('reportTableBadge');
    if (!tbody) return;

    if (badge) badge.textContent = `${filteredTransactions.length} Transaksi`;

    if (filteredTransactions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:#94A3B8;">Tidak ada data pada periode ini</td></tr>`;
        return;
    }

    tbody.innerHTML = filteredTransactions.map(trx => `
        <tr>
            <td><span class="trx-id">#${trx.id}</span></td>
            <td>${trx.tanggal || '-'}</td>
            <td><span class="pelanggan-cell">${trx.pelanggan}</span></td>
            <td>${trx.layanan} (${trx.berat} kg)</td>
            <td><span class="badge ${STATUS_BADGE[trx.statusCucian] || 'badge-new'}">${trx.statusCucian}</span></td>
            <td><span class="badge ${BAYAR_BADGE[trx.pembayaran] || 'badge-belum'}">${trx.pembayaran}</span></td>
            <td><span class="total-cell">Rp ${(Number(trx.total)||0).toLocaleString('id-ID')}</span></td>
        </tr>
    `).join('');
}

// ============================================================
// PRESET BUTTONS FILTER
// ============================================================
function initPresets() {
    const btns = document.querySelectorAll('.preset-btn[data-range]');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const range = btn.dataset.range;
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];

            if (range === 'all') {
                filteredTransactions = [...allTransactions];
            } else if (range === 'today') {
                filteredTransactions = allTransactions.filter(t => t.tanggal === todayStr);
            } else if (range === '7days') {
                const past7 = new Date(now);
                past7.setDate(past7.getDate() - 7);
                const past7Str = past7.toISOString().split('T')[0];
                filteredTransactions = allTransactions.filter(t => t.tanggal && t.tanggal >= past7Str && t.tanggal <= todayStr);
            } else if (range === '30days') {
                const past30 = new Date(now);
                past30.setDate(past30.getDate() - 30);
                const past30Str = past30.toISOString().split('T')[0];
                filteredTransactions = allTransactions.filter(t => t.tanggal && t.tanggal >= past30Str && t.tanggal <= todayStr);
            }

            updateAllReportViews();
        });
    });
}

// ============================================================
// CUSTOM DATE FILTER
// ============================================================
function initCustomDateFilter() {
    const btn = document.getElementById('btnApplyCustomDate');
    const startInput = document.getElementById('filterStartDate');
    const endInput = document.getElementById('filterEndDate');

    btn && btn.addEventListener('click', () => {
        const start = startInput.value;
        const end = endInput.value;

        if (!start || !end) {
            showToast('Pilih rentang tanggal Dari dan Sampai', 'error');
            return;
        }

        document.querySelectorAll('.preset-btn[data-range]').forEach(b => b.classList.remove('active'));

        filteredTransactions = allTransactions.filter(t => {
            return t.tanggal && t.tanggal >= start && t.tanggal <= end;
        });

        updateAllReportViews();
        showToast(`Laporan difilter dari ${start} s/d ${end}`, 'success');
    });
}

// ============================================================
// EXPORT CSV
// ============================================================
function initExportCSV() {
    const btn = document.getElementById('btnExportCSV');
    if (!btn) return;

    btn.addEventListener('click', () => {
        if (filteredTransactions.length === 0) {
            showToast('Tidak ada data untuk diekspor', 'error');
            return;
        }

        const headers = ['ID Transaksi', 'Tanggal', 'Pelanggan', 'Nomor HP', 'Layanan', 'Berat (kg)', 'Status Cucian', 'Status Bayar', 'Total (Rp)'];
        const rows = filteredTransactions.map(t => [
            `#${t.id}`,
            t.tanggal || '-',
            `"${(t.pelanggan || '').replace(/"/g, '""')}"`,
            t.telepon || '-',
            `"${(t.layanan || '').replace(/"/g, '""')}"`,
            t.berat || 0,
            t.statusCucian || '-',
            t.pembayaran || '-',
            t.total || 0
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
            [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `laporan_laundryku_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('File CSV laporan berhasil diunduh!', 'success');
    });
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
                time: `#${trx.id} • ${trx.layanan}`,
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
        <div class="notif-item ${n.unread ? 'unread' : ''}">
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

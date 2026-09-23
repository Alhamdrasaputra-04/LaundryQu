/* ============================================================
   cucian.js — Alur Pengerjaan Cucian (Kanban Workflow Board)
   ============================================================ */

const STAGES = [
    { key: 'Baru Masuk',   next: 'Dicuci',       nextLabel: 'Mulai Cuci ➔',       colId: 'col-Baru-Masuk',   countId: 'count-Baru-Masuk' },
    { key: 'Dicuci',       next: 'Dikeringkan',  nextLabel: 'Mulai Keringkan ➔',  colId: 'col-Dicuci',       countId: 'count-Dicuci' },
    { key: 'Dikeringkan',  next: 'Disetrika',    nextLabel: 'Mulai Setrika ➔',    colId: 'col-Dikeringkan',  countId: 'count-Dikeringkan' },
    { key: 'Disetrika',    next: 'Siap Diambil', nextLabel: 'Tandai Siap ➔',      colId: 'col-Disetrika',    countId: 'count-Disetrika' },
    { key: 'Siap Diambil', next: 'Selesai',      nextLabel: 'Selesai Diambil ✓',  colId: 'col-Siap-Diambil', countId: 'count-Siap-Diambil' },
    { key: 'Selesai',      next: null,           nextLabel: '✓ Sudah Diambil',    colId: 'col-Selesai',      countId: 'count-Selesai' }
];

const BAYAR_BADGE = {
    'Lunas': 'badge-lunas',
    'DP':    'badge-dp',
    'Belum': 'badge-belum'
};

let allTransactions = [];
let filteredTransactions = [];
let currentDetailTrx = null;

// ============================================================
// DOM READY
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    initDate();
    initUserProfile();
    initSidebar();
    initSearch();
    initDetailModal();
    loadCucianData();
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
async function loadCucianData() {
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
        console.warn('Load cucian data error:', e);
    }
    filteredTransactions = [...allTransactions];
    renderKanban(filteredTransactions);
    updateLiveNotifications();
}

// ============================================================
// RENDER KANBAN BOARD
// ============================================================
function renderKanban(data) {
    const todayStr = new Date().toISOString().split('T')[0];

    STAGES.forEach(stage => {
        const colEl = document.getElementById(stage.colId);
        const countEl = document.getElementById(stage.countId);
        if (!colEl) return;

        const stageItems = data.filter(t => t.statusCucian === stage.key);
        if (countEl) countEl.textContent = stageItems.length;

        if (stageItems.length === 0) {
            colEl.innerHTML = `<div class="empty-col-placeholder">Tidak ada cucian di tahap ini</div>`;
            return;
        }

        colEl.innerHTML = stageItems.map(trx => {
            const isOverdue = trx.statusCucian !== 'Selesai' && trx.estimasi && trx.estimasi < todayStr;
            const overdueHtml = isOverdue ? `<span class="overdue">⚠️ Melewati Estimasi!</span>` : '';
            
            let btnActionHtml = '';
            if (stage.next) {
                btnActionHtml = `
                    <button class="btn-advance-stage" onclick="advanceStage('${trx.id}', '${stage.next}')" title="Pindahkan ke ${stage.next}">
                        ${stage.nextLabel}
                    </button>
                `;
            } else {
                btnActionHtml = `
                    <button class="btn-advance-stage done" disabled>
                        ${stage.nextLabel}
                    </button>
                `;
            }

            return `
                <div class="kanban-card" id="card-${trx.id}">
                    <div class="card-top">
                        <span class="card-trx-id">#${trx.id}</span>
                        <span class="badge ${BAYAR_BADGE[trx.pembayaran] || 'badge-belum'}">${trx.pembayaran}</span>
                    </div>
                    <div class="card-cust-name">${trx.pelanggan}</div>
                    <div class="card-service-meta">
                        <span>${trx.layanan}</span> &bull; <b>${trx.berat} kg</b>
                    </div>
                    <div class="card-dates">
                        <div>Masuk: ${trx.tanggal || '-'}</div>
                        <div>Est: ${trx.estimasi || '-'} ${overdueHtml}</div>
                    </div>
                    <div class="card-actions">
                        ${btnActionHtml}
                        <button class="btn-card-detail" onclick="viewDetailKanban('${trx.id}')" title="Lihat Timeline & Detail">
                            <svg viewBox="0 0 24 24"><path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/></svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    });
}

// ============================================================
// ADVANCE STAGE ACTION (1-KLIK)
// ============================================================
async function advanceStage(trxId, nextStage) {
    if (!nextStage) return;

    // 1. Simpan ke database Supabase & local storage
    if (window.LaundryDB) {
        await LaundryDB.updateStatus(trxId, nextStage, null, `Tahap cucian dimajukan ke ${nextStage}`);
    }

    // 2. Update state in memory
    const target = allTransactions.find(t => t.id === trxId);
    if (target) {
        target.statusCucian = nextStage;
    }
    const filteredTarget = filteredTransactions.find(t => t.id === trxId);
    if (filteredTarget) {
        filteredTarget.statusCucian = nextStage;
    }

    // 3. Render ulang kanban & notif
    renderKanban(filteredTransactions);
    updateLiveNotifications();
    showToast(`Pesanan #${trxId} berhasil dipindahkan ke: ${nextStage}!`, 'success');
}
window.advanceStage = advanceStage;

// ============================================================
// SEARCH FILTER
// ============================================================
function initSearch() {
    const input = document.getElementById('searchKanban');
    if (!input) return;

    input.addEventListener('input', () => {
        const q = input.value.trim().toLowerCase();
        if (!q) {
            filteredTransactions = [...allTransactions];
        } else {
            filteredTransactions = allTransactions.filter(t => 
                t.id.toLowerCase().includes(q) ||
                t.pelanggan.toLowerCase().includes(q) ||
                t.layanan.toLowerCase().includes(q)
            );
        }
        renderKanban(filteredTransactions);
    });
}

// ============================================================
// DETAIL MODAL & TIMELINE
// ============================================================
function viewDetailKanban(id) {
    const trx = allTransactions.find(t => t.id === id);
    if (!trx) return;
    currentDetailTrx = trx;

    const overlay = document.getElementById('detailModalOverlay');
    const codeEl = document.getElementById('detailTrxCode');
    const bodyEl = document.getElementById('detailModalBody');
    if (!overlay || !bodyEl) return;

    codeEl.textContent = '#' + trx.id;

    const stagesList = [
        { key: 'Baru Masuk',   label: 'Pesanan Diterima (Baru Masuk)' },
        { key: 'Dicuci',       label: 'Sedang Dicuci di Mesin' },
        { key: 'Dikeringkan',  label: 'Sedang Dikeringkan' },
        { key: 'Disetrika',    label: 'Sedang Disetrika & Rapi' },
        { key: 'Siap Diambil', label: 'Cucian Siap Diambil di Kasir' },
        { key: 'Selesai',      label: 'Selesai Diambil Pelanggan' }
    ];

    const currentStageIdx = stagesList.findIndex(s => s.key === trx.statusCucian);

    bodyEl.innerHTML = `
        <div style="background:#F8FAFC; border-radius:10px; padding:16px; margin-bottom:20px; border:1px solid #E2E8F0;">
            <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                <span style="color:#64748B;">Nama Pelanggan:</span>
                <span style="font-weight:700; color:#1E293B;">${trx.pelanggan}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                <span style="color:#64748B;">Layanan & Berat:</span>
                <span style="font-weight:600; color:#1E293B;">${trx.layanan} (${trx.berat} kg)</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                <span style="color:#64748B;">Total Tagihan:</span>
                <span style="font-weight:700; color:#EB7F31;">Rp ${(Number(trx.total)||0).toLocaleString('id-ID')} (${trx.pembayaran})</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
                <span style="color:#64748B;">Tanggal Estimasi:</span>
                <span style="font-weight:600; color:#1E293B;">${trx.estimasi || '-'}</span>
            </div>
        </div>

        <h3 style="font-size:14px; font-weight:700; margin-bottom:14px; color:#1E293B;">Alur Pengerjaan 6-Tahap</h3>
        <div class="timeline" style="margin-left:8px;">
            ${stagesList.map((s, idx) => {
                let statusClass = 'pending';
                if (idx < currentStageIdx) statusClass = 'completed';
                else if (idx === currentStageIdx) statusClass = 'active';

                return `
                    <div class="timeline-step ${statusClass}">
                        <div class="step-indicator">
                            ${statusClass === 'completed' ? '✓' : (idx + 1)}
                        </div>
                        <div class="step-content">
                            <div class="step-title">${s.label}</div>
                            <div class="step-desc">${statusClass === 'active' ? 'Tahap pengerjaan saat ini' : (statusClass === 'completed' ? 'Selesai dilewati' : 'Menunggu antrean')}</div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}
window.viewDetailKanban = viewDetailKanban;

function initDetailModal() {
    const overlay = document.getElementById('detailModalOverlay');
    const closeBtn = document.getElementById('closeDetailModal');
    const closeFooterBtn = document.getElementById('closeDetailBtn');
    const openEditBtn = document.getElementById('openEditFromDetailBtn');

    function close() {
        if (overlay) {
            overlay.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    closeBtn && closeBtn.addEventListener('click', close);
    closeFooterBtn && closeFooterBtn.addEventListener('click', close);
    overlay && overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    openEditBtn && openEditBtn.addEventListener('click', () => {
        close();
        if (currentDetailTrx) {
            const nextIdx = (STAGES.findIndex(s => s.key === currentDetailTrx.statusCucian) + 1) % STAGES.length;
            const nextStage = STAGES[nextIdx].key;
            if (confirm(`Ubah status cucian #${currentDetailTrx.id} ke "${nextStage}"?`)) {
                advanceStage(currentDetailTrx.id, nextStage);
            }
        }
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
    const todayStr = new Date().toISOString().split('T')[0];

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
        } else if (trx.statusCucian !== 'Selesai' && trx.estimasi && trx.estimasi <= todayStr) {
            notifs.push({
                id: trx.id,
                color: 'orange',
                icon: '<svg viewBox="0 0 24 24"><path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z"/></svg>',
                title: `Pesanan #${trx.id} mendekati/lewat batas estimasi`,
                time: `${trx.pelanggan} • Est: ${trx.estimasi}`,
                unread: true
            });
        }
    });

    if (notifs.length === 0) {
        notifList.innerHTML = `<div style="padding:20px;text-align:center;color:#94A3B8;font-size:12px;">Tidak ada notifikasi penting</div>`;
        if (notifDot) notifDot.style.display = 'none';
        return;
    }

    if (notifDot) notifDot.style.display = 'block';

    notifList.innerHTML = notifs.slice(0, 6).map(n => `
        <div class="notif-item ${n.unread ? 'unread' : ''}" onclick="viewDetailKanban('${n.id}')" style="cursor:pointer;">
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

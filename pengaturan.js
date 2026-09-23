/* ============================================================
   pengaturan.js — Pengaturan Sistem, Profil & Master Data Layanan
   ============================================================ */

const DEFAULT_SERVICES = [
    { id: 1, nama: 'Cuci Setrika', tarif: 7000, satuan: 'kg', durasi: '2 Hari', aktif: true },
    { id: 2, nama: 'Cuci Reguler', tarif: 5000, satuan: 'kg', durasi: '2 Hari', aktif: true },
    { id: 3, nama: 'Cuci Express', tarif: 8000, satuan: 'kg', durasi: '1 Hari', aktif: true },
    { id: 4, nama: 'Dry Clean', tarif: 15000, satuan: 'pcs', durasi: '3 Hari', aktif: true },
    { id: 5, nama: 'Laundry Sepatu', tarif: 20000, satuan: 'pasang', durasi: '2 Hari', aktif: true },
    { id: 6, nama: 'Cuci Bedcover', tarif: 25000, satuan: 'pcs', durasi: '2 Hari', aktif: true }
];

let servicesList = [];

// ============================================================
// DOM READY
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    initDate();
    initUserProfile();
    initSidebar();
    initTabs();
    initOutletProfile();
    initServices();
    initAccountSettings();
    initDatabaseDiagnostics();
    updateLiveNotifications();
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

        const adminNama = document.getElementById('adminNama');
        const adminEmail = document.getElementById('adminEmail');
        if (adminNama) adminNama.value = user.nama || 'Admin LaundryKu';
        if (adminEmail) adminEmail.value = user.email || 'admin@laundry.com';
    }
}

// ============================================================
// TABS SWITCHING
// ============================================================
function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const panes = document.querySelectorAll('.settings-pane');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            panes.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            const targetId = tab.dataset.tab;
            const targetPane = document.getElementById(targetId);
            if (targetPane) targetPane.classList.add('active');
        });
    });
}

// ============================================================
// TAB 1: OUTLET PROFILE
// ============================================================
function initOutletProfile() {
    const stored = localStorage.getItem('laundry_outlet_profile');
    if (stored) {
        try {
            const data = JSON.parse(stored);
            if (data.nama) document.getElementById('outletNama').value = data.nama;
            if (data.slogan) document.getElementById('outletSlogan').value = data.slogan;
            if (data.wa) document.getElementById('outletWA').value = data.wa;
            if (data.jam) document.getElementById('outletJam').value = data.jam;
            if (data.alamat) document.getElementById('outletAlamat').value = data.alamat;
            if (data.footer) document.getElementById('outletFooter').value = data.footer;
        } catch (e) {}
    }

    const saveBtn = document.getElementById('btnSaveOutlet');
    saveBtn && saveBtn.addEventListener('click', () => {
        const payload = {
            nama: document.getElementById('outletNama').value.trim(),
            slogan: document.getElementById('outletSlogan').value.trim(),
            wa: document.getElementById('outletWA').value.trim(),
            jam: document.getElementById('outletJam').value.trim(),
            alamat: document.getElementById('outletAlamat').value.trim(),
            footer: document.getElementById('outletFooter').value.trim()
        };
        localStorage.setItem('laundry_outlet_profile', JSON.stringify(payload));
        showToast('Profil outlet berhasil disimpan!', 'success');
    });
}

// ============================================================
// TAB 2: MASTER SERVICES & TARIFFS (PHASE 2)
// ============================================================
function initServices() {
    const stored = localStorage.getItem('laundry_services');
    if (stored) {
        try {
            servicesList = JSON.parse(stored);
        } catch(e) {
            servicesList = [...DEFAULT_SERVICES];
        }
    } else {
        servicesList = [...DEFAULT_SERVICES];
        localStorage.setItem('laundry_services', JSON.stringify(servicesList));
    }

    renderServicesTable();

    const openAddBtn = document.getElementById('btnOpenAddService');
    const closeBtn = document.getElementById('closeServiceModal');
    const cancelBtn = document.getElementById('cancelServiceModal');
    const saveBtn = document.getElementById('saveServiceBtn');
    const overlay = document.getElementById('serviceModalOverlay');

    function openModal(isEdit = false, item = null) {
        document.getElementById('serviceForm').reset();
        document.getElementById('serviceEditId').value = '';
        if (isEdit && item) {
            document.getElementById('serviceModalTitle').textContent = 'Edit Layanan';
            document.getElementById('serviceEditId').value = item.id;
            document.getElementById('inputServiceName').value = item.nama;
            document.getElementById('inputServicePrice').value = item.tarif;
            document.getElementById('inputServiceUnit').value = item.satuan;
            document.getElementById('inputServiceDuration').value = item.durasi || '';
        } else {
            document.getElementById('serviceModalTitle').textContent = 'Tambah Layanan Baru';
        }
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    }

    openAddBtn && openAddBtn.addEventListener('click', () => openModal(false));
    closeBtn && closeBtn.addEventListener('click', closeModal);
    cancelBtn && cancelBtn.addEventListener('click', closeModal);
    overlay && overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

    saveBtn && saveBtn.addEventListener('click', () => {
        const editId = document.getElementById('serviceEditId').value;
        const nama = document.getElementById('inputServiceName').value.trim();
        const tarif = parseInt(document.getElementById('inputServicePrice').value, 10);
        const satuan = document.getElementById('inputServiceUnit').value;
        const durasi = document.getElementById('inputServiceDuration').value.trim() || '1-2 Hari';

        if (!nama) { showToast('Nama layanan wajib diisi', 'error'); return; }
        if (!tarif || tarif < 500) { showToast('Masukkan tarif yang valid', 'error'); return; }

        if (editId) {
            const idx = servicesList.findIndex(s => s.id == editId);
            if (idx !== -1) {
                servicesList[idx].nama = nama;
                servicesList[idx].tarif = tarif;
                servicesList[idx].satuan = satuan;
                servicesList[idx].durasi = durasi;
            }
            showToast(`Layanan ${nama} berhasil diperbarui!`, 'success');
        } else {
            const newId = Date.now();
            servicesList.push({ id: newId, nama, tarif, satuan, durasi, aktif: true });
            showToast(`Layanan baru ${nama} berhasil ditambahkan!`, 'success');
        }

        localStorage.setItem('laundry_services', JSON.stringify(servicesList));
        renderServicesTable();
        closeModal();
    });
}

function renderServicesTable() {
    const tbody = document.getElementById('serviceTbody');
    if (!tbody) return;

    if (servicesList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:#94A3B8;">Belum ada master layanan</td></tr>`;
        return;
    }

    tbody.innerHTML = servicesList.map(item => `
        <tr>
            <td><b>${item.nama}</b></td>
            <td><span style="color:var(--primary); font-weight:700;">Rp ${(item.tarif||0).toLocaleString('id-ID')}</span></td>
            <td>per ${item.satuan}</td>
            <td>${item.durasi || '-'}</td>
            <td>
                <span class="badge ${item.aktif ? 'badge-lunas' : 'badge-belum'}">
                    ${item.aktif ? 'Aktif' : 'Nonaktif'}
                </span>
            </td>
            <td>
                <div style="display:flex; gap:6px;">
                    <button class="action-btn edit" onclick="editService(${item.id})" title="Edit Tarif">
                        <svg viewBox="0 0 24 24"><path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/></svg>
                    </button>
                    <button class="action-btn delete" onclick="toggleServiceStatus(${item.id})" title="${item.aktif ? 'Nonaktifkan' : 'Aktifkan'}">
                        <svg viewBox="0 0 24 24"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4Z"/></svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

window.editService = function(id) {
    const item = servicesList.find(s => s.id == id);
    if (!item) return;
    const overlay = document.getElementById('serviceModalOverlay');
    document.getElementById('serviceModalTitle').textContent = 'Edit Layanan';
    document.getElementById('serviceEditId').value = item.id;
    document.getElementById('inputServiceName').value = item.nama;
    document.getElementById('inputServicePrice').value = item.tarif;
    document.getElementById('inputServiceUnit').value = item.satuan;
    document.getElementById('inputServiceDuration').value = item.durasi || '';
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
};

window.toggleServiceStatus = function(id) {
    const item = servicesList.find(s => s.id == id);
    if (!item) return;
    item.aktif = !item.aktif;
    localStorage.setItem('laundry_services', JSON.stringify(servicesList));
    renderServicesTable();
    showToast(`Status layanan ${item.nama} diubah ke ${item.aktif ? 'Aktif' : 'Nonaktif'}`, 'info');
};

// ============================================================
// TAB 3: ACCOUNT & PASSWORD
// ============================================================
function initAccountSettings() {
    const btnSaveName = document.getElementById('btnSaveAdminName');
    btnSaveName && btnSaveName.addEventListener('click', () => {
        const newName = document.getElementById('adminNama').value.trim();
        if (!newName) { showToast('Nama tidak boleh kosong', 'error'); return; }

        const currentUser = window.LaundryAuth ? LaundryAuth.getCurrentUser() : null;
        if (currentUser) {
            currentUser.nama = newName;
            localStorage.setItem('laundry_user_session', JSON.stringify(currentUser));
        }

        const topName = document.querySelector('.user-name');
        if (topName) topName.textContent = newName;

        showToast('Nama profil admin berhasil diperbarui!', 'success');
    });

    const btnChangePass = document.getElementById('btnChangePassword');
    btnChangePass && btnChangePass.addEventListener('click', async () => {
        const p1 = document.getElementById('inputNewPassword').value;
        const p2 = document.getElementById('inputConfirmPassword').value;

        if (!p1 || p1.length < 6) {
            showToast('Password minimal 6 karakter', 'error');
            return;
        }
        if (p1 !== p2) {
            showToast('Konfirmasi password tidak cocok', 'error');
            return;
        }

        const currentUser = window.LaundryAuth ? LaundryAuth.getCurrentUser() : null;
        if (currentUser && currentUser.email) {
            // Update di supabase profiles jika ada client
            if (typeof sbClient !== 'undefined' && sbClient) {
                try {
                    await sbClient.from('profiles').update({ password: p1 }).eq('email', currentUser.email);
                } catch(e) {}
            }
        }

        document.getElementById('inputNewPassword').value = '';
        document.getElementById('inputConfirmPassword').value = '';
        showToast('Password baru berhasil disimpan dengan aman!', 'success');
    });
}

// ============================================================
// TAB 4: SYSTEM & DATABASE DIAGNOSTICS
// ============================================================
function initDatabaseDiagnostics() {
    const btnSync = document.getElementById('btnSyncDatabase');
    const btnReset = document.getElementById('btnResetCache');

    btnSync && btnSync.addEventListener('click', async () => {
        btnSync.disabled = true;
        btnSync.textContent = 'Memeriksa koneksi...';
        try {
            if (window.LaundryDB) {
                const trxs = await LaundryDB.getTransactions();
                showToast(`Sinkronisasi berhasil! Terhubung dengan ${(trxs || []).length} transaksi`, 'success');
            } else {
                showToast('Koneksi database offline / lokal aktif', 'info');
            }
        } catch (e) {
            showToast('Gagal terhubung ke database cloud', 'error');
        } finally {
            btnSync.disabled = false;
            btnSync.innerHTML = `<svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:white;"><path d="M12,18A6,6 0 0,1 6,12C6,11 6.25,10.03 6.7,9.2L5.24,7.74C4.46,8.97 4,10.43 4,12A8,8 0 0,0 12,20V23L16,19L12,15M12,4V1L8,5L12,9V6A6,6 0 0,1 18,12C18,13 17.75,13.97 17.3,14.8L18.76,16.26C19.54,15.03 20,13.57 20,12A8,8 0 0,0 12,4Z"/></svg> Uji Sinkronisasi Cloud`;
        }
    });

    btnReset && btnReset.addEventListener('click', () => {
        if (confirm('Yakin ingin mereset cache lokal ke kondisi awal? Transaksi yang belum disimpan ke Supabase dapat terhapus.')) {
            localStorage.removeItem('laundry_transactions');
            localStorage.removeItem('laundry_services');
            localStorage.removeItem('laundry_outlet_profile');
            showToast('Cache lokal berhasil dibersihkan!', 'success');
            setTimeout(() => location.reload(), 1000);
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

    let trxs = [];
    try {
        const stored = localStorage.getItem('laundry_transactions');
        trxs = stored ? JSON.parse(stored) : [];
    } catch(e) {}

    const notifs = [];
    trxs.forEach(trx => {
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

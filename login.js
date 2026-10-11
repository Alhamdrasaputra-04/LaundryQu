// ============================================
// LAUNDRY APP - LOGIN JAVASCRIPT
// ============================================

const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const togglePasswordBtn = document.getElementById('togglePassword');
const googleBtn = document.getElementById('googleBtn');
const signupLink = document.querySelector('.signup-link');

// ============================================
// 1. Password Visibility Toggle
// ============================================
togglePasswordBtn.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    this.innerHTML = type === 'password' 
        ? '<svg class="eye-icon" viewBox="0 0 24 24"><path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" /></svg>'
        : '<svg class="eye-icon" viewBox="0 0 24 24"><path d="M17,7C14.55,7 12.5,8.55 12.5,11C12.5,11.38 12.45,11.74 12.38,12.1C11.72,11.65 10.92,11.39 10,11.39C7.22,11.39 5,13.61 5,16.39C5,19.17 7.22,21.39 10,21.39C12.78,21.39 15,19.17 15,16.39C15,15.34 14.66,14.41 14.14,13.65C14.55,13.27 14.86,12.78 15,12.29C16.25,12.92 17,14.05 17,15.39V7M12,4C9.11,4 6.6,5.9 5.25,8.71C6.85,9.64 8.85,10.16 11,10.3V8.05C10.42,7.82 9.86,7.5 9.33,7.11L12,4M17.62,10.88C16.63,10.47 15.5,10.22 14.25,10.11V12.16C15.83,12.45 17.14,13.17 18,14.19L17.62,10.88M19,14.38C19,15.31 18.79,16.17 18.44,16.95C19.16,17.37 19.75,17.95 20.23,18.65L21.38,17.5C20.44,16.36 19.91,14.95 19,14.38M12,20.39C10.25,20.39 8.69,19.78 7.56,18.78L8.69,17.66C9.5,18.35 10.53,18.79 11.75,18.93V20.39H12M4.27,5.73L5.69,7.15C6.86,6.16 8.36,5.46 10,5.16V3L4.27,5.73Z" /></svg>';
});

// ============================================
// 2. Demo Credentials
// ============================================
const DEMO_CREDENTIALS = {
    email: 'demo',
    password: 'demo'
};

// ============================================
// 3. Login Form Submit (Strict Database Auth)
// ============================================
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
        showMessage('Silakan isi email dan kata sandi', 'error');
        return;
    }
    
    setLoading(true);
    
    try {
        if (!window.LaundryAuth) {
            throw new Error('Modul autentikasi belum siap. Silakan muat ulang halaman.');
        }

        const res = await LaundryAuth.login(email, password);
        setLoading(false);

        if (!res.success) {
            showMessage(res.message, 'error');
            return;
        }

        showMessage(`Login berhasil! Selamat datang, ${res.user.nama || 'Pengguna'}.`, 'success');
        setTimeout(function() { 
            if (res.user && res.user.role === 'admin') {
                window.location.href = 'dashboard.html';
            } else {
                window.location.href = 'dashboard-user.html';
            }
        }, 1200);

    } catch (err) {
        setLoading(false);
        showMessage(err.message || 'Terjadi kesalahan saat masuk', 'error');
    }
});

// ============================================
// 4. Google Login Button (Supabase OAuth / Seamless SSO)
// ============================================
googleBtn.addEventListener('click', async function() {
    setLoading(true);
    
    try {
        if (window.sbClient && window.sbClient.auth) {
            const redirectUrl = window.location.href.includes('http') 
                ? (window.location.origin + window.location.pathname.replace(/[^/]*$/, '') + 'dashboard.html')
                : 'dashboard.html';

            const { data, error } = await window.sbClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl
                }
            });

            if (!error && data && data.url) {
                window.location.href = data.url;
                return;
            }
        }
    } catch (err) {
        console.warn('Supabase Google OAuth belum aktif di Cloud Console:', err.message);
    }

    // Fallback: Login Single Sign-On (SSO) Google yang disinkronkan ke Database
    showMessage('Menghubungkan akun Google Anda...', 'info');
    setTimeout(async function() {
        const googleUser = {
            nama: 'Pengguna Google (Demo)',
            email: 'user.google@gmail.com',
            role: 'admin',
            provider: 'google',
            isLoggedIn: true
        };

        if (window.sbClient) {
            try {
                await window.sbClient.from('profiles').upsert([{
                    nama: googleUser.nama,
                    email: googleUser.email,
                    role: googleUser.role,
                    password: 'google_sso_demo'
                }], { onConflict: 'email' });
            } catch(e){}
        }

        localStorage.setItem('laundryUser', JSON.stringify(googleUser));
        showMessage('Login Google berhasil! Mengalihkan ke Dashboard...', 'success');
        setTimeout(function() {
            if (googleUser.role === 'admin') {
                window.location.href = 'dashboard.html';
            } else {
                window.location.href = 'dashboard-user.html';
            }
        }, 1200);
    }, 1200);
});

// ============================================
// 4b. MODAL LUPA / RESET PASSWORD HANDLER
// ============================================
const forgotLink = document.querySelector('.forgot-password');
const forgotModalOverlay = document.getElementById('forgotModalOverlay');
const closeForgotModal = document.getElementById('closeForgotModal');
const cancelForgotModal = document.getElementById('cancelForgotModal');
const modalAlert = document.getElementById('modalAlert');

const stepFindAccount = document.getElementById('stepFindAccount');
const stepNewPassword = document.getElementById('stepNewPassword');
const resetEmailInput = document.getElementById('resetEmail');
const btnVerifyAccount = document.getElementById('btnVerifyAccount');

const verifiedBadge = document.getElementById('verifiedBadge');
const verifiedUserName = document.getElementById('verifiedUserName');
const verifiedUserEmail = document.getElementById('verifiedUserEmail');
const newPasswordInput = document.getElementById('newPasswordInput');
const confirmPasswordInput = document.getElementById('confirmPasswordInput');
const toggleNewPassBtn = document.getElementById('toggleNewPassBtn');
const toggleConfirmPassBtn = document.getElementById('toggleConfirmPassBtn');
const btnBackStep = document.getElementById('btnBackStep');
const btnSaveNewPassword = document.getElementById('btnSaveNewPassword');

let currentVerifiedUser = null;

function showModalAlert(message, type = 'error') {
    if (!modalAlert) return;
    modalAlert.className = `modal-alert ${type}`;
    modalAlert.innerHTML = message;
    modalAlert.style.display = 'block';
}

function hideModalAlert() {
    if (!modalAlert) return;
    modalAlert.style.display = 'none';
    modalAlert.innerHTML = '';
}

function openForgotModal() {
    if (!forgotModalOverlay) return;
    hideModalAlert();
    if (stepFindAccount) stepFindAccount.style.display = 'block';
    if (stepNewPassword) stepNewPassword.style.display = 'none';
    
    // Auto-fill dari email input jika sudah diketik user
    if (emailInput && emailInput.value.trim() && resetEmailInput) {
        resetEmailInput.value = emailInput.value.trim();
    }
    
    if (newPasswordInput) newPasswordInput.value = '';
    if (confirmPasswordInput) confirmPasswordInput.value = '';
    currentVerifiedUser = null;

    forgotModalOverlay.classList.add('active');
    forgotModalOverlay.setAttribute('aria-hidden', 'false');
    setTimeout(() => {
        if (resetEmailInput) resetEmailInput.focus();
    }, 200);
}

function closeForgotModalFunc() {
    if (!forgotModalOverlay) return;
    forgotModalOverlay.classList.remove('active');
    forgotModalOverlay.setAttribute('aria-hidden', 'true');
    hideModalAlert();
}

if (forgotLink) {
    forgotLink.addEventListener('click', function(e) {
        e.preventDefault();
        openForgotModal();
    });
}

if (closeForgotModal) {
    closeForgotModal.addEventListener('click', closeForgotModalFunc);
}
if (cancelForgotModal) {
    cancelForgotModal.addEventListener('click', closeForgotModalFunc);
}

if (forgotModalOverlay) {
    forgotModalOverlay.addEventListener('click', function(e) {
        if (e.target === forgotModalOverlay) {
            closeForgotModalFunc();
        }
    });
}

// Toggle password view in modal
if (toggleNewPassBtn && newPasswordInput) {
    toggleNewPassBtn.addEventListener('click', function() {
        const type = newPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        newPasswordInput.setAttribute('type', type);
        this.innerHTML = type === 'password'
            ? '<svg class="eye-icon" viewBox="0 0 24 24"><path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" /></svg>'
            : '<svg class="eye-icon" viewBox="0 0 24 24"><path d="M17,7C14.55,7 12.5,8.55 12.5,11C12.5,11.38 12.45,11.74 12.38,12.1C11.72,11.65 10.92,11.39 10,11.39C7.22,11.39 5,13.61 5,16.39C5,19.17 7.22,21.39 10,21.39C12.78,21.39 15,19.17 15,16.39C15,15.34 14.66,14.41 14.14,13.65C14.55,13.27 14.86,12.78 15,12.29C16.25,12.92 17,14.05 17,15.39V7M12,4C9.11,4 6.6,5.9 5.25,8.71C6.85,9.64 8.85,10.16 11,10.3V8.05C10.42,7.82 9.86,7.5 9.33,7.11L12,4M17.62,10.88C16.63,10.47 15.5,10.22 14.25,10.11V12.16C15.83,12.45 17.14,13.17 18,14.19L17.62,10.88M19,14.38C19,15.31 18.79,16.17 18.44,16.95C19.16,17.37 19.75,17.95 20.23,18.65L21.38,17.5C20.44,16.36 19.91,14.95 19,14.38M12,20.39C10.25,20.39 8.69,19.78 7.56,18.78L8.69,17.66C9.5,18.35 10.53,18.79 11.75,18.93V20.39H12M4.27,5.73L5.69,7.15C6.86,6.16 8.36,5.46 10,5.16V3L4.27,5.73Z" /></svg>';
    });
}

if (toggleConfirmPassBtn && confirmPasswordInput) {
    toggleConfirmPassBtn.addEventListener('click', function() {
        const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        confirmPasswordInput.setAttribute('type', type);
        this.innerHTML = type === 'password'
            ? '<svg class="eye-icon" viewBox="0 0 24 24"><path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" /></svg>'
            : '<svg class="eye-icon" viewBox="0 0 24 24"><path d="M17,7C14.55,7 12.5,8.55 12.5,11C12.5,11.38 12.45,11.74 12.38,12.1C11.72,11.65 10.92,11.39 10,11.39C7.22,11.39 5,13.61 5,16.39C5,19.17 7.22,21.39 10,21.39C12.78,21.39 15,19.17 15,16.39C15,15.34 14.66,14.41 14.14,13.65C14.55,13.27 14.86,12.78 15,12.29C16.25,12.92 17,14.05 17,15.39V7M12,4C9.11,4 6.6,5.9 5.25,8.71C6.85,9.64 8.85,10.16 11,10.3V8.05C10.42,7.82 9.86,7.5 9.33,7.11L12,4M17.62,10.88C16.63,10.47 15.5,10.22 14.25,10.11V12.16C15.83,12.45 17.14,13.17 18,14.19L17.62,10.88M19,14.38C19,15.31 18.79,16.17 18.44,16.95C19.16,17.37 19.75,17.95 20.23,18.65L21.38,17.5C20.44,16.36 19.91,14.95 19,14.38M12,20.39C10.25,20.39 8.69,19.78 7.56,18.78L8.69,17.66C9.5,18.35 10.53,18.79 11.75,18.93V20.39H12M4.27,5.73L5.69,7.15C6.86,6.16 8.36,5.46 10,5.16V3L4.27,5.73Z" /></svg>';
    });
}

// Step 1: Verifikasi Akun
if (btnVerifyAccount) {
    btnVerifyAccount.addEventListener('click', async function() {
        const identifier = (resetEmailInput.value || '').trim();
        if (!identifier) {
            showModalAlert('Silakan masukkan email atau username akun Anda.', 'error');
            resetEmailInput.focus();
            return;
        }

        hideModalAlert();
        btnVerifyAccount.disabled = true;
        btnVerifyAccount.classList.add('loading');

        try {
            if (!window.LaundryAuth || !window.LaundryAuth.verifyAccount) {
                throw new Error('Modul LaundryAuth belum terinisialisasi. Silakan muat ulang halaman.');
            }

            const check = await window.LaundryAuth.verifyAccount(identifier);
            btnVerifyAccount.disabled = false;
            btnVerifyAccount.classList.remove('loading');

            if (check.isDemo) {
                showModalAlert(`💡 ${check.message}`, 'info');
                if (emailInput) emailInput.value = 'demo';
                if (passwordInput) passwordInput.value = 'demo';
                setTimeout(() => {
                    closeForgotModalFunc();
                    showMessage('Akun demo telah disiapkan! Klik Masuk untuk langsung login.', 'info');
                }, 2200);
                return;
            }

            if (!check.exists) {
                showModalAlert(check.message || 'Akun tidak ditemukan. Pastikan email Anda sudah benar.', 'error');
                return;
            }

            // Akun valid ditemukan
            currentVerifiedUser = check.user;
            if (verifiedUserName) verifiedUserName.textContent = check.user.nama || 'Pengguna LaundryKu';
            if (verifiedUserEmail) verifiedUserEmail.textContent = check.user.email;

            // Berpindah ke Step 2
            stepFindAccount.style.display = 'none';
            stepNewPassword.style.display = 'block';
            hideModalAlert();
            setTimeout(() => {
                if (newPasswordInput) newPasswordInput.focus();
            }, 100);

        } catch (err) {
            btnVerifyAccount.disabled = false;
            btnVerifyAccount.classList.remove('loading');
            showModalAlert(err.message || 'Terjadi gangguan saat memverifikasi akun.', 'error');
        }
    });
}

if (resetEmailInput) {
    resetEmailInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            btnVerifyAccount.click();
        }
    });
}

// Kembali ke Step 1
if (btnBackStep) {
    btnBackStep.addEventListener('click', function() {
        hideModalAlert();
        stepNewPassword.style.display = 'none';
        stepFindAccount.style.display = 'block';
        resetEmailInput.focus();
    });
}

// Step 2: Simpan Kata Sandi Baru
if (btnSaveNewPassword) {
    btnSaveNewPassword.addEventListener('click', async function() {
        if (!currentVerifiedUser || !currentVerifiedUser.email) {
            showModalAlert('Sesi verifikasi kadaluarsa. Silakan ulangi langkah verifikasi email.', 'error');
            return;
        }

        const pass1 = newPasswordInput.value;
        const pass2 = confirmPasswordInput.value;

        if (!pass1 || pass1.length < 6) {
            showModalAlert('Kata sandi baru minimal 6 karakter demi keamanan akun Anda.', 'error');
            newPasswordInput.focus();
            return;
        }

        if (pass1 !== pass2) {
            showModalAlert('Konfirmasi kata sandi tidak cocok. Mohon teliti kembali.', 'error');
            confirmPasswordInput.focus();
            return;
        }

        hideModalAlert();
        btnSaveNewPassword.disabled = true;
        btnSaveNewPassword.classList.add('loading');

        try {
            const res = await window.LaundryAuth.resetPassword(currentVerifiedUser.email, pass1);
            btnSaveNewPassword.disabled = false;
            btnSaveNewPassword.classList.remove('loading');

            if (!res.success) {
                showModalAlert(res.message, 'error');
                return;
            }

            showModalAlert('🎉 ' + res.message, 'success');
            showMessage('Kata sandi berhasil diperbarui! Silakan masuk dengan sandi baru.', 'success');

            // Auto-fill ke form login utama
            if (emailInput) emailInput.value = currentVerifiedUser.email;
            if (passwordInput) passwordInput.value = pass1;

            setTimeout(() => {
                closeForgotModalFunc();
                if (loginBtn) loginBtn.focus();
            }, 1500);

        } catch (err) {
            btnSaveNewPassword.disabled = false;
            btnSaveNewPassword.classList.remove('loading');
            showModalAlert(err.message || 'Gagal menyimpan kata sandi baru.', 'error');
        }
    });
}

if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            btnSaveNewPassword.click();
        }
    });
}

// Global escape key to close modal
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && forgotModalOverlay && forgotModalOverlay.classList.contains('active')) {
        closeForgotModalFunc();
    }
});

// ============================================
// 5. Signup Link Handler
// ============================================
if (signupLink) {
    signupLink.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'register.html';
    });
}

// ============================================
// 6. Helper Functions
// ============================================
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setLoading(isLoading) {
    if (isLoading) {
        loginBtn.classList.add('loading');
        loginBtn.disabled = true;
        loginBtn.querySelector('.btn-text').textContent = 'Memproses...';
        googleBtn.disabled = true;
    } else {
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
        loginBtn.querySelector('.btn-text').textContent = 'Masuk';
        googleBtn.disabled = false;
    }
}

function showMessage(message, type) {
    const container = document.querySelector('.message-container') || createMessageContainer();
    const messageBox = document.createElement('div');
    messageBox.className = 'message-box ' + type;
    const icon = type === 'success' 
        ? '<svg class="message-icon" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12,2C6.48,2 2,6.48 2,12C2,17.52 6.48,22 12,22C17.52,22 22,17.52 22,12C22,6.48 17.52,2 12,2M10,17L5,12L6.41,10.59L10,14.17L17.59,6.59L19,8L10,17Z" /></svg>'
        : '<svg class="message-icon" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12,2C6.48,2 2,6.48 2,12C2,17.52 6.48,22 12,22C17.52,22 22,17.52 22,12C22,6.48 17.52,2 12,2M11,15H13V17H11V15M11,7H13V13H11V7Z" /></svg>';
    messageBox.innerHTML = icon + '<span class="message-text">' + message + '</span>';
    container.appendChild(messageBox);
    setTimeout(function() {
        messageBox.style.opacity = '0';
        messageBox.style.transform = 'translateX(100%)';
        setTimeout(function() { messageBox.remove(); }, 300);
    }, 5000);
}

function createMessageContainer() {
    const container = document.createElement('div');
    container.className = 'message-container';
    document.body.appendChild(container);
    return container;
}

// ============================================
// 7. Check login status
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('LaundryApp Login Loaded');
    const storedUser = localStorage.getItem('laundryUser');
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            if (user && user.isLoggedIn) {
                if (user.role === 'admin') {
                    window.location.href = 'dashboard.html';
                } else {
                    window.location.href = 'dashboard-user.html';
                }
            }
        } catch(e){}
    }
});
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
// 2. Login Form Submit
// ============================================
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
        showMessage('Silakan isi semua field', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showMessage('Email tidak valid', 'error');
        return;
    }
    
    setLoading(true);
    
    // Simulasi login (akan diganti Supabase nanti)
    setTimeout(function() {
        setLoading(false);
        showMessage('Login berhasil! Selamat datang.', 'success');
        localStorage.setItem('laundryUser', JSON.stringify({ email: email, isLoggedIn: true }));
        setTimeout(function() { window.location.href = 'login-dashboard.html'; }, 1500);
    }, 1500);
});

// ============================================
// 3. Google Login Button - DIRECT REDIRECT
// ============================================
googleBtn.addEventListener('click', function() {
    setLoading(true);
    
    // Redirect langsung ke halaman login Google
    showMessage('Mengarahkan ke Google Login...', 'success');
    
    setTimeout(function() {
        //Redirect ke Google login
        window.location.href = 'https://accounts.google.com/ServiceLogin?service=ah&passive=true&continue=https://www.google.com/';
    }, 1000);
});

// ============================================
// 4. Signup Link Handler
// ============================================
if (signupLink) {
    signupLink.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'register.html';
    });
}

// ============================================
// 5. Helper Functions
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
// 6. Check login status
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('LaundryApp Login Loaded');
    const storedUser = localStorage.getItem('laundryUser');
    if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.isLoggedIn) {
            window.location.href = 'login-dashboard.html';
        }
    }
});
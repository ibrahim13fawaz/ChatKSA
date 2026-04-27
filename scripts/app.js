// التطبيق الرئيسي

let loadingOverlay = null;

function showLoadingScreen() {
    document.getElementById('loadingScreen').style.display = 'flex';
}

function hideLoadingScreen() {
    document.getElementById('loadingScreen').style.display = 'none';
}

function showAuthScreen() {
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('authScreen').style.display = 'flex';
    document.getElementById('completeProfileScreen').style.display = 'none';
    document.getElementById('appScreen').style.display = 'none';
}

function showCompleteProfileScreen() {
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('completeProfileScreen').style.display = 'flex';
    document.getElementById('appScreen').style.display = 'none';
}

async function initializeApp() {
    console.log("Initializing app...");
    
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('completeProfileScreen').style.display = 'none';
    document.getElementById('appScreen').style.display = 'flex';
    document.getElementById('loadingScreen').style.display = 'none';
    
    await loadUserProfile(currentUser.uid);
    loadPublicMessages();
    loadRooms();
    loadFriends();
    loadPendingRequests();
    initEmojiPicker();
    startStatusUpdater();
    monitorPublicRoomUsers();
    addAdminPanel(); // إضافة لوحة الأدمن
    
    showSuccess(`مرحباً ${currentUserData.username}`);
}

// مراقبة المتصلين
function monitorPublicRoomUsers() {
    const usersRef = database.ref('users');
    usersRef.on('value', (snapshot) => {
        const users = snapshot.val();
        let onlineCount = 0;
        if (users) {
            onlineCount = Object.values(users).filter(user => user.online === true).length;
        }
        const onlineElement = document.getElementById('onlineCount');
        if (onlineElement) {
            onlineElement.innerHTML = `<i class="fas fa-circle"></i><span>${onlineCount} متصل</span>`;
        }
    });
}

// التنقل بين الشاشات
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(`${view}View`).classList.add('active');
        
        if (view === 'friends') {
            loadFriends();
            loadPendingRequests();
        } else if (view === 'profile') {
            loadUserProfile(currentUser.uid);
        } else if (view === 'rooms') {
            loadRooms();
        }
    });
});

// فتح/إغلاق الشريط الجانبي
document.getElementById('toggleSidebar')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
});

document.querySelector('.main-content')?.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('open');
    }
});

// اختيار الجنس
document.querySelectorAll('.avatar-option').forEach(option => {
    option.addEventListener('click', () => {
        document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
    });
});

// دوال التحميل
function showLoading() {
    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = '<div class="spinner"></div>';
        document.body.appendChild(loadingOverlay);
    }
    loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

// إضافة أنماط إضافية
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    .loading-overlay {
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.7); display: flex;
        justify-content: center; align-items: center; z-index: 10000;
    }
    .error-toast, .success-toast {
        position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
        padding: 12px 24px; border-radius: 12px; color: white;
        display: flex; align-items: center; gap: 10px; z-index: 10001;
        max-width: 90%; text-align: center;
    }
    .error-toast { background: linear-gradient(135deg, #ef4444, #dc2626); }
    .success-toast { background: linear-gradient(135deg, #10b981, #059669); }
    @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
    .empty-state { text-align: center; color: var(--text-secondary); padding: 40px; }
    .loading { text-align: center; color: var(--text-secondary); padding: 40px; }
    .xp-bar { width: 100%; height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden; margin: 20px 0; }
    .xp-progress { height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent-hover)); transition: width 0.3s; }
    .profile-info { width: 100%; margin: 20px 0; }
    .info-row { padding: 10px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid var(--border); }
    .badges-container { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin: 20px 0; }
    .badge { background: var(--bg-tertiary); padding: 8px 15px; border-radius: 20px; font-size: 14px; display: flex; align-items: center; gap: 8px; }
    .profile-id { color: var(--text-secondary); font-size: 12px; margin-bottom: 20px; }
    .action-btn { padding: 5px 10px; background: var(--accent); color: white; border: none; border-radius: 5px; cursor: pointer; }
    .action-btn.danger { background: var(--error); }
    .admin-action-btn { width: 100%; padding: 12px; margin: 5px 0; background: var(--accent); color: white; border: none; border-radius: 10px; cursor: pointer; }
`;
document.head.appendChild(additionalStyles);

console.log("✅ App initialized");

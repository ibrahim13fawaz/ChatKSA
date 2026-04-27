// التطبيق الرئيسي

// إظهار/إخفاء الشاشات
function showLoadingScreen() {
    document.getElementById('loadingScreen').style.display = 'flex';
}

function hideLoadingScreen() {
    document.getElementById('loadingScreen').style.display = 'none';
}

function showAuthScreen() {
    document.getElementById('authScreen').style.display = 'flex';
    document.getElementById('completeProfileScreen').style.display = 'none';
    document.getElementById('appScreen').style.display = 'none';
}

function showCompleteProfileScreen() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('completeProfileScreen').style.display = 'flex';
    document.getElementById('appScreen').style.display = 'none';
}

async function initializeApp() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('completeProfileScreen').style.display = 'none';
    document.getElementById('appScreen').style.display = 'flex';
    
    // تحميل البيانات الأولية
    await loadUserProfile(currentUser.uid);
    loadPublicMessages();
    loadRooms();
    loadFriends();
    loadPendingRequests();
    initEmojiPicker();
    startStatusUpdater();
    
    // مراقبة عدد المتصلين في الغرفة العامة
    monitorPublicRoomUsers();
    
    // تحديث حالة الاتصال عند الإغلاق
    window.addEventListener('beforeunload', () => {
        if (currentUser) {
            updateUserStatus(currentUser.uid, false);
            if (currentRoom !== 'public') {
                database.ref(`rooms/${currentRoom}/usersOnline/${currentUser.uid}`).remove();
            }
        }
    });
    
    showSuccess(`مرحباً ${currentUserData.username}`);
}

// مراقبة مستخدمي الغرفة العامة
function monitorPublicRoomUsers() {
    const usersRef = database.ref('users');
    
    usersRef.on('value', (snapshot) => {
        const users = snapshot.val();
        let onlineCount = 0;
        
        if (users) {
            onlineCount = Object.values(users).filter(user => user.online === true).length;
        }
        
        document.getElementById('onlineCount').innerHTML = `
            <i class="fas fa-circle"></i>
            <span>${onlineCount} متصل</span>
        `;
    });
}

// التنقل بين الشاشات
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        
        // تحديث الأزرار النشطة
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // إخفاء جميع الشاشات
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        
        // إظهار الشاشة المحددة
        document.getElementById(`${view}View`).classList.add('active');
        
        // تحميل البيانات حسب الشاشة
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

// فتح/إغلاق الشريط الجانبي على الجوال
document.getElementById('toggleSidebar')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
});

// إغلاق الشريط الجانبي عند النقر على المحتوى على الجوال
document.querySelector('.main-content')?.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('open');
    }
});

// اختيار الجنس في شاشة إكمال الملف الشخصي
document.querySelectorAll('.avatar-option').forEach(option => {
    option.addEventListener('click', () => {
        document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
    });
});

// التحقق من اسم المستخدم أثناء الكتابة
let usernameCheckTimeout;
document.getElementById('usernameInput')?.addEventListener('input', async (e) => {
    clearTimeout(usernameCheckTimeout);
    const username = e.target.value;
    
    if (username.length < 3) {
        document.getElementById('usernameError').innerText = 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل';
        return;
    }
    
    usernameCheckTimeout = setTimeout(async () => {
        const isUnique = await isUsernameUnique(username);
        if (!isUnique) {
            document.getElementById('usernameError').innerText = 'اسم المستخدم موجود بالفعل';
        } else {
            document.getElementById('usernameError').innerText = '';
        }
    }, 500);
});

// إظهار/إخفاء التحميل
let loadingOverlay = null;

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

// إضافة أنماط إضافية للتحميل والإشعارات
const style = document.createElement('style');
style.textContent = `
    .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    }
    
    .error-toast, .success-toast {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        border-radius: 10px;
        color: white;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10001;
        animation: slideUp 0.3s ease;
    }
    
    .error-toast {
        background: var(--error);
    }
    
    .success-toast {
        background: var(--success);
    }
    
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    
    .empty-state {
        text-align: center;
        color: var(--text-secondary);
        padding: 40px;
    }
    
    .loading {
        text-align: center;
        color: var(--text-secondary);
        padding: 40px;
    }
    
    .profile-avatar-container {
        position: relative;
        display: inline-block;
    }
    
    .legendary-crown {
        position: absolute;
        top: -10px;
        right: -10px;
        font-size: 24px;
        color: #fbbf24;
    }
    
    .xp-bar {
        width: 100%;
        height: 8px;
        background: var(--bg-tertiary);
        border-radius: 4px;
        overflow: hidden;
        margin: 20px 0;
    }
    
    .xp-progress {
        height: 100%;
        background: linear-gradient(90deg, var(--accent), var(--accent-hover));
        transition: width 0.3s;
    }
    
    .profile-info {
        width: 100%;
        margin: 20px 0;
    }
    
    .info-row {
        padding: 10px;
        display: flex;
        align-items: center;
        gap: 10px;
        border-bottom: 1px solid var(--border);
    }
    
    .badges-section {
        width: 100%;
        margin-top: 20px;
    }
    
    .badges-section h3 {
        margin-bottom: 15px;
    }
    
    .disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .friends-tabs {
        display: flex;
        gap: 10px;
    }
    
    .friends-tab {
        padding: 8px 16px;
        background: var(--bg-tertiary);
        border: none;
        border-radius: 10px;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.3s;
    }
    
    .friends-tab.active {
        background: var(--accent);
        color: white;
    }
    
    .pending-requests {
        padding: 20px;
    }
    
    .stat-item {
        display: flex;
        justify-content: space-between;
        padding: 10px;
        border-bottom: 1px solid var(--border);
    }
`;

document.head.appendChild(style);

// بدء التطبيق
console.log('🚀 تطبيق الدردشة الاجتماعي جاهز للعمل');

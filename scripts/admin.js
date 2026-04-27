// ========== نظام الأدمن العام ==========

// حساب الأدمن الرئيسي
const ADMIN_EMAIL = "admin@chatksa.com";
const ADMIN_PASSWORD = "Admin@123456";
const ADMIN_USERNAME = "مدير النظام";

// إنشاء حساب الأدمن تلقائياً
async function setupAdminAccount() {
    try {
        // محاولة تسجيل الدخول بحساب الأدمن
        try {
            await auth.signInWithEmailAndPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
            console.log("✅ Admin account exists");
            await auth.signOut();
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                console.log("📝 Creating admin account...");
                const userCredential = await auth.createUserWithEmailAndPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
                
                await database.ref(`users/${userCredential.user.uid}`).set({
                    uid: userCredential.user.uid,
                    username: ADMIN_USERNAME,
                    avatar: "👑",
                    gender: "male",
                    country: "السعودية",
                    userId: "ADMIN001",
                    level: 100,
                    xp: 100000,
                    online: false,
                    lastSeen: firebase.database.ServerValue.TIMESTAMP,
                    friends: {},
                    requests: {},
                    badges: ['مبتدئ', 'نشيط', 'خبير', 'أسطورة', 'مؤسس'],
                    profileCompleted: true,
                    canChangeUsername: false,
                    bio: "👑 مدير النظام",
                    dailyXP: {},
                    createdAt: firebase.database.ServerValue.TIMESTAMP
                });
                
                console.log("✅ Admin account created!");
            }
        }
    } catch (error) {
        console.error("Admin setup error:", error);
    }
}

// التحقق من صلاحية الأدمن
async function isUserAdmin(uid) {
    try {
        const snapshot = await database.ref(`users/${uid}`).once('value');
        const userData = snapshot.val();
        return userData?.level >= 100 || userData?.username === ADMIN_USERNAME;
    } catch (error) {
        return false;
    }
}

// إضافة لوحة الأدمن في الواجهة
async function addAdminPanel() {
    if (!currentUser) return;
    
    const isAdmin = await isUserAdmin(currentUser.uid);
    if (!isAdmin) return;
    
    const sidebarNav = document.querySelector('.sidebar-nav');
    if (sidebarNav && !document.getElementById('adminPanelBtn')) {
        const adminBtn = document.createElement('button');
        adminBtn.id = 'adminPanelBtn';
        adminBtn.className = 'nav-btn';
        adminBtn.style.background = '#f59e0b';
        adminBtn.style.color = 'white';
        adminBtn.innerHTML = '<i class="fas fa-crown"></i><span>لوحة الأدمن</span>';
        adminBtn.onclick = showAdminPanel;
        sidebarNav.appendChild(adminBtn);
    }
}

// عرض لوحة الأدمن
function showAdminPanel() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>👑 لوحة تحكم الأدمن</h3>
            <div style="margin: 15px 0;">
                <button class="admin-action-btn" onclick="viewSystemStats(); this.closest('.modal').remove();">📊 إحصائيات النظام</button>
                <button class="admin-action-btn" onclick="manageUsers(); this.closest('.modal').remove();">👥 إدارة المستخدمين</button>
                <button class="admin-action-btn" onclick="manageRooms(); this.closest('.modal').remove();">🏠 إدارة الغرف</button>
            </div>
            <div class="modal-buttons">
                <button class="modal-btn cancel" onclick="this.closest('.modal').remove()">إغلاق</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// عرض إحصائيات النظام
async function viewSystemStats() {
    const usersSnapshot = await database.ref('users').once('value');
    const roomsSnapshot = await database.ref('rooms').once('value');
    const users = usersSnapshot.val() || {};
    const onlineCount = Object.values(users).filter(u => u.online === true).length;
    
    alert(`📊 إحصائيات النظام:\n\n👥 المستخدمين: ${Object.keys(users).length}\n🟢 المتصلون: ${onlineCount}\n🏠 الغرف: ${Object.keys(roomsSnapshot.val() || {}).length}`);
}

// إدارة المستخدمين
async function manageUsers() {
    const usersSnapshot = await database.ref('users').once('value');
    const users = usersSnapshot.val() || {};
    
    let usersList = "👥 قائمة المستخدمين:\n\n";
    for (const [uid, user] of Object.entries(users)) {
        usersList += `${user.username} - ${user.online ? '🟢 متصل' : '⚫ غير متصل'}\n`;
    }
    usersList += `\nالمجموع: ${Object.keys(users).length} مستخدم`;
    alert(usersList);
}

// إدارة الغرف
async function manageRooms() {
    const roomsSnapshot = await database.ref('rooms').once('value');
    const rooms = roomsSnapshot.val() || {};
    
    let roomsList = "🏠 قائمة الغرف:\n\n";
    for (const [id, room] of Object.entries(rooms)) {
        roomsList += `${room.name}\n`;
    }
    roomsList += `\nالمجموع: ${Object.keys(rooms).length} غرفة`;
    alert(roomsList);
}

// تشغيل إعداد الأدمن
setTimeout(() => {
    setupAdminAccount();
}, 2000);

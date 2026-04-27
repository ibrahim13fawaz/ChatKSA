// ========== نظام صلاحيات الأدمن ==========

// التحقق من صلاحية الأدمن قبل أي عملية
async function checkAdminPermission() {
    if (!currentUser) return false;
    return await isSuperAdmin(currentUser.uid);
}

// دالة حذف أي رسالة (عامة أو خاصة)
async function adminDeleteMessage(roomId, messageId, isPrivate = false) {
    if (!await checkAdminPermission()) {
        showError("❌ هذا الإجراء مخصص للأدمن فقط");
        return false;
    }
    
    try {
        if (isPrivate) {
            await database.ref(`privateChats/${roomId}/${messageId}`).remove();
        } else {
            await database.ref(`messages/${roomId}/${messageId}`).remove();
        }
        showSuccess("✅ تم حذف الرسالة بواسطة الأدمن");
        return true;
    } catch (error) {
        showError("❌ فشل حذف الرسالة");
        return false;
    }
}

// دالة حظر مستخدم من كل الغرف (حظر عام)
async function adminGlobalBan(userId, reason = "خالف قوانين الدردشة") {
    if (!await checkAdminPermission()) {
        showError("❌ هذا الإجراء مخصص للأدمن فقط");
        return false;
    }
    
    try {
        // إضافة المستخدم إلى قائمة المحظورين عالمياً
        await database.ref(`global_bans/${userId}`).set({
            bannedBy: currentUser.uid,
            reason: reason,
            bannedAt: firebase.database.ServerValue.TIMESTAMP,
            adminUsername: currentUserData.username
        });
        
        // حذف المستخدم من جميع الغرف
        const roomsSnapshot = await database.ref('rooms').once('value');
        const rooms = roomsSnapshot.val();
        
        if (rooms) {
            for (const roomId in rooms) {
                await database.ref(`rooms/${roomId}/bannedUsers/${userId}`).set(true);
                await database.ref(`rooms/${roomId}/usersOnline/${userId}`).remove();
            }
        }
        
        showSuccess(`✅ تم حظر المستخدم ${userId} عالمياً`);
        return true;
    } catch (error) {
        showError("❌ فشل حظر المستخدم");
        return false;
    }
}

// دالة إلغاء الحظر العام
async function adminRemoveGlobalBan(userId) {
    if (!await checkAdminPermission()) {
        showError("❌ هذا الإجراء مخصص للأدمن فقط");
        return false;
    }
    
    try {
        await database.ref(`global_bans/${userId}`).remove();
        
        // إزالة الحظر من جميع الغرف
        const roomsSnapshot = await database.ref('rooms').once('value');
        const rooms = roomsSnapshot.val();
        
        if (rooms) {
            for (const roomId in rooms) {
                await database.ref(`rooms/${roomId}/bannedUsers/${userId}`).remove();
            }
        }
        
        showSuccess(`✅ تم إلغاء الحظر عن المستخدم`);
        return true;
    } catch (error) {
        showError("❌ فشل إلغاء الحظر");
        return false;
    }
}

// دالة إرسال تحذير لمستخدم
async function adminSendWarning(userId, message) {
    if (!await checkAdminPermission()) {
        showError("❌ هذا الإجراء مخصص للأدمن فقط");
        return false;
    }
    
    try {
        await database.ref(`user_warnings/${userId}`).push({
            warning: message,
            fromAdmin: currentUser.uid,
            adminUsername: currentUserData.username,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        
        showSuccess(`✅ تم إرسال تحذير للمستخدم`);
        return true;
    } catch (error) {
        showError("❌ فشل إرسال التحذير");
        return false;
    }
}

// دالة عرض إحصائيات النظام (للأدمن فقط)
async function adminViewStats() {
    if (!await checkAdminPermission()) {
        showError("❌ هذا الإجراء مخصص للأدمن فقط");
        return;
    }
    
    try {
        const usersSnapshot = await database.ref('users').once('value');
        const roomsSnapshot = await database.ref('rooms').once('value');
        const messagesSnapshot = await database.ref('messages').once('value');
        
        const users = usersSnapshot.val() || {};
        const rooms = roomsSnapshot.val() || {};
        
        let totalMessages = 0;
        if (messagesSnapshot.val()) {
            for (const roomId in messagesSnapshot.val()) {
                totalMessages += Object.keys(messagesSnapshot.val()[roomId] || {}).length;
            }
        }
        
        const onlineCount = Object.values(users).filter(u => u.online === true).length;
        
        const statsHtml = `
            <div class="admin-stats">
                <h3>📊 إحصائيات النظام</h3>
                <div class="stat-item">👥 عدد المستخدمين: ${Object.keys(users).length}</div>
                <div class="stat-item">🟢 المتصلون الآن: ${onlineCount}</div>
                <div class="stat-item">🏠 عدد الغرف: ${Object.keys(rooms).length}</div>
                <div class="stat-item">💬 عدد الرسائل: ${totalMessages}</div>
                <div class="stat-item">👑 عدد الأدمن: ${SUPER_ADMINS.length + 1}</div>
            </div>
        `;
        
        // عرض في نافذة منبثقة
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                ${statsHtml}
                <div class="modal-buttons">
                    <button class="modal-btn confirm" onclick="this.closest('.modal').remove()">إغلاق</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
    } catch (error) {
        showError("❌ فشل تحميل الإحصائيات");
    }
}

// إضافة واجهة الأدمن في التطبيق
function addAdminPanel() {
    if (!currentUser) return;
    
    isSuperAdmin(currentUser.uid).then(isAdmin => {
        if (!isAdmin) return;
        
        // إضافة زر لوحة التحكم في الشريط الجانبي
        const sidebarNav = document.querySelector('.sidebar-nav');
        if (sidebarNav && !document.getElementById('adminPanelBtn')) {
            const adminBtn = document.createElement('button');
            adminBtn.id = 'adminPanelBtn';
            adminBtn.className = 'nav-btn';
            adminBtn.style.background = 'linear-gradient(135deg, #f59e0b, #ea580c)';
            adminBtn.style.color = 'white';
            adminBtn.innerHTML = `
                <i class="fas fa-crown"></i>
                <span>لوحة التحكم</span>
            `;
            adminBtn.onclick = showAdminPanel;
            sidebarNav.appendChild(adminBtn);
        }
    });
}

// عرض لوحة تحكم الأدمن
function showAdminPanel() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px; max-height: 80vh; overflow-y: auto;">
            <h3>👑 لوحة تحكم الأدمن</h3>
            
            <div style="margin: 15px 0;">
                <button class="admin-action-btn" onclick="adminViewStats(); this.closest('.modal').remove();">
                    📊 عرض إحصائيات النظام
                </button>
                
                <button class="admin-action-btn" onclick="showUserManagement(); this.closest('.modal').remove();">
                    👥 إدارة المستخدمين
                </button>
                
                <button class="admin-action-btn" onclick="showRoomManagement(); this.closest('.modal').remove();">
                    🏠 إدارة الغرف
                </button>
                
                <button class="admin-action-btn" onclick="showAdminManagement(); this.closest('.modal').remove();">
                    👑 إدارة الأدمن
                </button>
                
                <button class="admin-action-btn" onclick="showSystemSettings(); this.closest('.modal').remove();">
                    ⚙️ إعدادات النظام
                </button>
            </div>
            
            <div class="admin-info" style="background: var(--bg-primary); padding: 10px; border-radius: 10px; margin-top: 10px;">
                <small>👤 مسجل كـ: ${currentUserData?.username}</small><br>
                <small>👑 صلاحية: أدمن عام</small>
            </div>
            
            <div class="modal-buttons" style="margin-top: 15px;">
                <button class="modal-btn cancel" onclick="this.closest('.modal').remove()">إغلاق</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// إدارة المستخدمين
async function showUserManagement() {
    const usersSnapshot = await database.ref('users').once('value');
    const users = usersSnapshot.val() || {};
    
    let usersHtml = '<div style="max-height: 400px; overflow-y: auto;">';
    for (const [uid, user] of Object.entries(users)) {
        const isAdmin = await isSuperAdmin(uid);
        usersHtml += `
            <div class="user-management-item" style="padding: 10px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${user.username}</strong><br>
                    <small>${user.online ? '🟢 متصل' : '⚫ غير متصل'}</small>
                    ${isAdmin ? '<span style="color: #f59e0b;"> 👑 أدمن</span>' : ''}
                </div>
                <div>
                    <button class="small-btn" onclick="adminSendWarning('${uid}', 'تحذير من الأدمن')">⚠️ تحذير</button>
                    <button class="small-btn danger" onclick="adminGlobalBan('${uid}', 'خالف قوانين الدردشة')">🔨 حظر</button>
                </div>
            </div>
        `;
    }
    usersHtml += '</div>';
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>👥 إدارة المستخدمين</h3>
            ${usersHtml}
            <div class="modal-buttons">
                <button class="modal-btn cancel" onclick="this.closest('.modal').remove()">إغلاق</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// إدارة الأدمن
async function showAdminManagement() {
    const adminsList = [];
    for (const uid of SUPER_ADMINS) {
        const userSnap = await database.ref(`users/${uid}`).once('value');
        if (userSnap.exists()) {
            adminsList.push({uid, username: userSnap.val().username});
        }
    }
    
    let adminsHtml = '<div style="max-height: 300px; overflow-y: auto;">';
    adminsList.forEach(admin => {
        if (admin.uid !== auth.currentUser?.uid) {
            adminsHtml += `
                <div class="admin-item" style="padding: 10px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between;">
                    <span>👑 ${admin.username}</span>
                    <button class="small-btn danger" onclick="removeAdmin('${admin.uid}')">إزالة</button>
                </div>
            `;
        }
    });
    adminsHtml += '</div>';
    adminsHtml += `
        <div style="margin-top: 15px;">
            <input type="text" id="newAdminUid" placeholder="معرف المستخدم (UID)" class="modal-input">
            <input type="text" id="newAdminName" placeholder="اسم المستخدم" class="modal-input">
            <button class="admin-action-btn" onclick="addNewAdmin(document.getElementById('newAdminUid').value, document.getElementById('newAdminName').value)">➕ إضافة أدمن</button>
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>👑 إدارة الأدمن</h3>
            ${adminsHtml}
            <div class="modal-buttons">
                <button class="modal-btn cancel" onclick="this.closest('.modal').remove()">إغلاق</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// إدارة الغرف
async function showRoomManagement() {
    const roomsSnapshot = await database.ref('rooms').once('value');
    const rooms = roomsSnapshot.val() || {};
    
    let roomsHtml = '<div style="max-height: 400px; overflow-y: auto;">';
    for (const [roomId, room] of Object.entries(rooms)) {
        roomsHtml += `
            <div class="room-management-item" style="padding: 10px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${room.name}</strong><br>
                    <small>المالك: ${room.ownerId}</small>
                </div>
                <div>
                    <button class="small-btn danger" onclick="deleteRoom('${roomId}')">🗑️ حذف الغرفة</button>
                </div>
            </div>
        `;
    }
    roomsHtml += '</div>';
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>🏠 إدارة الغرف</h3>
            ${roomsHtml}
            <div class="modal-buttons">
                <button class="modal-btn cancel" onclick="this.closest('.modal').remove()">إغلاق</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// حذف غرفة (للأدمن فقط)
async function deleteRoom(roomId) {
    if (!await checkAdminPermission()) {
        showError("❌ هذا الإجراء مخصص للأدمن فقط");
        return;
    }
    
    if (confirm('⚠️ هل أنت متأكد من حذف هذه الغرفة؟ هذا الإجراء لا يمكن التراجع عنه!')) {
        try {
            await database.ref(`rooms/${roomId}`).remove();
            await database.ref(`messages/${roomId}`).remove();
            showSuccess("✅ تم حذف الغرفة بنجاح");
            location.reload();
        } catch (error) {
            showError("❌ فشل حذف الغرفة");
        }
    }
}

// إعدادات النظام
function showSystemSettings() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>⚙️ إعدادات النظام</h3>
            <div style="margin: 15px 0;">
                <label>
                    <input type="checkbox" id="maintenanceMode"> وضع الصيانة
                </label>
            </div>
            <div class="modal-buttons">
                <button class="modal-btn confirm" onclick="saveSystemSettings()">حفظ</button>
                <button class="modal-btn cancel" onclick="this.closest('.modal').remove()">إلغاء</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// حفظ إعدادات النظام
async function saveSystemSettings() {
    const maintenanceMode = document.getElementById('maintenanceMode')?.checked || false;
    await database.ref('system_settings/maintenance_mode').set(maintenanceMode);
    showSuccess("✅ تم حفظ الإعدادات");
    document.querySelector('.modal')?.remove();
}

// إضافة ستايل للأزرار
const adminStyles = document.createElement('style');
adminStyles.textContent = `
    .admin-action-btn {
        width: 100%;
        padding: 12px;
        margin: 5px 0;
        background: var(--accent);
        color: white;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.3s;
    }
    
    .admin-action-btn:hover {
        transform: translateX(5px);
        background: var(--accent-hover);
    }
    
    .small-btn {
        padding: 5px 10px;
        margin: 0 2px;
        background: var(--accent);
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 12px;
    }
    
    .small-btn.danger {
        background: var(--error);
    }
    
    .admin-stats {
        direction: rtl;
    }
    
    .admin-stats .stat-item {
        padding: 8px;
        margin: 5px 0;
        background: var(--bg-primary);
        border-radius: 8px;
    }
`;
document.head.appendChild(adminStyles);

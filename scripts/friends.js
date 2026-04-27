// نظام إدارة الأصدقاء

// إرسال طلب صداقة
async function sendFriendRequest(toUserId) {
    if (toUserId === currentUser.uid) {
        showError('لا يمكنك إضافة نفسك كصديق');
        return;
    }
    
    // التحقق من وجود طلب مسبق
    const existingRequest = await database.ref(`users/${toUserId}/requests/${currentUser.uid}`).once('value');
    if (existingRequest.exists()) {
        showError('تم إرسال طلب صداقة مسبقاً');
        return;
    }
    
    // التحقق من الصداقة الحالية
    const existingFriend = await database.ref(`users/${currentUser.uid}/friends/${toUserId}`).once('value');
    if (existingFriend.exists()) {
        showError('هذا المستخدم صديق لك بالفعل');
        return;
    }
    
    const requestData = {
        fromUserId: currentUser.uid,
        fromUsername: currentUserData.username,
        fromAvatar: currentUserData.avatar,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        status: 'pending'
    };
    
    try {
        await database.ref(`users/${toUserId}/requests/${currentUser.uid}`).set(requestData);
        showSuccess('تم إرسال طلب الصداقة');
        
        // إشعار للمستخدم
        const userData = await database.ref(`users/${toUserId}`).once('value');
        if (userData.val() && userData.val().online) {
            showNotification(
                'طلب صداقة جديد',
                `${currentUserData.username} أرسل لك طلب صداقة`,
                currentUserData.avatar
            );
        }
    } catch (error) {
        showError('فشل إرسال الطلب: ' + error.message);
    }
}

// قبول طلب صداقة
async function acceptFriendRequest(fromUserId) {
    try {
        // إضافة الصديق لكلا الطرفين
        const friendData = {
            userId: fromUserId,
            username: currentUserData.username,
            avatar: currentUserData.avatar,
            addedAt: firebase.database.ServerValue.TIMESTAMP
        };
        
        const myData = {
            userId: currentUser.uid,
            username: currentUserData.username,
            avatar: currentUserData.avatar,
            addedAt: firebase.database.ServerValue.TIMESTAMP
        };
        
        await database.ref(`users/${currentUser.uid}/friends/${fromUserId}`).set(friendData);
        await database.ref(`users/${fromUserId}/friends/${currentUser.uid}`).set(myData);
        
        // حذف الطلب
        await database.ref(`users/${currentUser.uid}/requests/${fromUserId}`).remove();
        
        // تحديث النقاط
        await updateUserXP(currentUser.uid, 5);
        
        showSuccess('تم قبول طلب الصداقة');
        loadFriends();
        loadPendingRequests();
    } catch (error) {
        showError('فشل قبول الطلب: ' + error.message);
    }
}

// رفض طلب صداقة
async function rejectFriendRequest(fromUserId) {
    try {
        await database.ref(`users/${currentUser.uid}/requests/${fromUserId}`).remove();
        showSuccess('تم رفض طلب الصداقة');
        loadPendingRequests();
    } catch (error) {
        showError('فشل رفض الطلب: ' + error.message);
    }
}

// تحميل قائمة الأصدقاء
function loadFriends() {
    const friendsRef = database.ref(`users/${currentUser.uid}/friends`);
    const container = document.getElementById('friendsList');
    
    friendsRef.on('value', async (snapshot) => {
        container.innerHTML = '';
        const friends = snapshot.val();
        
        if (!friends || Object.keys(friends).length === 0) {
            container.innerHTML = '<div class="empty-state">لا يوجد أصدقاء بعد</div>';
            return;
        }
        
        for (const [friendId, friendData] of Object.entries(friends)) {
            // جلب الحالة الحالية للصديق
            const userSnapshot = await database.ref(`users/${friendId}`).once('value');
            const userData = userSnapshot.val();
            
            displayFriend(friendData, userData);
        }
    });
}

// عرض صديق في القائمة
function displayFriend(friendData, userData) {
    const container = document.getElementById('friendsList');
    
    const friendDiv = document.createElement('div');
    friendDiv.className = 'friend-item';
    
    const isOnline = userData && userData.online;
    const lastSeen = userData ? formatTime(userData.lastSeen) : 'غير معروف';
    
    friendDiv.innerHTML = `
        <img class="friend-avatar" src="${friendData.avatar}" alt="avatar">
        <div class="friend-info">
            <div class="friend-name">${escapeHtml(friendData.username)}</div>
            <div class="friend-status">
                <span class="online-status ${isOnline ? 'online' : 'offline'}"></span>
                ${isOnline ? 'متصل الآن' : `آخر ظهور ${lastSeen}`}
            </div>
        </div>
        <div class="action-buttons">
            <button class="action-btn" onclick="startPrivateChat('${friendData.userId}')">
                <i class="fas fa-comment"></i>
            </button>
            <button class="action-btn danger" onclick="removeFriend('${friendData.userId}')">
                <i class="fas fa-user-minus"></i>
            </button>
        </div>
    `;
    
    container.appendChild(friendDiv);
}

// تحميل طلبات الصداقة المعلقة
function loadPendingRequests() {
    const requestsRef = database.ref(`users/${currentUser.uid}/requests`);
    const container = document.getElementById('pendingRequests');
    
    requestsRef.on('value', (snapshot) => {
        container.innerHTML = '';
        const requests = snapshot.val();
        
        if (!requests || Object.keys(requests).length === 0) {
            container.style.display = 'none';
            return;
        }
        
        container.style.display = 'block';
        container.innerHTML = '<h3>طلبات الصداقة</h3>';
        
        for (const [userId, requestData] of Object.entries(requests)) {
            displayRequest(requestData, userId);
        }
    });
}

// عرض طلب صداقة
function displayRequest(requestData, userId) {
    const container = document.getElementById('pendingRequests');
    
    const requestDiv = document.createElement('div');
    requestDiv.className = 'friend-item';
    
    requestDiv.innerHTML = `
        <img class="friend-avatar" src="${requestData.fromAvatar}" alt="avatar">
        <div class="friend-info">
            <div class="friend-name">${escapeHtml(requestData.fromUsername)}</div>
            <div class="friend-status">طلب صداقة</div>
        </div>
        <div class="action-buttons">
            <button class="action-btn" onclick="acceptFriendRequest('${userId}')">
                <i class="fas fa-check"></i> قبول
            </button>
            <button class="action-btn danger" onclick="rejectFriendRequest('${userId}')">
                <i class="fas fa-times"></i> رفض
            </button>
        </div>
    `;
    
    container.appendChild(requestDiv);
}

// إزالة صديق
async function removeFriend(friendId) {
    if (confirm('هل أنت متأكد من إزالة هذا الصديق؟')) {
        try {
            await database.ref(`users/${currentUser.uid}/friends/${friendId}`).remove();
            await database.ref(`users/${friendId}/friends/${currentUser.uid}`).remove();
            showSuccess('تم إزالة الصديق');
            loadFriends();
        } catch (error) {
            showError('فشل إزالة الصديق: ' + error.message);
        }
    }
}

// البحث عن مستخدمين
async function searchUsers(username) {
    if (!username.trim()) {
        showError('الرجاء إدخال اسم مستخدم');
        return;
    }
    
    const container = document.getElementById('searchResults');
    container.innerHTML = '<div class="loading">جاري البحث...</div>';
    
    try {
        const snapshot = await database.ref('users').orderByChild('username').startAt(username).endAt(username + '\uf8ff').once('value');
        const users = snapshot.val();
        
        container.innerHTML = '';
        
        if (!users) {
            container.innerHTML = '<div class="empty-state">لا توجد نتائج</div>';
            return;
        }
        
        for (const [userId, userData] of Object.entries(users)) {
            if (userId !== currentUser.uid) {
                displaySearchResult(userData, userId);
            }
        }
    } catch (error) {
        showError('فشل البحث: ' + error.message);
    }
}

// عرض نتيجة البحث
function displaySearchResult(userData, userId) {
    const container = document.getElementById('searchResults');
    
    // التحقق من حالة الصداقة
    const isFriend = currentUserData.friends && currentUserData.friends[userId];
    const hasRequest = currentUserData.requests && currentUserData.requests[userId];
    
    const userDiv = document.createElement('div');
    userDiv.className = 'user-item';
    
    userDiv.innerHTML = `
        <img class="user-avatar" src="${userData.avatar}" alt="avatar">
        <div class="user-info">
            <div class="user-name">${escapeHtml(userData.username)}</div>
            <div class="user-meta">
                <span>${userData.country}</span>
                <span>مستوى ${userData.level}</span>
            </div>
        </div>
        <div class="action-buttons">
            ${!isFriend && !hasRequest ? 
                `<button class="action-btn" onclick="sendFriendRequest('${userId}')">
                    <i class="fas fa-user-plus"></i> إضافة
                </button>` : 
                isFriend ? 
                `<button class="action-btn" onclick="startPrivateChat('${userId}')">
                    <i class="fas fa-comment"></i> مراسلة
                </button>` :
                `<button class="action-btn disabled" disabled>
                    <i class="fas fa-clock"></i> طلب مرسل
                </button>`
            }
            <button class="action-btn" onclick="viewUserProfile('${userId}')">
                <i class="fas fa-eye"></i> عرض
            </button>
        </div>
    `;
    
    container.appendChild(userDiv);
}

// بدء محادثة خاصة
async function startPrivateChat(userId) {
    const chatId = [currentUser.uid, userId].sort().join('_');
    const userSnapshot = await database.ref(`users/${userId}`).once('value');
    const userData = userSnapshot.val();
    
    if (!userData) {
        showError('المستخدم غير موجود');
        return;
    }
    
    loadPrivateChat(chatId, userData);
}

// عرض ملف مستخدم آخر
async function viewUserProfile(userId) {
    const userSnapshot = await database.ref(`users/${userId}`).once('value');
    const userData = userSnapshot.val();
    
    if (!userData) {
        showError('المستخدم غير موجود');
        return;
    }
    
    // عرض ملف شخصي مؤقت
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content">
            <h3>${escapeHtml(userData.username)}</h3>
            <div style="text-align: center;">
                <img src="${userData.avatar}" style="width: 100px; height: 100px; border-radius: 50%; margin: 20px 0;">
                <p>المستوى: ${userData.level}</p>
                <p>الدولة: ${userData.country}</p>
                <p>السيرة: ${userData.bio || 'لا توجد سيرة'}</p>
                <div class="badges-container">
                    ${userData.badges.map(badge => `<div class="badge"><i class="fas fa-medal"></i> ${badge}</div>`).join('')}
                </div>
                <div class="modal-buttons">
                    <button class="modal-btn confirm" onclick="startPrivateChat('${userId}')">مراسلة</button>
                    <button class="modal-btn cancel" onclick="this.closest('.modal').remove()">إغلاق</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// البحث
document.getElementById('searchBtn')?.addEventListener('click', () => {
    const username = document.getElementById('searchUsername').value;
    searchUsers(username);
});

document.getElementById('searchUsername')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const username = document.getElementById('searchUsername').value;
        searchUsers(username);
    }
});

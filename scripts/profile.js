// نظام الملف الشخصي

// عرض الملف الشخصي
async function showProfile() {
    // التبديل إلى عرض الملف الشخصي
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-view="profile"]').classList.add('active');
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.getElementById('profileView').classList.add('active');
    
    await loadUserProfile(currentUser.uid);
}

// تحميل الملف الشخصي
async function loadUserProfile(userId) {
    const container = document.getElementById('userProfile');
    container.innerHTML = '<div class="loading">جاري التحميل...</div>';
    
    try {
        const userSnapshot = await database.ref(`users/${userId}`).once('value');
        const userData = userSnapshot.val();
        
        if (!userData) {
            container.innerHTML = '<div class="error">فشل تحميل الملف الشخصي</div>';
            return;
        }
        
        // حساب الميداليات
        const badgesCount = userData.badges ? userData.badges.length : 0;
        const friendsCount = userData.friends ? Object.keys(userData.friends).length : 0;
        const xpProgress = (userData.xp % 1000) / 10;
        
        container.innerHTML = `
            <div class="profile-avatar-container">
                <img class="profile-avatar" src="${userData.avatar}" alt="avatar">
                ${userData.level >= 100 ? '<i class="fas fa-crown legendary-crown"></i>' : ''}
            </div>
            <h2>${escapeHtml(userData.username)}</h2>
            <p class="profile-id">#${userData.userId}</p>
            
            <div class="profile-stats">
                <div class="stat-card">
                    <div class="stat-value">${userData.level}</div>
                    <div class="stat-label">المستوى</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${userData.xp} XP</div>
                    <div class="stat-label">النقاط</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${friendsCount}</div>
                    <div class="stat-label">الأصدقاء</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${badgesCount}</div>
                    <div class="stat-label">الشارات</div>
                </div>
            </div>
            
            <div class="xp-bar">
                <div class="xp-progress" style="width: ${xpProgress}%"></div>
            </div>
            
            <div class="profile-info">
                <div class="info-row">
                    <i class="fas fa-venus-mars"></i>
                    <span>الجنس: ${userData.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
                </div>
                <div class="info-row">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>الدولة: ${userData.country}</span>
                </div>
                <div class="info-row">
                    <i class="fas fa-calendar"></i>
                    <span>تاريخ التسجيل: ${new Date(userData.createdAt).toLocaleDateString('ar')}</span>
                </div>
                <div class="info-row">
                    <i class="fas fa-info-circle"></i>
                    <span>السيرة: ${userData.bio || 'لا توجد سيرة'}</span>
                </div>
            </div>
            
            <div class="badges-section">
                <h3>الشارات</h3>
                <div class="badges-container">
                    ${userData.badges.map(badge => `
                        <div class="badge">
                            <i class="fas fa-medal"></i>
                            <span>${badge}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // تحديث معلومات الشريط الجانبي
        updateSidebarInfo(userData);
        
    } catch (error) {
        showError('فشل تحميل الملف الشخصي: ' + error.message);
        container.innerHTML = '<div class="error">فشل تحميل الملف الشخصي</div>';
    }
}

// تحديث الشريط الجانبي
function updateSidebarInfo(userData) {
    document.getElementById('sidebarAvatar').src = userData.avatar;
    document.getElementById('sidebarUsername').textContent = userData.username;
    document.getElementById('sidebarLevel').innerHTML = `<i class="fas fa-star"></i> مستوى ${userData.level}`;
}

// تعديل الملف الشخصي
function editProfile() {
    document.getElementById('editBio').value = currentUserData.bio || '';
    document.getElementById('editProfileModal').style.display = 'flex';
}

// حفظ التعديلات
async function saveProfile() {
    const bio = document.getElementById('editBio').value;
    
    try {
        await database.ref(`users/${currentUser.uid}`).update({
            bio: bio,
            lastUpdated: firebase.database.ServerValue.TIMESTAMP
        });
        
        currentUserData.bio = bio;
        showSuccess('تم تحديث الملف الشخصي');
        document.getElementById('editProfileModal').style.display = 'none';
        await loadUserProfile(currentUser.uid);
    } catch (error) {
        showError('فشل تحديث الملف الشخصي: ' + error.message);
    }
}

// تغيير اسم المستخدم (مرة واحدة فقط)
async function changeUsername(newUsername) {
    if (!currentUserData.canChangeUsername) {
        showError('لا يمكنك تغيير اسم المستخدم أكثر من مرة');
        return;
    }
    
    if (!await isUsernameUnique(newUsername)) {
        showError('اسم المستخدم موجود بالفعل');
        return;
    }
    
    if (confirm('تحذير: يمكنك تغيير اسم المستخدم مرة واحدة فقط. هل أنت متأكد؟')) {
        try {
            await database.ref(`users/${currentUser.uid}`).update({
                username: newUsername,
                canChangeUsername: false
            });
            
            currentUserData.username = newUsername;
            currentUserData.canChangeUsername = false;
            
            showSuccess('تم تغيير اسم المستخدم بنجاح');
            await loadUserProfile(currentUser.uid);
        } catch (error) {
            showError('فشل تغيير اسم المستخدم: ' + error.message);
        }
    }
}

// عرض إحصائيات المستخدم
async function showUserStats() {
    // حساب وقت التواجد
    const todayKey = new Date().toDateString();
    const dailyXP = currentUserData.dailyXP || {};
    const todayXP = dailyXP[todayKey] || 0;
    
    const statsHtml = `
        <div class="stats-dialog">
            <h3>إحصائيات اليوم</h3>
            <div class="stat-item">
                <span>النقاط المكتسبة:</span>
                <strong>${todayXP} / 900</strong>
            </div>
            <div class="stat-item">
                <span>الرسائل المرسلة:</span>
                <strong>${Math.min(todayXP, 200)}</strong>
            </div>
            <div class="stat-item">
                <span>المستوى القادم:</span>
                <strong>${1000 - (currentUserData.xp % 1000)} XP</strong>
            </div>
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
}

// تحديث الحالة بشكل دوري
function startStatusUpdater() {
    // تحديث الحالة كل دقيقة
    setInterval(async () => {
        if (currentUser) {
            await database.ref(`users/${currentUser.uid}`).update({
                lastActive: firebase.database.ServerValue.TIMESTAMP,
                online: true
            });
            
            // إضافة نقاط التواجد (1 نقطة لكل دقيقة، حد 300 في اليوم)
            await updateUserXP(currentUser.uid, 1);
        }
    }, 60000);
    
    // تحديث النقاط اليومية عند منتصف الليل
    const now = new Date();
    const night = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0, 0, 0
    );
    const msUntilMidnight = night.getTime() - now.getTime();
    
    setTimeout(() => {
        // إعادة تعيين النقاط اليومية
        database.ref(`users/${currentUser.uid}/dailyXP`).set({});
        // إعادة جدولة
        startStatusUpdater();
    }, msUntilMidnight);
}

// أحداث الملف الشخصي
document.getElementById('editProfileBtn')?.addEventListener('click', editProfile);
document.getElementById('saveProfileBtn')?.addEventListener('click', saveProfile);
document.getElementById('cancelEditProfile')?.addEventListener('click', () => {
    document.getElementById('editProfileModal').style.display = 'none';
});

// النقر على صورة الملف الشخصي في الشريط الجانبي
document.querySelector('.user-info')?.addEventListener('click', showProfile);

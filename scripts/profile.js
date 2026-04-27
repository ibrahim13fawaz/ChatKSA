// نظام الملف الشخصي

// عرض الملف الشخصي
async function showProfile() {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-view="profile"]').classList.add('active');
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.getElementById('profileView').classList.add('active');
    await loadUserProfile(currentUser.uid);
}

// تحميل الملف الشخصي
async function loadUserProfile(userId) {
    const container = document.getElementById('userProfile');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">جاري التحميل...</div>';
    
    try {
        const userSnapshot = await database.ref(`users/${userId}`).once('value');
        const userData = userSnapshot.val();
        
        if (!userData) {
            container.innerHTML = '<div class="error">فشل تحميل الملف الشخصي</div>';
            return;
        }
        
        const friendsCount = userData.friends ? Object.keys(userData.friends).length : 0;
        const xpProgress = (userData.xp % 1000) / 10;
        
        container.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 80px;">${userData.avatar}</div>
                <h2>${escapeHtml(userData.username)}</h2>
                <p class="profile-id">#${userData.userId}</p>
            </div>
            
            <div class="profile-stats">
                <div class="stat-card"><div class="stat-value">${userData.level}</div><div class="stat-label">المستوى</div></div>
                <div class="stat-card"><div class="stat-value">${userData.xp}</div><div class="stat-label">XP</div></div>
                <div class="stat-card"><div class="stat-value">${friendsCount}</div><div class="stat-label">الأصدقاء</div></div>
            </div>
            
            <div class="xp-bar"><div class="xp-progress" style="width: ${xpProgress}%"></div></div>
            
            <div class="profile-info">
                <div class="info-row"><i class="fas fa-venus-mars"></i><span>الجنس: ${userData.gender === 'male' ? 'ذكر' : 'أنثى'}</span></div>
                <div class="info-row"><i class="fas fa-map-marker-alt"></i><span>الدولة: ${userData.country}</span></div>
                <div class="info-row"><i class="fas fa-info-circle"></i><span>السيرة: ${userData.bio || 'لا توجد سيرة'}</span></div>
            </div>
            
            <div class="badges-container">
                ${userData.badges.map(badge => `<div class="badge"><i class="fas fa-medal"></i> ${badge}</div>`).join('')}
            </div>
        `;
        
        // تحديث الشريط الجانبي
        document.getElementById('sidebarAvatar').textContent = userData.avatar;
        document.getElementById('sidebarUsername').textContent = userData.username;
        document.getElementById('sidebarLevel').innerHTML = `<i class="fas fa-star"></i> مستوى ${userData.level}`;
        
    } catch (error) {
        container.innerHTML = '<div class="error">فشل تحميل الملف الشخصي</div>';
    }
}

// تعديل الملف الشخصي
document.getElementById('editProfileBtn')?.addEventListener('click', () => {
    document.getElementById('editBio').value = currentUserData?.bio || '';
    document.getElementById('editProfileModal').style.display = 'flex';
});

document.getElementById('saveProfileBtn')?.addEventListener('click', async () => {
    const bio = document.getElementById('editBio').value;
    try {
        await database.ref(`users/${currentUser.uid}`).update({ bio: bio });
        currentUserData.bio = bio;
        showSuccess('تم تحديث الملف الشخصي');
        document.getElementById('editProfileModal').style.display = 'none';
        await loadUserProfile(currentUser.uid);
    } catch (error) {
        showError('فشل تحديث الملف الشخصي');
    }
});

document.getElementById('cancelEditProfile')?.addEventListener('click', () => {
    document.getElementById('editProfileModal').style.display = 'none';
});

// تحديث الحالة بشكل دوري
function startStatusUpdater() {
    setInterval(async () => {
        if (currentUser) {
            await database.ref(`users/${currentUser.uid}`).update({
                lastActive: firebase.database.ServerValue.TIMESTAMP,
                online: true
            });
            await updateUserXP(currentUser.uid, 1);
        }
    }, 60000);
}

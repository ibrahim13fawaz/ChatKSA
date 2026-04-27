// أدوات مساعدة عامة

// إنشاء ID عشوائي
function generateRandomId() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// التحقق من اسم مستخدم فريد
async function isUsernameUnique(username) {
    const snapshot = await database.ref('users').orderByChild('username').equalTo(username).once('value');
    return !snapshot.exists();
}

// تنسيق الوقت
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'الآن';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} دقيقة`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ساعة`;
    
    return date.toLocaleDateString('ar');
}

// تحديث النقاط والمستوى
async function updateUserXP(uid, points) {
    const userRef = database.ref(`users/${uid}`);
    const snapshot = await userRef.once('value');
    const userData = snapshot.val();
    
    let newXP = (userData.xp || 0) + points;
    let newLevel = Math.floor(newXP / 1000);
    
    // التحقق من الحد اليومي
    const todayKey = new Date().toDateString();
    const dailyXP = userData.dailyXP || {};
    
    if (dailyXP[todayKey]) {
        if (dailyXP[todayKey] + points > 900) return;
        dailyXP[todayKey] += points;
    } else {
        dailyXP[todayKey] = points;
    }
    
    // تحديث الشارات
    let badges = userData.badges || [];
    
    if (newLevel >= 1 && !badges.includes('مبتدئ')) {
        badges.push('مبتدئ');
    }
    if (newLevel >= 10 && !badges.includes('نشيط')) {
        badges.push('نشيط');
    }
    if (newLevel >= 50 && !badges.includes('خبير')) {
        badges.push('خبير');
    }
    if (newLevel >= 100 && !badges.includes('أسطورة')) {
        badges.push('أسطورة');
    }
    
    if (userData.friends && Object.keys(userData.friends).length >= 10 && !badges.includes('اجتماعي')) {
        badges.push('اجتماعي');
    }
    
    await userRef.update({
        xp: newXP,
        level: newLevel,
        dailyXP: dailyXP,
        badges: badges
    });
    
    return { newXP, newLevel };
}

// تحديث الحالة (متصل/غير متصل)
function updateUserStatus(uid, status) {
    const userRef = database.ref(`users/${uid}`);
    const updates = {
        online: status,
        lastSeen: firebase.database.ServerValue.TIMESTAMP
    };
    
    if (status) {
        updates.lastActive = firebase.database.ServerValue.TIMESTAMP;
    }
    
    userRef.update(updates);
}

// عرض الإشعارات
function showNotification(title, body, icon) {
    if (Notification.permission === 'granted') {
        new Notification(title, { body, icon });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification(title, { body, icon });
            }
        });
    }
}

// تشغيل الصوت
function playSound(soundName) {
    const audio = new Audio(`https://www.soundjay.com/misc/sounds/${soundName}.mp3`);
    audio.play().catch(e => console.log('Sound playback failed:', e));
}

// عرض رسالة خطأ
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-toast';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

// عرض رسالة نجاح
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-toast';
    successDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// قائمة الإيموجيات
const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
    '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
    '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
    '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
    '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
    '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨',
    '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥',
    '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧',
    '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐'
];

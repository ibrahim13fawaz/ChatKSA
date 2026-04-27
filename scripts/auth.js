// ===============================
// 🔥 AUTH SYSTEM - FIXED VERSION
// ===============================

// تأكد من تعريف Firebase compat في HTML
// firebase.initializeApp(firebaseConfig)

let currentUser = null;
let currentUserData = null;

// ===============================
// 🔧 PROVIDERS
// ===============================
const googleProvider = new firebase.auth.GoogleAuthProvider();
const facebookProvider = new firebase.auth.FacebookAuthProvider();

// ===============================
// 🔥 HELPERS (FIXED)
// ===============================

function showLoading() {
    document.body.classList.add('loading');
}

function hideLoading() {
    document.body.classList.remove('loading');
}

function showError(msg) {
    alert(msg); // تقدر تستبدلها بتصميم toast
}

function showSuccess(msg) {
    alert(msg);
}

// ===============================
// 🔄 UI NAVIGATION (FIXED)
// ===============================
function showAuthScreen() {
    document.getElementById('authScreen')?.style && (
        document.getElementById('authScreen').style.display = 'block'
    );
}

function showCompleteProfileScreen() {
    document.getElementById('profileScreen')?.style && (
        document.getElementById('profileScreen').style.display = 'block'
    );
}

async function initializeApp() {
    console.log("App initialized");
    // ضع هنا تشغيل التطبيق الرئيسي
}

// ===============================
// 🟢 USER STATUS
// ===============================
async function updateUserStatus(uid, online) {
    try {
        await firebase.database().ref(`users/${uid}`).update({
            online: online,
            lastSeen: firebase.database.ServerValue.TIMESTAMP
        });
    } catch (e) {
        console.error(e);
    }
}

// ===============================
// 🔍 USERNAME CHECK
// ===============================
async function isUsernameUnique(username) {
    const snapshot = await firebase.database()
        .ref('users')
        .orderByChild('username')
        .equalTo(username)
        .once('value');

    return !snapshot.exists();
}

// ===============================
// 🆔 RANDOM ID
// ===============================
function generateRandomId() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ===============================
// 🔐 AUTH STATE
// ===============================
firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;

        try {
            const snap = await firebase.database()
                .ref(`users/${user.uid}`)
                .once('value');

            const data = snap.val();

            if (!data || !data.profileCompleted) {
                showCompleteProfileScreen();
            } else {
                currentUserData = data;
                await initializeApp();
                hideLoading();
            }
        } catch (err) {
            console.error(err);
            showError("حدث خطأ في تحميل البيانات");
            hideLoading();
        }
    } else {
        showAuthScreen();
        hideLoading();
    }
});

// ===============================
// 🔑 LOGIN
// ===============================
document.getElementById('loginBtn')?.addEventListener('click', async () => {
    const email = document.getElementById('loginEmail')?.value?.trim();
    const password = document.getElementById('loginPassword')?.value;

    if (!email) return showError('أدخل البريد الإلكتروني');
    if (!password) return showError('أدخل كلمة المرور');

    showLoading();

    try {
        await firebase.auth().signInWithEmailAndPassword(email, password);
        showSuccess('تم تسجيل الدخول');
    } catch (err) {
        showError(err.message);
    } finally {
        hideLoading();
    }
});

// ===============================
// 🆕 REGISTER
// ===============================
document.getElementById('registerBtn')?.addEventListener('click', async () => {
    const email = document.getElementById('registerEmail')?.value?.trim();
    const password = document.getElementById('registerPassword')?.value;
    const confirm = document.getElementById('confirmPassword')?.value;

    if (!email) return showError('أدخل البريد');
    if (!password) return showError('أدخل كلمة المرور');
    if (password !== confirm) return showError('كلمات المرور غير متطابقة');
    if (password.length < 6) return showError('كلمة المرور ضعيفة');

    showLoading();

    try {
        await firebase.auth().createUserWithEmailAndPassword(email, password);
        showSuccess('تم إنشاء الحساب');
    } catch (err) {
        showError(err.message);
    } finally {
        hideLoading();
    }
});

// ===============================
// 🌍 GOOGLE LOGIN
// ===============================
document.getElementById('googleLoginBtn')?.addEventListener('click', async () => {
    showLoading();
    try {
        await firebase.auth().signInWithPopup(googleProvider);
        showSuccess('تم تسجيل الدخول');
    } catch (err) {
        showError(err.message);
    } finally {
        hideLoading();
    }
});

// ===============================
// 📘 FACEBOOK LOGIN
// ===============================
document.getElementById('facebookLoginBtn')?.addEventListener('click', async () => {
    showLoading();
    try {
        await firebase.auth().signInWithPopup(facebookProvider);
        showSuccess('تم تسجيل الدخول');
    } catch (err) {
        showError(err.message);
    } finally {
        hideLoading();
    }
});

// ===============================
// 👤 COMPLETE PROFILE (FIXED)
// ===============================
document.getElementById('completeProfileBtn')?.addEventListener('click', async () => {
    const selected = document.querySelector('.avatar-option.selected');
    const gender = selected?.dataset.gender;
    const country = document.getElementById('countrySelect')?.value;
    const username = document.getElementById('usernameInput')?.value?.trim();

    if (!gender) return showError('اختر الجنس');
    if (!country) return showError('اختر الدولة');
    if (!username) return showError('أدخل اسم المستخدم');

    if (username.length < 3) return showError('اسم المستخدم قصير');
    if (username.length > 20) return showError('اسم المستخدم طويل');

    const valid = /^[a-zA-Z0-9_\u0600-\u06FF]+$/;
    if (!valid.test(username)) return showError('اسم غير صالح');

    showLoading();

    try {
        const unique = await isUsernameUnique(username);
        if (!unique) {
            hideLoading();
            return showError('اسم المستخدم مستخدم');
        }

        const userId = generateRandomId();

        const userData = {
            uid: currentUser.uid,
            username,
            avatar: gender === 'male' ? '👨' : '👩',
            gender,
            country,
            userId,
            xp: 0,
            level: 0,
            online: true,
            profileCompleted: true,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };

        await firebase.database().ref(`users/${currentUser.uid}`).set(userData);

        currentUserData = userData;

        showSuccess('تم إكمال الملف');

        setTimeout(() => {
            initializeApp();
        }, 1000);

    } catch (err) {
        showError(err.message);
    } finally {
        hideLoading();
    }
});

// ===============================
// 🚪 LOGOUT
// ===============================
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    if (!confirm('تسجيل الخروج؟')) return;

    showLoading();

    try {
        if (currentUser) {
            await updateUserStatus(currentUser.uid, false);
        }

        await firebase.auth().signOut();
        currentUser = null;
        currentUserData = null;

        showSuccess('تم تسجيل الخروج');
    } catch (err) {
        showError(err.message);
    } finally {
        hideLoading();
    }
});

// ===============================
// 🔁 SWITCH FORMS
// ===============================
document.getElementById('showRegister')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
});

document.getElementById('showLogin')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
});

// ===============================
// 🔍 LIVE USERNAME CHECK
// ===============================
let timeout;

document.getElementById('usernameInput')?.addEventListener('input', (e) => {
    clearTimeout(timeout);

    const value = e.target.value.trim();
    const error = document.getElementById('usernameError');

    if (!error) return;

    if (value.length < 3) {
        error.textContent = 'قصير جداً';
        return;
    }

    error.textContent = 'جاري التحقق...';

    timeout = setTimeout(async () => {
        const ok = await isUsernameUnique(value);
        error.textContent = ok ? 'متاح ✅' : 'مستخدم ❌';
    }, 400);
});

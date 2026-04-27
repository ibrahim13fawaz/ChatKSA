// تكوين Firebase - استبدل هذه البيانات بمشروعك الخاص
const firebaseConfig = {
  apiKey: "AIzaSyCXA1x9fJe6zPFo7yiK1kSRsoR89aSff5k",
  authDomain: "itchat-web-8c4ed.firebaseapp.com",
  databaseURL: "https://itchat-web-8c4ed-default-rtdb.firebaseio.com",
  projectId: "itchat-web-8c4ed",
  storageBucket: "itchat-web-8c4ed.firebasestorage.app",
  messagingSenderId: "787261764804",
  appId: "1:787261764804:web:7af9a924d03989b1dbc591",
  measurementId: "G-1KPE5B71QR"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);

// مراجع Firebase
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

// إعداد مزودي المصادقة
const googleProvider = new firebase.auth.GoogleAuthProvider();
const facebookProvider = new firebase.auth.FacebookAuthProvider();

// متغيرات عامة
let currentUser = null;
let currentUserData = null;
let currentRoom = 'public';
let currentPrivateChat = null;

// ========== نظام الأدمن العام ==========
// حساب الأدمن الرئيسي (غير قابل للتغيير)
const ADMIN_ACCOUNT = {
    email: "admin@chatksa.com",      // 👈 إيميل الأدمن
    password: "Admin@123456",         // 👈 باسورد الأدمن
    username: "مدير النظام",
    isSuperAdmin: true
};

// قائمة الأدمن الإضافيين (يمكن إضافتهم لاحقاً)
let SUPER_ADMINS = [];

// دالة التحقق من صلاحية الأدمن
async function isSuperAdmin(uid) {
    // التحقق من الحساب الرئيسي
    const currentUserEmail = auth.currentUser?.email;
    if (currentUserEmail === ADMIN_ACCOUNT.email) {
        return true;
    }
    
    // التحقق من قائمة الأدمن في قاعدة البيانات
    try {
        const snapshot = await database.ref(`super_admins/${uid}`).once('value');
        return snapshot.exists();
    } catch (error) {
        return false;
    }
}

// دالة إضافة أدمن جديد (لأصحاب الصلاحية فقط)
async function addNewAdmin(uid, username) {
    if (!await isSuperAdmin(auth.currentUser?.uid)) {
        showError("❌ ليس لديك صلاحية لإضافة أدمن");
        return false;
    }
    
    try {
        await database.ref(`super_admins/${uid}`).set({
            username: username,
            addedBy: auth.currentUser.uid,
            addedAt: firebase.database.ServerValue.TIMESTAMP
        });
        
        if (!SUPER_ADMINS.includes(uid)) {
            SUPER_ADMINS.push(uid);
        }
        
        showSuccess(`✅ تم إضافة ${username} كأدمن`);
        return true;
    } catch (error) {
        showError("❌ فشل إضافة الأدمن");
        return false;
    }
}

// دالة إزالة أدمن
async function removeAdmin(uid) {
    if (!await isSuperAdmin(auth.currentUser?.uid)) {
        showError("❌ ليس لديك صلاحية لإزالة أدمن");
        return false;
    }
    
    if (auth.currentUser?.uid === uid) {
        showError("❌ لا يمكن إزالة نفسك من قائمة الأدمن");
        return false;
    }
    
    try {
        await database.ref(`super_admins/${uid}`).remove();
        SUPER_ADMINS = SUPER_ADMINS.filter(id => id !== uid);
        showSuccess("✅ تم إزالة الأدمن");
        return true;
    } catch (error) {
        showError("❌ فشل إزالة الأدمن");
        return false;
    }
}

// جلب قائمة الأدمن من قاعدة البيانات
async function loadSuperAdmins() {
    try {
        const snapshot = await database.ref('super_admins').once('value');
        if (snapshot.exists()) {
            SUPER_ADMINS = Object.keys(snapshot.val());
        }
    } catch (error) {
        console.error("Error loading super admins:", error);
    }
}

// إنشاء حساب الأدمن تلقائياً إذا لم يكن موجوداً
async function ensureAdminAccount() {
    try {
        // محاولة تسجيل الدخول بحساب الأدمن
        try {
            await auth.signInWithEmailAndPassword(ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password);
            console.log("✅ حساب الأدمن موجود بالفعل");
            await auth.signOut(); // تسجيل خروج مؤقت
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                // إنشاء حساب الأدمن
                console.log("📝 جاري إنشاء حساب الأدمن...");
                const userCredential = await auth.createUserWithEmailAndPassword(ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password);
                
                // إنشاء بيانات الأدمن في قاعدة البيانات
                await database.ref(`users/${userCredential.user.uid}`).set({
                    uid: userCredential.user.uid,
                    username: ADMIN_ACCOUNT.username,
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
                    badges: ['مبتدئ', 'نشيط', 'خبير', 'أسطورة', 'مؤسس', 'مدير نظام'],
                    profileCompleted: true,
                    canChangeUsername: false,
                    bio: "👑 مدير النظام - جميع الصلاحيات",
                    dailyXP: {},
                    createdAt: firebase.database.ServerValue.TIMESTAMP,
                    isSystemAdmin: true
                });
                
                // إضافة الأدمن إلى قائمة الأدمن
                await database.ref(`super_admins/${userCredential.user.uid}`).set({
                    username: ADMIN_ACCOUNT.username,
                    role: "founder",
                    addedAt: firebase.database.ServerValue.TIMESTAMP
                });
                
                console.log("✅ تم إنشاء حساب الأدمن بنجاح!");
            }
        }
    } catch (error) {
        console.error("❌ خطأ في إنشاء حساب الأدمن:", error);
    }
}

// تنفيذ إنشاء حساب الأدمن عند تحميل الصفحة
setTimeout(() => {
    ensureAdminAccount();
    loadSuperAdmins();
}, 1000);

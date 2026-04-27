// تكوين Firebase - استبدل هذه البيانات بمشروعك الخاص
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
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

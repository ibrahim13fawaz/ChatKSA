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

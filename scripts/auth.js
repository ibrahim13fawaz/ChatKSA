// نظام التسجيل والمصادقة

// التحقق من حالة المستخدم
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        
        // التحقق من إكمال الملف الشخصي
        const userData = await database.ref(`users/${user.uid}`).once('value');
        
        if (!userData.exists() || !userData.val().profileCompleted) {
            showCompleteProfileScreen();
        } else {
            currentUserData = userData.val();
            await initializeApp();
        }
    } else {
        showAuthScreen();
    }
    
    hideLoadingScreen();
});

// تسجيل الدخول بالبريد الإلكتروني
document.getElementById('loginBtn')?.addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showError('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
        return;
    }
    
    showLoading();
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        showSuccess('تم تسجيل الدخول بنجاح');
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
});

// إنشاء حساب جديد
document.getElementById('registerBtn')?.addEventListener('click', async () => {
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!email || !password) {
        showError('الرجاء إدخال جميع البيانات');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('كلمة المرور غير متطابقة');
        return;
    }
    
    if (password.length < 6) {
        showError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        return;
    }
    
    showLoading();
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        showSuccess('تم إنشاء الحساب بنجاح');
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
});

// تسجيل الدخول بـ Google
document.getElementById('googleLoginBtn')?.addEventListener('click', async () => {
    showLoading();
    try {
        await auth.signInWithPopup(googleProvider);
        showSuccess('تم تسجيل الدخول بنجاح');
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
});

// تسجيل الدخول بـ Facebook
document.getElementById('facebookLoginBtn')?.addEventListener('click', async () => {
    showLoading();
    try {
        await auth.signInWithPopup(facebookProvider);
        showSuccess('تم تسجيل الدخول بنجاح');
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
});

// إكمال الملف الشخصي
document.getElementById('completeProfileBtn')?.addEventListener('click', async () => {
    const selectedGender = document.querySelector('.avatar-option.selected')?.dataset.gender;
    const country = document.getElementById('countrySelect').value;
    const username = document.getElementById('usernameInput').value;
    
    if (!selectedGender || !country || !username) {
        showError('الرجاء إكمال جميع البيانات');
        return;
    }
    
    if (!await isUsernameUnique(username)) {
        document.getElementById('usernameError').innerText = 'اسم المستخدم موجود بالفعل';
        return;
    }
    
    showLoading();
    
    const avatar = selectedGender === 'male' ? '👨' : '👩';
    const userId = generateRandomId();
    
    const userData = {
        uid: currentUser.uid,
        username: username,
        avatar: avatar,
        gender: selectedGender,
        country: country,
        userId: userId,
        level: 0,
        xp: 0,
        online: true,
        lastSeen: firebase.database.ServerValue.TIMESTAMP,
        friends: {},
        requests: {},
        badges: ['جديد'],
        profileCompleted: true,
        canChangeUsername: true,
        bio: '',
        dailyXP: {},
        createdAt: firebase.database.ServerValue.TIMESTAMP
    };
    
    try {
        await database.ref(`users/${currentUser.uid}`).set(userData);
        showSuccess('تم إكمال الملف الشخصي بنجاح');
        await initializeApp();
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
});

// تسجيل الخروج
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        showLoading();
        try {
            if (currentUser) {
                updateUserStatus(currentUser.uid, false);
            }
            await auth.signOut();
            showSuccess('تم تسجيل الخروج');
        } catch (error) {
            showError(error.message);
        } finally {
            hideLoading();
        }
    }
});

// التبديل بين نماذج التسجيل والدخول
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

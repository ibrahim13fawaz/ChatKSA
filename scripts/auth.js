// نظام التسجيل والمصادقة

// التحقق من حالة المستخدم
auth.onAuthStateChanged(async (user) => {
    console.log("Auth state changed:", user ? user.email : "No user");
    
    if (user) {
        currentUser = user;
        
        try {
            const userDataSnapshot = await database.ref(`users/${user.uid}`).once('value');
            const userData = userDataSnapshot.val();
            
            if (!userData || !userData.profileCompleted) {
                console.log("Profile not completed, showing completion screen");
                showCompleteProfileScreen();
            } else {
                console.log("User logged in:", userData.username);
                currentUserData = userData;
                await initializeApp();
            }
        } catch (error) {
            console.error("Error checking user:", error);
            showError("حدث خطأ، حاول مرة أخرى");
            showAuthScreen();
        }
    } else {
        showAuthScreen();
    }
    
    hideLoadingScreen();
});

// تسجيل الدخول بالبريد الإلكتروني
document.getElementById('loginBtn')?.addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email) {
        showError('الرجاء إدخال البريد الإلكتروني');
        return;
    }
    if (!password) {
        showError('الرجاء إدخال كلمة المرور');
        return;
    }
    
    showLoading();
    try {
        await auth.signInWithEmailAndPassword(email, password);
        showSuccess('تم تسجيل الدخول بنجاح');
    } catch (error) {
        let errorMessage = 'فشل تسجيل الدخول';
        if (error.code === 'auth/user-not-found') errorMessage = 'البريد الإلكتروني غير مسجل';
        else if (error.code === 'auth/wrong-password') errorMessage = 'كلمة المرور غير صحيحة';
        else if (error.code === 'auth/invalid-email') errorMessage = 'البريد الإلكتروني غير صالح';
        showError(errorMessage);
    } finally {
        hideLoading();
    }
});

// إنشاء حساب جديد
document.getElementById('registerBtn')?.addEventListener('click', async () => {
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!email) {
        showError('الرجاء إدخال البريد الإلكتروني');
        return;
    }
    if (!password) {
        showError('الرجاء إدخال كلمة المرور');
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
        await auth.createUserWithEmailAndPassword(email, password);
        showSuccess('تم إنشاء الحساب بنجاح');
    } catch (error) {
        let errorMessage = 'فشل إنشاء الحساب';
        if (error.code === 'auth/email-already-in-use') errorMessage = 'البريد الإلكتروني مستخدم بالفعل';
        else if (error.code === 'auth/invalid-email') errorMessage = 'البريد الإلكتروني غير صالح';
        else if (error.code === 'auth/weak-password') errorMessage = 'كلمة المرور ضعيفة، استخدم 6 أحرف على الأقل';
        showError(errorMessage);
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
        showError('فشل تسجيل الدخول بـ Google: ' + error.message);
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
        showError('فشل تسجيل الدخول بـ Facebook: ' + error.message);
    } finally {
        hideLoading();
    }
});// إكمال الملف الشخصي
document.getElementById('completeProfileBtn')?.addEventListener('click', async () => {
    const selectedGenderElement = document.querySelector('.avatar-option.selected');
    const selectedGender = selectedGenderElement?.dataset.gender;
    const country = document.getElementById('countrySelect').value;
    let username = document.getElementById('usernameInput').value.trim();
    
    if (!selectedGender) {
        showError('❌ الرجاء اختيار الجنس (ذكر/أنثى)');
        return;
    }
    if (!country) {
        showError('❌ الرجاء اختيار الدولة');
        return;
    }
    if (!username) {
        showError('❌ الرجاء إدخال اسم المستخدم');
        return;
    }
    if (username.length < 3) {
        showError('❌ اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
        return;
    }
    
    showLoading();
    
    const isUnique = await isUsernameUnique(username);
    if (!isUnique) {
        showError('❌ اسم المستخدم موجود بالفعل');
        hideLoading();
        return;
    }
    
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
        showSuccess('✅ تم إكمال الملف الشخصي بنجاح!');
        currentUserData = userData;
        await initializeApp();
    } catch (error) {
        showError('فشل إكمال الملف الشخصي: ' + error.message);
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
            showError('فشل تسجيل الخروج');
        } finally {
            hideLoading();
        }
    }
});

// التبديل بين النماذج
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

// التحقق المباشر من اسم المستخدم
let usernameCheckTimeout;
document.getElementById('usernameInput')?.addEventListener('input', async (e) => {
    clearTimeout(usernameCheckTimeout);
    const username = e.target.value.trim();
    const errorDiv = document.getElementById('usernameError');
    
    if (username.length < 3) {
        errorDiv.textContent = '⚠️ اسم المستخدم يجب أن يكون 3 أحرف على الأقل';
        return;
    }
    
    errorDiv.textContent = '🔄 جاري التحقق...';
    
    usernameCheckTimeout = setTimeout(async () => {
        const isUnique = await isUsernameUnique(username);
        if (!isUnique) {
            errorDiv.textContent = '❌ اسم المستخدم موجود بالفعل';
            errorDiv.style.color = '#ef4444';
        } else {
            errorDiv.textContent = '✅ اسم المستخدم متاح';
            errorDiv.style.color = '#10b981';
        }
    }, 500);
});

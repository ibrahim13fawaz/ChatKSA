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
});

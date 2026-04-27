// نظام التسجيل والمصادقة - النسخة المصححة

// التحقق من حالة المستخدم
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        
        try {
            // التحقق من إكمال الملف الشخصي
            const userDataSnapshot = await database.ref(`users/${user.uid}`).once('value');
            const userData = userDataSnapshot.val();
            
            if (!userData || !userData.profileCompleted) {
                // لم يكمل الملف الشخصي بعد
                showCompleteProfileScreen();
            } else {
                currentUserData = userData;
                await initializeApp();
                hideLoadingScreen();
            }
        } catch (error) {
            console.error("خطأ في التحقق من المستخدم:", error);
            showError("حدث خطأ، حاول مرة أخرى");
            hideLoadingScreen();
        }
    } else {
        showAuthScreen();
        hideLoadingScreen();
    }
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
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'البريد الإلكتروني غير مسجل';
                break;
            case 'auth/wrong-password':
                errorMessage = 'كلمة المرور غير صحيحة';
                break;
            case 'auth/invalid-email':
                errorMessage = 'البريد الإلكتروني غير صالح';
                break;
            default:
                errorMessage = error.message;
        }
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
    
    // التحقق من صحة المدخلات
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
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        showSuccess('تم إنشاء الحساب بنجاح');
        // سيتم نقله تلقائياً لشاشة إكمال الملف الشخصي
    } catch (error) {
        let errorMessage = 'فشل إنشاء الحساب';
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'البريد الإلكتروني مستخدم بالفعل';
                break;
            case 'auth/invalid-email':
                errorMessage = 'البريد الإلكتروني غير صالح';
                break;
            case 'auth/weak-password':
                errorMessage = 'كلمة المرور ضعيفة، استخدم 6 أحرف على الأقل';
                break;
            default:
                errorMessage = error.message;
        }
        showError(errorMessage);
    } finally {
        hideLoading();
    }
});

// تسجيل الدخول بـ Google
document.getElementById('googleLoginBtn')?.addEventListener('click', async () => {
    showLoading();
    try {
        const result = await auth.signInWithPopup(googleProvider);
        showSuccess('تم تسجيل الدخول بنجاح');
    } catch (error) {
        console.error("Google login error:", error);
        showError('فشل تسجيل الدخول بـ Google: ' + error.message);
    } finally {
        hideLoading();
    }
});

// تسجيل الدخول بـ Facebook
document.getElementById('facebookLoginBtn')?.addEventListener('click', async () => {
    showLoading();
    try {
        const result = await auth.signInWithPopup(facebookProvider);
        showSuccess('تم تسجيل الدخول بنجاح');
    } catch (error) {
        console.error("Facebook login error:", error);
        showError('فشل تسجيل الدخول بـ Facebook: ' + error.message);
    } finally {
        hideLoading();
    }
});

// إكمال الملف الشخصي - النسخة المصححة مع تحسينات
document.getElementById('completeProfileBtn')?.addEventListener('click', async () => {
    const selectedGenderElement = document.querySelector('.avatar-option.selected');
    const selectedGender = selectedGenderElement?.dataset.gender;
    const country = document.getElementById('countrySelect').value;
    let username = document.getElementById('usernameInput').value.trim();
    
    // التحقق من صحة البيانات مع رسائل واضحة
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
    
    if (username.length > 20) {
        showError('❌ اسم المستخدم يجب أن لا يتجاوز 20 حرف');
        return;
    }
    
    // التحقق من الأحرف المسموحة
    const validChars = /^[a-zA-Z0-9_\u0600-\u06FF]+$/;
    if (!validChars.test(username)) {
        showError('❌ اسم المستخدم يمكن أن يحتوي فقط على حروف وأرقام و underscore');
        return;
    }
    
    showLoading();
    
    // التحقق من اسم المستخدم الفريد
    const isUnique = await isUsernameUnique(username);
    if (!isUnique) {
        showError('❌ اسم المستخدم موجود بالفعل، الرجاء اختيار اسم آخر');
        document.getElementById('usernameInput').focus();
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
        showSuccess('✅ تم إكمال الملف الشخصي بنجاح! جاري تحويلك للتطبيق...');
        
        // تحديث المتغيرات
        currentUserData = userData;
        
        // تأخير بسيط قبل الانتقال
        setTimeout(async () => {
            await initializeApp();
        }, 1500);
        
    } catch (error) {
        console.error("Error completing profile:", error);
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
                await updateUserStatus(currentUser.uid, false);
            }
            await auth.signOut();
            showSuccess('تم تسجيل الخروج');
            // إعادة تعيين المتغيرات
            currentUser = null;
            currentUserData = null;
        } catch (error) {
            showError('فشل تسجيل الخروج: ' + error.message);
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
    // مسح الحقول
    document.getElementById('registerEmail').value = '';
    document.getElementById('registerPassword').value = '';
    document.getElementById('confirmPassword').value = '';
});

document.getElementById('showLogin')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    // مسح الحقول
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
});

// التحقق المباشر من اسم المستخدم أثناء الكتابة
let usernameCheckTimeout;
document.getElementById('usernameInput')?.addEventListener('input', async (e) => {
    clearTimeout(usernameCheckTimeout);
    const username = e.target.value.trim();
    const errorDiv = document.getElementById('usernameError');
    
    if (username.length < 3) {
        errorDiv.textContent = '⚠️ اسم المستخدم يجب أن يكون 3 أحرف على الأقل';
        errorDiv.style.color = '#f59e0b';
        return;
    }
    
    if (username.length > 20) {
        errorDiv.textContent = '⚠️ اسم المستخدم يجب أن لا يتجاوز 20 حرف';
        errorDiv.style.color = '#f59e0b';
        return;
    }
    
    errorDiv.textContent = '🔄 جاري التحقق...';
    errorDiv.style.color = '#4f46e5';
    
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

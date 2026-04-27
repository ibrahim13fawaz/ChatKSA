// تحسين دالة التحقق من اسم المستخدم الفريد
async function isUsernameUnique(username) {
    if (!username || username.length < 3) return false;
    
    try {
        const snapshot = await database.ref('users')
            .orderByChild('username')
            .equalTo(username)
            .once('value');
        return !snapshot.exists();
    } catch (error) {
        console.error("Error checking username:", error);
        return false;
    }
}

// تحسين دالة عرض الأخطاء
function showError(message) {
    // إزالة أي إشعار سابق
    const existingToast = document.querySelector('.error-toast');
    if (existingToast) existingToast.remove();
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-toast';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(errorDiv);
    
    // اهتزاز بسيط للتنبيه
    errorDiv.style.animation = 'shake 0.5s ease';
    
    setTimeout(() => {
        errorDiv.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => errorDiv.remove(), 300);
    }, 4000);
}

// تحسين دالة عرض النجاح
function showSuccess(message) {
    const existingToast = document.querySelector('.success-toast');
    if (existingToast) existingToast.remove();
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success-toast';
    successDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => successDiv.remove(), 300);
    }, 3000);
}

// إضافة تأثيرات جديدة للـ CSS
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(-50%) translateX(0); }
        25% { transform: translateX(-50%) translateX(-10px); }
        75% { transform: translateX(-50%) translateX(10px); }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    .error-toast, .success-toast {
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        border-radius: 12px;
        color: white;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10001;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        max-width: 90%;
        text-align: center;
    }
    
    .error-toast {
        background: linear-gradient(135deg, #ef4444, #dc2626);
    }
    
    .success-toast {
        background: linear-gradient(135deg, #10b981, #059669);
    }
    
    #usernameError {
        font-size: 12px;
        margin-top: -10px;
        margin-bottom: 15px;
        padding: 5px;
        transition: all 0.3s;
    }
    
    .profile-input:focus {
        outline: none;
        border-color: #4f46e5;
        box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
    }
    
    .profile-input.error {
        border-color: #ef4444;
        animation: shake 0.3s ease;
    }
`;
document.head.appendChild(additionalStyles);

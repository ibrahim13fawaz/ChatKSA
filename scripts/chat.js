// نظام الدردشة

let messagesListener = null;
let typingTimeout = null;

// تحميل رسائل الدردشة العامة
function loadPublicMessages() {
    if (messagesListener) {
        messagesListener.off();
    }
    
    const messagesRef = database.ref('messages/public');
    
    messagesListener = messagesRef.orderByChild('timestamp').limitToLast(100).on('child_added', (snapshot) => {
        const message = snapshot.val();
        displayMessage(message, snapshot.key);
    });
}

// عرض رسالة
function displayMessage(message, messageId) {
    const container = document.getElementById('publicMessages');
    const isOwn = message.senderId === currentUser.uid;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwn ? 'message-own' : ''}`;
    messageDiv.id = `msg-${messageId}`;
    
    const avatar = message.senderAvatar || '👤';
    const username = message.senderUsername || 'مستخدم';
    const time = formatTime(message.timestamp);
    
    messageDiv.innerHTML = `
        <img class="message-avatar" src="${avatar}" alt="avatar">
        <div class="message-content">
            <div class="message-header">
                <span class="message-username">${username}</span>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-text">${escapeHtml(message.text)}</div>
        </div>
    `;
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
    
    // تشغيل صوت الإشعار إذا لم تكن الرسالة من المستخدم
    if (!isOwn && !document.hasFocus()) {
        playSound('bell');
    }
}

// إرسال رسالة
async function sendMessage(roomId, text) {
    if (!text.trim()) return;
    
    const message = {
        senderId: currentUser.uid,
        senderUsername: currentUserData.username,
        senderAvatar: currentUserData.avatar,
        text: text.trim(),
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        type: 'text'
    };
    
    try {
        const messageRef = database.ref(`messages/${roomId}`).push();
        await messageRef.set(message);
        
        // تحديث النقاط
        await updateUserXP(currentUser.uid, 1);
        
        // مسح حقل الإدخال
        if (roomId === 'public') {
            document.getElementById('messageInput').value = '';
        } else if (roomId.startsWith('private_')) {
            document.getElementById('privateMessageInput').value = '';
        }
    } catch (error) {
        showError('فشل إرسال الرسالة: ' + error.message);
    }
}

// إرسال رسالة خاصة
async function sendPrivateMessage(chatId, text) {
    if (!text.trim() || !currentPrivateChat) return;
    
    const message = {
        senderId: currentUser.uid,
        senderUsername: currentUserData.username,
        senderAvatar: currentUserData.avatar,
        text: text.trim(),
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        read: false
    };
    
    try {
        const messageRef = database.ref(`privateChats/${chatId}`).push();
        await messageRef.set(message);
        
        // تحديث حالة القراءة للمرسل
        await database.ref(`privateChats/${chatId}/${messageRef.key}`).update({
            read: true
        });
        
        document.getElementById('privateMessageInput').value = '';
        
        // إشعار الطرف الآخر
        const receiverId = chatId.replace(currentUser.uid, '').replace('_', '');
        if (receiverId !== currentUser.uid) {
            const receiverData = await database.ref(`users/${receiverId}`).once('value');
            if (receiverData.val() && !document.hasFocus()) {
                showNotification(
                    `رسالة من ${currentUserData.username}`,
                    text,
                    currentUserData.avatar
                );
            }
        }
    } catch (error) {
        showError('فشل إرسال الرسالة: ' + error.message);
    }
}

// مؤشر الكتابة
function setupTypingIndicator(chatId, isPrivate = true) {
    const input = isPrivate ? 
        document.getElementById('privateMessageInput') : 
        document.getElementById('messageInput');
    
    if (!input) return;
    
    const typingRef = database.ref(`typing/${chatId}/${currentUser.uid}`);
    
    input.addEventListener('input', () => {
        typingRef.set(true);
        
        if (typingTimeout) clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            typingRef.remove();
        }, 1000);
    });
    
    input.addEventListener('blur', () => {
        typingRef.remove();
    });
}

// مراقبة مؤشر الكتابة في المحادثة الخاصة
function watchTypingIndicator(chatId) {
    const typingRef = database.ref(`typing/${chatId}`);
    
    typingRef.on('value', (snapshot) => {
        const typing = snapshot.val();
        const indicator = document.getElementById('privateTypingIndicator');
        
        if (typing) {
            const typingUsers = Object.keys(typing).filter(uid => uid !== currentUser.uid);
            if (typingUsers.length > 0) {
                indicator.textContent = 'يكتب...';
                indicator.style.display = 'block';
            } else {
                indicator.style.display = 'none';
            }
        } else {
            indicator.style.display = 'none';
        }
    });
}

// تحميل المحادثة الخاصة
async function loadPrivateChat(chatId, otherUser) {
    currentPrivateChat = chatId;
    
    const container = document.getElementById('privateMessages');
    container.innerHTML = '';
    
    // تحديث معلومات رأس المحادثة
    document.getElementById('privateChatUsername').textContent = otherUser.username;
    document.getElementById('privateChatAvatar').src = otherUser.avatar;
    
    // تحميل الرسائل
    const messagesRef = database.ref(`privateChats/${chatId}`);
    messagesRef.orderByChild('timestamp').on('child_added', (snapshot) => {
        const message = snapshot.val();
        displayPrivateMessage(message);
    });
    
    // إعداد مؤشر الكتابة
    setupTypingIndicator(chatId, true);
    watchTypingIndicator(chatId);
    
    // عرض نافذة المحادثة
    document.getElementById('privateChatOverlay').style.display = 'flex';
}

// عرض رسالة خاصة
function displayPrivateMessage(message) {
    const container = document.getElementById('privateMessages');
    const isOwn = message.senderId === currentUser.uid;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwn ? 'message-own' : ''}`;
    
    const time = formatTime(message.timestamp);
    
    messageDiv.innerHTML = `
        <img class="message-avatar" src="${message.senderAvatar}" alt="avatar">
        <div class="message-content">
            <div class="message-header">
                <span class="message-username">${message.senderUsername}</span>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-text">${escapeHtml(message.text)}</div>
            ${!isOwn && message.read ? '<i class="fas fa-check-double" style="font-size: 12px; color: var(--accent);"></i>' : ''}
        </div>
    `;
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

// إغلاق المحادثة الخاصة
document.getElementById('closePrivateChat')?.addEventListener('click', () => {
    currentPrivateChat = null;
    document.getElementById('privateChatOverlay').style.display = 'none';
    
    // إزالة المستمعين
    if (currentPrivateChat) {
        database.ref(`privateChats/${currentPrivateChat}`).off();
        database.ref(`typing/${currentPrivateChat}`).off();
    }
});

// إرسال رسالة عامة
document.getElementById('sendMessageBtn')?.addEventListener('click', () => {
    const message = document.getElementById('messageInput').value;
    sendMessage(currentRoom, message);
});

document.getElementById('messageInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const message = document.getElementById('messageInput').value;
        sendMessage(currentRoom, message);
    }
});

// إرسال رسالة خاصة
document.getElementById('sendPrivateMessageBtn')?.addEventListener('click', () => {
    if (currentPrivateChat) {
        const message = document.getElementById('privateMessageInput').value;
        sendPrivateMessage(currentPrivateChat, message);
    }
});

document.getElementById('privateMessageInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && currentPrivateChat) {
        const message = document.getElementById('privateMessageInput').value;
        sendPrivateMessage(currentPrivateChat, message);
    }
});

// تهيئة الإيموجيات
function initEmojiPicker() {
    const emojiPicker = document.getElementById('emojiPicker');
    const emojiBtn = document.getElementById('emojiBtn');
    const privateEmojiBtn = document.getElementById('privateEmojiBtn');
    
    emojiPicker.innerHTML = '';
    emojis.forEach(emoji => {
        const emojiSpan = document.createElement('span');
        emojiSpan.textContent = emoji;
        emojiSpan.style.cursor = 'pointer';
        emojiSpan.addEventListener('click', () => {
            const input = document.activeElement;
            if (input && (input.id === 'messageInput' || input.id === 'privateMessageInput')) {
                const start = input.selectionStart;
                const end = input.selectionEnd;
                const text = input.value;
                input.value = text.substring(0, start) + emoji + text.substring(end);
                input.focus();
                input.selectionStart = input.selectionEnd = start + emoji.length;
            }
            emojiPicker.style.display = 'none';
        });
        emojiPicker.appendChild(emojiSpan);
    });
    
    emojiBtn?.addEventListener('click', () => {
        emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'grid' : 'none';
    });
    
    privateEmojiBtn?.addEventListener('click', () => {
        emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'grid' : 'none';
    });
    
    // إغلاق منتقي الإيموجيات عند النقر خارجها
    document.addEventListener('click', (e) => {
        if (!emojiPicker.contains(e.target) && e.target !== emojiBtn && e.target !== privateEmojiBtn) {
            emojiPicker.style.display = 'none';
        }
    });
}

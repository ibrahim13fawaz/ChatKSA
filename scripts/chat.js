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
    if (!container) return;
    
    const isOwn = message.senderId === currentUser?.uid;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwn ? 'message-own' : ''}`;
    
    const time = formatTime(message.timestamp);
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${message.senderAvatar || '👤'}</div>
        <div class="message-content">
            <div class="message-header">
                <span class="message-username">${escapeHtml(message.senderUsername || 'مستخدم')}</span>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-text">${escapeHtml(message.text)}</div>
        </div>
    `;
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

// إرسال رسالة عامة
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
        await database.ref(`messages/${roomId}`).push(message);
        await updateUserXP(currentUser.uid, 1);
        
        if (roomId === 'public') {
            document.getElementById('messageInput').value = '';
        }
    } catch (error) {
        showError('فشل إرسال الرسالة');
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
        await database.ref(`privateChats/${chatId}`).push(message);
        document.getElementById('privateMessageInput').value = '';
    } catch (error) {
        showError('فشل إرسال الرسالة');
    }
}

// أحداث الإرسال
document.getElementById('sendMessageBtn')?.addEventListener('click', () => {
    const message = document.getElementById('messageInput').value;
    sendMessage(currentRoom, message);
});

document.getElementById('messageInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage(currentRoom, e.target.value);
    }
});

document.getElementById('sendPrivateMessageBtn')?.addEventListener('click', () => {
    if (currentPrivateChat) {
        sendPrivateMessage(currentPrivateChat, document.getElementById('privateMessageInput').value);
    }
});

// تهيئة الإيموجيات
function initEmojiPicker() {
    const emojiPicker = document.getElementById('emojiPicker');
    const emojiBtn = document.getElementById('emojiBtn');
    
    if (!emojiPicker || !emojiBtn) return;
    
    emojiPicker.innerHTML = '';
    emojis.forEach(emoji => {
        const emojiSpan = document.createElement('span');
        emojiSpan.textContent = emoji;
        emojiSpan.style.cursor = 'pointer';
        emojiSpan.onclick = () => {
            const input = document.getElementById('messageInput');
            if (input) {
                input.value += emoji;
                input.focus();
            }
            emojiPicker.style.display = 'none';
        };
        emojiPicker.appendChild(emojiSpan);
    });
    
    emojiBtn.onclick = () => {
        emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'grid' : 'none';
    };
    
    document.addEventListener('click', (e) => {
        if (!emojiPicker.contains(e.target) && e.target !== emojiBtn) {
            emojiPicker.style.display = 'none';
        }
    });
}

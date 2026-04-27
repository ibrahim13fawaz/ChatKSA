// نظام إدارة الغرف

let roomsListener = null;
let roomUsersListener = null;

// إنشاء غرفة جديدة
async function createRoom(roomName, roomImage) {
    if (!roomName) {
        showError('الرجاء إدخال اسم الغرفة');
        return;
    }
    
    const roomId = database.ref('rooms').push().key;
    const roomData = {
        id: roomId,
        name: roomName,
        image: roomImage || '🏠',
        ownerId: currentUser.uid,
        admins: [currentUser.uid],
        bannedUsers: {},
        createdAt: firebase.database.ServerValue.TIMESTAMP
    };
    
    try {
        await database.ref(`rooms/${roomId}`).set(roomData);
        showSuccess('تم إنشاء الغرفة بنجاح');
        closeCreateRoomModal();
        loadRooms();
    } catch (error) {
        showError('فشل إنشاء الغرفة: ' + error.message);
    }
}

// تحميل قائمة الغرف
function loadRooms() {
    if (roomsListener) {
        roomsListener.off();
    }
    
    const roomsRef = database.ref('rooms');
    const container = document.getElementById('roomsList');
    
    roomsListener = roomsRef.on('value', (snapshot) => {
        container.innerHTML = '';
        
        const rooms = snapshot.val();
        if (rooms) {
            Object.values(rooms).forEach(room => {
                displayRoom(room);
            });
        }
    });
}

// عرض الغرفة في القائمة
function displayRoom(room) {
    const container = document.getElementById('roomsList');
    
    const roomDiv = document.createElement('div');
    roomDiv.className = 'room-item';
    roomDiv.onclick = () => joinRoom(room.id);
    
    roomDiv.innerHTML = `
        <div class="room-image">${room.image}</div>
        <div class="room-info">
            <div class="room-name">${escapeHtml(room.name)}</div>
            <div class="room-meta">
                <span class="room-members">
                    <i class="fas fa-user"></i>
                    <span id="roomCount-${room.id}">0</span>
                </span>
            </div>
        </div>
        ${room.ownerId === currentUser.uid ? '<i class="fas fa-crown" style="color: var(--warning);"></i>' : ''}
    `;
    
    container.appendChild(roomDiv);
    
    // مراقبة عدد المتواجدين في الغرفة
    monitorRoomUsers(room.id);
}

// مراقبة مستخدمي الغرفة
function monitorRoomUsers(roomId) {
    const usersRef = database.ref(`rooms/${roomId}/usersOnline`);
    
    usersRef.on('value', (snapshot) => {
        const count = snapshot.numChildren();
        const countElement = document.getElementById(`roomCount-${roomId}`);
        if (countElement) {
            countElement.textContent = count;
        }
    });
}

// الانضمام إلى غرفة
async function joinRoom(roomId) {
    // التحقق من عدم الحظر
    const roomSnapshot = await database.ref(`rooms/${roomId}`).once('value');
    const room = roomSnapshot.val();
    
    if (room.bannedUsers && room.bannedUsers[currentUser.uid]) {
        showError('لقد تم حظرك من هذه الغرفة');
        return;
    }
    
    // مغادرة الغرفة الحالية
    if (currentRoom !== 'public') {
        await database.ref(`rooms/${currentRoom}/usersOnline/${currentUser.uid}`).remove();
    }
    
    currentRoom = roomId;
    
    // الانضمام إلى الغرفة الجديدة
    await database.ref(`rooms/${currentRoom}/usersOnline/${currentUser.uid}`).set({
        username: currentUserData.username,
        joinedAt: firebase.database.ServerValue.TIMESTAMP
    });
    
    // إرسال رسالة دخول
    const joinMessage = {
        senderId: 'system',
        senderUsername: 'النظام',
        text: `🚪 دخل: ${currentUserData.username}`,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        type: 'system'
    };
    
    // إذا كان المستوى 100 (أدمن)
    if (currentUserData.level >= 100) {
        joinMessage.text = `🔥 دخول أسطوري: ${currentUserData.username}`;
        joinMessage.type = 'legendary';
    }
    
    await database.ref(`messages/${currentRoom}`).push(joinMessage);
    
    // تحميل رسائل الغرفة
    if (messagesListener) {
        messagesListener.off();
    }
    loadRoomMessages(currentRoom);
    
    // تحديث واجهة الدردشة
    document.querySelector('[data-view="chat"]').click();
    
    showSuccess(`انضممت إلى غرفة ${room.name}`);
}

// تحميل رسائل الغرفة
function loadRoomMessages(roomId) {
    const messagesRef = database.ref(`messages/${roomId}`);
    
    messagesListener = messagesRef.orderByChild('timestamp').limitToLast(100).on('child_added', (snapshot) => {
        const message = snapshot.val();
        
        if (message.type === 'system') {
            displaySystemMessage(message);
        } else if (message.type === 'legendary') {
            displayLegendaryMessage(message);
        } else {
            displayMessage(message, snapshot.key);
        }
    });
}

// عرض رسالة نظام
function displaySystemMessage(message) {
    const container = document.getElementById('publicMessages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'system-message';
    messageDiv.textContent = message.text;
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

// عرض رسالة أسطورية
function displayLegendaryMessage(message) {
    const container = document.getElementById('publicMessages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'legendary-message';
    messageDiv.innerHTML = `
        <i class="fas fa-crown"></i>
        <span>${message.text}</span>
        <i class="fas fa-crown"></i>
    `;
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

// حظر مستخدم من الغرفة
async function banUserFromRoom(roomId, userId) {
    const roomSnapshot = await database.ref(`rooms/${roomId}`).once('value');
    const room = roomSnapshot.val();
    
    // التحقق من الصلاحيات
    if (room.ownerId !== currentUser.uid && !room.admins.includes(currentUser.uid)) {
        showError('ليس لديك صلاحية لحظر المستخدمين');
        return;
    }
    
    await database.ref(`rooms/${roomId}/bannedUsers/${userId}`).set(true);
    await database.ref(`rooms/${roomId}/usersOnline/${userId}`).remove();
    
    showSuccess('تم حظر المستخدم بنجاح');
}

// طرد مستخدم من الغرفة
async function kickUserFromRoom(roomId, userId) {
    const roomSnapshot = await database.ref(`rooms/${roomId}`).once('value');
    const room = roomSnapshot.val();
    
    if (room.ownerId !== currentUser.uid && !room.admins.includes(currentUser.uid)) {
        showError('ليس لديك صلاحية لطرد المستخدمين');
        return;
    }
    
    await database.ref(`rooms/${roomId}/usersOnline/${userId}`).remove();
    showSuccess('تم طرد المستخدم بنجاح');
}

// تعيين مشرف
async function setAdmin(roomId, userId) {
    const roomSnapshot = await database.ref(`rooms/${roomId}`).once('value');
    const room = roomSnapshot.val();
    
    if (room.ownerId !== currentUser.uid) {
        showError('فقط مالك الغرفة يمكنه تعيين مشرفين');
        return;
    }
    
    const admins = room.admins || [];
    if (!admins.includes(userId)) {
        admins.push(userId);
        await database.ref(`rooms/${roomId}/admins`).set(admins);
        showSuccess('تم تعيين المشرف بنجاح');
    }
}

// حذف رسالة
async function deleteMessage(roomId, messageId) {
    const roomSnapshot = await database.ref(`rooms/${roomId}`).once('value');
    const room = roomSnapshot.val();
    const messageSnapshot = await database.ref(`messages/${roomId}/${messageId}`).once('value');
    const message = messageSnapshot.val();
    
    // التحقق من الصلاحيات
    const canDelete = room.ownerId === currentUser.uid || 
                     room.admins.includes(currentUser.uid) ||
                     message.senderId === currentUser.uid;
    
    if (!canDelete) {
        showError('ليس لديك صلاحية لحذف هذه الرسالة');
        return;
    }
    
    await database.ref(`messages/${roomId}/${messageId}`).remove();
    showSuccess('تم حذف الرسالة');
}

// إظهار نموذج إنشاء غرفة
document.getElementById('createRoomBtn')?.addEventListener('click', () => {
    document.getElementById('createRoomModal').style.display = 'flex';
});

document.getElementById('confirmCreateRoom')?.addEventListener('click', () => {
    const roomName = document.getElementById('roomName').value;
    const roomImage = document.getElementById('roomImage').value;
    createRoom(roomName, roomImage);
});

document.getElementById('cancelCreateRoom')?.addEventListener('click', closeCreateRoomModal);

function closeCreateRoomModal() {
    document.getElementById('createRoomModal').style.display = 'none';
    document.getElementById('roomName').value = '';
    document.getElementById('roomImage').value = '';
}

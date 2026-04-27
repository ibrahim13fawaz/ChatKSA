// نظام إدارة الغرف

let roomsListener = null;

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
        showError('فشل إنشاء الغرفة');
    }
}

// تحميل قائمة الغرف
function loadRooms() {
    if (roomsListener) {
        roomsListener.off();
    }
    
    const roomsRef = database.ref('rooms');
    const container = document.getElementById('roomsList');
    if (!container) return;
    
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

// عرض الغرفة
function displayRoom(room) {
    const container = document.getElementById('roomsList');
    if (!container) return;
    
    const roomDiv = document.createElement('div');
    roomDiv.className = 'room-item';
    roomDiv.onclick = () => joinRoom(room.id);
    
    roomDiv.innerHTML = `
        <div class="room-image">${room.image}</div>
        <div class="room-info">
            <div class="room-name">${escapeHtml(room.name)}</div>
            <div class="room-meta">${room.ownerId === currentUser?.uid ? '👑 مالك' : ''}</div>
        </div>
    `;
    
    container.appendChild(roomDiv);
}

// الانضمام إلى غرفة
async function joinRoom(roomId) {
    const roomSnapshot = await database.ref(`rooms/${roomId}`).once('value');
    const room = roomSnapshot.val();
    
    if (room?.bannedUsers?.[currentUser.uid]) {
        showError('لقد تم حظرك من هذه الغرفة');
        return;
    }
    
    if (currentRoom !== 'public') {
        await database.ref(`rooms/${currentRoom}/usersOnline/${currentUser.uid}`).remove();
    }
    
    currentRoom = roomId;
    await database.ref(`rooms/${currentRoom}/usersOnline/${currentUser.uid}`).set({
        username: currentUserData.username,
        joinedAt: firebase.database.ServerValue.TIMESTAMP
    });
    
    const joinMessage = {
        senderId: 'system',
        senderUsername: 'النظام',
        text: `🚪 دخل: ${currentUserData.username}`,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        type: 'system'
    };
    
    await database.ref(`messages/${currentRoom}`).push(joinMessage);
    
    if (messagesListener) messagesListener.off();
    loadPublicMessages();
    
    document.querySelector('[data-view="chat"]').click();
    showSuccess(`انضممت إلى ${room.name}`);
}

// أحداث نموذج إنشاء الغرفة
document.getElementById('createRoomBtn')?.addEventListener('click', () => {
    document.getElementById('createRoomModal').style.display = 'flex';
});

document.getElementById('confirmCreateRoom')?.addEventListener('click', () => {
    createRoom(document.getElementById('roomName').value, document.getElementById('roomImage').value);
});

document.getElementById('cancelCreateRoom')?.addEventListener('click', closeCreateRoomModal);

function closeCreateRoomModal() {
    document.getElementById('createRoomModal').style.display = 'none';
    document.getElementById('roomName').value = '';
    document.getElementById('roomImage').value = '';
}

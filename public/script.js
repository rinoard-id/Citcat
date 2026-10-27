const socket = io();

let myUsername = '';
let activeRecipient = null;
const conversations = {}; // username -> { messages: [], online: boolean, avatar: string, unread: 0 }
let pendingRequests = [];

socket.on('connect', () => {
  const savedUsername = localStorage.getItem('citcat_username');
  const savedPassword = localStorage.getItem('citcat_password');
  if (savedUsername && savedPassword) {
    socket.emit('register-username', { username: savedUsername, password: savedPassword }, (res) => {
      if (res.success) {
        myUsername = res.username;
        if (myUsernameEl) myUsernameEl.textContent = myUsername;
        if (loginOverlay && loginOverlay.style.display !== 'none') {
          loginOverlay.style.display = 'none';
        }
      }
    });
  }
});

// Contact requests UI elements
const pendingRequestsContainer = document.getElementById('pending-requests-container');
const pendingRequestsList = document.getElementById('pending-requests-list');
const pendingCount = document.getElementById('pending-count');

function renderPendingRequests() {
  if (!pendingRequestsList) return;
  pendingRequestsList.innerHTML = '';
  if (pendingRequests.length === 0) {
    if (pendingRequestsContainer) pendingRequestsContainer.style.display = 'none';
    return;
  }
  if (pendingRequestsContainer) pendingRequestsContainer.style.display = 'block';
  if (pendingCount) pendingCount.textContent = pendingRequests.length;

  pendingRequests.forEach((req) => {
    const item = document.createElement('div');
    item.style.cssText = 'display: flex; align-items: center; justify-content: space-between; background: white; padding: 8px 12px; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);';
    
    const left = document.createElement('div');
    left.style.cssText = 'display: flex; align-items: center; gap: 10px;';
    
    const av = document.createElement('div');
    av.className = 'avatar small';
    if (req.avatar) {
      av.style.backgroundImage = `url(${req.avatar})`;
      av.textContent = '';
    } else {
      av.textContent = req.username.charAt(0).toUpperCase();
    }
    
    const nameEl = document.createElement('span');
    nameEl.style.cssText = 'font-weight: 600; font-size: 0.95rem; color: var(--ios-text-dark);';
    nameEl.textContent = req.username;
    
    left.appendChild(av);
    left.appendChild(nameEl);

    const right = document.createElement('div');
    right.style.cssText = 'display: flex; gap: 6px;';

    const acceptBtn = document.createElement('button');
    acceptBtn.className = 'call-btn accept';
    acceptBtn.style.cssText = 'width: auto; height: 28px; padding: 0 10px; font-size: 0.8rem; border-radius: 6px;';
    acceptBtn.innerHTML = '<i class="fa-solid fa-check"></i> Terima';
    acceptBtn.onclick = () => {
      socket.emit('approve-contact', { requesterUsername: req.username }, (res) => {
        if (res.success) {
          pendingRequests = pendingRequests.filter(r => r.username !== req.username);
          renderPendingRequests();
          if (res.user) {
            const u = res.user;
            if (!conversations[u.username]) {
              conversations[u.username] = {
                messages: [],
                online: u.online === 1,
                avatar: u.avatar,
                unread: 0
              };
            }
            renderConversations();
            openChat(u.username);
          }
        } else {
          alert(res.error || 'Gagal menyetujui kontak.');
        }
      });
    };

    const rejectBtn = document.createElement('button');
    rejectBtn.className = 'call-btn reject';
    rejectBtn.style.cssText = 'width: auto; height: 28px; padding: 0 10px; font-size: 0.8rem; border-radius: 6px;';
    rejectBtn.innerHTML = '<i class="fa-solid fa-xmark"></i> Tolak';
    rejectBtn.onclick = () => {
      socket.emit('reject-contact', { requesterUsername: req.username }, (res) => {
        if (res.success) {
          pendingRequests = pendingRequests.filter(r => r.username !== req.username);
          renderPendingRequests();
        } else {
          alert(res.error || 'Gagal menolak kontak.');
        }
      });
    };

    right.appendChild(acceptBtn);
    right.appendChild(rejectBtn);

    item.appendChild(left);
    item.appendChild(right);
    pendingRequestsList.appendChild(item);
  });
}

socket.on('contact-request', ({ username, avatar }) => {
  if (!pendingRequests.some(r => r.username === username)) {
    pendingRequests.push({ username, online: 1, avatar });
    renderPendingRequests();
  }
});

socket.on('contact-approved', ({ username, avatar }) => {
  if (!conversations[username]) {
    conversations[username] = {
      messages: [],
      online: true,
      avatar,
      unread: 0
    };
    renderConversations();
    alert(`Permintaan kontak Anda ke ${username} telah disetujui!`);
  }
});

// DOM Elements
const loginOverlay = document.getElementById('login-overlay');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');
const loginError = document.getElementById('login-error');

const myUsernameEl = document.getElementById('my-username');
const myAvatarEl = document.getElementById('my-avatar');
const avatarFileInput = document.getElementById('avatar-file-input');

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchResultBox = document.getElementById('search-result-box');
const foundUsername = document.getElementById('found-username');
const addContactBtn = document.getElementById('add-contact-btn');
const searchError = document.getElementById('search-error');

const conversationListEl = document.getElementById('conversation-list');
const chatEmptyState = document.getElementById('chat-empty-state');
const chatBox = document.getElementById('chat-box');
const activeUsernameEl = document.getElementById('active-username');
const activeStatusEl = document.getElementById('active-status');
const activeAvatarEl = document.getElementById('active-avatar');
const messagesScroll = document.getElementById('messages-scroll');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const emojiBtn = document.getElementById('emoji-btn');
const emojiPicker = document.getElementById('emoji-picker');
const stickerBtn = document.getElementById('sticker-btn');
const stickerPicker = document.getElementById('sticker-picker');
const stickersTabPane = document.getElementById('stickers-tab');
const gifsTabPane = document.getElementById('gifs-tab');
const attachBtn = document.getElementById('attach-btn');
const attachmentMenu = document.getElementById('attachment-menu');
const cameraInput = document.getElementById('camera-input');
const galleryInput = document.getElementById('gallery-input');
const documentInput = document.getElementById('document-input');
const btnCamera = document.getElementById('btn-camera');
const btnGallery = document.getElementById('btn-gallery');
const btnDocument = document.getElementById('btn-document');
const btnLocation = document.getElementById('btn-location');
const backBtn = document.getElementById('back-btn');
const sidebar = document.getElementById('sidebar');
const chatArea = document.getElementById('chat-area');
const logoutBtn = document.getElementById('logout-btn');

// Call DOM elements
const audioCallBtn = document.getElementById('audio-call-btn');
const videoCallBtn = document.getElementById('video-call-btn');
const callOverlay = document.getElementById('call-overlay');
const callPeerAvatar = document.getElementById('call-peer-avatar');
const callPeerName = document.getElementById('call-peer-name');
const callStatusText = document.getElementById('call-status-text');
const callMediaContainer = document.getElementById('call-media-container');
const remoteVideo = document.getElementById('remote-video');
const localVideo = document.getElementById('local-video');
const callAcceptBtn = document.getElementById('call-accept-btn');
const callRejectBtn = document.getElementById('call-reject-btn');

// Broadcast DOM elements
const broadcastBtn = document.getElementById('broadcast-btn');
const broadcastModal = document.getElementById('broadcast-modal');
const broadcastText = document.getElementById('broadcast-text');
const broadcastSendBtn = document.getElementById('broadcast-send-btn');
const broadcastCloseBtn = document.getElementById('broadcast-close-btn');

// Trash DOM elements
const trashBtn = document.getElementById('trash-btn');
const trashModal = document.getElementById('trash-modal');
const trashList = document.getElementById('trash-list');
const trashCloseBtn = document.getElementById('trash-close-btn');

// Contact Info DOM elements
const chatContactInfo = document.getElementById('chat-contact-info');
const contactInfoModal = document.getElementById('contact-info-modal');
const infoAvatar = document.getElementById('info-avatar');
const infoUsername = document.getElementById('info-username');
const infoStatus = document.getElementById('info-status');
const infoMediaGallery = document.getElementById('info-media-gallery');
const infoCloseBtn = document.getElementById('info-close-btn');

// Chat Menu Dropdown elements
const chatMenuBtn = document.getElementById('chat-menu-btn');
const chatDropdownMenu = document.getElementById('chat-dropdown-menu');
const menuViewProfile = document.getElementById('menu-view-profile');
const menuClearChat = document.getElementById('menu-clear-chat');
const menuViewTrash = document.getElementById('menu-view-trash');

const headerNotifBtn = document.getElementById('header-notif-btn');
if (headerNotifBtn) {
  headerNotifBtn.addEventListener('click', () => {
    const chatTabBtn = document.querySelector('.sidebar-tab[data-target="chat-tab-pane"]');
    if (chatTabBtn) chatTabBtn.click();
  });
}

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('citcat_username');
  localStorage.removeItem('citcat_password');
  localStorage.removeItem('citcat_avatar');
  window.location.reload();
});

// Check localStorage for previous session & avatar
const savedUsername = localStorage.getItem('citcat_username');
const savedPassword = localStorage.getItem('citcat_password');
const savedAvatar = localStorage.getItem('citcat_avatar');

if (savedAvatar) {
  myAvatarEl.style.backgroundImage = `url(${savedAvatar})`;
  myAvatarEl.textContent = '';
}

if (savedUsername && savedPassword) {
  loginWithCredentials(savedUsername, savedPassword);
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  if (username.length < 2) {
    loginError.textContent = 'Username minimal 2 karakter.';
    return;
  }
  if (password.length < 4) {
    loginError.textContent = 'Password minimal 4 karakter.';
    return;
  }
  loginWithCredentials(username, password);
});

function loginWithCredentials(username, password) {
  socket.emit('register-username', { username, password }, (response) => {
    if (response.success) {
      myUsername = response.username;
      localStorage.setItem('citcat_username', myUsername);
      localStorage.setItem('citcat_password', password);
      myUsernameEl.textContent = myUsername;

      if (response.avatar) {
        myAvatarEl.style.backgroundImage = `url(${response.avatar})`;
        myAvatarEl.textContent = '';
        localStorage.setItem('citcat_avatar', response.avatar);
      } else if (savedAvatar) {
        myAvatarEl.style.backgroundImage = `url(${savedAvatar})`;
        myAvatarEl.textContent = '';
      } else {
        myAvatarEl.style.backgroundImage = '';
        myAvatarEl.textContent = myUsername.charAt(0).toUpperCase();
      }

      loginOverlay.style.display = 'none';

      // Clear existing conversations strictly
      Object.keys(conversations).forEach(k => delete conversations[k]);

      response.users.forEach((u) => {
        conversations[u.username] = {
          messages: [],
          online: u.online === 1,
          avatar: u.avatar,
          unread: 0
        };
      });
      pendingRequests = response.pendingRequests || [];
      renderConversations();
      renderPendingRequests();
    } else {
      loginError.textContent = response.error || 'Gagal masuk.';
    }
  });
}

// Open My Profile Modal on avatar click
if (myAvatarEl) {
  myAvatarEl.addEventListener('click', (e) => {
    e.stopPropagation();
    openMyProfile();
  });
}

avatarFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    const avatarUrl = evt.target.result;
    myAvatarEl.style.backgroundImage = `url(${avatarUrl})`;
    myAvatarEl.textContent = '';
    const myProfileAvatarEl = document.getElementById('my-profile-avatar');
    if (myProfileAvatarEl) {
      myProfileAvatarEl.style.backgroundImage = `url(${avatarUrl})`;
      myProfileAvatarEl.textContent = '';
    }
    localStorage.setItem('citcat_avatar', avatarUrl);
    socket.emit('update-avatar', { avatar: avatarUrl }, (res) => {
      if (!res.success) {
        console.error('Failed to update avatar');
      }
    });
  };
  reader.readAsDataURL(file);
  e.target.value = '';
});

socket.on('user-avatar-updated', ({ username, avatar }) => {
  if (conversations[username]) {
    conversations[username].avatar = avatar;
    renderConversations();
  }
  if (activeRecipient === username) {
    activeAvatarEl.style.backgroundImage = avatar ? `url(${avatar})` : '';
    activeAvatarEl.textContent = avatar ? '' : username.charAt(0).toUpperCase();
  }
});

// Search user (Does NOT auto-add contact, shows Add Contact button)
let searchedUser = null;

searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const targetUsername = searchInput.value.trim();
  searchError.textContent = '';
  searchResultBox.style.display = 'none';

  if (!targetUsername) return;
  if (targetUsername === myUsername) {
    searchError.textContent = 'Tidak dapat mencari username sendiri.';
    return;
  }

  socket.emit('search-user', { targetUsername }, (response) => {
    if (response.success) {
      searchedUser = response.user;
      foundUsername.textContent = searchedUser.username;
      searchResultBox.style.display = 'flex';
    } else {
      searchError.textContent = response.error || 'Pengguna tidak ditemukan.';
    }
  });
});

addContactBtn.addEventListener('click', () => {
  if (!searchedUser) return;
  socket.emit('add-contact', { username: myUsername, targetUsername: searchedUser.username }, (res) => {
    searchResultBox.style.display = 'none';
    searchInput.value = '';
    if (res.success) {
      if (res.user) {
        const u = res.user;
        if (!conversations[u.username]) {
          conversations[u.username] = {
            messages: [],
            online: u.online === 1,
            avatar: u.avatar,
            unread: 0
          };
        }
        renderConversations();
        alert(`Kontak ${u.username} berhasil terhubung!`);
        openChat(u.username);
      } else {
        alert(res.message || `Permintaan kontak berhasil dikirim ke ${searchedUser.username} (Menunggu persetujuan).`);
      }
    } else {
      alert(res.error || 'Gagal mengirim permintaan kontak.');
    }
  });
});

// Open chat with a recipient
function openChat(username) {
  activeRecipient = username;
  if (!conversations[username]) {
    conversations[username] = {
      messages: [],
      online: true,
      avatar: null,
      unread: 0
    };
  }
  conversations[username].unread = 0;

  chatEmptyState.style.display = 'none';
  chatBox.style.display = 'flex';
  activeUsernameEl.textContent = username;

  const conv = conversations[username];
  if (conv.avatar) {
    activeAvatarEl.style.backgroundImage = `url(${conv.avatar})`;
    activeAvatarEl.textContent = '';
  } else {
    activeAvatarEl.style.backgroundImage = '';
    activeAvatarEl.textContent = username.charAt(0).toUpperCase();
  }

  const isOnline = conv.online;
  activeStatusEl.textContent = isOnline ? 'online' : 'offline';
  activeStatusEl.className = `status-sub ${isOnline ? 'online' : ''}`;

  // Responsive mobile view
  if (window.innerWidth <= 768) {
    sidebar.classList.add('hidden');
    chatArea.classList.add('active');
  }

  renderConversations();

  // Fetch message history
  socket.emit('get-history', { targetUsername: username }, (history) => {
    conversations[username].messages = history || [];
    renderMessages();
    markMessagesRead(username);
  });
}

// Back button on mobile
backBtn.addEventListener('click', () => {
  sidebar.classList.remove('hidden');
  chatArea.classList.remove('active');
  activeRecipient = null;
});

// Render conversation list in sidebar
function renderConversations() {
  const usernames = Object.keys(conversations);

  const totalUnread = Object.values(conversations).reduce((sum, c) => sum + (c.unread || 0), 0);
  const chatTabBadge = document.getElementById('chat-tab-badge');
  const headerNotifBadge = document.getElementById('header-notif-badge');

  if (chatTabBadge) {
    chatTabBadge.textContent = totalUnread;
    chatTabBadge.style.display = totalUnread > 0 ? 'inline-block' : 'none';
  }
  if (headerNotifBadge) {
    headerNotifBadge.textContent = totalUnread;
    headerNotifBadge.style.display = totalUnread > 0 ? 'flex' : 'none';
  }

  if (usernames.length === 0) {
    conversationListEl.innerHTML = '<li class="no-conversations">Belum ada kontak. Cari & tambah username di atas.</li>';
    return;
  }

  conversationListEl.innerHTML = '';
  usernames.forEach((username) => {
    const conv = conversations[username];
    const lastMsg = conv.messages[conv.messages.length - 1];
    const preview = lastMsg ? lastMsg.message : 'Mulai percakapan...';
    const timeStr = lastMsg ? formatTime(lastMsg.timestamp) : '';

    const avatarHtml = conv.avatar
      ? `<div class="avatar small" style="background-image: url(${conv.avatar});"></div>`
      : `<div class="avatar small">${username.charAt(0).toUpperCase()}</div>`;

    const li = document.createElement('li');
    li.className = `conversation-item ${activeRecipient === username ? 'active' : ''}`;
    li.innerHTML = `
      ${avatarHtml}
      <div class="conv-info">
        <div class="conv-header-row">
          <span class="conv-username">${escapeHtml(username)}</span>
          <span class="conv-time">${timeStr}</span>
        </div>
        <div class="conv-preview">${escapeHtml(preview)}</div>
      </div>
      ${conv.unread > 0 ? `<span class="unread-badge">${conv.unread}</span>` : ''}
    `;

    li.addEventListener('click', () => {
      openChat(username);
    });

    conversationListEl.appendChild(li);
  });
}

// Render messages in active chat
function renderMessages() {
  if (!activeRecipient) return;
  const isGroup = activeRecipient.startsWith('group:');
  const messages = isGroup 
    ? groups[activeRecipient.replace('group:', '')].messages 
    : (conversations[activeRecipient] ? conversations[activeRecipient].messages : []);
  if (!messages) return;

  messagesScroll.innerHTML = '';

  messages.forEach((msg) => {
    const isSent = msg.sender === myUsername;
    const row = document.createElement('div');
    row.className = `message-row ${isSent ? 'sent' : 'received'}`;

    const timeStr = formatTime(msg.timestamp);
    let statusText = '';
    if (isSent) {
      if (msg.status === 'read') statusText = ' • Dibaca';
      else statusText = ' • Terkirim';
    }

    let senderLabel = (isGroup && !isSent) ? `<div style="font-size:0.75rem; font-weight:600; color:var(--ios-blue); margin-bottom:2px;">${escapeHtml(msg.sender)}</div>` : '';

    let contentHtml = '';
    if (msg.fileType === 'image' || (msg.message && msg.message.startsWith('data:image'))) {
      contentHtml = `<img src="${escapeHtml(msg.message)}" class="chat-media-item" alt="Foto">`;
    } else if (msg.fileType === 'video' || (msg.message && msg.message.startsWith('data:video'))) {
      contentHtml = `<video src="${escapeHtml(msg.message)}" class="chat-media-item" controls></video>`;
    } else if (msg.fileType === 'file' || msg.fileName) {
      contentHtml = `<div class="file-message"><i class="fa-solid fa-file-arrow-down"></i> <a href="${escapeHtml(msg.message)}" download="${escapeHtml(msg.fileName || 'file')}">${escapeHtml(msg.fileName || 'Dokumen')}</a></div>`;
    } else {
      const isMedia = msg.message.startsWith('http') && (msg.message.endsWith('.gif') || msg.message.includes('giphy.com'));
      if (isMedia) {
        contentHtml = `<img src="${escapeHtml(msg.message)}" class="chat-media-item" alt="Sticker/GIF">`;
      } else {
        contentHtml = escapeHtml(msg.message);
      }
    }

    row.innerHTML = `
      <div class="msg-bubble">${senderLabel}${contentHtml}</div>
      <div class="msg-meta">${timeStr}${statusText}</div>
    `;

    messagesScroll.appendChild(row);
  });

  messagesScroll.scrollTop = messagesScroll.scrollHeight;
}

// Send message
messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text || !activeRecipient) return;

  const isGroup = activeRecipient.startsWith('group:');
  const messageId = 'msg_' + Math.random().toString(36).substring(2, 11);
  const timestamp = new Date().toISOString();

  if (isGroup) {
    const groupId = activeRecipient.replace('group:', '');
    const messageObj = {
      id: messageId,
      groupId,
      sender: myUsername,
      message: text,
      timestamp
    };
    groups[groupId].messages.push(messageObj);
    messageInput.value = '';
    emojiPicker.style.display = 'none';
    renderMessages();
    socket.emit('send-group-message', { groupId, message: text, messageId });
    return;
  }

  const messageObj = {
    id: messageId,
    sender: myUsername,
    recipient: activeRecipient,
    message: text,
    timestamp,
    status: 'delivered'
  };

  conversations[activeRecipient].messages.push(messageObj);
  messageInput.value = '';
  emojiPicker.style.display = 'none';

  renderMessages();
  renderConversations();

  socket.emit('send-message', {
    recipient: activeRecipient,
    message: text,
    messageId
  });
});

// Request Notification Permission on load
if (typeof Notification !== 'undefined' && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
  Notification.requestPermission();
}

function playNotificationSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08); // A5
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch (e) {
    // Audio context not allowed or supported without user interaction
  }
}

// Receive message (Automatically adds sender to conversations/contacts if they chat us first)
socket.on('receive-message', (msg) => {
  const peer = msg.sender === myUsername ? msg.recipient : msg.sender;

  if (!conversations[peer]) {
    conversations[peer] = {
      messages: [],
      online: true,
      avatar: null,
      unread: 0
    };
  }

  conversations[peer].messages.push(msg);

  if (activeRecipient === peer) {
    renderMessages();
    markMessagesRead(peer);
  } else {
    conversations[peer].unread += 1;
    playNotificationSound();
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {
      new Notification(`Pesan baru dari ${msg.sender}`, {
        body: msg.message.startsWith('http') ? '[Media / Gambar]' : msg.message,
        icon: 'https://cdn-icons-png.flaticon.com/512/1041/1041916.png'
      });
    }
  }

  renderConversations();
});

// Message deleted in trash
socket.on('message-deleted', ({ messageId }) => {
  Object.keys(conversations).forEach((username) => {
    const msgs = conversations[username].messages;
    const idx = msgs.findIndex(m => m.id === messageId);
    if (idx !== -1) {
      msgs.splice(idx, 1);
      if (activeRecipient === username) {
        renderMessages();
      }
    }
  });
});

// Message status updates
socket.on('message-status', ({ messageId, status }) => {
  Object.keys(conversations).forEach((username) => {
    const msg = conversations[username].messages.find((m) => m.id === messageId);
    if (msg) {
      msg.status = status;
      if (activeRecipient === username) {
        renderMessages();
      }
    }
  });
});

socket.on('messages-read', ({ reader }) => {
  if (conversations[reader]) {
    conversations[reader].messages.forEach((m) => {
      if (m.sender === myUsername) m.status = 'read';
    });
    if (activeRecipient === reader) {
      renderMessages();
    }
  }
});

// User online/offline status updates
socket.on('user-online', ({ username, avatar }) => {
  if (conversations[username]) {
    conversations[username].online = true;
    if (avatar) conversations[username].avatar = avatar;
    if (activeRecipient === username) {
      activeStatusEl.textContent = 'online';
      activeStatusEl.className = 'status-sub online';
    }
  }
  renderConversations();
});

socket.on('user-offline', ({ username }) => {
  if (conversations[username]) {
    conversations[username].online = false;
    if (activeRecipient === username) {
      activeStatusEl.textContent = 'offline';
      activeStatusEl.className = 'status-sub';
    }
  }
  renderConversations();
});

function markMessagesRead(sender) {
  socket.emit('mark-read', { sender, recipient: myUsername });
}

// Emoji picker toggle
emojiBtn.addEventListener('click', () => {
  emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'block' : 'none';
});

emojiPicker.addEventListener('click', (e) => {
  if (e.target.tagName === 'SPAN') {
    messageInput.value += e.target.textContent;
    messageInput.focus();
  }
});

// Helpers
function formatTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Sticker & GIF Library
const stickerLibrary = [
  { name: 'Watermelon Happy', url: 'https://media.giphy.com/media/l0HlRnAWXxn0MhOBK/giphy.gif' },
  { name: 'Thumbs Up Cat', url: 'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif' },
  { name: 'Party Dog', url: 'https://media.giphy.com/media/26u4lOMA8JKSnL9Uk/giphy.gif' },
  { name: 'Minion Laugh', url: 'https://media.giphy.com/media/13CoXDiaCcCoyY/giphy.gif' },
  { name: 'Cool Doge', url: 'https://media.giphy.com/media/ZO9b1ntYVJmjZlsWlm/giphy.gif' },
  { name: 'Heart Eyes', url: 'https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif' }
];

const gifLibrary = [
  { name: 'Thumbs Up', url: 'https://media.giphy.com/media/5GoVL4DAcXAQM/giphy.gif' },
  { name: 'Laughing', url: 'https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif' },
  { name: 'Mind Blown', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif' },
  { name: 'Dancing', url: 'https://media.giphy.com/media/YoWOIjn7OMNsKIbMo4/giphy.gif' },
  { name: 'Applause', url: 'https://media.giphy.com/media/7rj2ZgttvgomY/giphy.gif' },
  { name: 'Crying', url: 'https://media.giphy.com/media/OPU6wzx8JrHna/giphy.gif' }
];

function renderPickers() {
  stickersTabPane.innerHTML = '';
  stickerLibrary.forEach(item => {
    const div = document.createElement('div');
    div.className = 'sticker-item';
    div.innerHTML = `<img src="${item.url}" alt="${item.name}" loading="lazy">`;
    div.addEventListener('click', () => sendMediaMessage(item.url));
    stickersTabPane.appendChild(div);
  });

  gifsTabPane.innerHTML = '';
  gifLibrary.forEach(item => {
    const div = document.createElement('div');
    div.className = 'gif-item';
    div.innerHTML = `<img src="${item.url}" alt="${item.name}" loading="lazy">`;
    div.addEventListener('click', () => sendMediaMessage(item.url));
    gifsTabPane.appendChild(div);
  });
}
renderPickers();

stickerBtn.addEventListener('click', () => {
  emojiPicker.style.display = 'none';
  stickerPicker.style.display = stickerPicker.style.display === 'none' ? 'flex' : 'none';
});

document.querySelectorAll('.picker-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.picker-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.getAttribute('data-target');
    if (target === 'stickers-tab') {
      stickersTabPane.style.display = 'grid';
      gifsTabPane.style.display = 'none';
    } else {
      stickersTabPane.style.display = 'none';
      gifsTabPane.style.display = 'grid';
    }
  });
});

function sendMediaMessage(url) {
  if (!activeRecipient) return;
  stickerPicker.style.display = 'none';

  const messageId = 'msg_' + Math.random().toString(36).substring(2, 11);
  const timestamp = new Date().toISOString();

  const messageObj = {
    id: messageId,
    sender: myUsername,
    recipient: activeRecipient,
    message: url,
    timestamp,
    status: 'delivered'
  };

  conversations[activeRecipient].messages.push(messageObj);
  renderMessages();
  renderConversations();

  socket.emit('send-message', {
    recipient: activeRecipient,
    message: url,
    messageId
  });
}

// Attachment Menu handlers
attachBtn.addEventListener('click', () => {
  emojiPicker.style.display = 'none';
  stickerPicker.style.display = 'none';
  attachmentMenu.style.display = attachmentMenu.style.display === 'none' ? 'flex' : 'none';
});

btnCamera.addEventListener('click', () => {
  attachmentMenu.style.display = 'none';
  cameraInput.click();
});

btnGallery.addEventListener('click', () => {
  attachmentMenu.style.display = 'none';
  galleryInput.click();
});

btnDocument.addEventListener('click', () => {
  attachmentMenu.style.display = 'none';
  documentInput.click();
});

btnLocation.addEventListener('click', () => {
  attachmentMenu.style.display = 'none';
  if (!activeRecipient) {
    alert('Pilih kontak terlebih dahulu untuk membagikan lokasi.');
    return;
  }
  if (!navigator.geolocation) {
    alert('Geolocation tidak didukung oleh browser Anda.');
    return;
  }

  alert('Mengambil lokasi Anda...');
  navigator.geolocation.getCurrentPosition((position) => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const mapUrl = `https://maps.google.com/?q=${lat},${lng}`;
    const locationMessage = `📍 Berbagi Lokasi Saya:\n${mapUrl}`;

    const messageId = 'msg_' + Math.random().toString(36).substring(2, 11);
    const timestamp = new Date().toISOString();

    const messageObj = {
      id: messageId,
      sender: myUsername,
      recipient: activeRecipient,
      message: locationMessage,
      timestamp,
      status: 'delivered'
    };

    conversations[activeRecipient].messages.push(messageObj);
    renderMessages();
    renderConversations();

    socket.emit('send-message', {
      recipient: activeRecipient,
      message: locationMessage,
      messageId
    });
  }, (error) => {
    alert('Gagal mendapatkan lokasi: ' + error.message);
  });
});

cameraInput.addEventListener('change', (e) => {
  if (e.target.files[0]) handleFileSelected(e.target.files[0]);
  e.target.value = '';
});

galleryInput.addEventListener('change', (e) => {
  if (e.target.files[0]) handleFileSelected(e.target.files[0]);
  e.target.value = '';
});

documentInput.addEventListener('change', (e) => {
  if (e.target.files[0]) handleFileSelected(e.target.files[0]);
  e.target.value = '';
});

function handleFileSelected(file) {
  if (!file || !activeRecipient) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const fileUrl = e.target.result;
    let fileType = 'file';
    if (file.type.startsWith('image/')) fileType = 'image';
    else if (file.type.startsWith('video/')) fileType = 'video';

    const messageId = 'msg_' + Math.random().toString(36).substring(2, 11);
    const timestamp = new Date().toISOString();

    const messageObj = {
      id: messageId,
      sender: myUsername,
      recipient: activeRecipient,
      message: fileUrl,
      fileName: file.name,
      fileType: fileType,
      timestamp,
      status: 'delivered'
    };

    conversations[activeRecipient].messages.push(messageObj);
    renderMessages();
    renderConversations();

    socket.emit('send-message', {
      recipient: activeRecipient,
      message: fileUrl,
      fileName: file.name,
      fileType: fileType,
      messageId
    });
  };
  reader.readAsDataURL(file);
}

// Broadcast Chat handlers
broadcastBtn.addEventListener('click', () => {
  broadcastModal.style.display = 'flex';
  broadcastText.value = '';
  broadcastText.focus();
});

broadcastCloseBtn.addEventListener('click', () => {
  broadcastModal.style.display = 'none';
});

broadcastSendBtn.addEventListener('click', () => {
  const text = broadcastText.value.trim();
  if (!text) return;
  broadcastModal.style.display = 'none';

  const contacts = Object.keys(conversations);
  if (contacts.length === 0) {
    alert('Tidak ada kontak untuk dibroadcast. Tambahkan kontak terlebih dahulu.');
    return;
  }

  const timestamp = new Date().toISOString();
  contacts.forEach((contact) => {
    const messageId = 'msg_' + Math.random().toString(36).substring(2, 11);
    const messageObj = {
      id: messageId,
      sender: myUsername,
      recipient: contact,
      message: text,
      timestamp,
      status: 'delivered'
    };

    conversations[contact].messages.push(messageObj);

    socket.emit('send-message', {
      recipient: contact,
      message: text,
      messageId
    });
  });

  renderConversations();
  if (activeRecipient && conversations[activeRecipient]) {
    renderMessages();
  }

  alert(`Pesan broadcast berhasil dikirim ke ${contacts.length} kontak.`);
});

// Trash Modal Handlers
trashBtn.addEventListener('click', () => openTrashModal());
menuViewTrash.addEventListener('click', () => {
  chatDropdownMenu.style.display = 'none';
  openTrashModal();
});

function openTrashModal() {
  trashModal.style.display = 'flex';
  trashList.innerHTML = '<div style="color:var(--ios-text-light);">Memuat trash...</div>';

  socket.emit('get-trash', (items) => {
    if (!items || items.length === 0) {
      trashList.innerHTML = '<div style="color:var(--ios-text-light);">Trash kosong.</div>';
      return;
    }

    trashList.innerHTML = '';
    items.forEach((item) => {
      const div = document.createElement('div');
      div.style.cssText = 'background: rgba(255,255,255,0.08); padding: 10px 14px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;';
      div.innerHTML = `
        <div>
          <div style="font-size: 0.85rem; color: #EBEBF5; margin-bottom: 2px;">Dari: ${escapeHtml(item.sender)} -> Ke: ${escapeHtml(item.recipient)}</div>
          <div style="font-size: 1rem; color: white; word-break: break-all;">${escapeHtml(item.message)}</div>
        </div>
        <button type="button" class="call-btn accept" style="width: 36px; height: 36px; font-size: 0.9rem;" title="Pulihkan Pesan"><i class="fa-solid fa-rotate-left"></i></button>
      `;

      div.querySelector('button').addEventListener('click', () => {
        socket.emit('restore-message', { messageId: item.id }, (res) => {
          if (res.success) {
            alert('Pesan berhasil dipulihkan.');
            openTrashModal();
          } else {
            alert('Gagal memulihkan pesan.');
          }
        });
      });

      trashList.appendChild(div);
    });
  });
}

trashCloseBtn.addEventListener('click', () => {
  trashModal.style.display = 'none';
});

// Chat Menu Dropdown & Contact Info Modal (WhatsApp style)
chatMenuBtn.addEventListener('click', () => {
  chatDropdownMenu.style.display = chatDropdownMenu.style.display === 'none' ? 'block' : 'none';
});

menuClearChat.addEventListener('click', () => {
  chatDropdownMenu.style.display = 'none';
  if (confirm('Hapus semua riwayat chat dengan kontak ini?')) {
    if (activeRecipient && conversations[activeRecipient]) {
      conversations[activeRecipient].messages = [];
      renderMessages();
      renderConversations();
    }
  }
});

menuViewProfile.addEventListener('click', () => {
  chatDropdownMenu.style.display = 'none';
  openContactInfo();
});

chatContactInfo.addEventListener('click', () => {
  openContactInfo();
});

function openContactInfo() {
  if (!activeRecipient) return;
  contactInfoModal.style.display = 'flex';
  infoUsername.textContent = activeRecipient;
  infoStatus.textContent = conversations[activeRecipient].online ? 'online' : 'offline';
  infoStatus.style.color = conversations[activeRecipient].online ? '#34C759' : '#8E8E93';

  const avatar = conversations[activeRecipient].avatar;
  if (avatar) {
    infoAvatar.style.backgroundImage = `url(${avatar})`;
    infoAvatar.textContent = '';
  } else {
    infoAvatar.style.backgroundImage = '';
    infoAvatar.textContent = activeRecipient.charAt(0).toUpperCase();
  }

  // Generate QR code for contact
  const infoQrcodeEl = document.getElementById('info-qrcode');
  if (infoQrcodeEl) {
    infoQrcodeEl.innerHTML = '';
    if (typeof QRCode !== 'undefined') {
      new QRCode(infoQrcodeEl, {
        text: `citcat:add:${activeRecipient}`,
        width: 130,
        height: 130,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
    }
  }

  // Populate shared media gallery
  infoMediaGallery.innerHTML = '';
  const messages = conversations[activeRecipient].messages || [];
  const mediaMsgs = messages.filter(m => m.fileType === 'image' || m.fileType === 'video' || (m.message && m.message.startsWith('data:image')));

  if (mediaMsgs.length === 0) {
    infoMediaGallery.innerHTML = '<div style="grid-column: span 3; color: #8E8E93; font-size: 0.9rem;">Belum ada media bersama.</div>';
    return;
  }

  mediaMsgs.forEach(m => {
    const item = document.createElement('div');
    item.style.cssText = 'height: 70px; border-radius: 8px; overflow: hidden; background: #000;';
    if (m.fileType === 'video' || m.message.startsWith('data:video')) {
      item.innerHTML = `<video src="${m.message}" style="width:100%; height:100%; object-fit:cover;"></video>`;
    } else {
      item.innerHTML = `<img src="${m.message}" style="width:100%; height:100%; object-fit:cover;" alt="Media">`;
    }
    infoMediaGallery.appendChild(item);
  });
}

infoCloseBtn.addEventListener('click', () => {
  contactInfoModal.style.display = 'none';
});

// WebRTC / Voice & Video Call Logic
let peerConnection = null;
let localStream = null;
let currentCallType = 'audio';
let incomingCaller = null;
let isCaller = false;

const rtcConfig = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

audioCallBtn.addEventListener('click', () => startCall('audio'));
videoCallBtn.addEventListener('click', () => startCall('video'));

async function startCall(callType) {
  if (!activeRecipient) return;
  currentCallType = callType;
  isCaller = true;

  callPeerName.textContent = activeRecipient;
  const conv = conversations[activeRecipient];
  if (conv && conv.avatar) {
    callPeerAvatar.style.backgroundImage = `url(${conv.avatar})`;
    callPeerAvatar.textContent = '';
  } else {
    callPeerAvatar.style.backgroundImage = '';
    callPeerAvatar.textContent = activeRecipient.charAt(0).toUpperCase();
  }

  callStatusText.textContent = `Memanggil ${activeRecipient} (${callType === 'video' ? 'Video Call' : 'Suara'})...`;
  callMediaContainer.style.display = callType === 'video' ? 'block' : 'none';
  callAcceptBtn.style.display = 'none';
  callOverlay.style.display = 'flex';

  socket.emit('call-request', { recipient: activeRecipient, callType });

  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === 'video'
    });
    if (callType === 'video') {
      localVideo.srcObject = localStream;
    }
  } catch (err) {
    console.error('Media error:', err);
    alert('Tidak dapat mengakses kamera/mikrofon.');
    endCall();
  }
}

socket.on('incoming-call', ({ sender, callType }) => {
  incomingCaller = sender;
  currentCallType = callType;
  isCaller = false;

  callPeerName.textContent = sender;
  const conv = conversations[sender];
  if (conv && conv.avatar) {
    callPeerAvatar.style.backgroundImage = `url(${conv.avatar})`;
    callPeerAvatar.textContent = '';
  } else {
    callPeerAvatar.style.backgroundImage = '';
    callPeerAvatar.textContent = sender.charAt(0).toUpperCase();
  }

  callStatusText.textContent = `Panggilan ${callType === 'video' ? 'Video' : 'Suara'} Masuk dari ${sender}...`;
  callMediaContainer.style.display = callType === 'video' ? 'block' : 'none';
  callAcceptBtn.style.display = 'block';
  callOverlay.style.display = 'flex';
});

callAcceptBtn.addEventListener('click', async () => {
  callAcceptBtn.style.display = 'none';
  callStatusText.textContent = 'Menghubungkan...';

  socket.emit('call-response', { recipient: incomingCaller, accepted: true });

  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: currentCallType === 'video'
    });
    if (currentCallType === 'video') {
      localVideo.srcObject = localStream;
    }

    createPeerConnection(incomingCaller);
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('webrtc-offer', { recipient: incomingCaller, offer });
  } catch (err) {
    console.error('Accept call error:', err);
    endCall();
  }
});

socket.on('call-responded', async ({ sender, accepted }) => {
  if (!accepted) {
    alert(`${sender} menolak panggilan.`);
    endCall();
    return;
  }

  callStatusText.textContent = 'Terhubung!';
  try {
    createPeerConnection(sender);
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('webrtc-offer', { recipient: sender, offer });
  } catch (err) {
    console.error('Call response error:', err);
    endCall();
  }
});

callRejectBtn.addEventListener('click', () => {
  const target = isCaller ? activeRecipient : incomingCaller;
  if (target) {
    socket.emit('end-call', { recipient: target });
  }
  endCall();
});

socket.on('end-call', () => {
  endCall();
});

function createPeerConnection(remoteUser) {
  if (peerConnection) return;
  peerConnection = new RTCPeerConnection(rtcConfig);

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('webrtc-ice', { recipient: remoteUser, candidate: event.candidate });
    }
  };
}

socket.on('webrtc-offer', async ({ sender, offer }) => {
  try {
    if (!localStream) {
      localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: currentCallType === 'video'
      });
      if (currentCallType === 'video') localVideo.srcObject = localStream;
    }

    createPeerConnection(sender);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('webrtc-answer', { recipient: sender, answer });
    callStatusText.textContent = 'Terhubung!';
  } catch (err) {
    console.error('Offer error:', err);
  }
});

socket.on('webrtc-answer', async ({ answer }) => {
  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    callStatusText.textContent = 'Terhubung!';
  } catch (err) {
    console.error('Answer error:', err);
  }
});

socket.on('webrtc-ice', async ({ candidate }) => {
  try {
    if (peerConnection) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  } catch (err) {
    console.error('ICE error:', err);
  }
});

function endCall() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }
  remoteVideo.srcObject = null;
  localVideo.srcObject = null;
  callOverlay.style.display = 'none';
  incomingCaller = null;
  isCaller = false;
}

// Click outside to close pickers/menus
document.addEventListener('click', (e) => {
  if (!attachmentMenu.contains(e.target) && !attachBtn.contains(e.target)) {
    attachmentMenu.style.display = 'none';
  }
  if (!stickerPicker.contains(e.target) && !stickerBtn.contains(e.target)) {
    stickerPicker.style.display = 'none';
  }
  if (!emojiPicker.contains(e.target) && !emojiBtn.contains(e.target)) {
    emojiPicker.style.display = 'none';
  }
  if (!chatDropdownMenu.contains(e.target) && !chatMenuBtn.contains(e.target)) {
    chatDropdownMenu.style.display = 'none';
  }
});

// QR Scanner Elements & Logic
const scanQrBtn = document.getElementById('scan-qr-btn');
const qrScannerModal = document.getElementById('qr-scanner-modal');
const qrScannerCloseBtn = document.getElementById('qr-scanner-close-btn');
let html5QrCode = null;

if (scanQrBtn) {
  scanQrBtn.addEventListener('click', () => {
    qrScannerModal.style.display = 'flex';
    html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        html5QrCode.stop().then(() => {
          qrScannerModal.style.display = 'none';
          handleScannedQR(decodedText);
        }).catch(() => {
          qrScannerModal.style.display = 'none';
          handleScannedQR(decodedText);
        });
      },
      (errorMessage) => {}
    ).catch((err) => {
      alert('Gagal mengakses kamera: ' + err);
      qrScannerModal.style.display = 'none';
    });
  });
}

if (qrScannerCloseBtn) {
  qrScannerCloseBtn.addEventListener('click', () => {
    if (html5QrCode) {
      html5QrCode.stop().catch(() => {}).finally(() => {
        qrScannerModal.style.display = 'none';
      });
    } else {
      qrScannerModal.style.display = 'none';
    }
  });
}

function handleScannedQR(text) {
  let target = text.trim();
  if (target.startsWith('citcat:add:')) {
    target = target.replace('citcat:add:', '');
  }
  if (!target) return;
  if (target === myUsername) {
    alert('Ini adalah QR code Anda sendiri.');
    return;
  }
  searchInput.value = target;
  socket.emit('search-user', { targetUsername: target }, (response) => {
    if (response.success) {
      searchedUser = response.user;
      foundUsername.textContent = searchedUser.username;
      searchResultBox.style.display = 'flex';
      addContactBtn.click();
    } else {
      alert(response.error || 'Pengguna dari QR tidak ditemukan.');
    }
  });
}

// ==========================================
// Offline / Online Toggle (Off-Grid P2P) & My Profile Features
// ==========================================
let isOfflineMode = false;
const offlineToggleBtn = document.getElementById('offline-toggle-btn');
const statusOnlineText = document.querySelector('.status-online-text');

if (offlineToggleBtn) {
  offlineToggleBtn.addEventListener('click', async () => {
    isOfflineMode = !isOfflineMode;
    if (isOfflineMode) {
      offlineToggleBtn.style.background = '#34C759';
      offlineToggleBtn.style.color = 'white';
      offlineToggleBtn.title = 'Mode Offline (Off-Grid P2P) Aktif - Klik untuk kembali online';
      if (statusOnlineText) statusOnlineText.textContent = 'Offline (Off-Grid)';
      if (window.offGridManager) {
        const res = await window.offGridManager.toggleOffGrid(true, myUsername);
        if (res && res.message) {
          alert(res.message);
        } else {
          alert('Mode Off-Grid diaktifkan (Bluetooth LE / Wi-Fi Direct P2P).');
        }
      } else {
        alert('Mode Offline diaktifkan.');
      }
    } else {
      offlineToggleBtn.style.background = '';
      offlineToggleBtn.style.color = '';
      offlineToggleBtn.title = 'Toggle Mode Offline / Off-Grid P2P';
      if (statusOnlineText) statusOnlineText.textContent = 'Online';
      if (window.offGridManager) {
        await window.offGridManager.toggleOffGrid(false, myUsername);
      }
      alert('Kembali ke Mode Online (Server).');
    }
  });
}

// My Profile & Contact Sharing Modal Elements
const userProfileBtn = document.getElementById('user-profile-btn');
const myProfileModal = document.getElementById('my-profile-modal');
const myProfileCloseBtn = document.getElementById('my-profile-close-btn');
const myProfileAvatar = document.getElementById('my-profile-avatar');
const myProfileUsername = document.getElementById('my-profile-username');
const myProfileStatus = document.getElementById('my-profile-status');
const myProfileQrcode = document.getElementById('my-profile-qrcode');
const myShareLinkInput = document.getElementById('my-share-link-input');
const copyShareLinkBtn = document.getElementById('copy-share-link-btn');
const nativeShareBtn = document.getElementById('native-share-btn');

if (userProfileBtn) {
  userProfileBtn.addEventListener('click', () => {
    openMyProfile();
  });
}

function openMyProfile() {
  if (!myProfileModal) return;
  myProfileModal.style.display = 'flex';
  if (myProfileUsername) myProfileUsername.textContent = myUsername || 'Username';
  if (myProfileStatus) {
    myProfileStatus.textContent = isOfflineMode ? 'Offline (Off-Grid P2P)' : 'Online';
    myProfileStatus.style.color = isOfflineMode ? '#FF9500' : '#34C759';
  }

  const savedAvatar = localStorage.getItem('citcat_avatar');
  if (myProfileAvatar) {
    if (savedAvatar) {
      myProfileAvatar.style.backgroundImage = `url(${savedAvatar})`;
      myProfileAvatar.textContent = '';
    } else {
      myProfileAvatar.style.backgroundImage = '';
      myProfileAvatar.textContent = (myUsername || 'U').charAt(0).toUpperCase();
    }
  }

  const shareText = `citcat:add:${myUsername}`;
  if (myShareLinkInput) myShareLinkInput.value = shareText;

  if (myProfileQrcode) {
    myProfileQrcode.innerHTML = '';
    if (typeof QRCode !== 'undefined') {
      new QRCode(myProfileQrcode, {
        text: shareText,
        width: 140,
        height: 140,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
    }
  }

  // Populate My Media Gallery & Documents
  const myMediaGallery = document.getElementById('my-media-gallery');
  const myDocumentsList = document.getElementById('my-documents-list');

  if (myMediaGallery) myMediaGallery.innerHTML = '';
  if (myDocumentsList) myDocumentsList.innerHTML = '';

  let allMedia = [];
  let allDocs = [];

  Object.keys(conversations).forEach(username => {
    const msgs = conversations[username].messages || [];
    msgs.forEach(m => {
      if (m.fileType === 'image' || m.fileType === 'video' || (m.message && m.message.startsWith('data:image'))) {
        allMedia.push(m);
      } else if (m.fileType === 'file' || m.fileName) {
        allDocs.push(m);
      }
    });
  });

  if (allMedia.length === 0) {
    if (myMediaGallery) myMediaGallery.innerHTML = '<div style="grid-column: span 3; color: #8E8E93; font-size: 0.85rem;">Belum ada media.</div>';
  } else {
    allMedia.forEach(m => {
      const item = document.createElement('div');
      item.style.cssText = 'height: 65px; border-radius: 8px; overflow: hidden; background: #000;';
      if (m.fileType === 'video' || m.message.startsWith('data:video')) {
        item.innerHTML = `<video src="${m.message}" style="width:100%; height:100%; object-fit:cover;"></video>`;
      } else {
        item.innerHTML = `<img src="${m.message}" style="width:100%; height:100%; object-fit:cover;" alt="Media">`;
      }
      myMediaGallery.appendChild(item);
    });
  }

  if (allDocs.length === 0) {
    if (myDocumentsList) myDocumentsList.innerHTML = '<div style="color: #8E8E93; font-size: 0.85rem;">Belum ada dokumen.</div>';
  } else {
    allDocs.forEach(m => {
      const item = document.createElement('div');
      item.style.cssText = 'background: rgba(255,255,255,0.08); padding: 8px 10px; border-radius: 8px; display: flex; align-items: center; justify-content: space-between; font-size: 0.85rem;';
      item.innerHTML = `
        <span style="color: white; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 240px;"><i class="fa-solid fa-file"></i> ${escapeHtml(m.fileName || 'Dokumen')}</span>
        <a href="${escapeHtml(m.message)}" download="${escapeHtml(m.fileName || 'file')}" style="color: #34C759; text-decoration: none;"><i class="fa-solid fa-download"></i></a>
      `;
      myDocumentsList.appendChild(item);
    });
  }
}

const changeAvatarBtn = document.getElementById('change-avatar-btn');
if (changeAvatarBtn) {
  changeAvatarBtn.addEventListener('click', () => {
    avatarFileInput.click();
  });
}

if (myProfileAvatar) {
  myProfileAvatar.addEventListener('click', () => {
    avatarFileInput.click();
  });
}

if (myProfileCloseBtn) {
  myProfileCloseBtn.addEventListener('click', () => {
    myProfileModal.style.display = 'none';
  });
}

if (copyShareLinkBtn) {
  copyShareLinkBtn.addEventListener('click', () => {
    if (myShareLinkInput) {
      navigator.clipboard.writeText(myShareLinkInput.value).then(() => {
        alert('Tautan kontak berhasil disalin ke clipboard!');
      }).catch(() => {
        myShareLinkInput.select();
        document.execCommand('copy');
        alert('Tautan kontak disalin!');
      });
    }
  });
}

if (nativeShareBtn) {
  nativeShareBtn.addEventListener('click', async () => {
    const shareData = {
      title: 'Citcat Contact',
      text: `Ayo chat di Citcat! Tambahkan kontak saya dengan username: ${myUsername}`,
      url: window.location.href
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share canceled or failed', err);
      }
    } else {
      navigator.clipboard.writeText(`citcat:add:${myUsername}`);
      alert('Web Share API tidak didukung browser ini. Kontak tersalin ke clipboard.');
    }
  });
}

// ==========================================
// Sidebar Tabs, Groups, Nearby, & BBM Status Features
// ==========================================

// Tab Switching
const sidebarTabs = document.querySelectorAll('.sidebar-tab');
sidebarTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    sidebarTabs.forEach(t => {
      t.classList.remove('active');
      t.style.borderBottom = 'none';
      t.style.color = 'var(--ios-text-light)';
    });
    tab.classList.add('active');
    tab.style.borderBottom = '2px solid var(--ios-blue)';
    tab.style.color = 'var(--ios-blue)';

    const targetId = tab.getAttribute('data-target');
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.style.display = 'none';
      pane.classList.remove('active');
    });
    const targetPane = document.getElementById(targetId);
    if (targetPane) {
      targetPane.style.display = 'flex';
      targetPane.classList.add('active');
    }
  });
});

// Profile Modal Top Close & Click Outside
const myProfileTopCloseBtn = document.getElementById('my-profile-top-close-btn');
if (myProfileTopCloseBtn) {
  myProfileTopCloseBtn.addEventListener('click', () => {
    myProfileModal.style.display = 'none';
  });
}
if (myProfileModal) {
  myProfileModal.addEventListener('click', (e) => {
    if (e.target === myProfileModal) {
      myProfileModal.style.display = 'none';
    }
  });
}

// Nearby Contacts (People Nearby)
const nearbyBtn = document.getElementById('nearby-btn');
const nearbyModal = document.getElementById('nearby-modal');
const nearbyCloseBtn = document.getElementById('nearby-close-btn');
const nearbyUsersList = document.getElementById('nearby-users-list');

if (nearbyBtn) {
  nearbyBtn.addEventListener('click', () => {
    nearbyModal.style.display = 'flex';
    nearbyUsersList.innerHTML = '<div style="color:var(--ios-text-light); text-align:center;">Mencari pengguna di sekitar...</div>';
    socket.emit('get-nearby-users', (users) => {
      nearbyUsersList.innerHTML = '';
      if (!users || users.length === 0) {
        nearbyUsersList.innerHTML = '<div style="color:var(--ios-text-light); text-align:center;">Tidak ada pengguna lain di sekitar.</div>';
        return;
      }
      users.forEach(u => {
        const div = document.createElement('div');
        div.style.cssText = 'display: flex; align-items: center; justify-content: space-between; background: rgba(0, 0, 0, 0.03); padding: 10px 12px; border-radius: 10px;';
        
        const left = document.createElement('div');
        left.style.cssText = 'display: flex; align-items: center; gap: 10px;';
        
        const av = document.createElement('div');
        av.className = 'avatar small';
        if (u.avatar) {
          av.style.backgroundImage = `url(${u.avatar})`;
          av.textContent = '';
        } else {
          av.textContent = u.username.charAt(0).toUpperCase();
        }

        const info = document.createElement('div');
        info.innerHTML = `
          <div style="font-weight: 600; font-size: 0.95rem; color: var(--ios-text-dark);">${escapeHtml(u.username)}</div>
          <div style="font-size: 0.75rem; color: var(--ios-text-light);"><i class="fa-solid fa-location-dot"></i> ~${u.distance} • Status: ${escapeHtml(u.status_text || 'Available')}</div>
        `;
        left.appendChild(av);
        left.appendChild(info);

        const addBtn = document.createElement('button');
        addBtn.className = 'call-btn accept';
        addBtn.style.cssText = 'width: auto; height: 32px; padding: 0 12px; font-size: 0.8rem; border-radius: 8px;';
        addBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Tambah';
        addBtn.onclick = () => {
          socket.emit('add-contact', { username: myUsername, targetUsername: u.username }, (res) => {
            if (res.success) {
              alert(`Permintaan kontak dikirim ke ${u.username} (Menunggu persetujuan).`);
              addBtn.disabled = true;
              addBtn.textContent = 'Menunggu';
              addBtn.style.background = '#8E8E93';
            } else {
              alert(res.error || 'Gagal mengirim permintaan.');
            }
          });
        };

        div.appendChild(left);
        div.appendChild(addBtn);
        nearbyUsersList.appendChild(div);
      });
    });
  });
}

if (nearbyCloseBtn) {
  nearbyCloseBtn.addEventListener('click', () => {
    nearbyModal.style.display = 'none';
  });
}
if (nearbyModal) {
  nearbyModal.addEventListener('click', (e) => {
    if (e.target === nearbyModal) nearbyModal.style.display = 'none';
  });
}

// Groups Feature
const groups = {}; // groupId -> { name, members, messages: [] }
const openCreateGroupBtn = document.getElementById('open-create-group-btn');
const createGroupModal = document.getElementById('create-group-modal');
const groupCreateCloseBtn = document.getElementById('group-create-close-btn');
const groupCreateSubmitBtn = document.getElementById('group-create-submit-btn');
const groupNameInput = document.getElementById('group-name-input');
const groupMembersSelectList = document.getElementById('group-members-select-list');
const groupList = document.getElementById('group-list');
const selectedGroupMembers = new Set();

if (openCreateGroupBtn) {
  openCreateGroupBtn.addEventListener('click', () => {
    const contactUsernames = Object.keys(conversations);
    groupNameInput.value = '';
    selectedGroupMembers.clear();
    if (groupMembersSelectList) groupMembersSelectList.innerHTML = '';

    if (contactUsernames.length === 0) {
      if (groupMembersSelectList) groupMembersSelectList.innerHTML = '<div style="color:var(--ios-text-light); font-size:0.9rem; text-align:center; padding: 15px;">Belum ada kontak.</div>';
    } else {
      contactUsernames.forEach(username => {
        const conv = conversations[username];
        const item = document.createElement('div');
        item.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 10px; cursor: pointer; background: rgba(0,0,0,0.02); transition: background 0.15s;';
        
        const left = document.createElement('div');
        left.style.cssText = 'display: flex; align-items: center; gap: 10px;';
        
        const av = document.createElement('div');
        av.className = 'avatar small';
        if (conv && conv.avatar) {
          av.style.backgroundImage = `url(${conv.avatar})`;
          av.textContent = '';
        } else {
          av.textContent = username.charAt(0).toUpperCase();
        }

        const nameEl = document.createElement('span');
        nameEl.style.cssText = 'font-weight: 600; font-size: 0.95rem; color: var(--ios-text-dark);';
        nameEl.textContent = username;

        left.appendChild(av);
        left.appendChild(nameEl);

        const checkIcon = document.createElement('i');
        checkIcon.className = 'fa-solid fa-check';
        checkIcon.style.cssText = 'color: var(--ios-blue); opacity: 0; font-size: 1.1rem; transition: opacity 0.15s;';

        item.appendChild(left);
        item.appendChild(checkIcon);

        item.onclick = () => {
          if (selectedGroupMembers.has(username)) {
            selectedGroupMembers.delete(username);
            item.style.background = 'rgba(0,0,0,0.02)';
            checkIcon.style.opacity = '0';
          } else {
            selectedGroupMembers.add(username);
            item.style.background = 'rgba(0, 122, 255, 0.1)';
            checkIcon.style.opacity = '1';
          }
        };

        if (groupMembersSelectList) groupMembersSelectList.appendChild(item);
      });
    }
    createGroupModal.style.display = 'flex';
  });
}

if (groupCreateCloseBtn) {
  groupCreateCloseBtn.addEventListener('click', () => {
    createGroupModal.style.display = 'none';
  });
}
if (createGroupModal) {
  createGroupModal.addEventListener('click', (e) => {
    if (e.target === createGroupModal) createGroupModal.style.display = 'none';
  });
}

if (groupCreateSubmitBtn) {
  groupCreateSubmitBtn.addEventListener('click', () => {
    const name = groupNameInput.value.trim();
    if (!name) {
      alert('Nama grup wajib diisi.');
      return;
    }
    const selectedMembers = Array.from(selectedGroupMembers);
    if (selectedMembers.length === 0) {
      alert('Pilih minimal 1 kontak anggota untuk grup.');
      return;
    }

    socket.emit('create-group', { name, members: selectedMembers }, (res) => {
      if (res && res.success) {
        const grp = res.group;
        groups[grp.id] = { name: grp.name, members: grp.members, messages: [] };
        renderGroups();
        createGroupModal.style.display = 'none';
        alert(`Grup "${grp.name}" berhasil dibuat!`);
      } else {
        alert((res && res.error) || 'Gagal membuat grup.');
      }
    });
  });
}

function renderGroups() {
  if (!groupList) return;
  const groupIds = Object.keys(groups);
  if (groupIds.length === 0) {
    groupList.innerHTML = '<li class="no-conversations">Belum ada grup. Buat grup dengan tombol di atas.</li>';
    return;
  }
  groupList.innerHTML = '';
  groupIds.forEach(gid => {
    const g = groups[gid];
    const li = document.createElement('li');
    li.className = 'conversation-item';
    li.innerHTML = `
      <div class="avatar small" style="background: var(--ios-blue); color: white;"><i class="fa-solid fa-users"></i></div>
      <div class="conv-info">
        <div class="conv-header-row">
          <span class="conv-username">${escapeHtml(g.name)}</span>
        </div>
        <div class="conv-preview">${g.members.length} Anggota</div>
      </div>
    `;
    li.addEventListener('click', () => {
      openGroupChat(gid);
    });
    groupList.appendChild(li);
  });
}

function openGroupChat(groupId) {
  activeRecipient = 'group:' + groupId;
  const g = groups[groupId];

  chatEmptyState.style.display = 'none';
  chatBox.style.display = 'flex';
  activeUsernameEl.textContent = g.name;
  activeStatusEl.textContent = `${g.members.length} Anggota`;
  activeStatusEl.className = 'status-sub online';
  activeAvatarEl.style.backgroundImage = '';
  activeAvatarEl.innerHTML = '<i class="fa-solid fa-users" style="font-size: 1rem;"></i>';

  if (window.innerWidth <= 768) {
    sidebar.classList.add('hidden');
    chatArea.classList.add('active');
  }

  renderMessages();
}

socket.on('receive-group-message', (msg) => {
  const gid = msg.groupId;
  if (!groups[gid]) {
    groups[gid] = { name: 'Grup', members: [], messages: [] };
  }
  groups[gid].messages.push(msg);
  if (activeRecipient === 'group:' + gid) {
    renderMessages();
  }
  renderGroups();
});

// BBM / WhatsApp Status Feature
const myStatusInput = document.getElementById('my-status-input');
const updateStatusBtn = document.getElementById('update-status-btn');
const contactStatusesList = document.getElementById('contact-statuses-list');
const allStatuses = {}; // username -> statusText

function handleUpdateStatus() {
  const statusText = myStatusInput.value.trim();
  if (!statusText) {
    alert('Tulis status terlebih dahulu.');
    return;
  }
  socket.emit('update-status', { statusText }, (res) => {
    if (res && res.success) {
      allStatuses[myUsername] = statusText;
      renderContactStatuses();
      myStatusInput.value = '';
      alert('Status berhasil diperbarui!');
    } else {
      alert('Gagal memperbarui status.');
    }
  });
}

if (updateStatusBtn) {
  updateStatusBtn.addEventListener('click', handleUpdateStatus);
}

if (myStatusInput) {
  myStatusInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleUpdateStatus();
    }
  });
}

socket.on('user-status-updated', ({ username, statusText }) => {
  allStatuses[username] = statusText;
  renderContactStatuses();
});

function renderContactStatuses() {
  if (!contactStatusesList) return;

  if (myUsername && !allStatuses[myUsername]) {
    allStatuses[myUsername] = 'Available';
  }

  const usernames = Object.keys(allStatuses);
  if (usernames.length === 0) {
    contactStatusesList.innerHTML = '<li style="color: var(--ios-text-light); font-size: 0.85rem;">Belum ada status.</li>';
    return;
  }

  contactStatusesList.innerHTML = '';

  // Render my status at the top
  if (myUsername && allStatuses[myUsername]) {
    const myLi = document.createElement('li');
    myLi.style.cssText = 'background: rgba(0, 122, 255, 0.08); padding: 10px 12px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid var(--ios-blue);';
    myLi.innerHTML = `
      <div>
        <div style="font-weight: 600; font-size: 0.9rem; color: var(--ios-text-dark);">${escapeHtml(myUsername)} <span style="font-size: 0.75rem; color: var(--ios-blue); font-weight: normal;">(Status Saya)</span></div>
        <div style="font-size: 0.85rem; color: var(--ios-text-dark); margin-top: 2px;">"${escapeHtml(allStatuses[myUsername])}"</div>
      </div>
    `;
    contactStatusesList.appendChild(myLi);
  }

  // Render contacts' statuses with WhatsApp-style reply button
  usernames.forEach(u => {
    if (u === myUsername) return;
    const st = allStatuses[u];
    const li = document.createElement('li');
    li.style.cssText = 'background: rgba(0,0,0,0.03); padding: 10px 12px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;';
    
    const infoDiv = document.createElement('div');
    infoDiv.innerHTML = `
      <div style="font-weight: 600; font-size: 0.9rem; color: var(--ios-text-dark);">${escapeHtml(u)}</div>
      <div style="font-size: 0.85rem; color: var(--ios-blue); font-style: italic; margin-top: 2px;">"${escapeHtml(st)}"</div>
    `;

    const replyBtn = document.createElement('button');
    replyBtn.className = 'call-btn accept';
    replyBtn.style.cssText = 'width: auto; height: 30px; padding: 0 12px; font-size: 0.80rem; border-radius: 8px;';
    replyBtn.innerHTML = '<i class="fa-solid fa-reply"></i> Balas';
    replyBtn.onclick = () => {
      // Switch to Chat tab
      const chatTabBtn = document.querySelector('.sidebar-tab[data-target="chat-tab-pane"]');
      if (chatTabBtn) chatTabBtn.click();

      openChat(u);
      messageInput.value = `Membalas status "${st}": `;
      messageInput.focus();
    };

    li.appendChild(infoDiv);
    li.appendChild(replyBtn);
    contactStatusesList.appendChild(li);
  });
}

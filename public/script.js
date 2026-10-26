const socket = io();

let myUsername = '';
let activeRecipient = null;
const conversations = {}; // username -> { messages: [], online: boolean, avatar: string, unread: 0 }
let pendingRequests = [];

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

// Profile picture upload
myAvatarEl.addEventListener('click', () => {
  avatarFileInput.click();
});

avatarFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    const avatarUrl = evt.target.result;
    myAvatarEl.style.backgroundImage = `url(${avatarUrl})`;
    myAvatarEl.textContent = '';
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
  socket.emit('add-contact', { targetUsername: searchedUser.username }, (res) => {
    searchResultBox.style.display = 'none';
    searchInput.value = '';
    if (res.success) {
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
      alert(`Kontak ${u.username} berhasil ditambahkan!`);
      openChat(u.username);
    } else {
      alert(res.error || 'Gagal menambahkan kontak.');
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
  if (!activeRecipient || !conversations[activeRecipient]) return;

  messagesScroll.innerHTML = '';
  const messages = conversations[activeRecipient].messages;

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

    const deleteBtnHtml = `<button type="button" class="delete-msg-btn" title="Hapus pesan (Masuk ke Trash)"><i class="fa-solid fa-trash"></i></button>`;

    row.innerHTML = `
      <div class="msg-bubble">${contentHtml} ${isSent ? deleteBtnHtml : ''}</div>
      <div class="msg-meta">${timeStr}${statusText}</div>
    `;

    const delBtn = row.querySelector('.delete-msg-btn');
    if (delBtn) {
      delBtn.addEventListener('click', () => {
        if (confirm('Hapus pesan ini? Pesan akan dipindahkan ke Trash (otomatis terhapus permanen setelah 30 hari).')) {
          socket.emit('delete-message', { messageId: msg.id }, (res) => {
            if (res.success) {
              row.remove();
            } else {
              alert(res.error || 'Gagal menghapus pesan.');
            }
          });
        }
      });
    }

    messagesScroll.appendChild(row);
  });

  messagesScroll.scrollTop = messagesScroll.scrollHeight;
}

// Send message
messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text || !activeRecipient) return;

  const messageId = 'msg_' + Math.random().toString(36).substring(2, 11);
  const timestamp = new Date().toISOString();

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

socket.on('call-ended', () => {
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

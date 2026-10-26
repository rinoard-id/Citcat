const socket = io();

let myPin = '';
let activeChatPin = null;
const chats = {}; // pin -> { messages: [], unread: 0 }

// DOM Elements
const myPinEl = document.getElementById('my-pin');
const copyPinBtn = document.getElementById('copy-pin-btn');
const addContactForm = document.getElementById('add-contact-form');
const targetPinInput = document.getElementById('target-pin-input');
const addErrorEl = document.getElementById('add-error');
const chatListEl = document.getElementById('chat-list');
const chatEmptyState = document.getElementById('chat-empty-state');
const chatActiveContainer = document.getElementById('chat-active-container');
const activePeerPinEl = document.getElementById('active-peer-pin');
const messagesContainer = document.getElementById('messages-container');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const pingBtn = document.getElementById('ping-btn');
const bbmContainerEl = document.querySelector('.bbm-container');

// Socket: Assigned PIN
socket.on('assigned-pin', ({ pin }) => {
  myPin = pin;
  myPinEl.textContent = pin;
});

// Copy PIN
copyPinBtn.addEventListener('click', () => {
  if (myPin) {
    navigator.clipboard.writeText(myPin);
    copyPinBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
    setTimeout(() => {
      copyPinBtn.innerHTML = '<i class="fa-solid fa-copy"></i>';
    }, 1500);
  }
});

// Add Contact / Start Chat
addContactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const targetPin = targetPinInput.value.toUpperCase().trim();
  addErrorEl.textContent = '';

  if (targetPin === myPin) {
    addErrorEl.textContent = 'Tidak dapat menambahkan PIN Anda sendiri.';
    return;
  }

  socket.emit('check-pin', { targetPin }, (response) => {
    if (response.success) {
      targetPinInput.value = '';
      openChat(response.pin);
    } else {
      addErrorEl.textContent = response.error || 'PIN tidak ditemukan.';
    }
  });
});

// Open or switch to chat with a PIN
function openChat(pin) {
  if (!chats[pin]) {
    chats[pin] = {
      messages: [],
      unread: 0
    };
  }

  // Clear unread when opening
  chats[pin].unread = 0;
  activeChatPin = pin;

  chatEmptyState.style.display = 'none';
  chatActiveContainer.style.display = 'flex';
  activePeerPinEl.textContent = `PIN: ${pin}`;

  renderChatList();
  renderMessages();
  markChatMessagesRead(pin);
}

// Render chat list in sidebar
function renderChatList() {
  const pinKeys = Object.keys(chats);
  if (pinKeys.length === 0) {
    chatListEl.innerHTML = '<li class="no-chats">Belum ada obrolan. Masukkan PIN untuk mulai.</li>';
    return;
  }

  chatListEl.innerHTML = '';
  pinKeys.forEach((pin) => {
    const chat = chats[pin];
    const lastMsg = chat.messages[chat.messages.length - 1];
    const preview = lastMsg ? (lastMsg.sender === 'me' ? 'Anda: ' : '') + lastMsg.text : 'Mulai percakapan...';

    const li = document.createElement('li');
    li.className = `chat-list-item ${activeChatPin === pin ? 'active' : ''}`;
    li.innerHTML = `
      <div>
        <div class="chat-list-pin">PIN: ${pin}</div>
        <div class="chat-list-preview">${escapeHtml(preview)}</div>
      </div>
      ${chat.unread > 0 ? `<span class="unread-badge">${chat.unread}</span>` : ''}
    `;

    li.addEventListener('click', () => {
      openChat(pin);
    });

    chatListEl.appendChild(li);
  });
}

// Render messages in active chat room
function renderMessages() {
  if (!activeChatPin || !chats[activeChatPin]) return;

  messagesContainer.innerHTML = '';
  const messages = chats[activeChatPin].messages;

  messages.forEach((msg) => {
    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${msg.sender === 'me' ? 'sent' : 'received'}`;
    
    let statusBadge = '';
    if (msg.sender === 'me') {
      const statusClass = msg.status === 'R' ? 'status-r' : 'status-d';
      const statusText = msg.status === 'R' ? 'R' : 'D';
      statusBadge = `<span class="message-status ${statusClass}">${statusText}</span>`;
    }

    const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    bubble.innerHTML = `
      <div class="message-text">${escapeHtml(msg.text)}</div>
      <div class="message-meta">
        <span class="message-time">${timeStr}</span>
        ${statusBadge}
      </div>
    `;

    messagesContainer.appendChild(bubble);
  });

  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Send message
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text || !activeChatPin) return;

  const messageId = 'msg_' + Math.random().toString(36.substring(2, 9));
  const timestamp = new Date().toISOString();

  const messageObj = {
    id: messageId,
    sender: 'me',
    text,
    status: 'sent', // initial before delivery
    timestamp
  };

  chats[activeChatPin].messages.push(messageObj);
  messageInput.value = '';
  renderMessages();
  renderChatList();

  socket.emit('send-message', {
    toPin: activeChatPin,
    message: text,
    messageId
  });
});

// Receive message from server
socket.on('receive-message', ({ fromPin, message, messageId, timestamp }) => {
  if (!chats[fromPin]) {
    chats[fromPin] = {
      messages: [],
      unread: 0
    };
  }

  const messageObj = {
    id: messageId,
    sender: 'them',
    text: message,
    status: 'R',
    timestamp
  };

  chats[fromPin].messages.push(messageObj);

  if (activeChatPin === fromPin) {
    renderMessages();
    // Mark as read immediately if chat is open
    socket.markReadTimeout = socket.markReadTimeout || {};
    socket.emit('mark-read', { messageId, fromPin });
  } else {
    chats[fromPin].unread += 1;
  }

  renderChatList();
});

// Update message status (D or R)
socket.on('message-status', ({ messageId, status }) => {
  Object.keys(chats).forEach((pin) => {
    const msg = chats[pin].messages.find((m) => m.id === messageId);
    if (msg) {
      msg.status = status;
      if (activeChatPin === pin) {
        renderMessages();
      }
    }
  });
});

// Mark messages as read when viewing chat
function markChatMessagesRead(pin) {
  // If we wanted to batch mark read, but individual or per-message is fine
}

// PING! Feature
pingBtn.addEventListener('click', () => {
  if (!activeChatPin) return;
  socket.emit('send-ping', { toPin: activeChatPin });
  
  // Local feedback for PING sent
  const msgObj = {
    id: 'ping_' + Date.now(),
    sender: 'me',
    text: '⚡ [PENGIRIMAN PING!] ⚡',
    status: 'D',
    timestamp: new Date().toISOString()
  };
  chats[activeChatPin].messages.push(msgObj);
  renderMessages();
  renderChatList();
});

// Receive PING!
socket.on('receive-ping', ({ fromPin }) => {
  if (!chats[fromPin]) {
    chats[fromPin] = {
      messages: [],
      unread: 0
    };
  }

  const msgObj = {
    id: 'ping_' + Date.now(),
    sender: 'them',
    text: '⚡ [PING! PING! PING!] ⚡',
    status: 'R',
    timestamp: new Date().toISOString()
  };
  chats[fromPin].messages.push(msgObj);

  if (activeChatPin === fromPin) {
    renderMessages();
  } else {
    chats[fromPin].unread += 1;
  }
  renderChatList();

  // Trigger screen shake & vibration
  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200, 100, 300]);
  }

  bbmContainerEl.classList.add('screen-shake');
  setTimeout(() => {
    bbmContainerEl.classList.remove('screen-shake');
  }, 500);

  // Auto open chat if not currently active or alert user
  if (activeChatPin !== fromPin) {
    // optional notification
  }
});

// Helper: Escape HTML to prevent XSS
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', () => {
  const loginContainer = document.getElementById('login-container');
  const dashboardContainer = document.getElementById('dashboard-container');
  const loginForm = document.getElementById('login-form');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginError = document.getElementById('login-error');
  const btnLogout = document.getElementById('btn-logout');
  const btnRefresh = document.getElementById('btn-refresh');
  const searchInput = document.getElementById('search-input');

  const statTotalUsers = document.getElementById('stat-total-users');
  const statOnlineUsers = document.getElementById('stat-online-users');
  const statTotalMessages = document.getElementById('stat-total-messages');
  const statTotalTrash = document.getElementById('stat-total-trash');

  const messagesTbody = document.getElementById('messages-tbody');
  const usersTbody = document.getElementById('users-tbody');
  const trashTbody = document.getElementById('trash-tbody');

  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  let rawData = {
    users: [],
    messages: [],
    trash: []
  };

  // Check existing session
  if (sessionStorage.getItem('admin_logged_in') === 'true') {
    showDashboard();
  }

  // Login Handler
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    loginError.textContent = '';

    try {
      const res = await fetch('/api/history/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (data.success) {
        sessionStorage.setItem('admin_logged_in', 'true');
        showDashboard();
      } else {
        loginError.textContent = data.error || 'Login gagal.';
      }
    } catch (err) {
      console.error(err);
      loginError.textContent = 'Terjadi kesalahan koneksi server.';
    }
  });

  // Logout Handler
  btnLogout.addEventListener('click', () => {
    sessionStorage.removeItem('admin_logged_in');
    dashboardContainer.classList.add('hidden');
    loginContainer.classList.remove('hidden');
    usernameInput.value = '';
    passwordInput.value = '';
    loginError.textContent = '';
  });

  // Refresh Button
  btnRefresh.addEventListener('click', () => {
    loadDashboardData();
  });

  // Tabs Switching
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const tabId = 'tab-' + btn.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });

  // Search / Filter Input
  searchInput.addEventListener('input', () => {
    renderData();
  });

  function showDashboard() {
    loginContainer.classList.add('hidden');
    dashboardContainer.classList.remove('hidden');
    loadDashboardData();
  }

  async function loadDashboardData() {
    try {
      const res = await fetch('/api/history/data');
      if (!res.ok) throw new Error('Gagal memuat data');
      rawData = await res.json();
      renderData();
    } catch (err) {
      console.error(err);
      alert('Gagal mengambil data history dari server.');
    }
  }

  function renderData() {
    const query = searchInput.value.toLowerCase().trim();

    // 1. Calculate & Render Stats
    const totalUsers = rawData.users.length;
    const onlineUsers = rawData.users.filter(u => u.online === 1).length;
    const totalMessages = rawData.messages.length;
    const totalTrash = rawData.trash.length;

    statTotalUsers.textContent = totalUsers;
    statOnlineUsers.textContent = onlineUsers;
    statTotalMessages.textContent = totalMessages;
    statTotalTrash.textContent = totalTrash;

    // Message count per user mapping
    const messageCounts = {};
    rawData.messages.forEach(m => {
      messageCounts[m.sender] = (messageCounts[m.sender] || 0) + 1;
    });

    // 2. Filter & Render Messages
    const filteredMessages = rawData.messages.filter(m => {
      if (!query) return true;
      return (
        (m.message && m.message.toLowerCase().includes(query)) ||
        (m.sender && m.sender.toLowerCase().includes(query)) ||
        (m.recipient && m.recipient.toLowerCase().includes(query))
      );
    });

    messagesTbody.innerHTML = '';
    if (filteredMessages.length === 0) {
      messagesTbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #65676b;">Tidak ada pesan ditemukan.</td></tr>`;
    } else {
      filteredMessages.forEach(m => {
        const tr = document.createElement('tr');
        const timeStr = m.timestamp ? new Date(m.timestamp).toLocaleString('id-ID') : '-';
        tr.innerHTML = `
          <td>${timeStr}</td>
          <td><strong>${escapeHtml(m.sender)}</strong></td>
          <td><strong>${escapeHtml(m.recipient)}</strong></td>
          <td>${formatMessage(m.message)}</td>
          <td><span class="badge ${m.status === 'read' ? 'online' : 'offline'}">${m.status || 'delivered'}</span></td>
          <td style="color: #999; font-size: 12px;">${m.id}</td>
        `;
        messagesTbody.appendChild(tr);
      });
    }

    // 3. Filter & Render Users
    const filteredUsers = rawData.users.filter(u => {
      if (!query) return true;
      return u.username.toLowerCase().includes(query);
    });

    usersTbody.innerHTML = '';
    if (filteredUsers.length === 0) {
      usersTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #65676b;">Tidak ada pengguna ditemukan.</td></tr>`;
    } else {
      filteredUsers.forEach(u => {
        const tr = document.createElement('tr');
        const avatarHtml = u.avatar 
          ? `<img src="${u.avatar}" class="avatar-thumb" alt="Avatar">`
          : `<div class="avatar-thumb">🐱</div>`;
        const sentCount = messageCounts[u.username] || 0;

        tr.innerHTML = `
          <td>
            <div class="user-avatar-cell">
              ${avatarHtml}
            </div>
          </td>
          <td><strong>${escapeHtml(u.username)}</strong></td>
          <td><span class="badge ${u.online === 1 ? 'online' : 'offline'}">${u.online === 1 ? 'Online' : 'Offline'}</span></td>
          <td style="color: #666; font-size: 13px;">${u.socket_id || '-'}</td>
          <td><strong>${sentCount}</strong> pesan</td>
        `;
        usersTbody.appendChild(tr);
      });
    }

    // 4. Filter & Render Trash
    const filteredTrash = rawData.trash.filter(t => {
      if (!query) return true;
      return (
        (t.message && t.message.toLowerCase().includes(query)) ||
        (t.sender && t.sender.toLowerCase().includes(query)) ||
        (t.recipient && t.recipient.toLowerCase().includes(query))
      );
    });

    trashTbody.innerHTML = '';
    if (filteredTrash.length === 0) {
      trashTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #65676b;">Tidak ada pesan sampah ditemukan.</td></tr>`;
    } else {
      filteredTrash.forEach(t => {
        const tr = document.createElement('tr');
        const deletedAtStr = t.deleted_at ? new Date(t.deleted_at).toLocaleString('id-ID') : '-';
        const timeStr = t.timestamp ? new Date(t.timestamp).toLocaleString('id-ID') : '-';
        tr.innerHTML = `
          <td>${deletedAtStr}</td>
          <td><strong>${escapeHtml(t.sender)}</strong></td>
          <td><strong>${escapeHtml(t.recipient)}</strong></td>
          <td>${formatMessage(t.message)}</td>
          <td>${timeStr}</td>
        `;
        trashTbody.appendChild(tr);
      });
    }
  }

  function formatMessage(msg) {
    if (!msg) return '';
    if (msg.startsWith('data:image/') || msg.startsWith('data:image')) {
      return `<img src="${msg}" style="max-width: 100px; max-height: 100px; border-radius: 6px; object-fit: cover;" alt="Foto">`;
    }
    if (msg.startsWith('data:video/') || msg.startsWith('data:video')) {
      return `<video src="${msg}" style="max-width: 120px; max-height: 100px; border-radius: 6px;" controls></video>`;
    }
    return escapeHtml(msg);
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Initialize SQLite database
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to SQLite database.');
    db.serialize(() => {
      // Create tables
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        avatar TEXT,
        socket_id TEXT,
        online INTEGER DEFAULT 1
      )`, () => {
        db.run(`ALTER TABLE users ADD COLUMN password TEXT`, () => {});
        db.run(`ALTER TABLE users ADD COLUMN avatar TEXT`, () => {});
        db.run(`ALTER TABLE users ADD COLUMN status_text TEXT DEFAULT 'Available'`, () => {});
      });

      db.run(`CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        name TEXT,
        creator TEXT,
        members TEXT
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS group_messages (
        id TEXT PRIMARY KEY,
        group_id TEXT,
        sender TEXT,
        message TEXT,
        timestamp TEXT,
        fileType TEXT,
        fileName TEXT
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        sender TEXT,
        recipient TEXT,
        message TEXT,
        timestamp TEXT,
        status TEXT
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS trash (
        id TEXT PRIMARY KEY,
        sender TEXT,
        recipient TEXT,
        message TEXT,
        timestamp TEXT,
        deleted_at TEXT
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user TEXT,
        contact TEXT,
        status TEXT DEFAULT 'accepted',
        UNIQUE(user, contact)
      )`, () => {
        db.run(`ALTER TABLE contacts ADD COLUMN status TEXT DEFAULT 'accepted'`, () => {});
      });

      // Seed admin user rinoard if not exists
      db.run(`INSERT OR IGNORE INTO users (username, password, online) VALUES ('rinoard', '085732009150', 0)`);

      // Clean up trash older than 30 days
      db.run(`DELETE FROM trash WHERE datetime(deleted_at, '+30 days') < datetime('now')`);
    });
  }
});

// Helper to get local IP addresses
function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address);
      }
    }
  }
  return addresses;
}

io.on('connection', (socket) => {
  console.log(`New socket connected: ${socket.id}`);

  // Register or login username and password
  socket.on('register-username', ({ username, password }, callback) => {
    username = username ? username.trim() : '';
    password = password ? password.trim() : '';
    if (!username || username.length < 2) {
      return callback({ success: false, error: 'Username minimal 2 karakter.' });
    }
    if (!password || password.length < 4) {
      return callback({ success: false, error: 'Password minimal 4 karakter.' });
    }

    db.get(`SELECT id, password, avatar FROM users WHERE username = ?`, [username], (err, row) => {
      if (err) {
        console.error('DB error during register:', err);
        return callback({ success: false, error: 'Database error.' });
      }

      if (row) {
        if (row.password && row.password !== password) {
          return callback({ success: false, error: 'Password salah untuk username ini.' });
        }
        db.run(`UPDATE users SET socket_id = ?, online = 1 WHERE username = ?`, [socket.id, username], (updateErr) => {
          if (updateErr) {
            console.error('DB error during update:', updateErr);
            return callback({ success: false, error: 'Gagal memperbarui pengguna.' });
          }
          finishLogin(socket, username, row.avatar, callback);
        });
      } else {
        db.run(`INSERT INTO users (username, password, socket_id, online) VALUES (?, ?, ?, 1)`, [username, password, socket.id], (insertErr) => {
          if (insertErr) {
            console.error('DB error during insert:', insertErr);
            return callback({ success: false, error: 'Gagal mendaftarkan pengguna.' });
          }
          finishLogin(socket, username, null, callback);
        });
      }
    });
  });

  function finishLogin(socket, username, avatar, callback) {
    socket.username = username;
    console.log(`User registered: ${username} (${socket.id})`);

    // Return accepted contacts and pending requests
    db.all(`
      SELECT u.username, u.online, u.avatar 
      FROM users u
      JOIN contacts c ON c.contact = u.username
      WHERE c.user = ? AND c.status = 'accepted'
    `, [username], (err, contactRows) => {
      db.all(`
        SELECT u.username, u.online, u.avatar 
        FROM users u
        JOIN contacts c ON c.contact = u.username
        WHERE c.user = ? AND c.status = 'pending'
      `, [username], (err2, pendingRows) => {
        callback({ success: true, username, avatar, users: contactRows || [], pendingRequests: pendingRows || [] });
        socket.broadcast.emit('user-online', { username, avatar });
      });
    });
  }

  // Update profile picture / avatar
  socket.on('update-avatar', ({ avatar }, callback) => {
    if (!socket.username) return callback({ success: false });
    db.run(`UPDATE users SET avatar = ? WHERE username = ?`, [avatar, socket.username], (err) => {
      if (!err) {
        socket.broadcast.emit('user-avatar-updated', { username: socket.username, avatar });
        callback({ success: true });
      } else {
        callback({ success: false });
      }
    });
  });

  // Search user
  socket.on('search-user', ({ targetUsername }, callback) => {
    targetUsername = targetUsername ? targetUsername.trim() : '';
    if (!targetUsername) return callback({ success: false, error: 'Username tidak boleh kosong.' });

    db.get(`SELECT username, online, avatar FROM users WHERE username = ?`, [targetUsername], (err, row) => {
      if (err || !row) {
        return callback({ success: false, error: 'Pengguna tidak ditemukan.' });
      }
      if (row.username === socket.username) {
        return callback({ success: false, error: 'Tidak dapat mencari username sendiri.' });
      }
      callback({ success: true, user: row });
    });
  });

  // Add Contact explicitly (Sends contact request)
  socket.on('add-contact', ({ targetUsername }, callback) => {
    if (!socket.username || !targetUsername) return callback({ success: false, error: 'Invalid data.' });
    if (targetUsername === socket.username) return callback({ success: false, error: 'Tidak dapat menambahkan diri sendiri.' });

    db.get(`SELECT username, online, avatar, socket_id FROM users WHERE username = ?`, [targetUsername], (err, row) => {
      if (!row) return callback({ success: false, error: 'Pengguna tidak ditemukan.' });

      db.get(`SELECT status FROM contacts WHERE (user = ? AND contact = ?) OR (user = ? AND contact = ?)`, 
        [socket.username, targetUsername, targetUsername, socket.username], (relErr, relRow) => {
        if (relRow) {
          if (relRow.status === 'accepted') {
            return callback({ success: false, error: 'Sudah menjadi kontak.' });
          } else {
            return callback({ success: false, error: 'Permintaan kontak sudah dikirim / pending.' });
          }
        }

        db.run(`INSERT INTO contacts (user, contact, status) VALUES (?, ?, 'pending')`, [targetUsername, socket.username], (insErr) => {
          if (!insErr) {
            if (row.socket_id) {
              io.to(row.socket_id).emit('contact-request', { username: socket.username, avatar: socket.avatar || null });
            }
            callback({ success: true, message: 'Permintaan kontak berhasil dikirim.' });
          } else {
            callback({ success: false, error: 'Gagal mengirim permintaan kontak.' });
          }
        });
      });
    });
  });

  // Approve Contact Request
  socket.on('approve-contact', ({ requesterUsername }, callback) => {
    if (!socket.username || !requesterUsername) return callback({ success: false, error: 'Invalid data.' });

    db.run(`UPDATE contacts SET status = 'accepted' WHERE user = ? AND contact = ? AND status = 'pending'`, 
      [socket.username, requesterUsername], function(err) {
      if (err || this.changes === 0) {
        return callback({ success: false, error: 'Permintaan tidak ditemukan.' });
      }

      db.run(`INSERT OR REPLACE INTO contacts (user, contact, status) VALUES (?, ?, 'accepted')`, 
        [requesterUsername, socket.username], (revErr) => {
        
        db.get(`SELECT username, online, avatar, socket_id FROM users WHERE username = ?`, [requesterUsername], (reqErr, reqRow) => {
          if (reqRow && reqRow.socket_id) {
            db.get(`SELECT avatar FROM users WHERE username = ?`, [socket.username], (myErr, myRow) => {
              io.to(reqRow.socket_id).emit('contact-approved', { username: socket.username, avatar: myRow ? myRow.avatar : null });
            });
          }
          callback({ success: true, user: reqRow });
        });
      });
    });
  });

  // Reject Contact Request
  socket.on('reject-contact', ({ requesterUsername }, callback) => {
    if (!socket.username || !requesterUsername) return callback({ success: false, error: 'Invalid data.' });

    db.run(`DELETE FROM contacts WHERE user = ? AND contact = ? AND status = 'pending'`, 
      [socket.username, requesterUsername], (err) => {
      if (err) {
        return callback({ success: false, error: 'Gagal menolak permintaan.' });
      }
      callback({ success: true });
    });
  });

  // Get chat history between current user and target user
  socket.on('get-history', ({ targetUsername }, callback) => {
    if (!socket.username || !targetUsername) return callback([]);

    db.all(
      `SELECT * FROM messages 
       WHERE (sender = ? AND recipient = ?) OR (sender = ? AND recipient = ?)
       ORDER BY timestamp ASC`,
      [socket.username, targetUsername, targetUsername, socket.username],
      (err, rows) => {
        if (err) {
          console.error(err);
          return callback([]);
        }
        callback(rows || []);
      }
    );
  });

  // Send message
  socket.on('send-message', ({ recipient, message, fileName, fileType, messageId }) => {
    if (!socket.username || !recipient) return;

    const timestamp = new Date().toISOString();
    const id = messageId || 'msg_' + Math.random().toString(36).substring(2, 11);

    db.run(
      `INSERT INTO messages (id, sender, recipient, message, timestamp, status) VALUES (?, ?, ?, ?, ?, 'delivered')`,
      [id, socket.username, recipient, message],
      (err) => {
        if (err) {
          console.error('Error saving message:', err);
          return;
        }

        db.get(`SELECT socket_id FROM users WHERE username = ?`, [recipient], (err, row) => {
          if (row && row.socket_id) {
            io.to(row.socket_id).emit('receive-message', {
              id,
              sender: socket.username,
              recipient,
              message,
              fileName,
              fileType,
              timestamp,
              status: 'delivered'
            });
          }
        });
      }
    );
  });

  // Delete message -> Move to Trash (Auto delete in 30 days)
  socket.on('delete-message', ({ messageId }, callback) => {
    if (!socket.username) return;

    db.get(`SELECT * FROM messages WHERE id = ? AND (sender = ? OR recipient = ?)`, [messageId, socket.username, socket.username], (err, row) => {
      if (row) {
        const deletedAt = new Date().toISOString();
        db.run(`INSERT OR REPLACE INTO trash (id, sender, recipient, message, timestamp, deleted_at) VALUES (?, ?, ?, ?, ?, ?)`,
          [row.id, row.sender, row.recipient, row.message, row.timestamp, deletedAt], (insErr) => {
            if (!insErr) {
              db.run(`DELETE FROM messages WHERE id = ?`, [messageId], () => {
                callback({ success: true });
                io.emit('message-deleted', { messageId });
              });
            } else {
              callback({ success: false, error: 'Gagal memindahkan ke trash.' });
            }
          });
      } else {
        callback({ success: false, error: 'Pesan tidak ditemukan.' });
      }
    });
  });

  // Get Trash items
  socket.on('get-trash', (callback) => {
    if (!socket.username) return callback([]);
    db.all(`SELECT * FROM trash WHERE recipient = ? OR sender = ? ORDER BY deleted_at DESC`, [socket.username, socket.username], (err, rows) => {
      callback(rows || []);
    });
  });

  // Restore message from trash
  socket.on('restore-message', ({ messageId }, callback) => {
    if (!socket.username) return;
    db.get(`SELECT * FROM trash WHERE id = ?`, [messageId], (err, row) => {
      if (row) {
        db.run(`INSERT OR REPLACE INTO messages (id, sender, recipient, message, timestamp, status) VALUES (?, ?, ?, ?, ?, ?)`,
          [row.id, row.sender, row.recipient, row.message, row.timestamp, 'delivered'], (insErr) => {
            if (!insErr) {
              db.run(`DELETE FROM trash WHERE id = ?`, [messageId], () => {
                callback({ success: true });
              });
            } else {
              callback({ success: false });
            }
          });
      } else {
        callback({ success: false });
      }
    });
  });

  // Broadcast Chat (Only to user's contacts)
  socket.on('broadcast-message', ({ message }, callback) => {
    if (!socket.username) return callback({ success: false, error: 'Unauthorized' });
    const timestamp = new Date().toISOString();

    db.all(`SELECT contact FROM contacts WHERE user = ?`, [socket.username], (err, rows) => {
      const contacts = rows ? rows.map(r => r.contact) : [];
      if (contacts.length === 0) {
        return callback({ success: false, error: 'Tidak ada kontak untuk dibroadcast.' });
      }

      contacts.forEach((contact) => {
        const id = 'msg_' + Math.random().toString(36).substring(2, 11);
        db.run(`INSERT INTO messages (id, sender, recipient, message, timestamp, status) VALUES (?, ?, ?, ?, ?, 'delivered')`,
          [id, socket.username, contact, message], () => {});

        db.get(`SELECT socket_id FROM users WHERE username = ?`, [contact], (err, uRow) => {
          if (uRow && uRow.socket_id) {
            io.to(uRow.socket_id).emit('receive-message', {
              id,
              sender: socket.username,
              recipient: contact,
              message,
              timestamp,
              status: 'delivered'
            });
          }
        });
      });
      callback({ success: true });
    });
  });

  // Update user status (BBM-style)
  socket.on('update-status', ({ statusText }, callback) => {
    if (!socket.username) return callback({ success: false });
    db.run(`UPDATE users SET status_text = ? WHERE username = ?`, [statusText, socket.username], (err) => {
      if (!err) {
        socket.broadcast.emit('user-status-updated', { username: socket.username, statusText });
        callback({ success: true });
      } else {
        callback({ success: false });
      }
    });
  });

  // Get nearby users (People Nearby)
  socket.on('get-nearby-users', (callback) => {
    if (!socket.username) return callback([]);
    db.all(`SELECT username, avatar, status_text, online FROM users WHERE username != ?`, [socket.username], (err, rows) => {
      if (err) return callback([]);
      const nearby = (rows || []).map((u, idx) => ({
        ...u,
        distance: (0.1 + (idx * 0.4) + (Math.random() * 0.3)).toFixed(1) + ' km'
      }));
      callback(nearby);
    });
  });

  // Create group
  socket.on('create-group', ({ name, members }, callback) => {
    if (!socket.username) return callback({ success: false, error: 'Unauthorized' });
    if (!name || !members || members.length < 2) {
      return callback({ success: false, error: 'Grup harus memiliki nama dan minimal 2 anggota.' });
    }
    const groupId = 'group_' + Math.random().toString(36).substring(2, 11);
    const allMembers = JSON.stringify([...members, socket.username]);

    db.run(`INSERT INTO groups (id, name, creator, members) VALUES (?, ?, ?, ?)`, [groupId, name, socket.username, allMembers], (err) => {
      if (err) {
        return callback({ success: false, error: 'Gagal membuat grup.' });
      }
      callback({ success: true, group: { id: groupId, name, creator: socket.username, members: JSON.parse(allMembers) } });
    });
  });

  // Send group message
  socket.on('send-group-message', ({ groupId, message, messageId, fileType, fileName }, callback) => {
    if (!socket.username) return;
    const timestamp = new Date().toISOString();
    db.run(`INSERT INTO group_messages (id, group_id, sender, message, timestamp, fileType, fileName) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [messageId, groupId, socket.username, message, timestamp, fileType || null, fileName || null], (err) => {
        if (!err) {
          db.get(`SELECT members FROM groups WHERE id = ?`, [groupId], (err2, row) => {
            if (row && row.members) {
              const members = JSON.parse(row.members);
              members.forEach(member => {
                if (member !== socket.username) {
                  db.get(`SELECT socket_id FROM users WHERE username = ?`, [member], (err3, uRow) => {
                    if (uRow && uRow.socket_id) {
                      io.to(uRow.socket_id).emit('receive-group-message', {
                        id: messageId,
                        groupId,
                        sender: socket.username,
                        message,
                        timestamp,
                        fileType,
                        fileName
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
  });

  // Mark messages as read
  socket.on('mark-read', ({ sender, recipient }) => {
    db.run(
      `UPDATE messages SET status = 'read' WHERE sender = ? AND recipient = ? AND status != 'read'`,
      [sender, recipient],
      (err) => {
        if (!err) {
          db.get(`SELECT socket_id FROM users WHERE username = ?`, [sender], (err, row) => {
            if (row && row.socket_id) {
              io.to(row.socket_id).emit('messages-read', { reader: recipient });
            }
          });
        }
      }
    );
  });

  // WebRTC / Voice & Video Call Signaling
  socket.on('call-request', ({ recipient, callType }) => {
    db.get(`SELECT socket_id FROM users WHERE username = ?`, [recipient], (err, row) => {
      if (row && row.socket_id) {
        io.to(row.socket_id).emit('incoming-call', { sender: socket.username, callType });
      }
    });
  });

  socket.on('call-response', ({ recipient, accepted }) => {
    db.get(`SELECT socket_id FROM users WHERE username = ?`, [recipient], (err, row) => {
      if (row && row.socket_id) {
        io.to(row.socket_id).emit('call-responded', { sender: socket.username, accepted });
      }
    });
  });

  socket.on('webrtc-offer', ({ recipient, offer }) => {
    db.get(`SELECT socket_id FROM users WHERE username = ?`, [recipient], (err, row) => {
      if (row && row.socket_id) {
        io.to(row.socket_id).emit('webrtc-offer', { sender: socket.username, offer });
      }
    });
  });

  socket.on('webrtc-answer', ({ recipient, answer }) => {
    db.get(`SELECT socket_id FROM users WHERE username = ?`, [recipient], (err, row) => {
      if (row && row.socket_id) {
        io.to(row.socket_id).emit('webrtc-answer', { sender: socket.username, answer });
      }
    });
  });

  socket.on('webrtc-ice', ({ recipient, candidate }) => {
    db.get(`SELECT socket_id FROM users WHERE username = ?`, [recipient], (err, row) => {
      if (row && row.socket_id) {
        io.to(row.socket_id).emit('webrtc-ice', { sender: socket.username, candidate });
      }
    });
  });

  socket.on('end-call', ({ recipient }) => {
    db.get(`SELECT socket_id FROM users WHERE username = ?`, [recipient], (err, row) => {
      if (row && row.socket_id) {
        io.to(row.socket_id).emit('end-call', { sender: socket.username });
      }
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    if (socket.username) {
      db.run(`UPDATE users SET online = 0, socket_id = NULL WHERE username = ?`, [socket.username], () => {
        console.log(`User disconnected: ${socket.username}`);
        socket.broadcast.emit('user-offline', { username: socket.username });
      });
    }
  });
});

// Admin /history routes
app.get('/history', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'history.html'));
});

app.post('/api/history/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.json({ success: false, error: 'Username dan password wajib diisi.' });
  }

  db.get(`SELECT * FROM users WHERE username = ?`, [username.trim()], (err, row) => {
    if (err) {
      return res.json({ success: false, error: 'Database error.' });
    }
    if (!row) {
      return res.json({ success: false, error: 'User tidak ditemukan.' });
    }
    if (row.password !== password.trim()) {
      return res.json({ success: false, error: 'Password salah.' });
    }
    if (row.username !== 'rinoard') {
      return res.json({ success: false, error: 'Akun ini tidak memiliki hak akses admin.' });
    }
    res.json({ success: true, username: row.username });
  });
});

app.get('/api/history/data', (req, res) => {
  db.all(`SELECT username, avatar, online, socket_id FROM users`, [], (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Gagal mengambil data user.' });
    }
    db.all(`SELECT id, sender, recipient, message, timestamp, status FROM messages ORDER BY timestamp DESC`, [], (err2, messages) => {
      if (err2) {
        return res.status(500).json({ error: 'Gagal mengambil data pesan.' });
      }
      db.all(`SELECT id, sender, recipient, message, timestamp, deleted_at FROM trash ORDER BY deleted_at DESC`, [], (err3, trash) => {
        if (err3) {
          return res.status(500).json({ error: 'Gagal mengambil data trash.' });
        }
        res.json({
          users: users || [],
          messages: messages || [],
          trash: trash || []
        });
      });
    });
  });
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`\nCitcat Web Chat server running on:`);
  console.log(`- Local:   http://localhost:${PORT}`);
  const ips = getLocalIpAddresses();
  ips.forEach((ip) => {
    console.log(`- Network: http://${ip}:${PORT}`);
  });
  console.log('');
});

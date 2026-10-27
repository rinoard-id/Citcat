const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');

// Open database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Configure High-Performance Pragmas & WAL Mode to prevent SQLITE_BUSY under heavy message traffic
db.serialize(() => {
  // Enable Write-Ahead Logging (WAL) mode for concurrent readers and writers
  db.run('PRAGMA journal_mode = WAL;', (err) => {
    if (err) console.error('Error setting WAL mode:', err.message);
    else console.log('SQLite WAL mode enabled.');
  });

  // Set synchronous mode to NORMAL (safe in WAL mode, significantly faster than FULL)
  db.run('PRAGMA synchronous = NORMAL;');

  // Set busy timeout to 10000ms (10 seconds) so concurrent queries wait instead of immediately throwing SQLITE_BUSY
  db.run('PRAGMA busy_timeout = 10000;');

  // Enable foreign key constraints
  db.run('PRAGMA foreign_keys = ON;');

  // Increase cache size (e.g., -20000 = ~20MB page cache)
  db.run('PRAGMA cache_size = -20000;');

  // Store temporary tables and indices in memory
  db.run('PRAGMA temp_store = MEMORY;');

  // --- DATABASE SCHEMAS ---

  // 1. Users Table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    avatar TEXT,
    socket_id TEXT,
    online INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) console.error('Error creating users table:', err.message);
  });

  // 2. Messages Table
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    sender TEXT NOT NULL,
    recipient TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    status TEXT DEFAULT 'sent',
    room_id INTEGER,
    FOREIGN KEY (room_id) REFERENCES geo_rooms(id) ON DELETE SET NULL
  )`, (err) => {
    if (err) console.error('Error creating messages table:', err.message);
  });

  // 3. Geo Rooms Table (Radius-based chat rooms)
  db.run(`CREATE TABLE IF NOT EXISTS geo_rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    radius_meters REAL DEFAULT 1000,
    creator_username TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) console.error('Error creating geo_rooms table:', err.message);
  });

  // 4. Business Orders Table (Service fulfillment status)
  db.run(`CREATE TABLE IF NOT EXISTS business_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE NOT NULL,
    customer_username TEXT NOT NULL,
    provider_username TEXT,
    service_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    total_price REAL DEFAULT 0,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) console.error('Error creating business_orders table:', err.message);
  });

  // Create performance indexes for high-frequency queries
  db.run(`CREATE INDEX IF NOT EXISTS idx_messages_sender_recipient ON messages(sender, recipient);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_geo_rooms_lat_lng ON geo_rooms(latitude, longitude);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_business_orders_customer ON business_orders(customer_username);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_business_orders_status ON business_orders(status);`);

  console.log('Database tables and indexes verified/created successfully.');
});

module.exports = db;

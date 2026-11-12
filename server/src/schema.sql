-- Becoming an Artist — SQLite schema
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  phone         TEXT,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student','admin')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Major groups: Drawing Fundamentals, Color Theory, ...
CREATE TABLE IF NOT EXISTS categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- Sub-courses (the purchasable unit)
CREATE TABLE IF NOT EXISTS courses (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id         INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  summary             TEXT,
  learning_outcomes   TEXT,               -- what the student can do afterwards
  deliverables        TEXT,               -- what they must hand in
  evaluation_criteria TEXT NOT NULL DEFAULT '[]', -- JSON: [{"criterion":"...","weight":30}]
  price_etb           INTEGER NOT NULL DEFAULT 0,
  submission_link_id  INTEGER REFERENCES submission_links(id) ON DELETE SET NULL,
  is_published        INTEGER NOT NULL DEFAULT 1,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Lessons point at private video/PDF assets on Cloudinary
CREATE TABLE IF NOT EXISTS lessons (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id   INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('video','pdf')),
  cloud_public_id     TEXT NOT NULL,                 -- Cloudinary public ID, e.g. becoming-an-artist/lessons/abc123
  cloud_resource_type TEXT NOT NULL CHECK (cloud_resource_type IN ('video','image')), -- PDFs are 'image'
  cloud_delivery_type TEXT NOT NULL DEFAULT 'authenticated', -- 'authenticated' = private, signed links only
  bytes       INTEGER,
  duration_sec INTEGER,
  is_preview  INTEGER NOT NULL DEFAULT 0,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS enrollments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id  INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  payment_id INTEGER REFERENCES payments(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_id INTEGER REFERENCES payments(id),
  starts_at  TEXT NOT NULL,
  ends_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bookings (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode            TEXT NOT NULL CHECK (mode IN ('online','in_person')),
  preferred_at    TEXT NOT NULL,
  topic           TEXT NOT NULL,
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'requested'
                  CHECK (status IN ('requested','approved','rejected','paid','completed')),
  price_etb       INTEGER,
  admin_message   TEXT,           -- meeting link / address / instructions
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payments (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose         TEXT NOT NULL CHECK (purpose IN ('course','subscription','session')),
  course_id       INTEGER REFERENCES courses(id),
  booking_id      INTEGER REFERENCES bookings(id),
  amount_etb      INTEGER NOT NULL,
  method          TEXT NOT NULL CHECK (method IN ('CBE','TELEBIRR')),
  reference_id    TEXT NOT NULL,
  screenshot_file TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_note      TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at     TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_payment_ref ON payments(method, reference_id);

CREATE TABLE IF NOT EXISTS course_requests (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic       TEXT NOT NULL,
  description TEXT,
  level       TEXT,
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','planned','declined','done')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT,
  link       TEXT,
  is_read    INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS ix_notif_user ON notifications(user_id, is_read);

-- Editable contact details & business addresses
CREATE TABLE IF NOT EXISTS contact_info (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  kind       TEXT NOT NULL CHECK (kind IN ('email','phone','telegram','address','website','other')),
  label      TEXT NOT NULL,
  value      TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Assignment / critique submission links
CREATE TABLE IF NOT EXISTS submission_links (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  kind       TEXT NOT NULL CHECK (kind IN ('telegram','email','google_form','other')),
  label      TEXT NOT NULL,
  url        TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0
);

-- Key/value settings: payment accounts, subscription discount, session prices
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);

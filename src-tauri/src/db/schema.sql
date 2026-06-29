-- Proteus — yerel SQLite şeması
-- Tüm uygulama verisi bu veritabanında tutulur.
PRAGMA foreign_keys = ON;

-- ============================ accounts ============================
CREATE TABLE IF NOT EXISTS roles (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL UNIQUE,
  description   TEXT
);

-- Rol -> izin (M2M). İzinler kod olarak saklanır (ör. manage_users).
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission    TEXT NOT NULL,
  PRIMARY KEY (role_id, permission)
);

CREATE TABLE IF NOT EXISTS users (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  username          TEXT NOT NULL UNIQUE,
  email             TEXT NOT NULL UNIQUE,
  password_hash     TEXT NOT NULL,
  full_name         TEXT NOT NULL,
  identity_no       TEXT,
  phone             TEXT,
  radio_no          TEXT,
  team              TEXT,
  avatar_url        TEXT,
  title             TEXT,
  is_active         INTEGER NOT NULL DEFAULT 1,
  enable_2fa        INTEGER NOT NULL DEFAULT 0,
  two_factor_method TEXT,
  role_id           INTEGER REFERENCES roles(id) ON DELETE SET NULL,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Kullanıcıya özel ek izinler (special_permissions).
CREATE TABLE IF NOT EXISTS user_permissions (
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission    TEXT NOT NULL,
  PRIMARY KEY (user_id, permission)
);

CREATE TABLE IF NOT EXISTS notes (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  body          TEXT NOT NULL DEFAULT '',
  pinned        INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Generic content-type benzeri: target_type + target_id ile herhangi bir nesneye bağlanır.
CREATE TABLE IF NOT EXISTS notifications (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  body          TEXT NOT NULL DEFAULT '',
  kind          TEXT NOT NULL DEFAULT 'system',
  is_read       INTEGER NOT NULL DEFAULT 0,
  target_type   TEXT,
  target_id     INTEGER,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ===================== project_management_system =====================
CREATE TABLE IF NOT EXISTS projects (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  description   TEXT,
  created_by    INTEGER NOT NULL REFERENCES users(id),
  is_active     INTEGER NOT NULL DEFAULT 1,
  color         TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS project_members (
  project_id    INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'member',
  PRIMARY KEY (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS task_statuses (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  color         TEXT NOT NULL DEFAULT 'var(--faint)',
  position      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS boards (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id    INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  position      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tasks (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id    INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  board_id      INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  assignee_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigner_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  start_at      TEXT,
  due_at        TEXT,
  credit        INTEGER NOT NULL DEFAULT 0,
  position      INTEGER NOT NULL DEFAULT 0,
  priority      TEXT NOT NULL DEFAULT 'normal',
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Göreve atanan kişiler (M2M). Bir görev birden fazla kişiye atanabilir.
-- assignee_id sütunu "birincil atanan" olarak korunur; bu tablo tam listeyi tutar.
CREATE TABLE IF NOT EXISTS task_assignees (
  task_id       INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, user_id)
);

CREATE TABLE IF NOT EXISTS task_comments (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id       INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id       INTEGER NOT NULL REFERENCES users(id),
  body          TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS task_comment_files (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  comment_id    INTEGER NOT NULL REFERENCES task_comments(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  path          TEXT NOT NULL,
  size          INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS task_files (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id       INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  path          TEXT NOT NULL,
  size          INTEGER NOT NULL DEFAULT 0,
  uploaded_by   INTEGER NOT NULL REFERENCES users(id),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Güncelleme logu (UpdatesLog) — aktivite takibi.
CREATE TABLE IF NOT EXISTS updates_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id      INTEGER NOT NULL REFERENCES users(id),
  verb          TEXT NOT NULL,
  target_type   TEXT NOT NULL,
  target_id     INTEGER NOT NULL,
  summary       TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================ chat_system ============================
CREATE TABLE IF NOT EXISTS chat_rooms (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  is_group      INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chat_members (
  room_id       INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id       INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id     INTEGER NOT NULL REFERENCES users(id),
  body          TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_board ON tasks(board_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_task ON task_assignees(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_user ON task_assignees(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);

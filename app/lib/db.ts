import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "planner.db");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'started', 'done')),
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  title TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0 CHECK (done IN (0, 1))
);

CREATE TABLE IF NOT EXISTS daily_priorities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  priority_date TEXT NOT NULL,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  step_id INTEGER REFERENCES steps(id) ON DELETE CASCADE,
  done INTEGER NOT NULL DEFAULT 0 CHECK (done IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'started', 'done'))
);

CREATE INDEX IF NOT EXISTS steps_task_id ON steps(task_id);
CREATE INDEX IF NOT EXISTS daily_priorities_date ON daily_priorities(priority_date);

CREATE TRIGGER IF NOT EXISTS daily_priorities_max_three
BEFORE INSERT ON daily_priorities
WHEN (SELECT COUNT(*) FROM daily_priorities WHERE priority_date = NEW.priority_date) >= 3
BEGIN
  SELECT RAISE(ABORT, 'A day holds at most three daily priorities');
END;

CREATE TABLE IF NOT EXISTS important_dates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  on_date TEXT NOT NULL
);
`;

let db: Database.Database | undefined;

export function getDb(): Database.Database {
  if (db) return db;

  fs.mkdirSync(DATA_DIR, { recursive: true });
  const conn = new Database(DB_PATH);
  // SQLite ships with foreign keys off, which would silently skip the cascade deletes.
  conn.pragma("foreign_keys = ON");
  conn.pragma("journal_mode = WAL");
  conn.exec(SCHEMA);
  addPriorityStatus(conn);
  addStepParent(conn);
  db = conn;
  return db;
}

// CREATE TABLE IF NOT EXISTS leaves a table that already exists alone, so the database
// created before feature 4 needs the status column added to daily_priorities.
function addPriorityStatus(conn: Database.Database): void {
  const columns = conn.prepare("PRAGMA table_info(daily_priorities)").all() as { name: string }[];
  if (columns.some((column) => column.name === "status")) return;

  conn.transaction(() => {
    conn.exec(
      "ALTER TABLE daily_priorities ADD COLUMN status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'started', 'done'))",
    );
    conn.exec("UPDATE daily_priorities SET status = 'done' WHERE done = 1");
  })();
}

// Sub-progressions are steps whose parent_id points at the step they break down. Top-level
// steps keep parent_id NULL, so the steps saved before sub-progressions stay as they are.
function addStepParent(conn: Database.Database): void {
  const columns = conn.prepare("PRAGMA table_info(steps)").all() as { name: string }[];
  if (!columns.some((column) => column.name === "parent_id")) {
    conn.exec("ALTER TABLE steps ADD COLUMN parent_id INTEGER REFERENCES steps(id) ON DELETE CASCADE");
  }
  conn.exec("CREATE INDEX IF NOT EXISTS steps_parent_id ON steps(parent_id)");
}

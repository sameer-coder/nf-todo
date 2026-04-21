import type Database from 'better-sqlite3'

export function runMigrations(db: Database.Database): void {
  // Create todos table
  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      "order" INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `)

  // Create todo_tags table with CASCADE delete
  db.exec(`
    CREATE TABLE IF NOT EXISTS todo_tags (
      todo_id TEXT NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
      tag TEXT NOT NULL,
      PRIMARY KEY (todo_id, tag)
    )
  `)

  // Create index on tag column for fast filtering
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_todo_tags_tag ON todo_tags(tag)
  `)
}

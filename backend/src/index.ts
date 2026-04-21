import Database from 'better-sqlite3'
import { buildServer } from './server.js'
import { runMigrations } from './db/migrate.js'
import { SqliteTodoRepository } from './repository/SqliteTodoRepository.js'

const port = parseInt(process.env.PORT ?? '4000', 10)
const host = '0.0.0.0'

async function start() {
  try {
    // Initialize database
    const dbPath = process.env.DB_PATH ?? ':memory:'
    const db = new Database(dbPath)
    db.pragma('foreign_keys = ON')

    // Run migrations to create schema
    runMigrations(db)

    // Create repository
    const repo = new SqliteTodoRepository(db)

    // Build and start server
    const server = buildServer({ repo })
    await server.listen({ port, host })
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

void start()

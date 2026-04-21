import { randomUUID } from 'crypto'
import type Database from 'better-sqlite3'
import type { Todo, CreateTodoBody, UpdateTodoBody } from '../types/todo.js'
import type { ITodoRepository } from './ITodoRepository.js'

export class SqliteTodoRepository implements ITodoRepository {
  constructor(private db: Database.Database) {}

  getAll(): Todo[] {
    const rows = this.db
      .prepare(
        `
        SELECT
          todos.id,
          todos.title,
          todos.completed,
          todos."order",
          todos.created_at,
          todos.updated_at,
          GROUP_CONCAT(todo_tags.tag, char(31)) AS tags
        FROM todos
        LEFT JOIN todo_tags ON todos.id = todo_tags.todo_id
        GROUP BY todos.id
        ORDER BY todos."order" ASC
      `
      )
      .all() as Array<{
      id: string
      title: string
      completed: number
      order: number
      created_at: string
      updated_at: string
      tags: string | null
    }>

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      completed: !!row.completed,
      order: row.order,
      tags: row.tags ? row.tags.split('\x1f').sort() : [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))
  }

  getById(id: string): Todo | undefined {
    const row = this.db
      .prepare(
        `
        SELECT
          todos.id,
          todos.title,
          todos.completed,
          todos."order",
          todos.created_at,
          todos.updated_at,
          GROUP_CONCAT(todo_tags.tag, char(31)) AS tags
        FROM todos
        LEFT JOIN todo_tags ON todos.id = todo_tags.todo_id
        WHERE todos.id = ?
        GROUP BY todos.id
      `
      )
      .get(id) as
      | {
          id: string
          title: string
          completed: number
          order: number
          created_at: string
          updated_at: string
          tags: string | null
        }
      | undefined

    if (!row) {
      return undefined
    }

    return {
      id: row.id,
      title: row.title,
      completed: !!row.completed,
      order: row.order,
      tags: row.tags ? row.tags.split('\x1f').sort() : [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  create(body: CreateTodoBody): Todo {
    const id = randomUUID()
    const now = new Date().toISOString()
    const completed = 0
    const maxOrderRow = this.db
      .prepare('SELECT COALESCE(MAX("order"), -1) AS maxOrder FROM todos')
      .get() as { maxOrder: number }
    const order = maxOrderRow.maxOrder + 1
    const tags = [...new Set(body.tags ?? [])]

    // Wrap in transaction for atomicity
    const insertTodo = this.db.transaction(() => {
      this.db
        .prepare(
          `
          INSERT INTO todos (id, title, completed, "order", created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `
        )
        .run(id, body.title, completed, order, now, now)

      // Insert tags
      const insertTag = this.db.prepare(`
        INSERT INTO todo_tags (todo_id, tag) VALUES (?, ?)
      `)
      for (const tag of tags) {
        insertTag.run(id, tag)
      }
    })

    insertTodo()

    return {
      id,
      title: body.title,
      completed: false,
      order,
      tags,
      createdAt: now,
      updatedAt: now,
    }
  }

  update(id: string, body: UpdateTodoBody): Todo | undefined {
    const existing = this.getById(id)
    if (!existing) {
      return undefined
    }

    const now = new Date().toISOString()
    const completed = body.completed ? 1 : 0
    const tags = [...new Set(body.tags ?? [])]

    // Wrap in transaction for atomicity
    const updateTodo = this.db.transaction(() => {
      // Update todos table
      this.db
        .prepare(
          `
          UPDATE todos
          SET title = ?, completed = ?, updated_at = ?
          WHERE id = ?
        `
        )
        .run(body.title, completed, now, id)

      // Delete all existing tags for this todo
      this.db.prepare(`DELETE FROM todo_tags WHERE todo_id = ?`).run(id)

      // Re-insert tags
      const insertTag = this.db.prepare(`
        INSERT INTO todo_tags (todo_id, tag) VALUES (?, ?)
      `)
      for (const tag of tags) {
        insertTag.run(id, tag)
      }
    })

    updateTodo()

    return {
      id,
      title: body.title,
      completed: body.completed,
      order: existing.order,
      tags,
      createdAt: existing.createdAt,
      updatedAt: now,
    }
  }

  delete(id: string): void {
    const deleteTodo = this.db.transaction(() => {
      this.db.prepare(`DELETE FROM todos WHERE id = ?`).run(id)
    })
    deleteTodo()
  }

  reorder(ids: string[]): void {
    const updateOrder = this.db.transaction(() => {
      const stmt = this.db.prepare(`
        UPDATE todos SET "order" = ? WHERE id = ?
      `)

      for (let i = 0; i < ids.length; i++) {
        stmt.run(i, ids[i])
      }
    })

    updateOrder()
  }
}

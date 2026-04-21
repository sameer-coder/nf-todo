import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { runMigrations } from '../db/migrate.js'
import { SqliteTodoRepository } from './SqliteTodoRepository.js'
import type { CreateTodoBody, UpdateTodoBody } from '../types/todo.js'

describe('SqliteTodoRepository', () => {
  let db: Database.Database
  let repo: SqliteTodoRepository

  beforeEach(() => {
    // Create an in-memory database for each test
    db = new Database(':memory:')
    // Run migrations to set up the schema
    runMigrations(db)
    // Instantiate the repository
    repo = new SqliteTodoRepository(db)
  })

  afterEach(() => {
    db.close()
  })

  it('should create a todo with tags', () => {
    const body: CreateTodoBody = {
      title: 'Buy milk',
      tags: ['shopping', 'errand'],
    }

    const todo = repo.create(body)

    expect(todo.id).toBeDefined()
    expect(todo.title).toBe('Buy milk')
    expect(todo.completed).toBe(false)
    expect(todo.order).toBe(0)
    expect(todo.tags).toEqual(['shopping', 'errand'])
    expect(todo.createdAt).toBeDefined()
    expect(todo.updatedAt).toBeDefined()
  })

  it('should create a todo without tags', () => {
    const body: CreateTodoBody = {
      title: 'Simple task',
    }

    const todo = repo.create(body)

    expect(todo.tags).toEqual([])
  })

  it('should retrieve all todos sorted by order', () => {
    // Create todos in reverse order to verify sorting
    const todo1 = repo.create({ title: 'First' })
    const todo2 = repo.create({ title: 'Second' })
    const todo3 = repo.create({ title: 'Third' })

    // Reorder them
    repo.reorder([todo3.id, todo1.id, todo2.id])

    const todos = repo.getAll()

    expect(todos).toHaveLength(3)
    expect(todos[0].title).toBe('Third')
    expect(todos[1].title).toBe('First')
    expect(todos[2].title).toBe('Second')
    expect(todos[0].order).toBe(0)
    expect(todos[1].order).toBe(1)
    expect(todos[2].order).toBe(2)
  })

  it('should retrieve a todo by ID with tags', () => {
    const created = repo.create({
      title: 'Task with tags',
      tags: ['work', 'urgent'],
    })

    const todo = repo.getById(created.id)

    expect(todo).toBeDefined()
    expect(todo?.title).toBe('Task with tags')
    // Tags may not come back in insertion order due to GROUP_CONCAT
    expect(todo?.tags).toEqual(expect.arrayContaining(['work', 'urgent']))
    expect(todo?.tags).toHaveLength(2)
  })

  it('should return undefined for non-existent todo', () => {
    const todo = repo.getById('non-existent-id')

    expect(todo).toBeUndefined()
  })

  it('should update a todo title', () => {
    const created = repo.create({ title: 'Original title' })

    const update: UpdateTodoBody = {
      title: 'Updated title',
      completed: false,
      tags: [],
    }

    const updated = repo.update(created.id, update)

    expect(updated?.title).toBe('Updated title')
    expect(updated?.completed).toBe(false)
  })

  it('should toggle todo completed status', () => {
    const created = repo.create({ title: 'Task' })
    expect(created.completed).toBe(false)

    // Mark as complete
    const completed = repo.update(created.id, {
      title: created.title,
      completed: true,
      tags: created.tags,
    })

    expect(completed?.completed).toBe(true)

    // Mark as incomplete
    const incomplete = repo.update(created.id, {
      title: created.title,
      completed: false,
      tags: created.tags,
    })

    expect(incomplete?.completed).toBe(false)
  })

  it('should update todo tags via delete and re-insert', () => {
    const created = repo.create({
      title: 'Task',
      tags: ['old-tag'],
    })

    const updated = repo.update(created.id, {
      title: created.title,
      completed: false,
      tags: ['new-tag-1', 'new-tag-2'],
    })

    expect(updated?.tags).toEqual(['new-tag-1', 'new-tag-2'])

    // Verify in DB
    const retrieved = repo.getById(created.id)
    expect(retrieved?.tags).toEqual(['new-tag-1', 'new-tag-2'])
  })

  it('should return undefined when updating non-existent todo', () => {
    const update: UpdateTodoBody = {
      title: 'Updated',
      completed: false,
      tags: [],
    }

    const result = repo.update('non-existent', update)

    expect(result).toBeUndefined()
  })

  it('should delete a todo and cascade delete tags', () => {
    const created = repo.create({
      title: 'To delete',
      tags: ['deleteme'],
    })

    repo.delete(created.id)

    const retrieved = repo.getById(created.id)
    expect(retrieved).toBeUndefined()

    // Verify orphaned tags are actually removed from todo_tags (tests CASCADE)
    const orphanedTags = (
      db
        .prepare('SELECT COUNT(*) as count FROM todo_tags WHERE todo_id = ?')
        .get(created.id) as { count: number }
    ).count
    expect(orphanedTags).toBe(0)
  })

  it('should reorder todos and update order values', () => {
    const todo1 = repo.create({ title: 'First' })
    const todo2 = repo.create({ title: 'Second' })
    const todo3 = repo.create({ title: 'Third' })

    // Reorder to: todo3, todo1, todo2
    repo.reorder([todo3.id, todo1.id, todo2.id])

    const todos = repo.getAll()

    expect(todos[0].id).toBe(todo3.id)
    expect(todos[0].order).toBe(0)
    expect(todos[1].id).toBe(todo1.id)
    expect(todos[1].order).toBe(1)
    expect(todos[2].id).toBe(todo2.id)
    expect(todos[2].order).toBe(2)
  })

  it('should convert completed INTEGER to boolean', () => {
    const created = repo.create({ title: 'Test boolean conversion' })

    // Update to completed
    repo.update(created.id, {
      title: created.title,
      completed: true,
      tags: [],
    })

    const retrieved = repo.getById(created.id)
    expect(typeof retrieved?.completed).toBe('boolean')
    expect(retrieved?.completed).toBe(true)
  })

  it('should handle todos with multiple tags', () => {
    const tags = ['tag1', 'tag2', 'tag3', 'tag4']
    const created = repo.create({ title: 'Many tags', tags })

    const retrieved = repo.getById(created.id)

    expect(retrieved?.tags).toEqual(expect.arrayContaining(tags))
    expect(retrieved?.tags).toHaveLength(4)
  })

  it('should maintain referential integrity with CASCADE delete', () => {
    // Create two todos with tags
    const todo1 = repo.create({ title: 'Todo 1', tags: ['shared'] })
    const todo2 = repo.create({ title: 'Todo 2', tags: ['shared'] })

    // Delete first todo
    repo.delete(todo1.id)

    // Verify second todo still has its tags
    const remaining = repo.getById(todo2.id)
    expect(remaining?.tags).toContain('shared')
    expect(repo.getAll()).toHaveLength(1)
  })

  it('should preserve createdAt timestamp across updates', async () => {
    const created = repo.create({ title: 'Original' })
    const originalCreatedAt = created.createdAt

    // Wait to ensure timestamp difference is detectable at millisecond resolution
    await new Promise((resolve) => setTimeout(resolve, 10))

    const updated = repo.update(created.id, {
      title: 'Modified',
      completed: true,
      tags: [],
    })

    expect(updated?.createdAt).toBe(originalCreatedAt)
    expect(updated?.updatedAt).not.toBe(originalCreatedAt)
  })

  it('should use ISO 8601 date format', () => {
    const created = repo.create({ title: 'Date test' })

    // ISO 8601 format example: 2026-04-20T10:30:45.123Z
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

    expect(created.createdAt).toMatch(iso8601Regex)
    expect(created.updatedAt).toMatch(iso8601Regex)
  })
})

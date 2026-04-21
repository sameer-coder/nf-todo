import { describe, it, beforeEach, expect } from 'vitest'
import Database from 'better-sqlite3'
import { buildServer } from '../server.js'
import { SqliteTodoRepository } from '../repository/SqliteTodoRepository.js'
import { runMigrations } from '../db/migrate.js'

describe('todos routes', () => {
  let app: ReturnType<typeof buildServer>

  beforeEach(async () => {
    const db = new Database(':memory:')
    runMigrations(db)
    const repo = new SqliteTodoRepository(db)
    app = buildServer({ repo })
    await app.ready()
  })

  // GET /api/todos
  it('GET /api/todos returns empty array initially', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/todos' })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([])
  })

  it('GET /api/todos returns sorted array of todos', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { title: 'First' },
    })
    await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { title: 'Second' },
    })

    const response = await app.inject({ method: 'GET', url: '/api/todos' })
    expect(response.statusCode).toBe(200)
    const todos = response.json()
    expect(todos).toHaveLength(2)
    expect(todos[0].title).toBe('First')
    expect(todos[1].title).toBe('Second')
    // Verify tags is always string[]
    expect(Array.isArray(todos[0].tags)).toBe(true)
    expect(Array.isArray(todos[1].tags)).toBe(true)
  })

  // GET /api/todos?status=active
  it('GET /api/todos?status=active filters completed todos', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { title: 'Active todo' },
    })
    const completedPost = await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { title: 'Completed todo' },
    })
    const completedId = completedPost.json().id
    await app.inject({
      method: 'PUT',
      url: `/api/todos/${completedId}`,
      payload: { title: 'Completed todo', completed: true, tags: [] },
    })

    const response = await app.inject({ method: 'GET', url: '/api/todos?status=active' })
    expect(response.statusCode).toBe(200)
    const todos = response.json()
    expect(todos).toHaveLength(1)
    expect(todos[0].title).toBe('Active todo')
    expect(todos[0].completed).toBe(false)
  })

  // GET /api/todos?status=completed
  it('GET /api/todos?status=completed returns only completed todos', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { title: 'Active todo' },
    })
    const completedPost = await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { title: 'Completed todo' },
    })
    const completedId = completedPost.json().id
    await app.inject({
      method: 'PUT',
      url: `/api/todos/${completedId}`,
      payload: { title: 'Completed todo', completed: true, tags: [] },
    })

    const response = await app.inject({ method: 'GET', url: '/api/todos?status=completed' })
    expect(response.statusCode).toBe(200)
    const todos = response.json()
    expect(todos).toHaveLength(1)
    expect(todos[0].completed).toBe(true)
  })

  // GET /api/todos?tags=work
  it('GET /api/todos?tags=work returns todos with that tag', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { title: 'Work task', tags: ['work'] },
    })
    await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { title: 'Personal task', tags: ['personal'] },
    })

    const response = await app.inject({ method: 'GET', url: '/api/todos?tags=work' })
    expect(response.statusCode).toBe(200)
    const todos = response.json()
    expect(todos).toHaveLength(1)
    expect(todos[0].title).toBe('Work task')
    expect(todos[0].tags).toContain('work')
  })

  // POST /api/todos
  it('POST /api/todos returns 201 with correct Todo', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { title: 'New todo', tags: ['work', 'urgent'] },
    })
    expect(response.statusCode).toBe(201)
    const todo = response.json()
    expect(todo.title).toBe('New todo')
    expect(todo.completed).toBe(false)
    expect(typeof todo.id).toBe('string')
    expect(Array.isArray(todo.tags)).toBe(true)
    expect(todo.tags).toContain('work')
    expect(todo.tags).toContain('urgent')
    expect(typeof todo.createdAt).toBe('string')
    expect(typeof todo.updatedAt).toBe('string')
    // camelCase fields — never snake_case
    expect(todo).not.toHaveProperty('created_at')
    expect(todo).not.toHaveProperty('updated_at')
  })

  it('POST /api/todos trims title and deduplicates tags', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { title: '  Trimmed  ', tags: ['work', 'work', '  home  ', ''] },
    })
    expect(response.statusCode).toBe(201)
    const todo = response.json()
    expect(todo.title).toBe('Trimmed')
    expect(todo.tags).toContain('work')
    expect(todo.tags).toContain('home')
    expect(todo.tags).not.toContain('')
    // Deduplication: work appears once
    expect(todo.tags.filter((t: string) => t === 'work')).toHaveLength(1)
  })

  // PUT /api/todos/:id with whitespace-only title → 400
  it('PUT /api/todos/:id with whitespace-only title returns 400', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { title: 'Original' },
    })
    const id = createRes.json().id

    const response = await app.inject({
      method: 'PUT',
      url: `/api/todos/${id}`,
      payload: { title: '   ', completed: false, tags: [] },
    })
    expect(response.statusCode).toBe(400)
  })

  // POST /api/todos with empty title → 400
  it('POST /api/todos with empty title returns 400', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { title: '' },
    })
    expect(response.statusCode).toBe(400)
  })

  // POST /api/todos with whitespace-only title → 400
  it('POST /api/todos with whitespace-only title returns 400', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { title: '   ' },
    })
    expect(response.statusCode).toBe(400)
  })

  // PUT /api/todos/:id
  it('PUT /api/todos/:id returns 200 with updated todo', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { title: 'Original', tags: ['old'] },
    })
    const id = createRes.json().id

    const response = await app.inject({
      method: 'PUT',
      url: `/api/todos/${id}`,
      payload: { title: 'Updated', completed: true, tags: ['new'] },
    })
    expect(response.statusCode).toBe(200)
    const todo = response.json()
    expect(todo.title).toBe('Updated')
    expect(todo.completed).toBe(true)
    expect(todo.tags).toEqual(['new'])
    expect(Array.isArray(todo.tags)).toBe(true)
  })

  it('PUT /api/todos/:id returns 404 for unknown id', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/api/todos/nonexistent-id',
      payload: { title: 'Updated', completed: false, tags: [] },
    })
    expect(response.statusCode).toBe(404)
  })

  // DELETE /api/todos/:id
  it('DELETE /api/todos/:id returns 204 and removes row', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { title: 'To delete' },
    })
    const id = createRes.json().id

    const deleteRes = await app.inject({ method: 'DELETE', url: `/api/todos/${id}` })
    expect(deleteRes.statusCode).toBe(204)

    // Verify it's gone
    const getRes = await app.inject({ method: 'GET', url: '/api/todos' })
    const todos = getRes.json()
    expect(todos.find((t: { id: string }) => t.id === id)).toBeUndefined()
  })

  it('DELETE /api/todos/:id returns 404 for unknown id', async () => {
    const response = await app.inject({ method: 'DELETE', url: '/api/todos/nonexistent-id' })
    expect(response.statusCode).toBe(404)
  })

  // PUT /api/todos/reorder
  it('PUT /api/todos/reorder returns 204 and GET reflects new order', async () => {
    const first = await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { title: 'First' },
    })
    const second = await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { title: 'Second' },
    })
    const firstId = first.json().id
    const secondId = second.json().id

    // Reverse the order
    const reorderRes = await app.inject({
      method: 'PUT',
      url: '/api/todos/reorder',
      payload: { ids: [secondId, firstId] },
    })
    expect(reorderRes.statusCode).toBe(204)

    const getRes = await app.inject({ method: 'GET', url: '/api/todos' })
    const todos = getRes.json()
    expect(todos[0].id).toBe(secondId)
    expect(todos[1].id).toBe(firstId)
  })

  // tags is always string[] in responses
  it('tags is always string[] in responses (never null)', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { title: 'No tags todo' },
    })

    const response = await app.inject({ method: 'GET', url: '/api/todos' })
    const todos = response.json()
    expect(Array.isArray(todos[0].tags)).toBe(true)
    expect(todos[0].tags).toEqual([])
  })
})

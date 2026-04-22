import type { APIRequestContext } from '@playwright/test'

const API_BASE = 'http://localhost:4000'

export async function createTodo(request: APIRequestContext, title: string, tags: string[] = []) {
  const response = await request.post(`${API_BASE}/api/todos`, {
    data: { title, tags },
  })
  return response.json()
}

export async function clearAllTodos(request: APIRequestContext) {
  const response = await request.get(`${API_BASE}/api/todos`)
  const todos = await response.json()
  for (const todo of todos) {
    await request.delete(`${API_BASE}/api/todos/${todo.id}`)
  }
}

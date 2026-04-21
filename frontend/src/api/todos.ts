import type { Todo, CreateTodoBody, UpdateTodoBody } from '../types/todo'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  if (res.status === 204) return undefined as T
  return res.json()
}

export const fetchTodos = (): Promise<Todo[]> =>
  apiFetch('/api/todos')

export const createTodo = (body: CreateTodoBody): Promise<Todo> =>
  apiFetch('/api/todos', {
    method: 'POST',
    body: JSON.stringify(body),
  })

export const updateTodo = (id: string, body: UpdateTodoBody): Promise<Todo> =>
  apiFetch(`/api/todos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })

export const deleteTodo = (id: string): Promise<void> =>
  apiFetch(`/api/todos/${id}`, { method: 'DELETE' })

export const reorderTodos = (ids: string[]): Promise<void> =>
  apiFetch('/api/todos/reorder', {
    method: 'PUT',
    body: JSON.stringify({ ids }),
  })

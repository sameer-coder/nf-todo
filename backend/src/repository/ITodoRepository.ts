import type { Todo, CreateTodoBody, UpdateTodoBody } from '../types/todo.js'

export interface ITodoRepository {
  getAll(): Todo[]
  getById(id: string): Todo | undefined
  create(body: CreateTodoBody): Todo
  update(id: string, body: UpdateTodoBody): Todo | undefined
  delete(id: string): void
  reorder(ids: string[]): void
}

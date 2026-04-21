export interface Todo {
  id: string
  title: string
  completed: boolean
  order: number
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface CreateTodoBody {
  title: string
  tags?: string[]
}

export interface UpdateTodoBody {
  title: string
  completed: boolean
  tags: string[]
}

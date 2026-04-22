import type { Todo } from '../types/todo'
import { TodoItem } from './TodoItem'

interface TodoListProps {
  todos: Todo[]
}

export function TodoList({ todos }: TodoListProps) {
  const sorted = [...todos].sort((a, b) => a.order - b.order)

  return (
    <ul className="space-y-3">
      {sorted.map(todo => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  )
}

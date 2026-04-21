import { useTodos } from '../context/TodoContext'
import { TodoItem } from './TodoItem'
import { EmptyState } from './EmptyState'

export function TodoList() {
  const { state } = useTodos()
  const sorted = [...state.todos].sort((a, b) => a.order - b.order)

  if (!state.isLoading && sorted.length === 0) {
    return <EmptyState variant="empty" />
  }

  return (
    <ul className="divide-y divide-neutral-100">
      {sorted.map(todo => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  )
}

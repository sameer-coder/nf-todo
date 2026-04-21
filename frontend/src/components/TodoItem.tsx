import type { Todo } from '../types/todo'
import { cn } from '../utils/cn'

interface TodoItemProps {
  todo: Todo
}

export function TodoItem({ todo }: TodoItemProps) {
  return (
    <li className="flex items-center gap-3 py-3 group">
      <div />
      <div />
      <span
        className={cn(
          'flex-1 text-[15px]',
          todo.completed ? 'line-through text-neutral-400' : 'text-neutral-900'
        )}
      >
        {todo.title}
      </span>
      <div />
      <div />
    </li>
  )
}

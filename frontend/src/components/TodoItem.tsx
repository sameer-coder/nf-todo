import type { Todo } from '../types/todo'
import { cn } from '../utils/cn'
import { Checkbox } from './Checkbox'
import { DeleteButton } from './DeleteButton'
import { useTodos } from '../context/TodoContext'
import { useToast } from '../context/ToastContext'
import { updateTodo, deleteTodo } from '../api/todos'

interface TodoItemProps {
  todo: Todo
}

export function TodoItem({ todo }: TodoItemProps) {
  const { dispatch } = useTodos()
  const { showToast } = useToast()

  async function handleToggle() {
    const previousTodo = todo
    const updated = { ...todo, completed: !todo.completed }

    dispatch({ type: 'UPDATE_TODO_OPTIMISTIC', payload: updated })

    try {
      await updateTodo(todo.id, { title: todo.title, completed: updated.completed, tags: todo.tags })
    } catch {
      dispatch({ type: 'UPDATE_TODO_ROLLBACK', payload: previousTodo })
      showToast('Something went wrong')
    }
  }

  async function handleDelete() {
    const previousTodo = todo

    dispatch({ type: 'DELETE_TODO_OPTIMISTIC', payload: todo.id })

    try {
      await deleteTodo(todo.id)
    } catch {
      dispatch({ type: 'DELETE_TODO_ROLLBACK', payload: previousTodo })
      showToast('Something went wrong')
    }
  }

  return (
    <li className="flex items-center gap-3 py-3 group">
      <Checkbox checked={todo.completed} onChange={handleToggle} />
      <div />
      <span
        className={cn(
          'flex-1 text-[15px]',
          todo.completed ? 'line-through text-neutral-400' : 'text-neutral-900',
        )}
      >
        {todo.title}
      </span>
      <div />
      <DeleteButton onDelete={handleDelete} />
    </li>
  )
}

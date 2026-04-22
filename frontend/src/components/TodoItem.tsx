import { useState } from 'react'
import type { Todo } from '../types/todo'
import { cn } from '../utils/cn'
import { Checkbox } from './Checkbox'
import { DeleteButton } from './DeleteButton'
import { InlineEditInput } from './InlineEditInput'
import { TagChip } from './TagChip'
import { useTodos } from '../context/TodoContext'
import { useToast } from '../context/ToastContext'
import { updateTodo, deleteTodo } from '../api/todos'

interface TodoItemProps {
  todo: Todo
}

export function TodoItem({ todo }: TodoItemProps) {
  const { dispatch } = useTodos()
  const { showToast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

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
    setIsLeaving(true)
    await new Promise<void>(resolve => setTimeout(resolve, 250))

    const previousTodo = todo
    dispatch({ type: 'DELETE_TODO_OPTIMISTIC', payload: todo.id })

    try {
      await deleteTodo(todo.id)
    } catch {
      setIsLeaving(false)
      dispatch({ type: 'DELETE_TODO_ROLLBACK', payload: previousTodo })
      showToast('Something went wrong')
    }
  }

  async function handleSave(newTitle: string) {
    const previousTodo = todo
    const updated = { ...todo, title: newTitle }

    setIsEditing(false)
    dispatch({ type: 'UPDATE_TODO_OPTIMISTIC', payload: updated })

    try {
      await updateTodo(todo.id, { title: newTitle, completed: todo.completed, tags: todo.tags })
    } catch {
      dispatch({ type: 'UPDATE_TODO_ROLLBACK', payload: previousTodo })
      showToast('Something went wrong')
    }
  }

  function handleCancel() {
    setIsEditing(false)
  }

  async function handleRemoveTag(tagToRemove: string) {
    const previousTodo = todo
    const updatedTags = todo.tags.filter(t => t !== tagToRemove)
    const updated = { ...todo, tags: updatedTags }

    dispatch({ type: 'UPDATE_TODO_OPTIMISTIC', payload: updated })

    try {
      await updateTodo(todo.id, { title: todo.title, completed: todo.completed, tags: updatedTags })
    } catch {
      dispatch({ type: 'UPDATE_TODO_ROLLBACK', payload: previousTodo })
      showToast('Something went wrong')
    }
  }

  return (
    <li
      className={cn(
        'flex items-center gap-3 py-3 group overflow-hidden',
        'motion-safe:animate-todo-enter',
        isLeaving && 'motion-safe:animate-todo-leave',
      )}
    >
      <Checkbox checked={todo.completed} onChange={handleToggle} />
      <div />
      {isEditing ? (
        <InlineEditInput
          initialValue={todo.title}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ) : (
        <span
          onClick={() => setIsEditing(true)}
          onKeyDown={e => e.key === 'Enter' && setIsEditing(true)}
          role="button"
          tabIndex={0}
          className={cn(
            'flex-1 text-[15px] cursor-text',
            'motion-safe:transition-colors motion-safe:duration-300',
            todo.completed
              ? 'line-through text-paper-muted decoration-paper-muted/60'
              : 'text-paper-text',
          )}
        >
          {todo.title}
        </span>
      )}
      {todo.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 items-center">
          {todo.tags.map(tag => (
            <TagChip
              key={tag}
              tag={tag}
              onClick={() => {/* wired in Story 4.2 */}}
              onRemove={() => handleRemoveTag(tag)}
            />
          ))}
        </div>
      )}
      <div />
      <DeleteButton onDelete={handleDelete} />
    </li>
  )
}

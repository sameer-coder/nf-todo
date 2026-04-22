import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Todo } from '../types/todo'
import { cn } from '../utils/cn'
import { Checkbox } from './Checkbox'
import { DeleteButton } from './DeleteButton'
import { DragHandle } from './DragHandle'
import { InlineEditInput } from './InlineEditInput'
import { TagChip } from './TagChip'
import { useTodos } from '../context/TodoContext'
import { useToast } from '../context/ToastContext'
import { useTagFilter } from '../hooks/useTagFilter'
import { updateTodo, deleteTodo } from '../api/todos'
import { parseTagsFromTitle } from '../utils/parseTagsFromTitle'

interface TodoItemProps {
  todo: Todo
}

export function TodoItem({ todo }: TodoItemProps) {
  const { dispatch } = useTodos()
  const { showToast } = useToast()
  const { toggleTagFilter, isTagActive } = useTagFilter()
  const [isEditing, setIsEditing] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: todo.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

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
    const { title: cleanedTitle, tags: newTags } = parseTagsFromTitle(newTitle)
    if (!cleanedTitle) return

    const mergedTags = [...new Set([...todo.tags, ...newTags])]
    const previousTodo = todo
    const updated = { ...todo, title: cleanedTitle, tags: mergedTags }

    setIsEditing(false)
    dispatch({ type: 'UPDATE_TODO_OPTIMISTIC', payload: updated })

    try {
      await updateTodo(todo.id, { title: cleanedTitle, completed: todo.completed, tags: mergedTags })
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
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        'group overflow-hidden rounded-2xl border border-paper-line/80 bg-paper-surface px-3 py-3 shadow-sm',
        'flex items-center gap-3',
        'motion-safe:transition-transform motion-safe:duration-200 hover:-translate-y-0.5',
        'motion-safe:animate-todo-enter',
        isLeaving && 'motion-safe:animate-todo-leave',
        isDragging && 'shadow-md opacity-75 bg-white',
      )}
    >
      <DragHandle listeners={listeners} />
      <Checkbox checked={todo.completed} onChange={handleToggle} />
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
            'flex-1 cursor-text text-[15px] font-medium leading-6',
            'motion-safe:transition-colors motion-safe:duration-300',
            todo.completed
              ? 'line-through text-neutral-400 decoration-paper-muted/60'
              : 'text-neutral-900',
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
              active={isTagActive(tag)}
              onClick={() => toggleTagFilter(tag)}
              onRemove={() => handleRemoveTag(tag)}
            />
          ))}
        </div>
      )}
      <DeleteButton onDelete={handleDelete} />
    </li>
  )
}

import { useRef, useEffect, useState } from 'react'
import type { Todo } from '../types/todo'
import { useTodos } from '../context/TodoContext'
import { useToast } from '../context/ToastContext'
import { createTodo } from '../api/todos'
import { parseTagsFromTitle } from '../utils/parseTagsFromTitle'

export function AddTodoInput() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')
  const { state, dispatch } = useTodos()
  const { showToast } = useToast()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function handleSubmit() {
    const raw = value.trim()
    if (!raw) return
    const { title, tags } = parseTagsFromTitle(raw)
    if (!title) return
    const nextOrder = Math.max(...state.todos.map(todo => todo.order), -1) + 1

    const tempTodo: Todo = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      order: nextOrder,
      tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    dispatch({ type: 'ADD_TODO_OPTIMISTIC', payload: tempTodo })
    setValue('')
    inputRef.current?.focus()

    try {
      const serverTodo = await createTodo({ title, tags })
      dispatch({ type: 'DELETE_TODO_OPTIMISTIC', payload: tempTodo.id })
      dispatch({ type: 'ADD_TODO_OPTIMISTIC', payload: serverTodo })
    } catch {
      dispatch({ type: 'ADD_TODO_ROLLBACK', payload: tempTodo.id })
      showToast('Something went wrong')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === 'Escape') {
      setValue('')
    }
  }

  return (
    <div className="mb-5 rounded-2xl border border-paper-line/90 bg-paper-header/70 p-2">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a task…"
        className="min-h-[44px] w-full rounded-xl bg-paper-surface px-4 text-[15px] text-paper-text outline-none ring-1 ring-transparent placeholder:text-paper-muted/70 motion-safe:transition-shadow focus-visible:ring-paper-ink/20 focus-visible:shadow-[0_0_0_4px_rgba(47,108,87,0.10)]"
      />
    </div>
  )
}

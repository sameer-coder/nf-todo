import { useRef, useEffect, useState } from 'react'
import type { Todo } from '../types/todo'
import { useTodos } from '../context/TodoContext'
import { useToast } from '../context/ToastContext'
import { createTodo } from '../api/todos'
import { parseTagsFromTitle } from '../utils/parseTagsFromTitle'

export function AddTodoInput() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
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

  const borderClass = isFocused
    ? 'border-accent-400 shadow-glow'
    : 'border-paper-border hover:border-paper-muted/50'

  return (
    <div className={`mb-5 flex items-center gap-2 rounded-2xl border bg-white/90 px-3 py-2 motion-safe:transition-all ${borderClass}`}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
        </svg>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="Add a task…"
        className="min-h-[36px] w-full bg-transparent text-[15px] text-paper-text outline-none placeholder:text-paper-muted/80"
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!value.trim()}
        aria-label="Add task"
        className="shrink-0 rounded-lg bg-accent-gradient px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-accent-500/30 motion-safe:transition-all hover:shadow-md hover:shadow-accent-500/40 disabled:cursor-not-allowed disabled:opacity-0 disabled:shadow-none"
      >
        Add
      </button>
    </div>
  )
}

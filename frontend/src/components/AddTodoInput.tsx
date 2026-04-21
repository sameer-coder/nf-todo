import { useRef, useEffect, useState } from 'react'
import type { Todo } from '../types/todo'
import { useTodos } from '../context/TodoContext'
import { useToast } from '../context/ToastContext'
import { createTodo } from '../api/todos'

export function AddTodoInput() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')
  const { state, dispatch } = useTodos()
  const { showToast } = useToast()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function handleSubmit() {
    const trimmed = value.trim()
    if (!trimmed) return
    const nextOrder = Math.max(...state.todos.map(todo => todo.order), -1) + 1

    const tempTodo: Todo = {
      id: crypto.randomUUID(),
      title: trimmed,
      completed: false,
      order: nextOrder,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    dispatch({ type: 'ADD_TODO_OPTIMISTIC', payload: tempTodo })
    setValue('')
    inputRef.current?.focus()

    try {
      const serverTodo = await createTodo({ title: trimmed, tags: [] })
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
    <div className="border-b border-neutral-200 pb-3 mb-4">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a task…"
        className="w-full outline-none text-[15px] text-neutral-900 placeholder:text-neutral-400 bg-transparent"
      />
    </div>
  )
}

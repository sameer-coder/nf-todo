import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { renderHook, act } from '@testing-library/react'
import App from './App'
import { TodoProvider, useTodos } from './context/TodoContext'
import { ToastProvider, useToast } from './context/ToastContext'
import * as todosApi from './api/todos'
import type { Todo } from './types/todo'

const mockTodos: Todo[] = [
  {
    id: '1',
    title: 'Test todo',
    completed: false,
    order: 1,
    tags: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
]

describe('App', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders 3 skeleton rows while loading', () => {
    vi.spyOn(todosApi, 'fetchTodos').mockReturnValue(new Promise(() => {}))
    render(<App />)
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons).toHaveLength(3)
  })

  it('populates TodoContext via SET_TODOS after fetch resolves', async () => {
    vi.spyOn(todosApi, 'fetchTodos').mockResolvedValue(mockTodos)
    render(<App />)
    await waitFor(() => {
      expect(document.querySelectorAll('.animate-pulse')).toHaveLength(0)
    })
  })

  it('hides skeleton rows after todos are loaded', async () => {
    vi.spyOn(todosApi, 'fetchTodos').mockResolvedValue(mockTodos)
    render(<App />)
    await waitFor(() => {
      expect(document.querySelectorAll('.animate-pulse')).toHaveLength(0)
    })
  })
})

describe('TodoContext', () => {
  it('provides state and dispatch via useTodos hook', () => {
    const { result } = renderHook(() => useTodos(), {
      wrapper: TodoProvider,
    })
    expect(result.current.state.todos).toEqual([])
    expect(result.current.state.isLoading).toBe(true)
    expect(typeof result.current.dispatch).toBe('function')
  })

  it('SET_TODOS updates todos and sets isLoading to false', () => {
    const { result } = renderHook(() => useTodos(), {
      wrapper: TodoProvider,
    })
    act(() => {
      result.current.dispatch({ type: 'SET_TODOS', payload: mockTodos })
    })
    expect(result.current.state.todos).toEqual(mockTodos)
    expect(result.current.state.isLoading).toBe(false)
  })

  it('throws if useTodos is used outside TodoProvider', () => {
    const originalError = console.error
    console.error = vi.fn()
    expect(() => renderHook(() => useTodos())).toThrow(
      'useTodos must be used within a TodoProvider'
    )
    console.error = originalError
  })
})

describe('ToastContext', () => {
  it('provides showToast and clearToast via useToast hook', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ToastProvider,
    })
    expect(result.current.toast.message).toBeNull()
    act(() => {
      result.current.showToast('Hello!')
    })
    expect(result.current.toast.message).toBe('Hello!')
    act(() => {
      result.current.clearToast()
    })
    expect(result.current.toast.message).toBeNull()
  })

  it('throws if useToast is used outside ToastProvider', () => {
    const originalError = console.error
    console.error = vi.fn()
    expect(() => renderHook(() => useToast())).toThrow(
      'useToast must be used within a ToastProvider'
    )
    console.error = originalError
  })

  it('TodoContext and ToastContext are both accessible from child components', () => {
    function Child() {
      const { state } = useTodos()
      const { toast } = useToast()
      return (
        <div>
          <span data-testid="todos-count">{state.todos.length}</span>
          <span data-testid="toast-msg">{toast.message ?? 'none'}</span>
        </div>
      )
    }
    function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <TodoProvider>
          <ToastProvider>{children}</ToastProvider>
        </TodoProvider>
      )
    }
    const { getByTestId } = render(<Child />, { wrapper: Wrapper })
    expect(getByTestId('todos-count')).toBeTruthy()
    expect(getByTestId('toast-msg').textContent).toBe('none')
  })
})

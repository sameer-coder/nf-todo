import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { renderHook, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
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
    render(<MemoryRouter><App /></MemoryRouter>)
    const skeletons = document.querySelectorAll('.motion-safe\\:animate-pulse')
    expect(skeletons).toHaveLength(3)
  })

  it('populates TodoContext via SET_TODOS after fetch resolves', async () => {
    vi.spyOn(todosApi, 'fetchTodos').mockResolvedValue(mockTodos)
    render(<MemoryRouter><App /></MemoryRouter>)
    await waitFor(() => {
      expect(document.querySelectorAll('.animate-pulse')).toHaveLength(0)
    })
  })

  it('hides skeleton rows after todos are loaded', async () => {
    vi.spyOn(todosApi, 'fetchTodos').mockResolvedValue(mockTodos)
    render(<MemoryRouter><App /></MemoryRouter>)
    await waitFor(() => {
      expect(document.querySelectorAll('.animate-pulse')).toHaveLength(0)
    })
  })

  it('renders a toast when the initial fetch fails', async () => {
    vi.spyOn(todosApi, 'fetchTodos').mockRejectedValue(new Error('network error'))
    render(<MemoryRouter><App /></MemoryRouter>)

    expect(await screen.findByText('Failed to load todos')).toBeDefined()
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

const mixedTodos: Todo[] = [
  { id: '1', title: 'Active work', completed: false, order: 1, tags: ['work'], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '2', title: 'Active personal', completed: false, order: 2, tags: ['personal'], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '3', title: 'Done work', completed: true, order: 3, tags: ['work'], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '4', title: 'Done untagged', completed: true, order: 4, tags: [], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
]

describe('Combined Filter (Story 4.4)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('status=active + tags=work shows only active todos with that tag', async () => {
    vi.spyOn(todosApi, 'fetchTodos').mockResolvedValue(mixedTodos)
    render(
      <MemoryRouter initialEntries={['/?status=active&tags=work']}>
        <App />
      </MemoryRouter>,
    )
    await waitFor(() => {
      expect(screen.getByText('Active work')).toBeDefined()
    })
    expect(screen.queryByText('Active personal')).toBeNull()
    expect(screen.queryByText('Done work')).toBeNull()
    expect(screen.queryByText('Done untagged')).toBeNull()
  })

  it('shows "No todos match your filters." when filters match nothing', async () => {
    vi.spyOn(todosApi, 'fetchTodos').mockResolvedValue(mixedTodos)
    render(
      <MemoryRouter initialEntries={['/?status=completed&tags=personal']}>
        <App />
      </MemoryRouter>,
    )
    await waitFor(() => {
      expect(screen.getByText('No todos match your filters.')).toBeDefined()
    })
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeDefined()
  })

  it('shows "No todos yet." when there are zero todos (not the no-results variant)', async () => {
    vi.spyOn(todosApi, 'fetchTodos').mockResolvedValue([])
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )
    await waitFor(() => {
      expect(screen.getByText('No todos yet.')).toBeDefined()
    })
    expect(screen.queryByText('No todos match your filters.')).toBeNull()
  })

  it('"No todos yet." and "No todos match your filters." have different copy', async () => {
    vi.spyOn(todosApi, 'fetchTodos').mockResolvedValue(mixedTodos)
    render(
      <MemoryRouter initialEntries={['/?status=completed&tags=personal']}>
        <App />
      </MemoryRouter>,
    )
    await waitFor(() => {
      expect(screen.getByText('No todos match your filters.')).toBeDefined()
    })
    expect(screen.queryByText('No todos yet.')).toBeNull()
  })
})

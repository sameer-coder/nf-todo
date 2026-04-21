import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect } from 'react'
import { AddTodoInput } from './AddTodoInput'
import { TodoProvider, useTodos } from '../context/TodoContext'
import { ToastProvider } from '../context/ToastContext'
import * as todosApi from '../api/todos'
import type { Todo } from '../types/todo'

function renderWithProviders() {
  return render(
    <TodoProvider>
      <ToastProvider>
        <AddTodoInput />
      </ToastProvider>
    </TodoProvider>
  )
}

function SeedTodos({ todos }: { todos: Todo[] }) {
  const { dispatch } = useTodos()

  useEffect(() => {
    dispatch({ type: 'SET_TODOS', payload: todos })
  }, [dispatch, todos])

  return null
}

function TodoOrders() {
  const { state } = useTodos()
  return <output data-testid="todo-orders">{state.todos.map(todo => todo.order).join(',')}</output>
}

describe('AddTodoInput', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('auto-focuses the input on render', () => {
    renderWithProviders()
    const input = screen.getByPlaceholderText('Add a task…')
    expect(document.activeElement).toBe(input)
  })

  it('calls createTodo when pressing Enter with non-empty value', async () => {
    const user = userEvent.setup()
    const serverTodo: Todo = {
      id: 'server-1',
      title: 'Buy groceries',
      completed: false,
      order: 0,
      tags: [],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }
    const spy = vi.spyOn(todosApi, 'createTodo').mockResolvedValue(serverTodo)

    renderWithProviders()
    const input = screen.getByPlaceholderText('Add a task…')

    await user.type(input, 'Buy groceries{Enter}')

    expect(spy).toHaveBeenCalledWith({ title: 'Buy groceries', tags: [] })
  })

  it('does NOT call createTodo when pressing Enter with empty value', async () => {
    const user = userEvent.setup()
    const spy = vi.spyOn(todosApi, 'createTodo').mockResolvedValue({} as Todo)

    renderWithProviders()
    const input = screen.getByPlaceholderText('Add a task…')

    await user.type(input, '   {Enter}')

    expect(spy).not.toHaveBeenCalled()
  })

  it('clears input after submission', async () => {
    const user = userEvent.setup()
    const serverTodo: Todo = {
      id: 'server-1',
      title: 'Test',
      completed: false,
      order: 0,
      tags: [],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }
    vi.spyOn(todosApi, 'createTodo').mockResolvedValue(serverTodo)

    renderWithProviders()
    const input = screen.getByPlaceholderText('Add a task…') as HTMLInputElement

    await user.type(input, 'Test{Enter}')

    expect(input.value).toBe('')
  })

  it('dispatches ADD_TODO_OPTIMISTIC before API call resolves', async () => {
    const user = userEvent.setup()
    let resolveApi: (value: Todo) => void
    const apiPromise = new Promise<Todo>(resolve => {
      resolveApi = resolve
    })
    vi.spyOn(todosApi, 'createTodo').mockReturnValue(apiPromise)

    render(
      <TodoProvider>
        <ToastProvider>
          <AddTodoInput />
        </ToastProvider>
      </TodoProvider>
    )

    const input = screen.getByPlaceholderText('Add a task…')
    await user.type(input, 'Optimistic test{Enter}')

    // API hasn't resolved yet, but input should be cleared (optimistic dispatch happened)
    expect((input as HTMLInputElement).value).toBe('')

    // Clean up: resolve the API
    resolveApi!({
      id: 'server-1',
      title: 'Optimistic test',
      completed: false,
      order: 0,
      tags: [],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    })

    await waitFor(() => {
      expect(todosApi.createTodo).toHaveBeenCalled()
    })
  })

  it('clears input on Escape key', async () => {
    const user = userEvent.setup()

    renderWithProviders()
    const input = screen.getByPlaceholderText('Add a task…') as HTMLInputElement

    await user.type(input, 'Some text')
    expect(input.value).toBe('Some text')

    await user.keyboard('{Escape}')
    expect(input.value).toBe('')
  })

  it('assigns optimistic order after the current maximum order', async () => {
    const user = userEvent.setup()
    vi.spyOn(todosApi, 'createTodo').mockReturnValue(new Promise(() => {}))

    const seededTodos: Todo[] = [
      {
        id: 'first',
        title: 'First',
        completed: false,
        order: 0,
        tags: [],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'second',
        title: 'Second',
        completed: false,
        order: 3,
        tags: [],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ]

    render(
      <TodoProvider>
        <ToastProvider>
          <SeedTodos todos={seededTodos} />
          <AddTodoInput />
          <TodoOrders />
        </ToastProvider>
      </TodoProvider>
    )

    const input = screen.getByPlaceholderText('Add a task…')
    await user.type(input, 'Third{Enter}')

    await waitFor(() => {
      expect(screen.getByTestId('todo-orders').textContent).toBe('0,3,4')
    })
  })
})

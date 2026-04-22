import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TodoList } from './TodoList'
import { TodoProvider } from '../context/TodoContext'
import { ToastProvider } from '../context/ToastContext'
import type { Todo } from '../types/todo'

vi.mock('../api/todos', () => ({
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
  reorderTodos: vi.fn().mockResolvedValue(undefined),
}))

const makeTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: '1',
  title: 'Test todo',
  completed: false,
  order: 0,
  tags: [],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

function renderWithProviders(todos: Todo[]) {
  return render(
    <MemoryRouter>
      <TodoProvider>
        <ToastProvider>
          <TodoList todos={todos} />
        </ToastProvider>
      </TodoProvider>
    </MemoryRouter>,
  )
}

describe('TodoList', () => {
  it('renders all todos', () => {
    const todos = [
      makeTodo({ id: '1', title: 'First', order: 0 }),
      makeTodo({ id: '2', title: 'Second', order: 1 }),
    ]
    renderWithProviders(todos)
    expect(screen.getByText('First')).toBeDefined()
    expect(screen.getByText('Second')).toBeDefined()
  })

  it('renders todos sorted by order', () => {
    const todos = [
      makeTodo({ id: '2', title: 'Second', order: 1 }),
      makeTodo({ id: '1', title: 'First', order: 0 }),
    ]
    renderWithProviders(todos)
    const list = screen.getByRole('list')
    const items = list.querySelectorAll('li')
    expect(items[0].textContent).toContain('First')
    expect(items[1].textContent).toContain('Second')
  })

  it('renders a drag handle for each todo', () => {
    const todos = [
      makeTodo({ id: '1', title: 'First', order: 0 }),
      makeTodo({ id: '2', title: 'Second', order: 1 }),
    ]
    renderWithProviders(todos)
    const handles = screen.getAllByLabelText('Drag to reorder')
    expect(handles).toHaveLength(2)
  })

  it('applies sortable attributes to list items (role and tabindex from useSortable)', () => {
    const todos = [makeTodo({ id: '1', title: 'First', order: 0 })]
    renderWithProviders(todos)
    const list = screen.getByRole('list')
    const item = list.querySelector('li')!
    // useSortable adds role="button" and tabindex
    expect(item.getAttribute('role')).toBe('button')
    expect(item.getAttribute('tabindex')).toBe('0')
  })
})

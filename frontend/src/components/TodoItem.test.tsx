import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { TodoItem } from './TodoItem'
import { TodoProvider } from '../context/TodoContext'
import { ToastProvider } from '../context/ToastContext'
import * as todosApi from '../api/todos'
import type { Todo } from '../types/todo'

const baseTodo: Todo = {
  id: '1',
  title: 'Test todo',
  completed: false,
  order: 0,
  tags: [],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

function renderWithProviders(todo: Todo) {
  return render(
    <MemoryRouter>
      <TodoProvider>
        <ToastProvider>
          <ul>
            <TodoItem todo={todo} />
          </ul>
        </ToastProvider>
      </TodoProvider>
    </MemoryRouter>,
  )
}

describe('TodoItem', () => {
  it('renders the todo title', () => {
    renderWithProviders(baseTodo)
    expect(screen.getByText('Test todo')).toBeDefined()
  })

  it('applies line-through and text-neutral-400 when todo is completed', () => {
    const completedTodo: Todo = { ...baseTodo, completed: true }
    renderWithProviders(completedTodo)
    const titleEl = screen.getByText('Test todo')
    expect(titleEl.className).toContain('line-through')
    expect(titleEl.className).toContain('text-neutral-400')
  })

  it('does not apply line-through when todo is not completed', () => {
    renderWithProviders(baseTodo)
    const titleEl = screen.getByText('Test todo')
    expect(titleEl.className).not.toContain('line-through')
    expect(titleEl.className).toContain('text-neutral-900')
  })

  it('renders a checkbox with aria-checked matching completed state', () => {
    renderWithProviders(baseTodo)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox.getAttribute('aria-checked')).toBe('false')
  })

  it('renders a checked checkbox for completed todo', () => {
    const completedTodo: Todo = { ...baseTodo, completed: true }
    renderWithProviders(completedTodo)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox.getAttribute('aria-checked')).toBe('true')
  })

  it('calls updateTodo on checkbox click', async () => {
    const user = userEvent.setup()
    const spy = vi.spyOn(todosApi, 'updateTodo').mockResolvedValue({ ...baseTodo, completed: true })
    renderWithProviders(baseTodo)
    await user.click(screen.getByRole('checkbox'))
    expect(spy).toHaveBeenCalledWith('1', { title: 'Test todo', completed: true, tags: [] })
    spy.mockRestore()
  })

  it('renders a delete button', () => {
    renderWithProviders(baseTodo)
    expect(screen.getByLabelText('Delete todo')).toBeDefined()
  })

  it('calls deleteTodo on delete button click', async () => {
    const user = userEvent.setup()
    const spy = vi.spyOn(todosApi, 'deleteTodo').mockResolvedValue(undefined)
    renderWithProviders(baseTodo)
    await user.click(screen.getByLabelText('Delete todo'))
    await waitFor(() => expect(spy).toHaveBeenCalledWith('1'))
    spy.mockRestore()
  })
})

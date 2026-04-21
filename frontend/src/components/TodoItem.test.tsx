import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TodoItem } from './TodoItem'
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

describe('TodoItem', () => {
  it('renders the todo title', () => {
    render(<TodoItem todo={baseTodo} />)
    expect(screen.getByText('Test todo')).toBeDefined()
  })

  it('applies line-through and text-neutral-400 when todo is completed', () => {
    const completedTodo: Todo = { ...baseTodo, completed: true }
    render(<TodoItem todo={completedTodo} />)
    const titleEl = screen.getByText('Test todo')
    expect(titleEl.className).toContain('line-through')
    expect(titleEl.className).toContain('text-neutral-400')
  })

  it('does not apply line-through when todo is not completed', () => {
    render(<TodoItem todo={baseTodo} />)
    const titleEl = screen.getByText('Test todo')
    expect(titleEl.className).not.toContain('line-through')
    expect(titleEl.className).toContain('text-neutral-900')
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TagChip } from './TagChip'

describe('TagChip', () => {
  it('renders the tag text', () => {
    render(<TagChip tag="shopping" />)
    expect(screen.getByText('shopping')).toBeDefined()
  })

  it('has correct default (inactive) styling classes', () => {
    render(<TagChip tag="work" />)
    const btn = screen.getByRole('button', { name: 'work' })
    expect(btn.className).toContain('bg-neutral-100')
    expect(btn.className).toContain('text-neutral-600')
    expect(btn.className).toContain('rounded-full')
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<TagChip tag="work" onClick={onClick} />)
    await user.click(screen.getByRole('button', { name: 'work' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('has focus-visible ring classes', () => {
    render(<TagChip tag="focus-test" />)
    const btn = screen.getByRole('button', { name: 'focus-test' })
    expect(btn.className).toContain('focus-visible:ring-2')
    expect(btn.className).toContain('focus-visible:ring-indigo-500')
    expect(btn.className).toContain('focus-visible:ring-offset-2')
  })

  it('applies active styling classes when active={true}', () => {
    render(<TagChip tag="active-tag" active={true} />)
    const btn = screen.getByRole('button', { name: 'active-tag' })
    expect(btn.className).toContain('bg-indigo-50')
    expect(btn.className).toContain('text-indigo-700')
    expect(btn.className).toContain('font-semibold')
  })

  it('does NOT apply active styling when active is false (default)', () => {
    render(<TagChip tag="inactive" />)
    const btn = screen.getByRole('button', { name: 'inactive' })
    expect(btn.className).not.toContain('bg-indigo-50')
    expect(btn.className).not.toContain('text-indigo-700')
  })

  it('sets aria-pressed to match active prop', () => {
    const { rerender } = render(<TagChip tag="test" active={false} />)
    let btn = screen.getByRole('button', { name: 'test' })
    expect(btn.getAttribute('aria-pressed')).toBe('false')

    rerender(<TagChip tag="test" active={true} />)
    btn = screen.getByRole('button', { name: 'test' })
    expect(btn.getAttribute('aria-pressed')).toBe('true')
  })

  // Story 3.4 — onRemove tests
  it('renders × button when onRemove prop is provided', () => {
    render(<TagChip tag="shopping" onRemove={vi.fn()} />)
    expect(screen.getByLabelText('Remove tag shopping')).toBeDefined()
  })

  it('does NOT render × button when onRemove is undefined', () => {
    render(<TagChip tag="shopping" />)
    expect(screen.queryByLabelText('Remove tag shopping')).toBeNull()
  })

  it('clicking × calls onRemove, NOT the chip onClick', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    const onClick = vi.fn()
    render(<TagChip tag="work" onClick={onClick} onRemove={onRemove} />)
    await user.click(screen.getByLabelText('Remove tag work'))
    expect(onRemove).toHaveBeenCalledTimes(1)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('× button has correct aria-label', () => {
    render(<TagChip tag="shopping" onRemove={vi.fn()} />)
    const removeBtn = screen.getByLabelText('Remove tag shopping')
    expect(removeBtn.getAttribute('aria-label')).toBe('Remove tag shopping')
  })
})


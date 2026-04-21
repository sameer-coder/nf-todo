import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DeleteButton } from './DeleteButton'

describe('DeleteButton', () => {
  it('has aria-label "Delete todo"', () => {
    render(<DeleteButton onDelete={() => {}} />)
    expect(screen.getByLabelText('Delete todo')).toBeDefined()
  })

  it('calls onDelete once on click', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<DeleteButton onDelete={onDelete} />)
    await user.click(screen.getByLabelText('Delete todo'))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('has opacity-30 class in default state (touch visibility)', () => {
    render(<DeleteButton onDelete={() => {}} />)
    const btn = screen.getByLabelText('Delete todo')
    expect(btn.className).toContain('opacity-30')
  })

  it('has md:group-hover:opacity-100 class for pointer device hover', () => {
    render(<DeleteButton onDelete={() => {}} />)
    const btn = screen.getByLabelText('Delete todo')
    expect(btn.className).toContain('md:group-hover:opacity-100')
  })
})

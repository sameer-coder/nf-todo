import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Checkbox } from './Checkbox'

describe('Checkbox', () => {
  it('renders with role="checkbox" attribute', () => {
    render(<Checkbox checked={false} onChange={() => {}} />)
    expect(screen.getByRole('checkbox')).toBeDefined()
  })

  it('has aria-checked="false" when checked={false}', () => {
    render(<Checkbox checked={false} onChange={() => {}} />)
    expect(screen.getByRole('checkbox').getAttribute('aria-checked')).toBe('false')
  })

  it('has aria-checked="true" when checked={true}', () => {
    render(<Checkbox checked={true} onChange={() => {}} />)
    expect(screen.getByRole('checkbox').getAttribute('aria-checked')).toBe('true')
  })

  it('calls onChange once on click', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Checkbox checked={false} onChange={onChange} />)
    await user.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('shows bg-indigo-600 when checked', () => {
    render(<Checkbox checked={true} onChange={() => {}} />)
    const inner = screen.getByRole('checkbox').querySelector('span')
    expect(inner?.className).toContain('bg-indigo-600')
  })

  it('does not show bg-indigo-600 when unchecked', () => {
    render(<Checkbox checked={false} onChange={() => {}} />)
    const inner = screen.getByRole('checkbox').querySelector('span')
    expect(inner?.className).not.toContain('bg-indigo-600')
  })

  it('has focus-visible ring classes', () => {
    render(<Checkbox checked={false} onChange={() => {}} />)
    const btn = screen.getByRole('checkbox')
    expect(btn.className).toContain('focus-visible:ring-2')
    expect(btn.className).toContain('focus-visible:ring-indigo-500')
    expect(btn.className).toContain('focus-visible:ring-offset-2')
  })

  it('has aria-label "Mark complete"', () => {
    render(<Checkbox checked={false} onChange={() => {}} />)
    expect(screen.getByRole('checkbox').getAttribute('aria-label')).toBe('Mark complete')
  })
})

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { FilterChipBar } from './FilterChipBar'

function renderWithRouter(initialEntries: string[] = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <FilterChipBar />
    </MemoryRouter>,
  )
}

describe('FilterChipBar', () => {
  it('renders null when no status or tags params', () => {
    const { container } = renderWithRouter()
    expect(container.innerHTML).toBe('')
  })

  it('renders status chip when ?status=active', () => {
    renderWithRouter(['/?status=active'])
    expect(screen.getByText('Active')).toBeDefined()
    expect(screen.getByLabelText('Remove filter Active')).toBeDefined()
  })

  it('renders status chip when ?status=completed', () => {
    renderWithRouter(['/?status=completed'])
    expect(screen.getByText('Completed')).toBeDefined()
  })

  it('renders tag chips when ?tags=work,personal', () => {
    renderWithRouter(['/?tags=work,personal'])
    expect(screen.getByText('work')).toBeDefined()
    expect(screen.getByText('personal')).toBeDefined()
  })

  it('renders "Clear all" button when filters are active', () => {
    renderWithRouter(['/?status=active'])
    expect(screen.getByRole('button', { name: 'Clear all' })).toBeDefined()
  })

  it('clicking × on status chip removes status from params', async () => {
    const user = userEvent.setup()
    renderWithRouter(['/?status=active&tags=work'])
    await user.click(screen.getByLabelText('Remove filter Active'))
    // After removal, status chip should be gone
    expect(screen.queryByText('Active')).toBeNull()
    // Tag chip should still be present
    expect(screen.getByText('work')).toBeDefined()
  })

  it('clicking × on tag chip removes that tag from params', async () => {
    const user = userEvent.setup()
    renderWithRouter(['/?tags=work,personal'])
    await user.click(screen.getByLabelText('Remove filter work'))
    expect(screen.queryByText('work')).toBeNull()
    expect(screen.getByText('personal')).toBeDefined()
  })

  it('"Clear all" removes all params and hides the bar', async () => {
    const user = userEvent.setup()
    const { container } = renderWithRouter(['/?status=active&tags=work'])
    await user.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(container.innerHTML).toBe('')
  })

  it('each chip has dismiss button with correct aria-label', () => {
    renderWithRouter(['/?status=active&tags=work'])
    expect(screen.getByLabelText('Remove filter Active')).toBeDefined()
    expect(screen.getByLabelText('Remove filter work')).toBeDefined()
  })
})

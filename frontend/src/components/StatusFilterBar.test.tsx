import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { StatusFilterBar } from './StatusFilterBar'

function renderWithRouter(initialEntries: string[] = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <StatusFilterBar />
    </MemoryRouter>,
  )
}

describe('StatusFilterBar', () => {
  it('renders "All", "Active", "Completed" buttons', () => {
    renderWithRouter()
    expect(screen.getByRole('tab', { name: 'All' })).toBeDefined()
    expect(screen.getByRole('tab', { name: 'Active' })).toBeDefined()
    expect(screen.getByRole('tab', { name: 'Completed' })).toBeDefined()
  })

  it('"All" tab is active by default (no status param)', () => {
    renderWithRouter()
    const allTab = screen.getByRole('tab', { name: 'All' })
    expect(allTab.getAttribute('aria-selected')).toBe('true')
    expect(allTab.className).toContain('font-semibold')
  })

  it('inactive tabs do not have font-semibold', () => {
    renderWithRouter()
    const activeTab = screen.getByRole('tab', { name: 'Active' })
    const completedTab = screen.getByRole('tab', { name: 'Completed' })
    expect(activeTab.className).not.toContain('font-semibold')
    expect(completedTab.className).not.toContain('font-semibold')
  })

  it('clicking "Active" sets status=active and marks it active', async () => {
    const user = userEvent.setup()
    renderWithRouter()
    await user.click(screen.getByRole('tab', { name: 'Active' }))
    const activeTab = screen.getByRole('tab', { name: 'Active' })
    expect(activeTab.getAttribute('aria-selected')).toBe('true')
    expect(activeTab.className).toContain('font-semibold')
  })

  it('clicking "Completed" marks it active and "All" inactive', async () => {
    const user = userEvent.setup()
    renderWithRouter()
    await user.click(screen.getByRole('tab', { name: 'Completed' }))
    const completedTab = screen.getByRole('tab', { name: 'Completed' })
    const allTab = screen.getByRole('tab', { name: 'All' })
    expect(completedTab.getAttribute('aria-selected')).toBe('true')
    expect(allTab.getAttribute('aria-selected')).toBe('false')
  })

  it('clicking "All" after another tab resets to default', async () => {
    const user = userEvent.setup()
    renderWithRouter()
    await user.click(screen.getByRole('tab', { name: 'Active' }))
    await user.click(screen.getByRole('tab', { name: 'All' }))
    const allTab = screen.getByRole('tab', { name: 'All' })
    expect(allTab.getAttribute('aria-selected')).toBe('true')
    expect(allTab.className).toContain('font-semibold')
  })

  it('tabs are mutually exclusive — only one active at a time', async () => {
    const user = userEvent.setup()
    renderWithRouter()
    await user.click(screen.getByRole('tab', { name: 'Active' }))
    const tabs = screen.getAllByRole('tab')
    const selected = tabs.filter(t => t.getAttribute('aria-selected') === 'true')
    expect(selected).toHaveLength(1)
  })
})

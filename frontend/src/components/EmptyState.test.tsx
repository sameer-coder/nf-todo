import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renders "No todos yet." when variant="empty"', () => {
    render(<EmptyState variant="empty" />)
    expect(screen.getByText('No todos yet.')).toBeDefined()
  })

  it('has no action button in variant="empty"', () => {
    render(<EmptyState variant="empty" />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('renders "No todos match your filters." when variant="no-results"', () => {
    render(<EmptyState variant="no-results" />)
    expect(screen.getByText('No todos match your filters.')).toBeDefined()
  })

  it('renders a "Clear filters" button in variant="no-results"', () => {
    render(<EmptyState variant="no-results" onClearFilters={() => {}} />)
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeDefined()
  })
})

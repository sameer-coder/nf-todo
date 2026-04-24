import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DragHandle } from './DragHandle'

describe('DragHandle', () => {
  it('renders a button with aria-label "Drag to reorder"', () => {
    render(<DragHandle />)
    const btn = screen.getByRole('button', { name: 'Drag to reorder' })
    expect(btn).toBeDefined()
  })

  it('has the touch target sizing classes (w-5 self-center flex items-center justify-center flex-shrink-0)', () => {
    render(<DragHandle />)
    const btn = screen.getByRole('button', { name: 'Drag to reorder' })
    expect(btn.className).toContain('w-5')
    expect(btn.className).toContain('self-center')
    expect(btn.className).toContain('flex')
    expect(btn.className).toContain('items-center')
    expect(btn.className).toContain('justify-center')
    expect(btn.className).toContain('flex-shrink-0')
  })

  it('has progressive disclosure classes (opacity-0 group-hover:opacity-100)', () => {
    render(<DragHandle />)
    const btn = screen.getByRole('button', { name: 'Drag to reorder' })
    expect(btn.className).toContain('opacity-0')
    expect(btn.className).toContain('group-hover:opacity-100')
    expect(btn.className).toContain('motion-safe:transition-opacity')
  })

  it('has touch device override for reduced opacity', () => {
    render(<DragHandle />)
    const btn = screen.getByRole('button', { name: 'Drag to reorder' })
    expect(btn.className).toContain('[@media(pointer:coarse)]:opacity-40')
  })

  it('has muted color', () => {
    render(<DragHandle />)
    const btn = screen.getByRole('button', { name: 'Drag to reorder' })
    expect(btn.className).toContain('text-paper-muted')
  })

  it('renders an SVG icon (≡ bars)', () => {
    render(<DragHandle />)
    const btn = screen.getByRole('button', { name: 'Drag to reorder' })
    const svg = btn.querySelector('svg')
    expect(svg).not.toBeNull()
  })

  it('spreads listeners onto the button', () => {
    const mockClick = vi.fn()
    const listeners = { onClick: mockClick }
    render(<DragHandle listeners={listeners} />)
    const btn = screen.getByRole('button', { name: 'Drag to reorder' })
    btn.click()
    expect(mockClick).toHaveBeenCalled()
  })
})

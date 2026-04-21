import { describe, it, expect } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('joins class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles falsy class names', () => {
    expect(cn('foo', undefined)).toBe('foo')
    expect(cn('foo', null)).toBe('foo')
  })

  it('deduplicates conflicting tailwind classes', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })
})

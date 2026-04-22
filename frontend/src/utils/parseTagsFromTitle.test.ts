import { describe, it, expect } from 'vitest'
import { parseTagsFromTitle } from './parseTagsFromTitle'

describe('parseTagsFromTitle', () => {
  it('extracts tags and strips them from title', () => {
    expect(parseTagsFromTitle('Buy milk #shopping #errand')).toEqual({
      title: 'Buy milk',
      tags: ['shopping', 'errand'],
    })
  })

  it('returns empty tags array when no hash tokens present', () => {
    expect(parseTagsFromTitle('Task without tags')).toEqual({
      title: 'Task without tags',
      tags: [],
    })
  })

  it('deduplicates repeated tags', () => {
    expect(parseTagsFromTitle('Task #work #work')).toEqual({
      title: 'Task',
      tags: ['work'],
    })
  })

  it('ignores solo # with no word chars after it', () => {
    expect(parseTagsFromTitle('Task #')).toEqual({
      title: 'Task #',
      tags: [],
    })
  })

  it('handles leading/trailing whitespace and tag at start', () => {
    const result = parseTagsFromTitle('  #tag title  ')
    expect(result.tags).toEqual(['tag'])
    expect(result.title).toBe('title')
  })

  it('handles title that is only a tag (empty title result)', () => {
    expect(parseTagsFromTitle('#tag')).toEqual({
      title: '',
      tags: ['tag'],
    })
  })

  it('deduplicates tag appearing mid-title', () => {
    expect(parseTagsFromTitle('Buy #groceries milk #groceries')).toEqual({
      title: 'Buy milk',
      tags: ['groceries'],
    })
  })

  it('normalizes tags to lowercase', () => {
    expect(parseTagsFromTitle('Task #Work #URGENT')).toEqual({
      title: 'Task',
      tags: ['work', 'urgent'],
    })
  })

  it('collapses extra whitespace left by removed tokens', () => {
    const { title } = parseTagsFromTitle('Buy #tag1 milk #tag2 bread')
    expect(title).toBe('Buy milk bread')
  })
})

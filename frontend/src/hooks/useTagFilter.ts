import { useSearchParams } from 'react-router-dom'
import { useCallback, useMemo } from 'react'

export function useTagFilter() {
  const [searchParams, setSearchParams] = useSearchParams()

  const activeTags = useMemo(
    () => (searchParams.get('tags') ?? '').split(',').filter(Boolean),
    [searchParams],
  )

  const isTagActive = useCallback(
    (tag: string) => activeTags.includes(tag),
    [activeTags],
  )

  const toggleTagFilter = useCallback(
    (tag: string) => {
      setSearchParams(prev => {
        const current = (prev.get('tags') ?? '').split(',').filter(Boolean)
        const updated = current.includes(tag)
          ? current.filter(t => t !== tag)
          : [...current, tag]
        if (updated.length === 0) prev.delete('tags')
        else prev.set('tags', updated.join(','))
        return prev
      })
    },
    [setSearchParams],
  )

  return { activeTags, isTagActive, toggleTagFilter }
}

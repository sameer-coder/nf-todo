import { useSearchParams } from 'react-router-dom'
import { FilterActiveChip } from './FilterActiveChip'

export function FilterChipBar() {
  const [searchParams, setSearchParams] = useSearchParams()

  const status = searchParams.get('status')
  const activeTags = (searchParams.get('tags') ?? '').split(',').filter(Boolean)

  const activeFilters: Array<{ label: string; onRemove: () => void }> = []

  if (status === 'active' || status === 'completed') {
    activeFilters.push({
      label: status === 'active' ? 'Active' : 'Completed',
      onRemove: () =>
        setSearchParams(prev => {
          prev.delete('status')
          return prev
        }),
    })
  }

  for (const tag of activeTags) {
    activeFilters.push({
      label: tag,
      onRemove: () =>
        setSearchParams(prev => {
          const remaining = (prev.get('tags') ?? '').split(',').filter(Boolean).filter(t => t !== tag)
          if (remaining.length === 0) prev.delete('tags')
          else prev.set('tags', remaining.join(','))
          return prev
        }),
    })
  }

  if (activeFilters.length === 0) return null

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 motion-safe:animate-fade-in-up">
      {activeFilters.map((filter, i) => (
        <FilterActiveChip
          key={i === 0 && status ? `status:${filter.label}` : `tag:${filter.label}`}
          label={filter.label}
          onRemove={filter.onRemove}
        />
      ))}
      <button
        type="button"
        onClick={() => setSearchParams(new URLSearchParams())}
        className="text-[11px] font-medium text-accent-700 underline decoration-accent-200 decoration-2 underline-offset-4 hover:text-accent-600 hover:decoration-accent-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 rounded"
      >
        Clear all
      </button>
    </div>
  )
}

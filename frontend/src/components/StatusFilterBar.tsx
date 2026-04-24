import { useSearchParams } from 'react-router-dom'
import { cn } from '../utils/cn'

type StatusFilter = 'all' | 'active' | 'completed'

const STATUSES: StatusFilter[] = ['all', 'active', 'completed']

const LABELS: Record<StatusFilter, string> = {
  all: 'All',
  active: 'Active',
  completed: 'Completed',
}

export function StatusFilterBar() {
  const [searchParams, setSearchParams] = useSearchParams()
  const current = (searchParams.get('status') ?? 'all') as StatusFilter

  function setStatus(status: StatusFilter) {
    setSearchParams(prev => {
      if (status === 'all') prev.delete('status')
      else prev.set('status', status)
      return prev
    })
  }

  return (
    <div
      className="mb-4 inline-flex gap-1 rounded-xl border border-paper-border bg-paper-header p-1"
      role="tablist"
      aria-label="Filter todos by status"
    >
      {STATUSES.map(status => (
        <button
          key={status}
          role="tab"
          aria-selected={current === status}
          onClick={() => setStatus(status)}
          className={cn(
            'rounded-lg px-3 py-1 text-xs font-medium capitalize motion-safe:transition-all',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-1',
            current === status
              ? 'bg-white font-semibold text-paper-text shadow-sm'
              : 'text-paper-muted hover:text-paper-text',
          )}
        >
          {LABELS[status]}
        </button>
      ))}
    </div>
  )
}

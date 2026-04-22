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
    <div className="flex gap-4 mb-4" role="tablist" aria-label="Filter todos by status">
      {STATUSES.map(status => (
        <button
          key={status}
          role="tab"
          aria-selected={current === status}
          onClick={() => setStatus(status)}
          className={cn(
            'text-sm capitalize rounded',
            'focus-visible:ring-2 focus-visible:ring-paper-ink focus-visible:ring-offset-2',
            current === status
              ? 'font-semibold text-paper-text'
              : 'text-paper-muted hover:text-paper-pencil',
          )}
        >
          {LABELS[status]}
        </button>
      ))}
    </div>
  )
}

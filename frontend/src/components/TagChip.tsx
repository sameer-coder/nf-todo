import { cn } from '../utils/cn'

interface TagChipProps {
  tag: string
  onClick?: () => void
  onRemove?: () => void
  active?: boolean
}

export function TagChip({ tag, onClick, onRemove, active = false }: TagChipProps) {
  return (
    <span className="inline-flex items-center gap-0.5">
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        aria-label={tag}
        className={cn(
          'rounded-full px-2 py-0.5 text-xs font-medium',
          'focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
          active
            ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 font-semibold'
            : 'bg-neutral-100 text-neutral-600',
        )}
      >
        {tag}
      </button>
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove tag ${tag}`}
          onClick={e => {
            e.stopPropagation()
            onRemove()
          }}
          className={cn(
            'p-1.5 -ml-1',
            'text-neutral-400 hover:text-neutral-600',
            'focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-full',
          )}
        >
          <span aria-hidden="true" className="text-xs leading-none">×</span>
        </button>
      )}
    </span>
  )
}

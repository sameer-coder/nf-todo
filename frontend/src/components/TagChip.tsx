import { cn } from '../utils/cn'

interface TagChipProps {
  tag: string
  onClick?: () => void
  onRemove?: () => void
  active?: boolean
}

export function TagChip({ tag, onClick, onRemove, active = false }: TagChipProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full pr-1">
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        aria-label={tag}
        className={cn(
          'rounded-full px-2.5 py-1 text-xs font-medium',
          'focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
          active
            ? 'bg-indigo-50 text-indigo-700 font-semibold ring-1 ring-indigo-200'
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
            'rounded-full p-1.5',
            'text-paper-muted hover:bg-paper-surface hover:text-paper-pencil',
            'focus-visible:ring-2 focus-visible:ring-paper-ink focus-visible:ring-offset-2 rounded-full',
          )}
        >
          <span aria-hidden="true" className="text-xs leading-none">×</span>
        </button>
      )}
    </span>
  )
}

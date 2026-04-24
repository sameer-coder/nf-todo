import { cn } from '../utils/cn'

interface TagChipProps {
  tag: string
  onClick?: () => void
  onRemove?: () => void
  active?: boolean
}

export function TagChip({ tag, onClick, onRemove, active = false }: TagChipProps) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full">
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        aria-label={tag}
        className={cn(
          'rounded-full px-2.5 py-0.5 text-[11px] font-semibold motion-safe:transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-1',
          active
            ? 'bg-accent-gradient text-white shadow-sm shadow-accent-500/30'
            : 'bg-accent-50 text-accent-700 hover:bg-accent-100',
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
            'rounded-full p-1',
            'text-paper-muted hover:bg-rose-50 hover:text-rose-600',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-1',
          )}
        >
          <span aria-hidden="true" className="text-[10px] leading-none">×</span>
        </button>
      )}
    </span>
  )
}

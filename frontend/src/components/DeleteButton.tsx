import { cn } from '../utils/cn'

interface DeleteButtonProps {
  onDelete: () => void
}

export function DeleteButton({ onDelete }: DeleteButtonProps) {
  return (
    <button
      type="button"
      aria-label="Delete todo"
      onClick={onDelete}
      className={cn(
        'h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-transparent bg-transparent',
        'flex opacity-40',
        '[@media(hover:hover)_and_(pointer:fine)]:opacity-0',
        '[@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100',
        '[@media(hover:hover)_and_(pointer:fine)]:focus-visible:opacity-100',
        'motion-safe:transition-all',
        'text-paper-muted hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2',
      )}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
    </button>
  )
}

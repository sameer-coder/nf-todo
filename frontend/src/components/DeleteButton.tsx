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
        'w-11 h-11 flex items-center justify-center flex-shrink-0',
        'opacity-30 md:opacity-0 md:group-hover:opacity-100',
        'motion-safe:transition-opacity',
        'text-neutral-400 hover:text-rose-500',
        'focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded',
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

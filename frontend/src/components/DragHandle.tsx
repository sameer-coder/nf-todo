import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import { cn } from '../utils/cn'

interface DragHandleProps {
  listeners?: SyntheticListenerMap
}

export function DragHandle({ listeners }: DragHandleProps) {
  return (
    <button
      type="button"
      aria-label="Drag to reorder"
      className={cn(
        'w-5 self-center flex items-center justify-center flex-shrink-0',
        'text-paper-muted/60 cursor-grab active:cursor-grabbing',
        'opacity-0 group-hover:opacity-100 motion-safe:transition-opacity',
        '[@media(pointer:coarse)]:opacity-40',
        'hover:text-accent-500',
      )}
      {...listeners}
    >
      <svg
        className="h-4 w-4"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <circle cx="9" cy="6" r="1.6" />
        <circle cx="15" cy="6" r="1.6" />
        <circle cx="9" cy="12" r="1.6" />
        <circle cx="15" cy="12" r="1.6" />
        <circle cx="9" cy="18" r="1.6" />
        <circle cx="15" cy="18" r="1.6" />
      </svg>
    </button>
  )
}
